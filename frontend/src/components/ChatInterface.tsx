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
  Sparkles,
  Activity,
  BarChart3,
  ShieldCheck,
  Database,
  Network,
  Mail,
  Siren,
  Lock,
  Plus,
  Search,
  MoreHorizontal,
  ChevronRight,
  Circle,
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
   SECURITY DOMAINS
   ============================================================ */

const SECURITY_DOMAINS = [
  {
    id: 'access',
    label: 'Access Control',
    short: 'Access',
    icon: ShieldCheck,
  },
  {
    id: 'backup',
    label: 'Data Backup',
    short: 'Backup',
    icon: Database,
  },
  {
    id: 'network',
    label: 'Network Security',
    short: 'Network',
    icon: Network,
  },
  {
    id: 'phishing',
    label: 'Email & Phishing',
    short: 'Phishing',
    icon: Mail,
  },
  {
    id: 'incident',
    label: 'Incident Response',
    short: 'Incident',
    icon: Siren,
  },
];


/* ============================================================
   CLEAN AI RESPONSE
   ============================================================ */

function stripMarkdown(text: string): string {
  let out = text
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>\s*/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>\s*/gi, '')
    .replace(/<\/?(think|thinking|thought|answer)[^>]*>/gi, '');

  const lines = out.split('\n');

  let last = -1;

  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim().toLowerCase();

    if (t === 'response') {
      last = i;
    }
  }

  if (last !== -1) {
    out = lines.slice(last + 1).join('\n');
  }

  return out
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .trim();
}


/* ============================================================
   NOTIFICATION SOUND
   ============================================================ */

function playNotificationSound() {
  try {
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';

    osc.frequency.setValueAtTime(
      880,
      ctx.currentTime
    );

    osc.frequency.exponentialRampToValueAtTime(
      660,
      ctx.currentTime + 0.15
    );

    gain.gain.setValueAtTime(
      0.06,
      ctx.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.3
    );

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);

  } catch {}
}


/* ============================================================
   CYBERCISO ORB
   ============================================================ */

function CyberOrb({
  small = false,
}: {
  small?: boolean;
}) {

  return (
    <div
      className={cn(
        'relative flex items-center justify-center',
        small
          ? 'w-9 h-9'
          : 'w-24 h-24'
      )}
    >

      <div
        className={cn(
          'absolute inset-0 rounded-full bg-violet-600/30 blur-2xl',
          small && 'blur-lg'
        )}
      />

      <div
        className={cn(
          'absolute inset-[8%] rounded-full bg-gradient-to-br from-violet-400 via-purple-600 to-blue-700 shadow-[0_0_45px_rgba(139,92,246,0.45)]',
          small && 'shadow-[0_0_20px_rgba(139,92,246,0.35)]'
        )}
      />

      <div
        className={cn(
          'absolute inset-[17%] rounded-full bg-[#0c0a16] border border-white/10 flex items-center justify-center',
          small && 'inset-[18%]'
        )}
      >

        <Shield
          className={cn(
            'text-violet-200',
            small
              ? 'w-4 h-4'
              : 'w-9 h-9'
          )}
        />

      </div>

      {!small && (
        <>
          <div className="absolute w-2 h-2 rounded-full bg-white/80 top-2 right-6 blur-[1px]" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-violet-200 bottom-5 left-3" />
        </>
      )}

    </div>
  );
}


/* ============================================================
   TYPING INDICATOR
   ============================================================ */

