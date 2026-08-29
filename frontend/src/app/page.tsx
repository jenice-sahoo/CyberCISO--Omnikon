'use client';

import Link from 'next/link';
import { Shield, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen hero-mesh hero-grid flex flex-col">
      <header className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/images/logo.svg" alt="CyberCISO" className="w-10 h-10 relative z-10" />
              <div className="absolute inset-0 bg-primary-400/20 blur-xl rounded-full" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">CyberCISO</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Secure & Private
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-3xl w-full text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 glass-strong rounded-full mb-8 shadow-sm opacity-0 animate-fade-in-up">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Shield className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-primary-800">Virtual CISO Assessment</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] opacity-0 animate-fade-in-up-delay-1">
            <span className="text-gray-900">Know your</span>
            <br />
            <span className="gradient-text">security posture</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 max-w-xl mx-auto leading-relaxed mb-10 opacity-0 animate-fade-in-up-delay-2">
            Get an instant letter-grade scorecard and a prioritized 30-day remediation plan mapped to industry frameworks.
          </p>

          <div className="flex flex-col items-center gap-6 opacity-0 animate-fade-in-up-delay-3">
            <Link
              href="/assess"
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-primary-500 to-primary-600 text-white text-lg font-semibold rounded-2xl shadow-xl shadow-primary-500/25 hover:shadow-2xl hover:shadow-primary-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-gray-400">
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
                10 Minutes
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-xs text-gray-400 flex items-center justify-center gap-2">
          <Lock className="w-3 h-3" />
          No data stored. Conversations stay in your browser.
        </p>
      </footer>
    </div>
  );
}
