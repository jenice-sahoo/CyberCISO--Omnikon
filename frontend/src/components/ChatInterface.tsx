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
   HELPERS
   ============================================================ */

function stripMarkdown(text: string): string {
  let output = text
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>\s*/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>\s*/gi, '')
    .replace(/<\/?(think|thinking|thought|answer)[^>]*>/gi, '');

  const lines = output.split('\n');

  let responseIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === 'response') {
      responseIndex = i;
    }
  }

  if (responseIndex !== -1) {
    output = lines.slice(responseIndex + 1).join('\n');
  }

  return output
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
    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();

    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.type = 'sine';

    oscillator.frequency.setValueAtTime(
      880,
      context.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      660,
      context.currentTime + 0.15
    );

    gain.gain.setValueAtTime(
      0.05,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + 0.3
    );

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.3);

    oscillator.addEventListener('ended', () => {
      void context.close();
    });
  } catch {
    // Audio is optional and should never break the chat.
  }
}

/* ============================================================
   TYPING INDICATOR
   ============================================================ */

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 message-enter">
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
        <Shield className="w-4 h-4 text-white" />
      </div>

      <div className="rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.035] px-5 py-4">
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
   VERTICAL PICKER
   ============================================================ */

function VerticalPicker({
  onSelect,
}: {
  onSelect: (vertical: Vertical) => void;
}) {
  return (
    <div className="min-h-screen bg-[#05040b] text-white relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-violet-700/[0.12] blur-[180px]" />

        <div className="absolute bottom-[-200px] right-[-150px] w-[500px] h-[500px] rounded-full bg-blue-700/[0.08] blur-[160px]" />
      </div>

      <div
        className="fixed inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-6 py-5 border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Secure & Private
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-16">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-xl shadow-violet-500/20">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                Select your business
                <span className="text-violet-400">.</span>
              </h1>

              <p className="text-gray-500 mt-4 max-w-xl mx-auto leading-relaxed">
                We&apos;ll tailor the security assessment to your
                industry&apos;s specific risks and requirements.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {[
                {
                  id: 'retail' as Vertical,
                  label: 'Retail',
                  description:
                    'POS systems, inventory management, payment networks and staff access.',
                  icon: '🛍️',
                },
                {
                  id: 'healthcare_clinic' as Vertical,
                  label: 'Healthcare Clinic',
                  description:
                    'EHR systems, patient data, HIPAA compliance and device security.',
                  icon: '🏥',
                },
                {
                  id: 'professional_services' as Vertical,
                  label: 'Professional Services',
                  description:
                    'Client data, cloud applications, IP protection and secure communications.',
                  icon: '💼',
                },
              ].map(
                ({
                  id,
                  label,
                  description,
                  icon,
                }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelect(id)}
                    className="group text-left p-6 rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-violet-500/[0.06] hover:border-violet-400/20 transition-all"
                  >
                    <div className="text-3xl mb-5">
                      {icon}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-200 group-hover:text-white">
                        {label}
                      </span>

                      <ArrowLeft className="w-4 h-4 rotate-180 text-gray-700 group-hover:text-violet-400 transition-all" />
                    </div>

                    <p className="text-xs text-gray-600 leading-relaxed">
                      {description}
                    </p>
                  </button>
                )
              )}
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

              <span>~10 minutes</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   MAIN PROPS
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
      initialVertical ?? null
    );

  const [scorecard, setScorecard] =
    useState<ScorecardResponse | null>(null);

  const [interviewComplete, setInterviewComplete] =
    useState(false);

  const [sessionId] =
    useState(() => generateSessionId());

  const previousMessageCount =
    useRef(0);

  const inputRef =
    useRef<HTMLTextAreaElement>(null);

  /* ==========================================================
     INITIALIZE ASSESSMENT
     ========================================================== */

  const handleVerticalSelect = useCallback(
    (selectedVertical: Vertical) => {
      setVertical(selectedVertical);
      setScorecard(null);
      setInterviewComplete(false);
      setError(null);

      const name =
        formatVertical(selectedVertical);

      const firstQuestion =
        FIRST_QUESTIONS[selectedVertical];

      setMessages([
        {
          role: 'user',
          content: `I want an assessment for ${name}`,
        },
        {
          role: 'assistant',
          content: `Sure! Here is your ${name} assessment.`,
        },
        {
          role: 'assistant',
          content: firstQuestion,
        },
      ]);
    },
    []
  );

  /* ==========================================================
     AUTO INITIALIZE FROM HOMEPAGE
     ========================================================== */

  useEffect(() => {
    if (
      initialVertical &&
      messages.length === 0 &&
      !interviewComplete
    ) {
      handleVerticalSelect(initialVertical);
    }
  }, [
    initialVertical,
    messages.length,
    interviewComplete,
    handleVerticalSelect,
  ]);

  /* ==========================================================
     MESSAGE SOUND
     ========================================================== */

  useEffect(() => {
    if (
      messages.length >
      previousMessageCount.current
    ) {
      const lastMessage =
        messages[messages.length - 1];

      if (lastMessage?.role === 'assistant') {
        playNotificationSound();
      }
    }

    previousMessageCount.current =
      messages.length;
  }, [messages]);

  /* ==========================================================
     FOCUS INPUT
     ========================================================== */

  useEffect(() => {
    if (interviewComplete) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    messages,
    interviewComplete,
  ]);

  /* ==========================================================
     SUBMIT MESSAGE
     ========================================================== */

  const handleSubmit = async (
    event:
      | React.FormEvent<HTMLFormElement>
      | KeyboardEvent<HTMLTextAreaElement>
  ) => {
    event.preventDefault();

    if (
      !input.trim() ||
      isLoading ||
      interviewComplete ||
      !vertical
    ) {
      return;
    }

    const userMessage =
      input.trim();

    /*
     * IMPORTANT:
     * The current user message is sent separately.
     * The conversation_history contains only messages
     * that existed BEFORE the current message.
     */
    const conversationHistory =
      messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

    const optimisticMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
    };

    setInput('');
    setError(null);
    setIsLoading(true);

    setMessages((previous) => [
      ...previous,
      optimisticMessage,
    ]);

    try {
      const request: ChatRequest = {
        message: userMessage,
        conversation_history:
          conversationHistory,
        vertical,
        session_id: sessionId,
      };

      const response =
        await sendChatMessage(request);

      let receivedScorecard =
        response.scorecard;

      /*
       * FALLBACK:
       * Some backend configurations may return
       * the scorecard as JSON text.
       */

      if (
        !receivedScorecard &&
        response.response
      ) {
        try {
          let raw =
            response.response.trim();

          if (raw.startsWith('```')) {
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

          if (raw.startsWith('{')) {
            const parsed =
              JSON.parse(raw);

            if (
              parsed &&
              typeof parsed === 'object' &&
              parsed.overall_grade &&
              parsed.sub_categories
            ) {
              receivedScorecard =
                parsed as ScorecardResponse;
            }
          }
        } catch {
          // Not a scorecard JSON response.
        }
      }

      /* ======================================================
         SCORECARD RECEIVED
         ====================================================== */

      if (receivedScorecard) {
        setScorecard(
          receivedScorecard
        );

        setInterviewComplete(true);

        setVertical(
          receivedScorecard.vertical
        );

        return;
      }

      /* ======================================================
         NORMAL CHAT RESPONSE
         ====================================================== */

      const assistantResponse =
        stripMarkdown(
          response.response || ''
        );

      if (assistantResponse) {
        setMessages((previous) => [
          ...previous,
          {
            role: 'assistant',
            content:
              assistantResponse,
          },
        ]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send message'
      );

      /*
       * Remove only the optimistic message.
       * Preserve all previous conversation history.
       */
      setMessages((previous) => {
        if (previous.length === 0) {
          return previous;
        }

        const last =
          previous[previous.length - 1];

        if (
          last.role === 'user' &&
          last.content === userMessage
        ) {
          return previous.slice(0, -1);
        }

        return previous;
      });
    } finally {
      setIsLoading(false);
    }
  };

  /* ==========================================================
     NEW ASSESSMENT
     ========================================================== */

  const handleRestart = () => {
    window.location.href = '/';
  };

  /* ==========================================================
     DOWNLOAD PDF
     ========================================================== */

  const handleDownloadPDF = async () => {
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
     VERTICAL PICKER
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
          onRestart={handleRestart}
          onDownloadPDF={
            handleDownloadPDF
          }
        />
      </div>
    );
  }

  /* ==========================================================
     ASSESSMENT CALCULATIONS
     ========================================================== */

  const userMessages =
    messages.filter(
      (message) =>
        message.role === 'user'
    );

  const answeredQuestions =
    Math.max(
      0,
      userMessages.length - 1
    );

  const estimatedQuestions = 10;

  const progress = Math.min(
    100,
    Math.round(
      (answeredQuestions /
        estimatedQuestions) *
        100
    )
  );

  /* ==========================================================
     MAIN ASSESSMENT UI
     ========================================================== */

  return (
    <div className="min-h-screen bg-[#05040b] text-white relative">
      {/* BACKGROUND */}

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-220px] left-[35%] w-[700px] h-[500px] rounded-full bg-violet-700/[0.08] blur-[180px]" />

        <div className="absolute top-[45%] right-[-200px] w-[500px] h-[500px] rounded-full bg-blue-700/[0.05] blur-[170px]" />

        <div className="absolute bottom-[-200px] left-[10%] w-[500px] h-[400px] rounded-full bg-fuchsia-700/[0.04] blur-[170px]" />
      </div>

      {/* GRID */}

      <div
        className="fixed inset-0 opacity-[0.028] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize:
            '48px 48px',
        }}
      />

      {/* PAGE */}

      <div className="relative z-10 flex min-h-screen">
        {/* LEFT SIDEBAR */}

        <aside className="hidden lg:flex w-60 flex-shrink-0 border-r border-white/[0.06] bg-[#07060d]/90 flex-col sticky top-0 h-screen">
          <div className="px-5 py-5 border-b border-white/[0.06]">
            <Link
              href="/"
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full" />

                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-white">
                  CyberCISO
                </div>

                <div className="text-[8px] uppercase tracking-[0.18em] text-gray-600">
                  AI security advisor
                </div>
              </div>
            </Link>
          </div>

          <div className="px-4 py-4">
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-violet-400/10 bg-violet-500/[0.07] text-violet-300 text-xs hover:bg-violet-500/[0.12] transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              New Assessment
            </Link>
          </div>

          <div className="px-3">
            <p className="px-3 mb-2 text-[8px] uppercase tracking-[0.2em] text-gray-700">
              Assessment
            </p>

            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/[0.045] text-gray-200">
              <Activity className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs">
                Live assessment
              </span>
            </div>
          </div>

          <div className="px-4 mt-6">
            <p className="px-2 mb-2 text-[8px] uppercase tracking-[0.2em] text-gray-700">
              Current
            </p>

            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,.7)]" />

                <span className="text-xs text-gray-300">
                  {vertical
                    ? formatVertical(
                        vertical
                      )
                    : 'Assessment'}
                </span>
              </div>

              <p className="text-[9px] text-gray-700 mt-1.5 ml-3.5">
                Assessment in progress
              </p>
            </div>
          </div>

          <div className="mt-auto p-4">
            <div className="rounded-xl border border-emerald-400/[0.08] bg-emerald-500/[0.025] p-3">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />

                <span className="text-[9px] text-gray-500">
                  Secure session
                </span>
              </div>

              <p className="text-[8px] text-emerald-400/60 mt-1 ml-5">
                Protected locally
              </p>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}

        <main className="flex-1 min-w-0">
          {/* HEADER */}

          <header className="sticky top-0 z-30 h-16 border-b border-white/[0.06] bg-[#07060d]/85 backdrop-blur-xl">
            <div className="h-full px-5 lg:px-7 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="lg:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600">
                    Security operations
                  </p>

                  <h1 className="text-sm font-semibold text-gray-200">
                    Assessment overview
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {vertical && (
                  <span className="hidden sm:block px-3 py-1.5 rounded-full border border-violet-400/10 bg-violet-500/[0.06] text-[10px] text-violet-300">
                    {formatVertical(
                      vertical
                    )}
                  </span>
                )}

                <div className="flex items-center gap-2 text-[10px] text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,.8)]" />

                  {isLoading
                    ? 'CyberCISO AI is thinking'
                    : 'CyberCISO AI is analyzing'}
                </div>
              </div>
            </div>
          </header>

          {/* CONTENT */}

          <div className="px-4 sm:px-6 lg:px-7 py-6 max-w-[1500px] mx-auto">
            {/* STAT CARDS */}

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
              <div className="rounded-xl border border-white/[0.07] bg-[#0a0911]/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.18em] text-gray-700">
                      Questions
                    </p>

                    <p className="text-xl font-semibold text-gray-200 mt-1">
                      {answeredQuestions}
                    </p>

                    <p className="text-[8px] text-gray-700">
                      answered
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-violet-500/[0.08] border border-violet-400/10 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5 text-violet-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#0a0911]/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.18em] text-gray-700">
                      Progress
                    </p>

                    <p className="text-xl font-semibold text-gray-200 mt-1">
                      {progress}%
                    </p>

                    <p className="text-[8px] text-gray-700">
                      assessment progress
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-blue-500/[0.08] border border-blue-400/10 flex items-center justify-center">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#0a0911]/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.18em] text-gray-700">
                      Domains
                    </p>

                    <p className="text-xl font-semibold text-gray-200 mt-1">
                      5
                    </p>

                    <p className="text-[8px] text-gray-700">
                      security areas
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-fuchsia-500/[0.08] border border-fuchsia-400/10 flex items-center justify-center">
                    <CircleDot className="w-3.5 h-3.5 text-fuchsia-400" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-[#0a0911]/80 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.18em] text-gray-700">
                      Frameworks
                    </p>

                    <p className="text-sm font-semibold text-gray-200 mt-2">
                      NIST + CIS
                    </p>

                    <p className="text-[8px] text-gray-700">
                      active controls
                    </p>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-emerald-500/[0.08] border border-emerald-400/10 flex items-center justify-center">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN GRID */}

            <div className="grid xl:grid-cols-[minmax(0,1fr)_280px] gap-4">
              {/* CHAT */}

              <section className="rounded-2xl border border-white/[0.08] bg-[#090811]/90 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <Shield className="w-4 h-4 text-white" />
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

                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                    <span className="text-[9px] text-gray-600">
                      Live
                    </span>
                  </div>
                </div>

                <div className="px-5 py-6 space-y-5">
                  {messages.map(
                    (message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={cn(
                          'flex gap-3 message-enter',
                          message.role ===
                            'user' &&
                            'justify-end'
                        )}
                      >
                        {message.role ===
                          'assistant' && (
                          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shadow-md shadow-violet-500/20 mt-0.5">
                            <Shield className="w-4 h-4 text-white" />
                          </div>
                        )}

                        <div
                          className={cn(
                            'max-w-[85%] rounded-2xl px-4 py-3',
                            message.role ===
                              'user'
                              ? 'bg-gradient-to-br from-violet-600 to-violet-500 text-white rounded-br-md shadow-lg shadow-violet-500/10'
                              : 'bg-white/[0.035] text-gray-300 border border-white/[0.07] rounded-bl-md'
                          )}
                        >
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">
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
                      <div className="px-4 py-3 rounded-xl border border-red-400/10 bg-red-500/[0.05] text-red-300 text-xs">
                        {error}
                      </div>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-5">
                  <form
                    onSubmit={handleSubmit}
                    className="rounded-xl border border-violet-400/10 bg-[#0d0b16] p-2.5 focus-within:border-violet-400/20 transition"
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
                        onKeyDown={(
                          event: KeyboardEvent<HTMLTextAreaElement>
                        ) => {
                          if (
                            event.key ===
                              'Enter' &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();

                            void handleSubmit(
                              event
                            );
                          }
                        }}
                        placeholder="Tell CyberCISO about your security..."
                        disabled={
                          isLoading ||
                          interviewComplete
                        }
                        rows={1}
                        className="flex-1 min-h-[44px] max-h-32 bg-transparent px-3 py-3 text-sm text-gray-200 placeholder:text-gray-700 focus:outline-none resize-none"
                        aria-label="Chat input"
                      />

                      <button
                        type="submit"
                        disabled={
                          !input.trim() ||
                          isLoading ||
                          interviewComplete
                        }
                        className={cn(
                          'w-10 h-10 rounded-lg flex items-center justify-center transition-all flex-shrink-0',
                          input.trim() &&
                            !isLoading &&
                            !interviewComplete
                            ? 'bg-gradient-to-br from-violet-500 to-blue-600 text-white shadow-lg shadow-violet-500/20 hover:scale-[1.03]'
                            : 'bg-white/[0.04] text-gray-700 cursor-not-allowed'
                        )}
                        aria-label="Send message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between px-3 pb-1 pt-1">
                      <span className="text-[8px] text-gray-700">
                        Enter to send • Shift+Enter for new line
                      </span>

                      <span className="flex items-center gap-1.5 text-[8px] text-gray-700">
                        <Lock className="w-2.5 h-2.5" />
                        Session protected
                      </span>
                    </div>
                  </form>
                </div>
              </section>

              {/* RIGHT SIDEBAR */}

              <aside className="space-y-4">
                <div className="rounded-2xl border border-white/[0.07] bg-[#0a0911]/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-300">
                      Assessment overview
                    </span>

                    <span className="text-[10px] text-violet-300">
                      {progress}%
                    </span>
                  </div>

                  <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
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
          </div>
        </main>
      </div>
    </div>
  );
}
