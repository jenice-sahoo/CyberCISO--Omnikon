'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import ChatInterface from '@/components/ChatInterface';
import { Vertical } from '@/types';

const VALID_VERTICALS: Vertical[] = [
  'retail',
  'healthcare_clinic',
  'professional_services',
];

function AssessContent() {
  const searchParams = useSearchParams();

  const verticalParam = searchParams.get('vertical');

  const initialVertical: Vertical | undefined =
    verticalParam &&
    VALID_VERTICALS.includes(verticalParam as Vertical)
      ? (verticalParam as Vertical)
      : undefined;

  return (
    <ChatInterface
      initialVertical={initialVertical}
    />
  );
}

export default function AssessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05040a] flex items-center justify-center text-gray-400">
          Loading CyberCISO...
        </div>
      }
    >
      <AssessContent />
    </Suspense>
  );
}
