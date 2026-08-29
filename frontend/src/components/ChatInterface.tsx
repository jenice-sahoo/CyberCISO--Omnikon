'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { Send, Shield, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { ChatMessage, ChatRequest, Vertical, ScorecardResponse } from '@/types';
import { sendChatMessage } from '@/lib/api';
import { cn, formatVertical, generateSessionId } from '@/lib/utils';
import { exportScorecardToPDF } from '@/lib/pdf';
import ScorecardView from './ScorecardView';

const FIRST_QUESTIONS: Record<Vertical, string> = {
  retail:
    'How many employees access your point-of-sale systems and inventory databases?',
  healthcare_clinic:
    'How many staff members access your electronic health records (EHR) system?',
  professional_services:
    'How many team members access client confidential data on a regular basis?',
};

function stripMarkdown(text: string): string {
  let out = text
    .replace(/<think>[\s\S]*?<\/think>\s*/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>\s*/gi, '')
    .replace(/<thought>[\s\S]*?<\/thought>\s*/gi, '')
    .replace(/<\/?(think|thinking|thought|answer)[^>]*>/gi, '');

  // Gemma-style "thinking ... response" delimiter fallback
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

function playNotificationSound() {
  try {
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';

    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      660,
      ctx.currentTime + 0.15
    );

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + 0.3
    );

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 message-enter">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20">
        <Shield className="w-4 h-4 text-white" />
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-5 py-3.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <div className="typing-dot w-2 h-2 rounded-full bg-primary-400" />
          <div className="typing-dot w-2 h-2 rounded-full bg-primary-400" />
          <div className="typing-dot w-2 h-2 rounded-full bg-primary-400" />
        </div>
      </div>
    </div>
  );
}

function VerticalPicker({
  onSelect,
}: {
  onSelect: (v: Vertical) => void;
}) {
  return (
    <div className="min-h-screen hero-mesh hero-grid">
      <div className="min-h-screen flex flex-col">

        <header className="px-6 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">

            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Secure & Private
            </div>

          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 py-12">

          <div className="max-w-4xl w-full">

            <div className="text-center mb-14 opacity-0 animate-fade-in-up">

              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
                Select your business
              </h1>

              <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
                We'll tailor the assessment to your industry's specific
                risks and compliance requirements.
              </p>

            </div>

            <div className="grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto mb-12">

              {([
                {
                  id: 'retail' as Vertical,
                  label: 'Retail',
                  desc: 'POS systems, inventory management, payment networks, seasonal staff onboarding',
                  icon: '🛍️',
                },
                {
                  id: 'healthcare_clinic' as Vertical,
                  label: 'Healthcare Clinic',
                  desc: 'EHR systems, PHI handling, HIPAA compliance, medical device security',
                  icon: '🏥',
                },
                {
                  id: 'professional_services' as Vertical,
                  label: 'Professional Services',
                  desc: 'Client data protection, cloud applications, IP safeguarding, encrypted comms',
                  icon: '💼',
                },
              ]).map(({ id, label, desc, icon }, idx) => (

                <button
                  key={id}
                  onClick={() => onSelect(id)}
                  className="vertical-card group p-7 text-left border border-gray-200/80 rounded-2xl bg-white/80 backdrop-blur-sm opacity-0 animate-fade-in-up"
                  style={{
                    animationDelay: `${0.1 + idx * 0.1}s`,
                  }}
                >

                  <div className="text-3xl mb-4">
                    {icon}
                  </div>

                  <div className="flex items-center justify-between mb-2">

                    <span className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors text-lg">
                      {label}
                    </span>

                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" />

                  </div>

                  <p className="text-sm text-gray-500 leading-relaxed">
                    {desc}
                  </p>

                </button>

              ))}

            </div>

            <div
              className="flex flex-wrap items-center justify-center gap-5 text-sm text-gray-400 opacity-0 animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                NIST CSF 2.0
              </div>

              <div className="w-1 h-1 rounded-full bg-gray-300" />

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                CIS Controls v8
              </div>

              <div className="w-1 h-1 rounded-full bg-gray-300" />

              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ~10 minutes
              </div>

            </div>

          </div>

        </main>

      </div>
    </div>
  );
}

interface ChatInterfaceProps {
  initialVertical?: Vertical;
}

