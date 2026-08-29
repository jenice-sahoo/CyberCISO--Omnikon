'use client';

import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import Link from 'next/link';

import {
  Activity,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Database,
  LayoutDashboard,
  Lock,
  Mail,
  Network,
  RotateCcw,
  Send,
  Settings,
  Shield,
  Siren,
  Sparkles,
  Zap,
} from 'lucide-react';

import {
  ChatMessage,
  ChatRequest,
  ScorecardResponse,
  Vertical,
} from '@/types';

import { sendChatMessage } from '@/lib/api';

import {
  cn,
  formatCategory,
  formatVertical,
  generateSessionId,
} from '@/lib/utils';

import { exportScorecardToPDF } from '@/lib/pdf';

import ScorecardView from './ScorecardView';


/* ============================================================
   QUESTIONS
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
   SECURITY DOMAINS
   ============================================================ */

const SECURITY_DOMAINS = [
  {
    key: 'access',
    label: 'Access Control',
    short: 'Access',
    icon: Shield,
  },
  {
    key: 'backup',
    label: 'Data Backup',
    short: 'Backup',
    icon: Database,
  },
  {
    key: 'network',
    label: 'Network Security',
    short: 'Network',
    icon: Network,
  },
  {
    key: 'phishing',
    label: 'Email & Phishing',
    short: 'Phishing',
    icon: Mail,
  },
  {
    key: 'incident',
    label: 'Incident Response',
    short: 'Incident',
    icon: Siren,
  },
];


/* ============================================================
   RESPONSE CLEANER
   ============================================================ */

function cleanResponse(text: string): string {
  let result = text
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>\s*/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>\s*/gi, '')
    .replace(/<\/?(think|thinking|thought|answer)[^>]*>/gi, '');

  const lines = result.split('\n');

  let responseMarker = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === 'response') {
      responseMarker = i;
    }
  }

  if (responseMarker !== -1) {
    result = lines
      .slice(responseMarker + 1)
      .join('\n');
  }

  return result
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim();
}


/* ============================================================
   DUPLICATE RESPONSE CHECK
   ============================================================ */

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,!?;:]+/g, '')
    .trim();
}


/* ============================================================
   TYPING INDICATOR
   ============================================================ */

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">

      <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
        <Shield className="w-4 h-4 text-white" />
      </div>

      <div className="rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.035] px-5 py-4">

        <div className="flex items-center gap-1.5">

          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />

          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse [animation-delay:150ms]" />

          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse [animation-delay:300ms]" />

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   BUSINESS SELECTOR
   ============================================================ */