function TypingIndicator() {

  return (
    <div className="flex gap-3 items-start">

      <CyberOrb small />

      <div className="rounded-2xl rounded-tl-md border border-white/[0.08] bg-white/[0.045] px-5 py-4">

        <div className="flex items-center gap-1.5">

          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-violet-400" />

          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-violet-400" />

          <div className="typing-dot w-1.5 h-1.5 rounded-full bg-violet-400" />

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
  onSelect: (v: Vertical) => void;
}) {

  const businesses = [
    {
      id: 'retail' as Vertical,
      label: 'Retail',
      description:
        'POS systems, inventory, payment networks',
      icon: '🛍️',
    },

    {
      id: 'healthcare_clinic' as Vertical,
      label: 'Healthcare Clinic',
      description:
        'EHR systems, PHI, medical devices',
      icon: '🏥',
    },

    {
      id: 'professional_services' as Vertical,
      label: 'Professional Services',
      description:
        'Client data, cloud applications, IP',
      icon: '💼',
    },
  ];

  return (

    <div className="min-h-screen bg-[#05040b] text-white relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[650px] h-[400px] rounded-full bg-violet-600/15 blur-[150px]" />

        <div className="absolute bottom-[-100px] left-[-100px] w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[130px]" />

      </div>

      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">

        <header className="h-16 border-b border-white/[0.06] bg-[#08070e]/70 backdrop-blur-xl">

          <div className="max-w-6xl mx-auto h-full px-5 flex items-center justify-between">

            <Link
              href="/"
              className="flex items-center gap-2.5 text-gray-500 hover:text-white transition"
            >

              <ArrowLeft className="w-4 h-4" />

              <span className="text-sm">
                Back
              </span>

            </Link>

            <div className="flex items-center gap-2 text-xs text-gray-500">

              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />

              Secure & Private

            </div>

          </div>

        </header>


        <main className="flex-1 flex items-center justify-center px-5 py-14">

          <div className="max-w-4xl w-full">

            <div className="text-center mb-12">

              <div className="flex justify-center mb-6">
                <CyberOrb />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-400/20 bg-violet-500/[0.07] text-violet-300 text-xs mb-5">

                <Sparkles className="w-3.5 h-3.5" />

                AI Security Assessment

              </div>

              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">

                Select your business

              </h1>

              <p className="text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">

                CyberCISO will tailor your assessment
                to your industry's risks.

              </p>

            </div>


            <div className="grid md:grid-cols-3 gap-4">

              {businesses.map(
                ({
                  id,
                  label,
                  description,
                  icon,
                }) => (

                  <button
                    key={id}
                    onClick={() => onSelect(id)}
                    className="group text-left rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6 hover:bg-white/[0.05] hover:border-violet-400/30 hover:-translate-y-1 transition-all duration-300"
                  >

                    <div className="text-3xl mb-5">
                      {icon}
                    </div>

                    <div className="flex items-center justify-between">

                      <h3 className="font-semibold text-gray-200 group-hover:text-white">
                        {label}
                      </h3>

                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition" />

                    </div>

                    <p className="text-sm text-gray-500 mt-3 leading-relaxed">
                      {description}
                    </p>

                  </button>

                )
              )}

            </div>


            <div className="flex justify-center gap-6 mt-9 text-xs text-gray-600">

              <span>
                NIST CSF 2.0
              </span>

              <span>
                •
              </span>

              <span>
                CIS Controls v8
              </span>

              <span>
                •
              </span>

              <span>
                Adaptive Assessment
              </span>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}


/* ============================================================
   DASHBOARD STAT CARD
   ============================================================ */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  accent = 'violet',
}: {
  label: string;
  value: string;
  description: string;
  icon: any;
  accent?: 'violet' | 'blue' | 'green';
}) {

  const accents = {
    violet: 'text-violet-300 bg-violet-500/10 border-violet-400/10',
    blue: 'text-blue-300 bg-blue-500/10 border-blue-400/10',
    green: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/10',
  };

  return (

    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-[10px] uppercase tracking-[0.16em] text-gray-600">
            {label}
          </p>

          <p className="text-2xl font-semibold text-white mt-1">
            {value}
          </p>

          <p className="text-[11px] text-gray-600 mt-1">
            {description}
          </p>

        </div>

        <div
          className={cn(
            'w-9 h-9 rounded-xl border flex items-center justify-center',
            accents[accent]
          )}
        >

          <Icon className="w-4 h-4" />

        </div>

      </div>

    </div>
  );
}


/* ============================================================
   DOMAIN COVERAGE
   ============================================================ */

function DomainCoverage({
  answered,
}: {
  answered: number;
}) {

  const levels = [
    Math.min(100, answered >= 1 ? 82 : 18),
    Math.min(100, answered >= 2 ? 64 : 8),
    Math.min(100, answered >= 3 ? 55 : 5),
    Math.min(100, answered >= 4 ? 48 : 4),
    Math.min(100, answered >= 5 ? 40 : 3),
  ];

  return (

    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

      <div className="flex items-center justify-between mb-5">

        <div>

          <p className="text-sm font-medium text-gray-200">
            Security coverage
          </p>

          <p className="text-[11px] text-gray-600 mt-1">
            Live assessment areas
          </p>

        </div>

        <BarChart3 className="w-4 h-4 text-violet-400" />

      </div>


      <div className="space-y-4">

        {SECURITY_DOMAINS.map(
          (domain, index) => {

            const Icon = domain.icon;

            return (

              <div key={domain.id}>

                <div className="flex items-center justify-between mb-1.5">

                  <div className="flex items-center gap-2">

                    <Icon className="w-3.5 h-3.5 text-gray-600" />

                    <span className="text-xs text-gray-400">
                      {domain.short}
                    </span>

                  </div>

                  <span className="text-[10px] text-gray-600">
                    {answered > index
                      ? 'reviewed'
                      : 'pending'}
                  </span>

                </div>


                <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-400 transition-all duration-700"
                    style={{
                      width: `${levels[index]}%`,
                    }}
                  />

                </div>

              </div>

            );
          }
        )}

      </div>

    </div>
  );
}


