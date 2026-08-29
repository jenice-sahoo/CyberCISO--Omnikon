'use client';

import { Suspense } from 'react';

import {
  Shield,
  Sparkles,
} from 'lucide-react';

import ChatInterface from '@/components/ChatInterface';

function LoadingScreen() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#05040b] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/[0.12] blur-[160px]" />

        <div className="absolute bottom-[-120px] left-[-80px] h-[300px] w-[300px] rounded-full bg-blue-600/[0.08] blur-[130px]" />
      </div>

      {/* Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 text-center">
        <div className="relative mx-auto mb-6 h-16 w-16">
          <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-2xl" />

          <div className="absolute inset-1 flex items-center justify-center rounded-full bg-gradient-to-br from-violet-400 via-purple-600 to-blue-700">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#090813]">
              <Shield className="h-6 w-6 text-violet-200" />
            </div>
          </div>
        </div>

        <div className="mb-2 flex items-center justify-center gap-2 text-violet-300">
          <Sparkles className="h-3.5 w-3.5" />

          <span className="text-xs">
            CyberCISO
          </span>
        </div>

        <p className="text-sm text-gray-600">
          Initializing secure assessment...
        </p>
      </div>
    </div>
  );
}

export default function AssessPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ChatInterface />
    </Suspense>
  );
}