export default function ChatInterface({
  initialVertical,
}: ChatInterfaceProps) {

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vertical, setVertical] = useState<Vertical | null>(
    initialVertical || null
  );

  const [scorecard, setScorecard] =
    useState<ScorecardResponse | null>(null);

  const [interviewComplete, setInterviewComplete] =
    useState(false);

  const [sessionId] = useState(() => generateSessionId());

  const prevMsgCountRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, scorecard, interviewComplete]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [messages]);

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {

      const lastMsg = messages[messages.length - 1];

      if (lastMsg?.role === 'assistant') {
        playNotificationSound();
      }
    }

    prevMsgCountRef.current = messages.length;
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || isLoading) {
      return;
    }

    const userMessage = input.trim();

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

    setMessages(newMessages);

    try {

      const request: ChatRequest = {
        message: userMessage,
        conversation_history: messages,
        vertical,
        session_id: sessionId,
      };

      const response = await sendChatMessage(request);

      /*
       * Fallback:
       * If backend returned JSON as text,
       * parse it client-side.
       */
      let sc = response.scorecard;

      if (!sc && response.response) {

        try {

          let raw = response.response.trim();

          if (raw.startsWith('```')) {
            raw = raw
              .replace(/^```(?:json)?\s*/i, '')
              .replace(/\s*```$/, '')
              .trim();
          }

          if (raw.startsWith('{')) {

            const parsed = JSON.parse(raw);

            if (
              parsed.overall_grade &&
              parsed.sub_categories
            ) {
              sc = parsed as ScorecardResponse;
            }

          }

        } catch {}

      }

      if (sc) {

        setScorecard(sc);
        setInterviewComplete(true);
        setVertical(sc.vertical);

      } else {

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: stripMarkdown(response.response),
          },
        ]);

      }

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to send message'
      );

      setMessages((prev) => prev.slice(0, -1));

    } finally {

      setIsLoading(false);

    }
  };

  /*
   * Creates the initial assessment conversation.
   */
  const handleVerticalSelect = useCallback(
    (selectedVertical: Vertical) => {

      setVertical(selectedVertical);

      const name = formatVertical(selectedVertical);

      const welcomeMsg =
        `Sure! Here is your ${name} assessment.`;

      const firstQuestion =
        FIRST_QUESTIONS[selectedVertical];

      setMessages([
        {
          role: 'user',
          content: `I want an assessment for ${name}`,
        },
        {
          role: 'assistant',
          content: welcomeMsg,
        },
        {
          role: 'assistant',
          content: firstQuestion,
        },
      ]);

    },
    []
  );

  /*
   * IMPORTANT FIX #1
   *
   * When the homepage sends the user to:
   *
   * /assess?vertical=retail
   *
   * the vertical is already known, so we need to
   * automatically initialize the conversation.
   */
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

  /*
   * IMPORTANT FIX #2
   *
   * "New Assessment" should NOT reset back to the
   * old business picker.
   *
   * Instead, return to our new CyberCISO homepage.
   */
  const handleRestart = () => {
    window.location.href = '/';
  };

  const handleDownloadPDF = async () => {

    if (!scorecard) {
      return;
    }

    try {

      await exportScorecardToPDF(scorecard);

    } catch (err) {

      setError('Failed to generate PDF');

    }
  };

  /*
   * Only show the old vertical picker when the user
   * visits /assess directly without choosing a business.
   */
  if (!vertical && !interviewComplete) {

    return (
      <VerticalPicker
        onSelect={handleVerticalSelect}
      />
    );

  }

  /*
   * Scorecard screen
   */
  if (interviewComplete && scorecard) {

    return (
      <div className="min-h-screen bg-gray-50">

        <ScorecardView
          scorecard={scorecard}
          onRestart={handleRestart}
          onDownloadPDF={handleDownloadPDF}
        />

      </div>
    );

  }

  /*
   * Active assessment chat
   */
  return (

    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col">

      <header className="glass-strong border-b border-gray-200/50 sticky top-0 z-10">

        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="relative">

              <img
                src="/images/logo.svg"
                alt="CyberCISO"
                className="w-9 h-9 relative z-10"
              />

              <div className="absolute inset-0 bg-primary-400/15 blur-lg rounded-full" />

            </div>

            <div>

              <h1 className="font-bold text-gray-900 text-sm tracking-tight">
                CyberCISO
              </h1>

              <p className="text-[11px] text-gray-400">
                Virtual CISO Assessment
              </p>

            </div>

          </div>

          {vertical && (

            <div className="flex items-center gap-2">

              <span className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full border border-primary-100">
                {formatVertical(vertical)}
              </span>

              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">

                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

                Secure

              </div>

            </div>

          )}

        </div>

      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col">

        <div className="flex-1 overflow-y-auto space-y-5 pb-4">

          {messages.map((msg, idx) => (

            <div
              key={idx}
              className={cn(
                'flex gap-3 message-enter',
                msg.role === 'user' && 'justify-end'
              )}
            >

              {msg.role === 'assistant' && (

                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20 mt-0.5">

                  <Shield className="w-4 h-4 text-white" />

                </div>

              )}

              <div
                className={cn(
                  'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm',

                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white bubble-user shadow-primary-600/20'
                    : 'bg-white text-gray-800 border border-gray-100 bubble-assistant'
                )}
              >

                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {msg.content}
                </p>

              </div>

            </div>

          ))}

          {isLoading && <TypingIndicator />}

          {error && (

            <div className="flex gap-3 justify-center message-enter">

              <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">

                <span>{error}</span>

              </div>

            </div>

          )}

          <div ref={messagesEndRef} />

        </div>

        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-100 pt-4 bg-white/80 backdrop-blur-sm sticky bottom-0"
        >

          <div className="flex gap-2.5 items-end">

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {

                if (e.key === 'Enter' && !e.shiftKey) {

                  e.preventDefault();

                  handleSubmit(e);

                }

              }}
              placeholder="Type your response..."
              disabled={isLoading}
              rows={1}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 resize-none max-h-32 text-[15px] placeholder:text-gray-400 transition-all"
              aria-label="Chat input"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                'p-3 rounded-xl transition-all duration-200 flex-shrink-0',

                input.trim() && !isLoading
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              )}
              aria-label="Send message"
            >

              <Send className="w-5 h-5" />

            </button>

          </div>

          <p className="text-[11px] text-gray-400 text-center mt-2.5">
            Press Enter to send, Shift+Enter for new line
          </p>

        </form>

      </main>

    </div>

  );
}