/* ============================================================
   ASSESSMENT ACTIVITY
   ============================================================ */

function AssessmentActivity({
  answered,
}: {
  answered: number;
}) {

  const states = [
    answered >= 1 ? 'complete' : 'active',
    answered >= 2 ? 'complete' : answered === 1 ? 'active' : 'pending',
    answered >= 3 ? 'complete' : answered === 2 ? 'active' : 'pending',
    answered >= 4 ? 'complete' : answered === 3 ? 'active' : 'pending',
    answered >= 5 ? 'complete' : answered === 4 ? 'active' : 'pending',
  ];

  return (

    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

      <div className="flex items-center justify-between mb-5">

        <div>

          <p className="text-sm font-medium text-gray-200">
            Assessment activity
          </p>

          <p className="text-[11px] text-gray-600 mt-1">
            Security areas being reviewed
          </p>

        </div>

        <Activity className="w-4 h-4 text-violet-400" />

      </div>


      <div className="space-y-4">

        {SECURITY_DOMAINS.map(
          (domain, index) => {

            const state = states[index];

            return (

              <div
                key={domain.id}
                className="flex items-center gap-3"
              >

                <div className="relative flex flex-col items-center">

                  <div
                    className={cn(
                      'w-2.5 h-2.5 rounded-full border',
                      state === 'complete'
                        ? 'bg-emerald-400 border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,.5)]'
                        : state === 'active'
                        ? 'bg-violet-400 border-violet-200 shadow-[0_0_10px_rgba(167,139,250,.7)]'
                        : 'bg-transparent border-gray-700'
                    )}
                  />

                  {index <
                    SECURITY_DOMAINS.length - 1 && (
                    <div className="absolute top-3 w-px h-5 bg-white/[0.06]" />
                  )}

                </div>


                <div className="flex-1 flex items-center justify-between">

                  <span
                    className={cn(
                      'text-xs',
                      state === 'pending'
                        ? 'text-gray-600'
                        : 'text-gray-400'
                    )}
                  >
                    {domain.label}
                  </span>

                  <span
                    className={cn(
                      'text-[10px]',
                      state === 'complete'
                        ? 'text-emerald-400'
                        : state === 'active'
                        ? 'text-violet-400'
                        : 'text-gray-700'
                    )}
                  >
                    {state === 'complete'
                      ? 'completed'
                      : state === 'active'
                      ? 'analyzing'
                      : 'pending'}
                  </span>

                </div>

              </div>

            );
          }
        )}

      </div>

    </div>
  );
}


/* ============================================================
   CHAT INTERFACE
   ============================================================ */

