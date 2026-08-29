'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Database,
  Lock,
  Mail,
  Network,
  RotateCcw,
  Send,
  Shield,
  Siren,
  Sparkles,
} from 'lucide-react';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import type {
  ChatMessage,
  ChatRequest,
  ScorecardResponse,
  Vertical,
} from '@/types';

import { sendChatMessage } from '@/lib/api';

import {
  formatCategory,
  formatVertical,
  generateSessionId,
} from '@/lib/utils';

import { exportScorecardToPDF } from '@/lib/pdf';

import ScorecardView from './ScorecardView';

/* ============================================================
   FIRST QUESTIONS
   ============================================================ */

const FIRST_QUESTIONS: Record<Vertical, string> = {
  retail:
    'How many employees access your point-of-sale systems and inventory databases?',

  healthcare_clinic:
    'How many staff members access your electronic health records (EHR) system?',

  professional_services:
    'How many team members access client confidential data on a regular basis?',
};

/* ============================================================
   VALID VERTICALS
   ============================================================ */

const VALID_VERTICALS: Vertical[] = [
  'retail',
  'healthcare_clinic',
  'professional_services',
];

/* ============================================================
   SECURITY DOMAINS
   ============================================================ */

const SECURITY_DOMAINS = [
  {
    key: 'access_control',
    label: 'Access Control',
    icon: Shield,
  },
  {
    key: 'data_backup',
    label: 'Data Backup',
    icon: Database,
  },
  {
    key: 'network_security',
    label: 'Network Security',
    icon: Network,
  },
  {
    key: 'email_phishing',
    label: 'Email & Phishing',
    icon: Mail,
  },
  {
    key: 'incident_response',
    label: 'Incident Response',
    icon: Siren,
  },
];

/* ============================================================
   CLEAN AI RESPONSE
   ============================================================ */

function cleanResponse(text: string): string {
  let output = text || '';

  output = output
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>\s*/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>\s*/gi, '')
    .replace(/<\/?(think|thinking|thought|answer)[^>]*>/gi, '');

  const lines = output.split('\n');

  let responseIndex = -1;

  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].trim().toLowerCase() === 'response') {
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
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}

/* ============================================================
   TYPING INDICATOR
   ============================================================ */

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20">
        <Shield className="h-4 w-4 text-white" />
      </div>

      <div className="rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.035] px-5 py-4">
        <div className="flex gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   BUSINESS PICKER
   ============================================================ */

