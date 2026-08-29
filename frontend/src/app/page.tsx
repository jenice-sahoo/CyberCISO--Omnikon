'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUp,
  Shield,
  Lock,
  CheckCircle2,
  Crosshair,
  MailWarning,
  KeyRound,
  DatabaseBackup,
  Siren,
  Network,
  Sparkles,
} from 'lucide-react';

const quickActions = [
  {
    icon: Shield,
    title: 'Security Assessment',
    description: 'Get a complete security posture assessment',
  },
  {
    icon: MailWarning,
    title: 'Phishing Readiness',
    description: 'Evaluate your organization’s phishing defenses',
  },
  {
    icon: KeyRound,
    title: 'Access Control',
    description: 'Review how users access sensitive systems',
  },
  {
    icon: DatabaseBackup,
    title: 'Backup & Recovery',
    description: 'Assess your backup and recovery practices',
  },
  {
    icon: Siren,
    title: 'Incident Response',
    description: 'See how prepared you are for a cyberattack',
  },
  {
    icon: Network,
    title: 'Network Security',
    description: 'Identify potential network security weaknesses',
  },
];

export default function Home() {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    window.location.href = '/assess';
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#05040a] text-white relative">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-[18%] -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-violet-600/20 blur-[140px]" />

        <div className="absolute left-[10%] bottom-[10%] w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="absolute right-[5%] top-[35%] w-[300px] h-[300px] rounded-full bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* Navigation */}
      <header className="relative z-10 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/40 blur-xl rounded-full" />

              <img
                src="/images/logo.svg"
                alt="CyberCISO"
                className="relative w-10 h-10"
              />
            </div>

            <div>
              <div className="font-bold text-lg tracking-tight">
                CyberCISO
              </div>

              <div className="text-[10px] tracking-[0.2em] text-gray-500 uppercase">
                AI Security Advisor
              </div>
            </div>
          </Link>

          {/* Status */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />

            <span className="text-xs text-gray-400">
              Secure & Private
            </span>
          </div>
        </div>
      </header>

      {/* Main hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-16">

        {/* AI badge */}
        <div className="flex justify-center mb-7">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] backdrop-blur-md">

            <Sparkles className="w-4 h-4 text-violet-400" />

            <span className="text-sm text-violet-200">
              AI-Powered Cybersecurity Assessment
            </span>

          </div>
        </div>

        {/* Heading */}
        <div className="text-center">

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">

            Your AI-powered

            <br />

            <span className="bg-gradient-to-r from-violet-300 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              security advisor.
            </span>

          </h1>

          <p className="mt-7 max-w-2xl mx-auto text-base sm:text-lg text-gray-400 leading-relaxed">
            Ask CyberCISO about your organization’s security.
            Identify risks, understand your security posture,
            and get practical recommendations to stay protected.
          </p>

        </div>

        {/* Main input */}
        <div className="max-w-3xl mx-auto mt-12">

          <form onSubmit={handleSubmit}>

            <div className="group relative">

              {/* Input glow */}
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-600/50 via-purple-500/30 to-blue-500/50 opacity-60 blur-sm group-focus-within:opacity-100 transition-opacity" />

              <div className="relative flex items-center rounded-2xl border border-white/10 bg-[#0d0b15]/95 backdrop-blur-xl shadow-2xl">

                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask CyberCISO about your security..."
                  className="flex-1 bg-transparent px-6 py-5 text-white placeholder:text-gray-600 outline-none text-base sm:text-lg"
                />

                <button
                  type="submit"
                  aria-label="Start assessment"
                  className="mr-3 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-violet-500/20"
                >
                  <ArrowUp className="w-5 h-5 text-white" />
                </button>

              </div>
            </div>

          </form>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">
            <Lock className="w-3.5 h-3.5" />
            <span>Your conversation stays in your browser</span>
          </div>

        </div>

        {/* Quick actions */}
        <div className="mt-16">

          <div className="flex items-center justify-center gap-2 mb-6">

            <Crosshair className="w-4 h-4 text-violet-400" />

            <span className="text-sm font-medium text-gray-400">
              Quick security assessments
            </span>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href="/assess"
                  className="group text-left p-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] hover:bg-white/[0.06] hover:border-violet-400/30 backdrop-blur-sm transition-all duration-200"
                >

                  <div className="flex items-start gap-4">

                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-400/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">

                      <Icon className="w-5 h-5 text-violet-400" />

                    </div>

                    <div>

                      <h3 className="font-medium text-gray-200 group-hover:text-white transition-colors">
                        {action.title}
                      </h3>

                      <p className="mt-1 text-xs leading-relaxed text-gray-600 group-hover:text-gray-500">
                        {action.description}
                      </p>

                    </div>

                  </div>

                </Link>
              );
            })}

          </div>

        </div>

        {/* Frameworks */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-3 mt-12 text-xs text-gray-600">

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
            NIST CSF 2.0
          </div>

          <div className="w-1 h-1 rounded-full bg-gray-700" />

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
            CIS Controls v8
          </div>

          <div className="w-1 h-1 rounded-full bg-gray-700" />

          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/70" />
            Adaptive Assessment
          </div>

        </div>

      </section>

      {/* Bottom decorative line */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-8">

        <div className="border-t border-white/[0.06] pt-5 flex items-center justify-center">

          <p className="text-[11px] text-gray-700 tracking-wide">
            CYBERCISO • INTELLIGENT SECURITY ASSESSMENT
          </p>

        </div>

      </div>

    </main>
  );
}