interface ChatInterfaceProps {
  initialVertical?: Vertical;
}


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
    useState(() => generateSessionId());

  const prevMsgCountRef =
    useRef(0);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLTextAreaElement>(null);


  /* ============================================================
     AUTO SCROLL
     ============================================================ */

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });

  }, [
    messages,
    scorecard,
    interviewComplete,
  ]);


  /* ============================================================
     AUTO FOCUS
     ============================================================ */

  useEffect(() => {

    inputRef.current?.focus();

  }, [messages]);


  /* ============================================================
     AI SOUND
     ============================================================ */

  useEffect(() => {

    if (
      messages.length >
      prevMsgCountRef.current
    ) {

      const last =
        messages[messages.length - 1];

      if (
        last?.role === 'assistant'
      ) {

        playNotificationSound();

      }

    }

    prevMsgCountRef.current =
      messages.length;

  }, [messages]);


  /* ============================================================
     SEND MESSAGE
     ============================================================ */

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    if (
      !input.trim() ||
      isLoading
    ) {
      return;
    }


    const userMessage =
      input.trim();

    setInput('');

    setError(null);

    setIsLoading(true);


    const newMessages = [
      ...messages,
      {
        role: 'user' as const,
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
          messages,

        vertical,

        session_id:
          sessionId,

      };


      const response =
        await sendChatMessage(
          request
        );


      let sc =
        response.scorecard;


      /* --------------------------------------------------------
         FALLBACK SCORECARD PARSING
         -------------------------------------------------------- */

      if (
        !sc &&
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
              parsed.overall_grade &&
              parsed.sub_categories
            ) {

              sc =
                parsed as ScorecardResponse;

            }

          }

        } catch {}

      }


      /* --------------------------------------------------------
         SCORECARD
         -------------------------------------------------------- */

      if (sc) {

        setScorecard(sc);

        setInterviewComplete(
          true
        );

        setVertical(
          sc.vertical
        );

      }

      /* --------------------------------------------------------
         NORMAL RESPONSE
         -------------------------------------------------------- */

      else {

        setMessages(
          prev => [
            ...prev,
            {
              role: 'assistant',
              content:
                stripMarkdown(
                  response.response
                ),
            },
          ]
        );

      }

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send message'
      );


      setMessages(
        prev =>
          prev.slice(0, -1)
      );

    } finally {

      setIsLoading(false);

    }

  };


  /* ============================================================
     SELECT BUSINESS
     ============================================================ */

  const handleVerticalSelect =
    useCallback(
      (
        selectedVertical: Vertical
      ) => {

        setVertical(
          selectedVertical
        );


        const name =
          formatVertical(
            selectedVertical
          );


        const welcomeMsg =
          `Sure! Here is your ${name} assessment.`;


        const firstQuestion =
          FIRST_QUESTIONS[
            selectedVertical
          ];


        setMessages([

          {
            role: 'user',
            content:
              `I want an assessment for ${name}`,
          },

          {
            role: 'assistant',
            content:
              welcomeMsg,
          },

          {
            role: 'assistant',
            content:
              firstQuestion,
          },

        ]);

      },
      []
    );


  /* ============================================================
     INITIALIZE FROM HOMEPAGE
     ============================================================ */

  useEffect(() => {

    if (
      initialVertical &&
      messages.length === 0 &&
      !interviewComplete
    ) {

      handleVerticalSelect(
        initialVertical
      );

    }

  }, [
    initialVertical,
    messages.length,
    interviewComplete,
    handleVerticalSelect,
  ]);


  /* ============================================================
     RESTART
     ============================================================ */

  const handleRestart = () => {

    window.location.href =
      '/';

  };


  /* ============================================================
     PDF
     ============================================================ */

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


  /* ============================================================
     DIRECT /ASSESS PICKER
     ============================================================ */

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


  /* ============================================================
     FINAL SCORECARD
     ============================================================ */

  if (
    interviewComplete &&
    scorecard
  ) {

    return (

      <div className="min-h-screen bg-[#05040b]">

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

      </div>

    );

  }


  /* ============================================================
     LIVE ASSESSMENT
     ============================================================ */

  const userMessages =
    messages.filter(
      message =>
        message.role === 'user'
    ).length;

  /*
   * The first user message is generated by CyberCISO
   * when the assessment starts, so don't count it as
   * a real answered question.
   */
  const answeredQuestions =
    Math.max(
      0,
      userMessages - 1
    );

  /*
   * The backend describes the assessment as roughly
   * 8–12 adaptive questions. We therefore show a
   * visual estimate rather than pretending we know
   * the exact final number.
   */
  const progress =
    Math.min(
      92,
      Math.max(
        8,
        answeredQuestions * 10
      )
    );


  return (

    <div className="min-h-screen bg-[#05040b] text-white relative overflow-hidden">

      {/* ======================================================
          BACKGROUND
          ====================================================== */}

      <div className="fixed inset-0 pointer-events-none">

        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[850px] h-[500px] rounded-full bg-violet-700/[0.10] blur-[170px]" />

        <div className="absolute bottom-[-180px] left-[-100px] w-[450px] h-[450px] rounded-full bg-blue-700/[0.07] blur-[160px]" />

        <div className="absolute top-[35%] right-[-150px] w-[400px] h-[400px] rounded-full bg-fuchsia-700/[0.06] blur-[150px]" />

      </div>


      {/* GRID */}

      <div
        className="fixed inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize:
            '48px 48px',
        }}
      />


      <div className="relative z-10 min-h-screen flex">


        {/* ====================================================
            SIDEBAR — NEBULA INSPIRED
            ==================================================== */}

        <aside className="hidden lg:flex w-[245px] flex-shrink-0 border-r border-white/[0.06] bg-[#08070e]/70 backdrop-blur-xl flex-col">

          {/* LOGO */}

          <div className="px-5 py-5">

            <Link
              href="/"
              className="flex items-center gap-3"
            >

              <CyberOrb small />

              <div>

                <div className="font-semibold text-sm text-white">
                  CyberCISO
                </div>

                <div className="text-[9px] tracking-[0.18em] uppercase text-gray-600">
                  AI Security Advisor
                </div>

              </div>

            </Link>

          </div>


          {/* NEW ASSESSMENT */}

          <div className="px-3">

            <button
              onClick={handleRestart}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-violet-500/[0.10] border border-violet-400/10 hover:bg-violet-500/[0.16] transition"
            >

              <Plus className="w-4 h-4 text-violet-300" />

              <span className="text-xs text-violet-200">
                New Assessment
              </span>

            </button>

          </div>


          {/* NAV */}

          <div className="px-3 mt-5">

            <div className="px-3 mb-2 text-[9px] uppercase tracking-[0.18em] text-gray-700">
              Assessment
            </div>


            <div className="space-y-1">

              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.04] text-gray-300">

                <Activity className="w-3.5 h-3.5 text-violet-400" />

                <span className="text-xs">
                  Live assessment
                </span>

              </div>


              <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600">

                <BarChart3 className="w-3.5 h-3.5" />

                <span className="text-xs">
                  Security posture
                </span>

              </div>

            </div>

          </div>


          {/* CURRENT ASSESSMENT */}

          <div className="px-3 mt-7 flex-1">

            <div className="px-3 mb-2 text-[9px] uppercase tracking-[0.18em] text-gray-700">
              Current
            </div>


            <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">

              <div className="flex items-center gap-2 mb-2">

                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,.7)]" />

                <span className="text-xs text-gray-300 truncate">
                  {vertical
                    ? formatVertical(vertical)
                    : 'Security Assessment'}
                </span>

              </div>

              <p className="text-[10px] text-gray-700">
                Assessment in progress
              </p>

            </div>

          </div>


          {/* SIDEBAR FOOTER */}

          <div className="p-4 border-t border-white/[0.06]">

            <div className="flex items-center gap-3">

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/40 to-blue-500/30 border border-white/10 flex items-center justify-center">

                <Shield className="w-3.5 h-3.5 text-violet-300" />

              </div>

              <div>

                <p className="text-xs text-gray-400">
                  Secure session
                </p>

                <p className="text-[10px] text-emerald-500/70">
                  ● Protected locally
                </p>

              </div>

            </div>

          </div>

        </aside>


        {/* ====================================================
            MAIN
            ==================================================== */}

        <main className="flex-1 min-w-0 flex flex-col">


          {/* ==================================================
              TOP HEADER
              ================================================== */}

          <header className="h-16 flex-shrink-0 border-b border-white/[0.06] bg-[#08070e]/65 backdrop-blur-xl">

            <div className="h-full px-5 flex items-center justify-between">

              <div className="flex items-center gap-3">

                <Link
                  href="/"
                  className="lg:hidden text-gray-600 hover:text-white"
                >

                  <ArrowLeft className="w-4 h-4" />

                </Link>


                <div>

                  <div className="flex items-center gap-2">

                    <h1 className="text-sm font-medium text-gray-200">
                      {vertical
                        ? formatVertical(vertical)
                        : 'Security Assessment'}
                    </h1>

                    <span className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-400/10 text-[9px] text-violet-300">
                      AI AUDIT
                    </span>

                  </div>

                  <p className="text-[10px] text-gray-600 mt-0.5">
                    Adaptive security interview
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-3">

                <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-600">

                  <Lock className="w-3 h-3" />

                  Session protected

                </div>


                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-emerald-400/10 bg-emerald-500/[0.05]">

                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,.7)] animate-pulse" />

                  <span className="text-[10px] text-emerald-400/80">
                    Active
                  </span>

                </div>


                <button className="w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.025] flex items-center justify-center text-gray-600 hover:text-gray-300 transition">

                  <MoreHorizontal className="w-4 h-4" />

                </button>

              </div>

            </div>

          </header>


          {/* ==================================================
              CONTENT
              ================================================== */}

          <div className="flex-1 overflow-y-auto">

            <div className="max-w-[1450px] mx-auto px-4 sm:px-6 py-6">


              {/* =================================================
                  TITLE
                  ================================================= */}

              <div className="mb-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.2em] text-violet-400/70 mb-2">
                      Security Operations
                    </p>

                    <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                      Assessment overview
                    </h2>

                  </div>


                  <div className="hidden md:flex items-center gap-2">

                    <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,.7)]" />

                    <span className="text-xs text-gray-500">
                      CyberCISO AI is analyzing
                    </span>

                  </div>

                </div>

              </div>


              {/* =================================================
                  STAT CARDS
                  ================================================= */}

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-4">

                <StatCard
                  label="Questions"
                  value={String(
                    answeredQuestions
                  )}
                  description="answered"
                  icon={Activity}
                />

                <StatCard
                  label="Progress"
                  value={`${progress}%`}
                  description="assessment progress"
                  icon={BarChart3}
                  accent="blue"
                />

                <StatCard
                  label="Domains"
                  value="5"
                  description="security areas"
                  icon={ShieldCheck}
                />

                <StatCard
                  label="Frameworks"
                  value="NIST + CIS"
                  description="active controls"
                  icon={Lock}
                  accent="green"
                />

              </div>


              {/* =================================================
                  MAIN DASHBOARD GRID
                  ================================================= */}

              <div className="grid xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)] gap-4">


                {/* =================================================
                    CHAT PANEL
                    ================================================= */}

                <section className="rounded-2xl border border-white/[0.07] bg-[#0a0911]/80 overflow-hidden flex flex-col min-h-[590px]">

                  {/* CHAT HEADER */}

                  <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <CyberOrb small />

                      <div>

                        <p className="text-sm font-medium text-gray-200">
                          CyberCISO AI
                        </p>

                        <div className="flex items-center gap-2 mt-0.5">

                          <span className="text-[10px] text-emerald-400/70">
                            Online
                          </span>

                          <span className="w-1 h-1 rounded-full bg-gray-700" />

                          <span className="text-[10px] text-gray-600">
                            Security analyst
                          </span>

                        </div>

                      </div>

                    </div>


                    <button className="w-8 h-8 rounded-lg border border-white/[0.06] flex items-center justify-center text-gray-600 hover:text-gray-300">

                      <Search className="w-3.5 h-3.5" />

                    </button>

                  </div>


                  {/* MESSAGES */}

                  <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5">

                    {messages.map(
                      (msg, idx) => {

                        const isUser =
                          msg.role === 'user';

                        return (

                          <div
                            key={idx}
                            className={cn(
                              'flex gap-3 message-enter',
                              isUser
                                ? 'justify-end'
                                : 'justify-start'
                            )}
                          >

                            {!isUser && (
                              <CyberOrb small />
                            )}


                            <div
                              className={cn(

                                'max-w-[78%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed',

                                isUser

                                  ? 'rounded-br-md bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-950/30'

                                  : 'rounded-tl-md bg-white/[0.045] border border-white/[0.07] text-gray-300'

                              )}
                            >

                              {!isUser && (
                                <div className="flex items-center gap-2 mb-2">

                                  <span className="text-[9px] uppercase tracking-[0.14em] text-violet-400">
                                    CyberCISO
                                  </span>

                                </div>
                              )}

                              <p className="whitespace-pre-wrap">
                                {msg.content}
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

                        <div className="px-4 py-3 rounded-xl border border-red-400/10 bg-red-500/[0.06] text-red-300 text-xs">
                          {error}
                        </div>

                      </div>

                    )}


                    <div ref={messagesEndRef} />

                  </div>


                  {/* CHAT INPUT */}

                  <div className="p-4 border-t border-white/[0.06]">

                    <form
                      onSubmit={
                        handleSubmit
                      }
                    >

                      <div className="relative">

                        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-violet-600/30 via-fuchsia-500/20 to-blue-500/30 blur-sm" />


                        <div className="relative rounded-2xl border border-white/[0.09] bg-[#11101a]">

                          <textarea
                            ref={inputRef}
                            value={input}
                            onChange={
                              e =>
                                setInput(
                                  e.target.value
                                )
                            }
                            onKeyDown={(
                              e: KeyboardEvent<HTMLTextAreaElement>
                            ) => {

                              if (
                                e.key ===
                                  'Enter' &&
                                !e.shiftKey
                              ) {

                                e.preventDefault();

                                handleSubmit(
                                  e
                                );

                              }

                            }}
                            disabled={
                              isLoading
                            }
                            rows={2}
                            placeholder="Tell CyberCISO about your security..."
                            className="w-full resize-none bg-transparent outline-none px-4 pt-4 pb-12 text-sm text-gray-200 placeholder:text-gray-700"
                          />


                          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between">

                            <div className="flex items-center gap-1">

                              <button
                                type="button"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-700 hover:text-gray-400 hover:bg-white/[0.04] transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>

                              <span className="text-[9px] text-gray-700 hidden sm:block">
                                Shift + Enter for new line
                              </span>

                            </div>


                            <button
                              type="submit"
                              disabled={
                                !input.trim() ||
                                isLoading
                              }
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center transition-all',

                                input.trim() &&
                                !isLoading

                                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-900/30 hover:scale-105'

                                  : 'bg-white/[0.04] text-gray-700 cursor-not-allowed'
                              )}
                            >

                              <Send className="w-3.5 h-3.5" />

                            </button>

                          </div>

                        </div>

                      </div>

                    </form>

                  </div>

                </section>


                {/* =================================================
                    RIGHT DASHBOARD
                    ================================================= */}

                <div className="space-y-4">


                  {/* PROGRESS CARD */}

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

                    <div className="flex items-center justify-between mb-4">

                      <div>

                        <p className="text-sm font-medium text-gray-200">
                          Assessment progress
                        </p>

                        <p className="text-[11px] text-gray-600 mt-1">
                          Adaptive interview
                        </p>

                      </div>

                      <span className="text-xl font-semibold text-white">
                        {progress}%
                      </span>

                    </div>


                    <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden mb-4">

                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 transition-all duration-700"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>


                    <div className="flex justify-between text-[10px] text-gray-600">

                      <span>
                        {answeredQuestions} answered
                      </span>

                      <span>
                        adaptive
                      </span>

                    </div>

                  </div>


                  {/* SECURITY COVERAGE */}

                  <DomainCoverage
                    answered={
                      answeredQuestions
                    }
                  />


                  {/* ACTIVITY */}

                  <AssessmentActivity
                    answered={
                      answeredQuestions
                    }
                  />


                  {/* FRAMEWORKS */}

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">

                    <div className="flex items-center gap-2 mb-4">

                      <ShieldCheck className="w-4 h-4 text-emerald-400" />

                      <div>

                        <p className="text-sm text-gray-200">
                          Framework coverage
                        </p>

                        <p className="text-[10px] text-gray-600">
                          Assessment standards
                        </p>

                      </div>

                    </div>


                    <div className="space-y-2">

                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.025] border border-white/[0.04]">

                        <span className="text-xs text-gray-400">
                          NIST CSF 2.0
                        </span>

                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />

                      </div>


                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.025] border border-white/[0.04]">

                        <span className="text-xs text-gray-400">
                          CIS Controls v8
                        </span>

                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />

                      </div>

                    </div>

                  </div>


                </div>

              </div>


              {/* =================================================
                  BOTTOM SECURITY SIGNAL STRIP
                  ================================================= */}

              <div className="grid sm:grid-cols-3 gap-3 mt-4">

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">

                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-400/10 flex items-center justify-center">

                    <Activity className="w-3.5 h-3.5 text-violet-400" />

                  </div>

                  <div>

                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                      AI status
                    </p>

                    <p className="text-xs text-gray-300 mt-0.5">
                      Adaptive analysis active
                    </p>

                  </div>

                </div>


                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">

                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-400/10 flex items-center justify-center">

                    <Lock className="w-3.5 h-3.5 text-blue-400" />

                  </div>

                  <div>

                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                      Privacy
                    </p>

                    <p className="text-xs text-gray-300 mt-0.5">
                      Session data protected
                    </p>

                  </div>

                </div>


                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 flex items-center gap-3">

                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/10 flex items-center justify-center">

                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />

                  </div>

                  <div>

                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">
                      Standards
                    </p>

                    <p className="text-xs text-gray-300 mt-0.5">
                      NIST + CIS aligned
                    </p>

                  </div>

                </div>

              </div>


            </div>

          </div>

        </main>

      </div>

    </div>
  );
}