function VerticalPicker({
  onSelect,
}: {
  onSelect: (vertical: Vertical) => void;
}) {
  const businesses = [
    {
      id: 'retail' as Vertical,
      label: 'Retail',
      description:
        'POS systems, inventory, payment networks and staff access.',
      icon: '🛍️',
    },
    {
      id: 'healthcare_clinic' as Vertical,
      label: 'Healthcare Clinic',
      description:
        'EHR systems, patient data, HIPAA and device security.',
      icon: '🏥',
    },
    {
      id: 'professional_services' as Vertical,
      label: 'Professional Services',
      description:
        'Client data, cloud applications, IP and secure communications.',
      icon: '💼',
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05040b] text-white">
      {/* Glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-200px] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-violet-700/[0.12] blur-[180px]" />

        <div className="absolute bottom-[-200px] right-[-150px] h-[500px] w-[500px] rounded-full bg-blue-700/[0.08] blur-[160px]" />
      </div>

      {/* Grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 min-h-screen">
        <header className="border-b border-white/[0.06] px-6 py-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Secure & Private
            </div>
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-77px)] items-center justify-center px-6 py-16">
          <div className="w-full max-w-5xl">
            <div className="mb-12 text-center">
              <div className="mb-5 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-xl shadow-violet-500/20">
                  <Shield className="h-6 w-6 text-white" />
                </div>
              </div>

              <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-violet-400">
                CyberCISO AI
              </p>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Select your business
                <span className="text-violet-400">.</span>
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-500">
                We&apos;ll tailor your security assessment to your
                industry&apos;s specific risks and requirements.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  type="button"
                  onClick={() =>
                    onSelect(business.id)
                  }
                  className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/25 hover:bg-violet-500/[0.06] hover:shadow-2xl hover:shadow-violet-950/30"
                >
                  <div className="mb-5 text-3xl">
                    {business.icon}
                  </div>

                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-semibold text-gray-200 group-hover:text-white">
                      {business.label}
                    </span>

                    <ArrowUpRight className="h-4 w-4 text-gray-700 transition group-hover:text-violet-400" />
                  </div>

                  <p className="text-xs leading-6 text-gray-600">
                    {business.description}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-5 text-[10px] text-gray-700">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                NIST CSF 2.0
              </span>

              <span>•</span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                CIS Controls v8
              </span>

              <span>•</span>

              <span>~10 minutes</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function ChatInterface() {
  const searchParams = useSearchParams();

  const verticalParam =
    searchParams.get('vertical');

  const urlVertical: Vertical | null =
    verticalParam &&
    VALID_VERTICALS.includes(
      verticalParam as Vertical
    )
      ? (verticalParam as Vertical)
      : null;

  const [vertical, setVertical] =
    useState<Vertical | null>(
      urlVertical
    );

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [input, setInput] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [scorecard, setScorecard] =
    useState<ScorecardResponse | null>(null);

  const [interviewComplete, setInterviewComplete] =
    useState(false);

  const [sessionId] =
    useState(() => generateSessionId());

  const inputRef =
    useRef<HTMLTextAreaElement>(null);

  /* ==========================================================
     SELECT BUSINESS
     ========================================================== */

  const handleVerticalSelect = useCallback(
    (selectedVertical: Vertical) => {
      const businessName =
        formatVertical(
          selectedVertical
        );

      setVertical(
        selectedVertical
      );

      setScorecard(null);

      setInterviewComplete(false);

      setError(null);

      setMessages([
        {
          role: 'user',
          content:
            `I want an assessment for ${businessName}`,
        },
        {
          role: 'assistant',
          content:
            `Sure! Here is your ${businessName} assessment.`,
        },
        {
          role: 'assistant',
          content:
            FIRST_QUESTIONS[
              selectedVertical
            ],
        },
      ]);
    },
    []
  );

  /* ==========================================================
     AUTO INITIALIZE FROM URL
     ========================================================== */

  useEffect(() => {
    if (
      urlVertical &&
      messages.length === 0 &&
      !interviewComplete
    ) {
      handleVerticalSelect(
        urlVertical
      );
    }
  }, [
    urlVertical,
    messages.length,
    interviewComplete,
    handleVerticalSelect,
  ]);

  /* ==========================================================
     FOCUS INPUT
     ========================================================== */

  useEffect(() => {
    if (
      vertical &&
      !interviewComplete
    ) {
      const timer =
        window.setTimeout(() => {
          inputRef.current?.focus();
        }, 150);

      return () =>
        window.clearTimeout(timer);
    }

    return undefined;
  }, [
    messages,
    vertical,
    interviewComplete,
  ]);

  /* ==========================================================
     SEND MESSAGE
     ========================================================== */

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (
      !input.trim() ||
      isLoading ||
      !vertical
    ) {
      return;
    }

    const userMessage =
      input.trim();

    setInput('');

    setError(null);

    setIsLoading(true);

    const history =
      [...messages];

    setMessages((previous) => [
      ...previous,
      {
        role: 'user',
        content: userMessage,
      },
    ]);

    try {
      const request: ChatRequest = {
        message: userMessage,

        conversation_history:
          history,

        vertical: vertical,

        session_id:
          sessionId,
      };

      const response =
        await sendChatMessage(
          request
        );

      let receivedScorecard =
        response.scorecard;

      /* --------------------------------------------
         JSON FALLBACK
         -------------------------------------------- */

      if (
        !receivedScorecard &&
        response.response
      ) {
        try {
          let raw =
            response.response.trim();

          if (
            raw.startsWith('```')
          ) {
            raw = raw
              .replace(
                /^```(?:json)?\s*/i,
                ''
              )
              .replace(
                /\s*```$/,
                ''
              )
              .trim();
          }

          if (
            raw.startsWith('{')
          ) {
            const parsed: unknown =
              JSON.parse(raw);

            if (
              typeof parsed ===
                'object' &&
              parsed !== null &&
              'overall_grade' in
                parsed &&
              'sub_categories' in
                parsed
            ) {
              receivedScorecard =
                parsed as ScorecardResponse;
            }
          }
        } catch {
          // Normal text response.
        }
      }

      /* --------------------------------------------
         SCORECARD
         -------------------------------------------- */

      if (
        receivedScorecard
      ) {
        setScorecard(
          receivedScorecard
        );

        setInterviewComplete(
          true
        );

        setVertical(
          receivedScorecard.vertical
        );
      } else {
        /* ------------------------------------------
           NORMAL AI MESSAGE
           ------------------------------------------ */

        setMessages((previous) => [
          ...previous,
          {
            role: 'assistant',
            content:
              cleanResponse(
                response.response
              ),
          },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send message'
      );

      setMessages(
        (previous) =>
          previous.slice(
            0,
            -1
          )
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================================================
     ENTER TO SEND
     ========================================================== */

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (!isLoading) {
        void handleSubmit(
          event as unknown as FormEvent
        );
      }
    }
  };

  /* ==========================================================
     RESTART
     ========================================================== */

  const handleRestart = () => {
    window.location.href = '/';
  };

  /* ==========================================================
     PDF
     ========================================================== */

  const handleDownloadPDF =
    async () => {
      if (!scorecard) {
        return;
      }

      try {
        await exportScorecardToPDF(
          scorecard
        );
      } catch {
        setError(
          'Failed to generate PDF'
        );
      }
    };

  /* ==========================================================
     BUSINESS PICKER
     ========================================================== */

  if (
    !vertical &&
    !interviewComplete
  ) {
    return (
      <VerticalPicker
        onSelect={
          handleVerticalSelect
        }
      />
    );
  }

  /* ==========================================================
     SCORECARD
     ========================================================== */

  if (
    interviewComplete &&
    scorecard
  ) {
    return (
      <div className="min-h-screen bg-[#05040b]">
        <ScorecardView
          scorecard={scorecard}
          onRestart={
            handleRestart
          }
          onDownloadPDF={
            handleDownloadPDF
          }
        />
      </div>
    );
  }

  /* ==========================================================
     PROGRESS
     ========================================================== */

  const answeredQuestions =
    Math.max(
      0,
      messages.filter(
        (message) =>
          message.role === 'user'
      ).length - 1
    );

  const estimatedQuestions = 10;

  const progress =
    Math.min(
      100,
      Math.round(
        (answeredQuestions /
          estimatedQuestions) *
          100
      )
    );

  const businessName =
    vertical
      ? formatVertical(
          vertical
        )
      : 'Security Assessment';

  /* ==========================================================
     MAIN CHAT UI
     ========================================================== */

  return (
    <div className="min-h-screen bg-[#05040b] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[30%] top-[-250px] h-[600px] w-[700px] rounded-full bg-violet-700/[0.08] blur-[180px]" />

        <div className="absolute right-[-200px] top-[35%] h-[500px] w-[500px] rounded-full bg-blue-700/[0.05] blur-[170px]" />
      </div>

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10">
        {/* HEADER */}
        <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07060d]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20">
                <Shield className="h-4 w-4 text-white" />
              </div>

              <div>
                <div className="text-sm font-semibold">
                  CyberCISO
                </div>

                <div className="text-[8px] uppercase tracking-[0.18em] text-gray-600">
                  AI security advisor
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-violet-400/10 bg-violet-500/[0.06] px-3 py-1.5 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />

                <span className="text-[10px] text-violet-300">
                  {businessName}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Secure
              </div>
            </div>
          </div>
        </header>

        {/* MAIN */}
        <main className="mx-auto max-w-6xl px-5 py-8">
          {/* TITLE */}
          <div className="mb-7">
            <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-violet-400/70">
              <Activity className="h-3.5 w-3.5" />
              Adaptive security interview
            </div>

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Security assessment
                  <span className="text-violet-400">
                    .
                  </span>
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                  Tell CyberCISO about your security
                  setup and we&apos;ll build your
                  personalized security posture.
                </p>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-gray-600">
                <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
                {progress}% complete
              </div>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="mb-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[9px] uppercase tracking-[0.2em] text-gray-600">
                Assessment progress
              </span>

              <span className="text-[10px] text-violet-300">
                {answeredQuestions} / ~{estimatedQuestions}
              </span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400 transition-all duration-500"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>
          </div>

          {/* LAYOUT */}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
            {/* CHAT */}
            <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08070e]/90">
              {/* Chat header */}
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20">
                    <Shield className="h-4 w-4 text-white" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-200">
                      CyberCISO AI
                    </p>

                    <p className="text-[8px] text-gray-600">
                      Online • Security analyst
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[9px] text-emerald-400/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </div>
              </div>

              {/* MESSAGES
                  No internal overflow.
                  No fixed height.
                  Browser/page scrolls naturally.
              */}
              <div className="space-y-5 px-5 py-6">
                {messages.map(
                  (message, index) => {
                    const isUser =
                      message.role ===
                      'user';

                    return (
                      <div
                        key={`${message.role}-${index}`}
                        className={`flex gap-3 ${
                          isUser
                            ? 'justify-end'
                            : ''
                        }`}
                      >
                        {!isUser && (
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600">
                            <Shield className="h-4 w-4 text-white" />
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                            isUser
                              ? 'rounded-br-md bg-gradient-to-br from-violet-600 to-violet-500 text-white shadow-lg shadow-violet-500/10'
                              : 'rounded-bl-md border border-white/[0.07] bg-white/[0.035] text-gray-300'
                          }`}
                        >
                          <p className="whitespace-pre-wrap text-[13px] leading-6">
                            {
                              message.content
                            }
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}

                {isLoading && (
                  <TypingIndicator />
                )}

                {error && (
                  <div className="flex justify-center">
                    <div className="rounded-xl border border-red-400/10 bg-red-500/[0.05] px-4 py-3 text-xs text-red-300">
                      {error}
                    </div>
                  </div>
                )}
              </div>

              {/* INPUT */}
              <div className="px-5 pb-5">
                <form
                  onSubmit={
                    handleSubmit
                  }
                  className="rounded-2xl border border-violet-400/10 bg-[#0d0b16] p-2.5 transition focus-within:border-violet-400/25"
                >
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(event) =>
                        setInput(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleKeyDown
                      }
                      rows={2}
                      disabled={
                        isLoading
                      }
                      placeholder="Tell CyberCISO about your security..."
                      className="min-h-[52px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-200 outline-none placeholder:text-gray-700"
                    />

                    <button
                      type="submit"
                      disabled={
                        isLoading ||
                        !input.trim()
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-lg shadow-violet-500/20 transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {isLoading ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div className="mt-2 flex items-center justify-between px-2 text-[8px] text-gray-700">
                    <span>
                      Enter to send • Shift + Enter for new line
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Lock className="h-3 w-3" />
                      Private session
                    </span>
                  </div>
                </form>
              </div>
            </section>

            {/* RIGHT PANEL */}
            <aside className="space-y-4">
              {/* Current assessment */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/[0.08]">
                    <Shield className="h-4 w-4 text-violet-400" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-200">
                      Current assessment
                    </p>

                    <p className="text-[9px] text-gray-600">
                      {businessName}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-black/10 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[9px] uppercase tracking-[0.15em] text-gray-600">
                      Progress
                    </span>

                    <span className="text-xs font-semibold text-violet-300">
                      {progress}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-400"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Security areas */}
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-200">
                    Security areas
                  </p>

                  <p className="mt-1 text-[9px] text-gray-600">
                    Covered throughout your interview
                  </p>
                </div>

                <div className="space-y-2">
                  {SECURITY_DOMAINS.map(
                    (domain) => {
                      const Icon =
                        domain.icon;

                      return (
                        <div
                          key={domain.key}
                          className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-black/10 px-3 py-2.5"
                        >
                          <Icon className="h-3.5 w-3.5 text-violet-400" />

                          <span className="text-[10px] text-gray-500">
                            {domain.label}
                          </span>

                          <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400/60" />
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Frameworks */}
              <div className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-500/[0.025] p-5">
                <div className="mb-3 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />

                  <span className="text-xs font-medium text-gray-300">
                    Framework coverage
                  </span>
                </div>

                <p className="text-[9px] text-gray-600">
                  Assessment standards
                </p>

                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/10 px-3 py-2">
                    <span className="text-[10px] text-gray-500">
                      NIST CSF 2.0
                    </span>

                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-black/10 px-3 py-2">
                    <span className="text-[10px] text-gray-500">
                      CIS Controls v8
                    </span>

                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>

              <Link
                href="/"
                className="flex items-center justify-center gap-2 rounded-xl border border-violet-400/10 bg-violet-500/[0.06] px-4 py-3 text-xs text-violet-300 transition hover:bg-violet-500/[0.1]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Start a new assessment
              </Link>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