function BusinessSelector({
  onSelect,
}: {
  onSelect: (vertical: Vertical) => void;
}) {
  const businesses = [
    {
      id: 'retail' as Vertical,
      title: 'Retail',
      emoji: '🛍️',
      description:
        'POS systems, inventory, payment networks and staff access.',
    },
    {
      id: 'healthcare_clinic' as Vertical,
      title: 'Healthcare Clinic',
      emoji: '🏥',
      description:
        'EHR systems, patient data, compliance and device security.',
    },
    {
      id: 'professional_services' as Vertical,
      title: 'Professional Services',
      emoji: '💼',
      description:
        'Client data, cloud applications, IP and communications.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#05040b] text-white relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[850px] h-[550px] rounded-full bg-violet-700/[0.12] blur-[180px]" />

        <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-fuchsia-700/[0.06] blur-[160px]" />

      </div>

      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">

        <header className="border-b border-white/[0.06]">

          <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs">
                Back
              </span>
            </Link>

            <div className="flex items-center gap-2 text-[10px] text-gray-600">

              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

              Secure & Private

            </div>

          </div>

        </header>


        <main className="flex-1 flex items-center justify-center px-6 py-16">

          <div className="max-w-4xl w-full">

            <div className="text-center mb-12">

              <div className="relative mx-auto w-14 h-14 mb-6">

                <div className="absolute inset-0 rounded-2xl bg-violet-500/20 blur-xl" />

                <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">

                  <Shield className="w-7 h-7 text-white" />

                </div>

              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">

                Select your business
                <span className="text-violet-400">
                  .
                </span>

              </h1>

              <p className="text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">

                We'll tailor the security assessment to your industry's specific risks and requirements.

              </p>

            </div>


            <div className="grid sm:grid-cols-3 gap-5">

              {businesses.map((business) => (

                <button
                  key={business.id}
                  type="button"
                  onClick={() =>
                    onSelect(business.id)
                  }
                  className="group text-left p-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-violet-500/[0.06] hover:border-violet-400/20 hover:-translate-y-1 transition-all duration-200"
                >

                  <div className="text-3xl mb-6">
                    {business.emoji}
                  </div>

                  <div className="flex items-center justify-between">

                    <span className="font-semibold text-gray-200 group-hover:text-white">
                      {business.title}
                    </span>

                    <span className="text-gray-700 group-hover:text-violet-400 text-lg">
                      →
                    </span>

                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed mt-3">
                    {business.description}
                  </p>

                </button>

              ))}

            </div>


            <div className="flex items-center justify-center gap-5 mt-10 text-[10px] text-gray-700">

              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                NIST CSF 2.0
              </span>

              <span>•</span>

              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                CIS Controls v8
              </span>

              <span>•</span>

              <span>
                ~10 minutes
              </span>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}


/* ============================================================
   PROPS
   ============================================================ */

interface ChatInterfaceProps {
  initialVertical?: Vertical;
}


/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function ChatInterface({
  initialVertical,
}: ChatInterfaceProps) {

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [input, setInput] =
    useState('');

  const [isLoading, setIsLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [vertical, setVertical] =
    useState<Vertical | null>(
      initialVertical || null
    );

  const [scorecard, setScorecard] =
    useState<ScorecardResponse | null>(null);

  const [interviewComplete, setInterviewComplete] =
    useState(false);

  const [sessionId] =
    useState(() =>
      generateSessionId()
    );

  const inputRef =
    useRef<HTMLTextAreaElement>(null);


  /* ==========================================================
     START ASSESSMENT
     ========================================================== */

  const startAssessment = useCallback(
    (selectedVertical: Vertical) => {

      const businessName =
        formatVertical(
          selectedVertical
        );

      setVertical(
        selectedVertical
      );

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

      setScorecard(null);

      setInterviewComplete(false);

      setError(null);

    },
    []
  );


  /* ==========================================================
     AUTO START FROM URL
     ========================================================== */

  useEffect(() => {

    if (
      initialVertical &&
      messages.length === 0 &&
      !interviewComplete
    ) {

      startAssessment(
        initialVertical
      );

    }

  }, [
    initialVertical,
    messages.length,
    interviewComplete,
    startAssessment,
  ]);


  /* ==========================================================
     INPUT FOCUS
     ========================================================== */

  useEffect(() => {

    if (!interviewComplete) {

      const timer =
        window.setTimeout(() => {
          inputRef.current?.focus();
        }, 100);

      return () =>
        window.clearTimeout(
          timer
        );

    }

  }, [
    messages,
    interviewComplete,
  ]);


  /* ==========================================================
     SEND MESSAGE
     ========================================================== */

  const handleSubmit =
    async (
      event?: FormEvent
    ) => {

      event?.preventDefault();

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

      const newMessages: ChatMessage[] = [
        ...history,

        {
          role: 'user',
          content: userMessage,
        },
      ];

      setMessages(
        newMessages
      );


      try {

        const request: ChatRequest = {

          message:
            userMessage,

          conversation_history:
            history,

          vertical,

          session_id:
            sessionId,

        };


        const response =
          await sendChatMessage(
            request
          );


        let returnedScorecard =
          response.scorecard;


        /* ====================================================
           FALLBACK SCORECARD PARSING
           ==================================================== */

        if (
          !returnedScorecard &&
          response.response
        ) {

          try {

            let raw =
              response.response.trim();


            if (
              raw.startsWith('```')
            ) {

              raw =
                raw
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

              const parsed =
                JSON.parse(raw);


              if (
                parsed &&
                parsed.overall_grade &&
                parsed.sub_categories
              ) {

                returnedScorecard =
                  parsed as ScorecardResponse;

              }

            }

          } catch {
            // Normal text response.
          }

        }


        /* ====================================================
           SCORECARD
           ==================================================== */

        if (
          returnedScorecard
        ) {

          setScorecard(
            returnedScorecard
          );

          setVertical(
            returnedScorecard.vertical
          );

          setInterviewComplete(
            true
          );

          return;

        }


        /* ====================================================
           NORMAL RESPONSE
           ==================================================== */

        const cleaned =
          cleanResponse(
            response.response
          );


        /*
         * Prevent the UI from displaying the exact
         * same assistant message twice.
         */

        const lastAssistant =
          [...history]
            .reverse()
            .find(
              message =>
                message.role ===
                'assistant'
            );


        if (
          lastAssistant &&
          normalizeText(
            lastAssistant.content
          ) ===
            normalizeText(
              cleaned
            )
        ) {

          return;

        }


        setMessages(
          previous => [
            ...previous,

            {
              role: 'assistant',
              content: cleaned,
            },
          ]
        );

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : 'Failed to send message.'
        );


        setMessages(
          previous =>
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
     ENTER KEY
     ========================================================== */

  const handleKeyDown =
    (
      event: KeyboardEvent<HTMLTextAreaElement>
    ) => {

      if (
        event.key === 'Enter' &&
        !event.shiftKey
      ) {

        event.preventDefault();

        void handleSubmit();

      }

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
          'Failed to generate PDF.'
        );

      }

    };


  /* ==========================================================
     RESTART
     ========================================================== */

  const handleRestart =
    () => {

      window.location.href =
        '/';

    };


  /* ==========================================================
     BUSINESS SELECTOR
     ========================================================== */

  if (
    !vertical &&
    !interviewComplete
  ) {

    return (
      <BusinessSelector
        onSelect={
          startAssessment
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

      <ScorecardView
        scorecard={
          scorecard
        }
        onRestart={
          handleRestart
        }
        onDownloadPDF={
          handleDownloadPDF
        }
      />

    );

  }


  /* ==========================================================
     PROGRESS
     ========================================================== */

  const userMessages =
    messages.filter(
      message =>
        message.role ===
        'user'
    );


  /*
   * First user message is the
   * "I want an assessment..." message.
   */

  const answeredQuestions =
    Math.max(
      0,
      userMessages.length - 1
    );


  const estimatedQuestions =
    10;


  const progress =
    Math.min(
      100,
      Math.round(
        (answeredQuestions /
          estimatedQuestions) *
          100
      )
    );


  const activeDomainIndex =
    Math.min(
      SECURITY_DOMAINS.length - 1,
      Math.floor(
        answeredQuestions / 2
      )
    );


  /* ==========================================================
     DASHBOARD
     ========================================================== */

  return (

    <div className="min-h-screen bg-[#05040b] text-white">


      {/* BACKGROUND */}

      <div className="fixed inset-0 pointer-events-none">

        <div className="absolute top-[-220px] left-[30%] w-[700px] h-[500px] rounded-full bg-violet-700/[0.08] blur-[180px]" />

        <div className="absolute right-[-200px] top-[35%] w-[550px] h-[550px] rounded-full bg-fuchsia-700/[0.04] blur-[170px]" />

      </div>


      {/* GRID */}

      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize:
            '48px 48px',
        }}
      />


      <div className="relative z-10 flex min-h-screen">


        {/* ====================================================
            SIDEBAR
            ==================================================== */}

        <aside className="hidden lg:flex w-[220px] flex-shrink-0 border-r border-white/[0.06] bg-[#07050d] flex-col">

          <div className="px-5 py-5 border-b border-white/[0.05]">

            <Link
              href="/"
              className="flex items-center gap-3"
            >

              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">

                <Shield className="w-4 h-4 text-white" />

              </div>

              <div>

                <p className="text-sm font-semibold">
                  CyberCISO
                </p>

                <p className="text-[8px] text-gray-600 uppercase tracking-[0.2em]">
                  Virtual CISO
                </p>

              </div>

            </Link>

          </div>


          <nav className="px-3 py-5">

            <p className="px-3 mb-2 text-[8px] uppercase tracking-[0.2em] text-gray-700">
              Assessment
            </p>


            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-violet-500/[0.08] text-gray-200">

              <Activity className="w-3.5 h-3.5 text-violet-400" />

              <span className="text-[10px]">
                Live assessment
              </span>

            </div>


            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-gray-700">

              <BarChart3 className="w-3.5 h-3.5" />

              <span className="text-[10px]">
                Security posture
              </span>

            </div>

          </nav>


          <div className="px-4">

            <p className="px-2 mb-2 text-[8px] uppercase tracking-[0.2em] text-gray-700">
              Current
            </p>


            <div className="p-3 rounded-xl border border-violet-400/[0.1] bg-violet-500/[0.025]">

              <div className="flex items-center gap-2">

                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,.8)]" />

                <span className="text-[9px] text-gray-400">
                  {formatVertical(
                    vertical
                  )}
                </span>

              </div>


              <div className="mt-3 h-1 rounded-full bg-white/[0.05] overflow-hidden">

                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                  style={{
                    width:
                      `${Math.max(
                        progress,
                        3
                      )}%`,
                  }}
                />

              </div>


              <div className="flex justify-between mt-2">

                <span className="text-[7px] text-gray-700">
                  {progress}% complete
                </span>

                <span className="text-[7px] text-violet-400">
                  LIVE
                </span>

              </div>

            </div>

          </div>


          <div className="mt-auto p-5">

            <div className="flex items-center gap-2">

              <Lock className="w-3 h-3 text-emerald-400" />

              <span className="text-[8px] text-gray-600">
                Secure session
              </span>

            </div>

            <p className="text-[7px] text-gray-700 ml-5 mt-1">
              Protected assessment
            </p>

          </div>

        </aside>


        {/* ====================================================
            MAIN
            ==================================================== */}

        <main className="flex-1 min-w-0">


          {/* HEADER */}

          <header className="h-16 border-b border-white/[0.06] bg-[#07050d]/90 backdrop-blur-xl">

            <div className="h-full px-5 lg:px-7 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="lg:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">

                  <Shield className="w-4 h-4" />

                </div>

                <div>

                  <p className="text-[8px] uppercase tracking-[0.2em] text-gray-700">
                    Security Operations
                  </p>

                  <p className="text-[11px] text-gray-300">
                    Assessment overview
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-3">

                <span className="hidden sm:flex items-center gap-2 text-[9px] text-gray-600">

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                  Secure connection

                </span>


                <div className="w-8 h-8 rounded-lg border border-white/[0.06] flex items-center justify-center">

                  <Settings className="w-3.5 h-3.5 text-gray-600" />

                </div>

              </div>

            </div>

          </header>


          {/* ==================================================
              PAGE CONTENT

              IMPORTANT:
              There is deliberately NO overflow-y-auto here.
              The browser page is the only scroll container.
              ================================================== */}

          <div className="px-5 lg:px-7 py-6 max-w-[1500px] mx-auto">


            {/* TITLE */}

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">

              <div>

                <div className="flex items-center gap-2 mb-2">

                  <span className="text-[8px] uppercase tracking-[0.22em] text-violet-400">
                    Security Assessment
                  </span>

                  <span className="px-2 py-0.5 rounded-full border border-violet-400/10 bg-violet-500/[0.06] text-[7px] text-violet-300">
                    LIVE
                  </span>

                </div>


                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">

                  Assessment overview
                  <span className="text-violet-400">
                    .
                  </span>

                </h1>


                <p className="text-[9px] text-gray-600 mt-1">
                  Adaptive security interview powered by CyberCISO AI.
                </p>

              </div>


              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-violet-400/[0.1] bg-violet-500/[0.025]">

                <Sparkles className="w-3 h-3 text-violet-400" />

                <span className="text-[8px] text-gray-500">
                  CyberCISO AI is analyzing
                </span>

              </div>

            </div>


            {/* =================================================
                STAT CARDS
                ================================================= */}

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">

              {[
                {
                  label: 'Questions',
                  value: answeredQuestions,
                  icon: Zap,
                },
                {
                  label: 'Progress',
                  value: `${progress}%`,
                  icon: BarChart3,
                },
                {
                  label: 'Security Domains',
                  value: '5',
                  icon: Shield,
                },
                {
                  label: 'Framework',
                  value: 'NIST + CIS',
                  icon: Lock,
                },
              ].map(
                (stat) => {

                  const Icon =
                    stat.icon;

                  return (

                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/[0.07] bg-[#0a0911]/80 p-4"
                    >

                      <div className="flex items-center justify-between">

                        <div>

                          <p className="text-[8px] uppercase tracking-[0.18em] text-gray-700">
                            {stat.label}
                          </p>

                          <p className="text-xl font-semibold text-gray-200 mt-1">
                            {stat.value}
                          </p>

                        </div>


                        <div className="w-8 h-8 rounded-lg bg-violet-500/[0.08] border border-violet-400/10 flex items-center justify-center">

                          <Icon className="w-3.5 h-3.5 text-violet-400" />

                        </div>

                      </div>

                    </div>

                  );

                }
              )}

            </div>


            {/* =================================================
                MAIN GRID
                ================================================= */}

            <div className="grid xl:grid-cols-[minmax(0,1fr)_285px] gap-4">


              {/* CHAT */}

              <section className="rounded-xl border border-white/[0.07] bg-[#090811]/90 overflow-hidden">


                {/* CHAT HEADER */}

                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">

                      <Shield className="w-4 h-4 text-white" />

                    </div>

                    <div>

                      <p className="text-[10px] font-semibold text-gray-200">
                        CyberCISO AI
                      </p>

                      <p className="text-[7px] text-gray-700">
                        Online • Security analyst
                      </p>

                    </div>

                  </div>


                  <div className="flex items-center gap-2 text-[8px] text-gray-600">

                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                    Online

                  </div>

                </div>


                {/* =================================================
                    MESSAGES

                    NO overflow-y-auto.
                    NO fixed height.
                    ================================================= */}

                <div className="px-5 py-6 space-y-5">

                  {messages.map(
                    (
                      message,
                      index
                    ) => (

                      <div
                        key={`${message.role}-${index}`}
                        className={cn(
                          'flex gap-3',
                          message.role === 'user'
                            ? 'justify-end'
                            : 'justify-start'
                        )}
                      >

                        {message.role ===
                          'assistant' && (

                          <div className="w-8 h-8 flex-shrink-0 rounded-xl bg-violet-500/[0.08] border border-violet-400/10 flex items-center justify-center">

                            <Shield className="w-3.5 h-3.5 text-violet-400" />

                          </div>

                        )}


                        <div
                          className={cn(
                            'max-w-[78%] px-4 py-3',
                            message.role === 'user'
                              ? 'rounded-2xl rounded-br-sm bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white'
                              : 'rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.025] text-gray-400'
                          )}
                        >

                          <p className="text-[11px] leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>

                        </div>

                      </div>

                    )
                  )}


                  {isLoading && (
                    <TypingIndicator />
                  )}


                  {error && (

                    <div className="flex justify-center">

                      <div className="max-w-lg px-4 py-3 rounded-xl border border-red-400/10 bg-red-500/[0.05] text-red-300 text-[9px]">

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
                    className="rounded-xl border border-violet-400/10 bg-[#0d0b16] p-2.5 focus-within:border-violet-400/20 transition"
                  >

                    <div className="flex items-end gap-2">

                      <textarea
                        ref={
                          inputRef
                        }
                        value={
                          input
                        }
                        onChange={(event) =>
                          setInput(
                            event.target.value
                          )
                        }
                        onKeyDown={
                          handleKeyDown
                        }
                        placeholder="Tell CyberCISO about your security..."
                        disabled={
                          isLoading
                        }
                        rows={1}
                        className="flex-1 min-h-[44px] max-h-32 bg-transparent px-3 py-3 text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none resize-none"
                        aria-label="Chat input"
                      />


                      <button
                        type="submit"
                        disabled={
                          !input.trim() ||
                          isLoading
                        }
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all',

                          input.trim() &&
                            !isLoading
                            ? 'bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/20 hover:scale-[1.03]'
                            : 'bg-white/[0.04] text-gray-700 cursor-not-allowed'
                        )}
                        aria-label="Send message"
                      >

                        <Send className="w-4 h-4" />

                      </button>

                    </div>


                    <div className="flex items-center justify-between px-3 pt-1.5">

                      <span className="text-[7px] text-gray-700">
                        Enter to send • Shift+Enter for new line
                      </span>

                      <span className="flex items-center gap-1 text-[7px] text-gray-700">

                        <Lock className="w-2.5 h-2.5" />

                        Protected

                      </span>

                    </div>

                  </form>

                </div>

              </section>


              {/* RIGHT PANEL */}

              <aside className="space-y-4">


                {/* PROGRESS */}

                <div className="rounded-xl border border-white/[0.07] bg-[#090811]/90 p-4">

                  <div className="flex items-center justify-between mb-1">

                    <p className="text-[9px] text-gray-300">
                      Assessment progress
                    </p>

                    <span className="text-[9px] text-violet-400">
                      {progress}%
                    </span>

                  </div>

                  <p className="text-[7px] text-gray-700 mb-4">
                    Adaptive interview
                  </p>


                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">

                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                      style={{
                        width:
                          `${Math.max(
                            progress,
                            2
                          )}%`,
                      }}
                    />

                  </div>


                  <div className="flex justify-between mt-2">

                    <span className="text-[7px] text-gray-700">
                      {answeredQuestions} answered
                    </span>

                    <span className="text-[7px] text-gray-700">
                      adaptive
                    </span>

                  </div>

                </div>


                {/* SECURITY COVERAGE */}

                <div className="rounded-xl border border-white/[0.07] bg-[#090811]/90 p-4">

                  <div className="flex items-center justify-between mb-1">

                    <p className="text-[9px] text-gray-300">
                      Security coverage
                    </p>

                    <BarChart3 className="w-3 h-3 text-violet-400" />

                  </div>

                  <p className="text-[7px] text-gray-700 mb-4">
                    Live assessment areas
                  </p>


                  <div className="space-y-3">

                    {SECURITY_DOMAINS.map(
                      (
                        domain,
                        index
                      ) => {

                        const active =
                          index <=
                          activeDomainIndex;

                        const value =
                          active
                            ? Math.min(
                                100,
                                Math.max(
                                  8,
                                  progress +
                                    20 -
                                    index *
                                      7
                                )
                              )
                            : 2;

                        const Icon =
                          domain.icon;

                        return (

                          <div
                            key={
                              domain.key
                            }
                          >

                            <div className="flex items-center justify-between mb-1">

                              <div className="flex items-center gap-2">

                                <Icon
                                  className={cn(
                                    'w-2.5 h-2.5',
                                    active
                                      ? 'text-violet-400'
                                      : 'text-gray-700'
                                  )}
                                />

                                <span
                                  className={cn(
                                    'text-[8px]',
                                    active
                                      ? 'text-gray-400'
                                      : 'text-gray-700'
                                  )}
                                >
                                  {
                                    domain.short
                                  }
                                </span>

                              </div>

                              <span className="text-[7px] text-gray-700">

                                {active
                                  ? `${value}%`
                                  : 'pending'}

                              </span>

                            </div>


                            <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">

                              <div
                                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                                style={{
                                  width:
                                    `${value}%`,
                                }}
                              />

                            </div>

                          </div>

                        );

                      }
                    )}

                  </div>

                </div>


                {/* ACTIVITY */}

                <div className="rounded-xl border border-white/[0.07] bg-[#090811]/90 p-4">

                  <div className="flex items-center justify-between mb-1">

                    <p className="text-[9px] text-gray-300">
                      Assessment activity
                    </p>

                    <Activity className="w-3 h-3 text-violet-400" />

                  </div>

                  <p className="text-[7px] text-gray-700 mb-4">
                    Security areas being reviewed
                  </p>


                  <div className="space-y-3">

                    {SECURITY_DOMAINS.map(
                      (
                        domain,
                        index
                      ) => {

                        const active =
                          index ===
                          activeDomainIndex;

                        const completed =
                          index <
                          activeDomainIndex;

                        return (

                          <div
                            key={
                              domain.key
                            }
                            className="flex items-center justify-between"
                          >

                            <div className="flex items-center gap-2">

                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full border',
                                  completed
                                    ? 'bg-emerald-400 border-emerald-300'
                                    : active
                                    ? 'bg-violet-400 border-violet-300 shadow-[0_0_7px_rgba(167,139,250,.8)]'
                                    : 'border-gray-700'
                                )}
                              />

                              <span
                                className={cn(
                                  'text-[8px]',
                                  active ||
                                    completed
                                    ? 'text-gray-400'
                                    : 'text-gray-700'
                                )}
                              >
                                {
                                  domain.label
                                }
                              </span>

                            </div>


                            <span className="text-[7px] text-gray-700">

                              {completed
                                ? 'done'
                                : active
                                ? 'reviewing'
                                : 'pending'}

                            </span>

                          </div>

                        );

                      }
                    )}

                  </div>

                </div>


                {/* FRAMEWORKS */}

                <div className="rounded-xl border border-white/[0.07] bg-[#090811]/90 p-4">

                  <div className="flex items-center gap-2 mb-4">

                    <Lock className="w-3.5 h-3.5 text-emerald-400" />

                    <div>

                      <p className="text-[9px] text-gray-300">
                        Framework coverage
                      </p>

                      <p className="text-[7px] text-gray-700">
                        Assessment standards
                      </p>

                    </div>

                  </div>


                  <div className="space-y-2">

                    <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.05] bg-white/[0.015]">

                      <span className="text-[8px] text-gray-500">
                        NIST CSF 2.0
                      </span>

                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />

                    </div>


                    <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-white/[0.05] bg-white/[0.015]">

                      <span className="text-[8px] text-gray-500">
                        CIS Controls v8
                      </span>

                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />

                    </div>

                  </div>

                </div>

              </aside>

            </div>


            {/* BOTTOM STATUS */}

            <div className="grid md:grid-cols-3 gap-3 mt-4">

              <div className="rounded-xl border border-white/[0.06] bg-[#090811]/90 px-4 py-3 flex items-center gap-3">

                <div className="w-7 h-7 rounded-lg bg-violet-500/[0.08] flex items-center justify-center">

                  <Zap className="w-3 h-3 text-violet-400" />

                </div>

                <div>

                  <p className="text-[7px] uppercase tracking-[0.15em] text-gray-700">
                    AI Status
                  </p>

                  <p className="text-[8px] text-gray-500">
                    Adaptive analysis active
                  </p>

                </div>

              </div>


              <div className="rounded-xl border border-white/[0.06] bg-[#090811]/90 px-4 py-3 flex items-center gap-3">

                <div className="w-7 h-7 rounded-lg bg-blue-500/[0.08] flex items-center justify-center">

                  <Lock className="w-3 h-3 text-blue-400" />

                </div>

                <div>

                  <p className="text-[7px] uppercase tracking-[0.15em] text-gray-700">
                    Privacy
                  </p>

                  <p className="text-[8px] text-gray-500">
                    Session protected
                  </p>

                </div>

              </div>


              <div className="rounded-xl border border-white/[0.06] bg-[#090811]/90 px-4 py-3 flex items-center gap-3">

                <div className="w-7 h-7 rounded-lg bg-emerald-500/[0.08] flex items-center justify-center">

                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />

                </div>

                <div>

                  <p className="text-[7px] uppercase tracking-[0.15em] text-gray-700">
                    Standards
                  </p>

                  <p className="text-[8px] text-gray-500">
                    NIST + CIS aligned
                  </p>

                </div>

              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}
