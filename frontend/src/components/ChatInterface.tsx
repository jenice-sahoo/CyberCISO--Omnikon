'use client';

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
} from 'react';

import {
  Send,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Activity,
  BarChart3,
  Lock,
  Database,
  Network,
  Mail,
  Siren,
  Sparkles,
  Zap,
  CircleDot,
  RotateCcw,
} from 'lucide-react';

import Link from 'next/link';

import {
  ChatMessage,
  ChatRequest,
  Vertical,
  ScorecardResponse,
} from '@/types';

import { sendChatMessage } from '@/lib/api';

import {
  cn,
  formatVertical,
  generateSessionId,
} from '@/lib/utils';

import { exportScorecardToPDF } from '@/lib/pdf';

import ScorecardView from './ScorecardView';

/* ============================================================
   ASSESSMENT CONFIGURATION
   ============================================================ */

/*
 * The backend uses:
 *
 *   15 mandatory core questions
 *   + up to 4 adaptive follow-up questions
 *   = maximum 19 questions
 *
 * IMPORTANT:
 * This must stay synchronized with api/index.py.
 */

const CORE_QUESTION_COUNT = 15;

const MAX_ADAPTIVE_QUESTIONS = 4;

const MAX_TOTAL_QUESTIONS =
  CORE_QUESTION_COUNT +
  MAX_ADAPTIVE_QUESTIONS;

/* ============================================================
   FIRST QUESTIONS
   ============================================================ */

const FIRST_QUESTIONS: Record<Vertical, string> = {
  retail:
    'How many employees access your point-of-sale systems, inventory systems, or other important business systems?',

  healthcare_clinic:
    'How many staff members access your electronic health records (EHR) system?',

  professional_services:
    'How many team members access client confidential data on a regular basis?',
};

/* ============================================================
   SECURITY DOMAINS
   ============================================================ */

const SECURITY_DOMAINS = [
  {
    key: 'access',
    label: 'Access Control',
    icon: Shield,
  },
  {
    key: 'backup',
    label: 'Data Backup',
    icon: Database,
  },
  {
    key: 'network',
    label: 'Network Security',
    icon: Network,
  },
  {
    key: 'phishing',
    label: 'Email & Phishing',
    icon: Mail,
  },
  {
    key: 'incident',
    label: 'Incident Response',
    icon: Siren,
  },
];

/* ============================================================
   CORE DOMAIN COMPLETION
   ============================================================ */

/*
 * The backend has the following 15 core-question structure
 * for ALL three business verticals:
 *
 * Q1-Q3   = Organization / business context
 * Q4-Q6   = Access Control
 * Q7-Q8   = Data Backup
 * Q9-Q11  = Network Security
 * Q12-Q13 = Email / Phishing
 * Q14-Q15 = Incident Response
 *
 * Adaptive questions are additional follow-ups and do not
 * replace the core questions.
 */

const DOMAIN_COMPLETION: Record<
  Vertical,
  Record<string, number>
> = {
  retail: {
    access: 6,
    backup: 8,
    network: 11,
    phishing: 13,
    incident: 15,
  },

  healthcare_clinic: {
    access: 6,
    backup: 8,
    network: 11,
    phishing: 13,
    incident: 15,
  },

  professional_services: {
    access: 6,
    backup: 8,
    network: 11,
    phishing: 13,
    incident: 15,
  },
};

/*
 * All three verticals now contain the same five security
 * domains in the backend.
 *
 * Healthcare DOES have phishing questions:
 * health_training
 * health_phishing
 *
 * Therefore Email & Phishing is NOT marked N/A.
 */

const DOMAIN_APPLICABILITY: Record<
  Vertical,
  Record<string, boolean>
> = {
  retail: {
    access: true,
    backup: true,
    network: true,
    phishing: true,
    incident: true,
  },

  healthcare_clinic: {
    access: true,
    backup: true,
    network: true,
    phishing: true,
    incident: true,
  },

  professional_services: {
    access: true,
    backup: true,
    network: true,
    phishing: true,
    incident: true,
  },
};

/* ============================================================
   HELPERS
   ============================================================ */

function stripMarkdown(text: string): string {
  let output = text
    .replace(
      /<think>[\s\S]*?<\/think>\s*/gi,
      ''
    )
    .replace(
      /<thinking>[\s\S]*?<\/thinking>\s*/gi,
      ''
    )
    .replace(
      /<thought>[\s\S]*?<\/thought>\s*/gi,
      ''
    )
    .replace(
      /<\/?(think|thinking|thought|answer)[^>]*>/gi,
      ''
    );

  const lines = output.split('\n');

  let responseIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (
      lines[i].trim().toLowerCase() ===
      'response'
    ) {
      responseIndex = i;
    }
  }

  if (responseIndex !== -1) {
    output = lines
      .slice(responseIndex + 1)
      .join('\n');
  }

  return output
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
