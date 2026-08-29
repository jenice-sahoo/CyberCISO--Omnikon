'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import {
  Shield,
  Sparkles,
} from 'lucide-react';

import ChatInterface from '@/components/ChatInterface';

import { Vertical } from '@/types';


const VALID_VERTICALS: Vertical[] = [
  'retail',
  'healthcare_clinic',
  'professional_services',
];


function LoadingScreen() {

  return (

    <div className="min-h-screen bg-[#05040b] text-white relative overflow-hidden flex items-center justify-center">

      {/* Background glow */}

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[450px] rounded-full bg-violet-600/15 blur-[150px]" />

        <div className="absolute left-[-100px] bottom-[-100px] w-[300px] h-[300px] rounded-full bg-blue-600/10 blur-[120px]" />

      </div>


      {/* Grid */}

      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
          backgroundSize:
            '48px 48px',
        }}
      />


      <div className="relative z-10 text-center">

        <div className="relative mx-auto w-16 h-16 mb-6">

          <div className="absolute inset-0 rounded-full bg-violet-500/30 blur-2xl" />

          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-violet-400 via-purple-600 to-blue-700 flex items-center justify-center">

            <div className="w-12 h-12 rounded-full bg-[#090813] flex items-center justify-center">

              <Shield className="w-6 h-6 text-violet-200" />

            </div>

          </div>

        </div>


        <div className="flex items-center justify-center gap-2 text-violet-300 mb-2">

          <Sparkles className="w-3.5 h-3.5" />

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


function AssessContent() {

  const searchParams =
    useSearchParams();

  const verticalParam =
    searchParams.get(
      'vertical'
    );


  const initialVertical:
    | Vertical
    | undefined =
    verticalParam &&
    VALID_VERTICALS.includes(
      verticalParam as Vertical
    )
      ? (
          verticalParam as Vertical
        )
      : undefined;


  return (
    <ChatInterface
      initialVertical={
        initialVertical
      }
    />
  );
}


export default function AssessPage() {

  return (

    <Suspense
      fallback={
        <LoadingScreen />
      }
    >

      <AssessContent />

    </Suspense>

  );
}
