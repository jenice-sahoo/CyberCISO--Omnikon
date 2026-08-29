'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
  MailWarning,
  KeyRound,
  DatabaseBackup,
  Siren,
  Network,
  X,
  ArrowRight,
} from 'lucide-react';

type Vertical = 'retail' | 'healthcare_clinic' | 'professional_services';

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

const businesses: {
  id: Vertical;
  icon: string;
  title: string;
  description: string;
}[] = [
  {
    id: 'retail',
    icon: '🛍️',
    title: 'Retail',
    description:
      'POS systems, inventory management, payment networks, seasonal staff onboarding',
  },
  {
    id: 'healthcare_clinic',
    icon: '🏥',
    title: 'Healthcare Clinic',
    description:
      'EHR systems, PHI handling, HIPAA compliance, medical device security',
  },
  {
    id: 'professional_services',
    icon: '💼',
    title: 'Professional Services',
    description:
      'Client data protection, cloud applications, IP safeguarding, encrypted communications',
  },
];

export default function Home() {
  const [showBusinessPicker, setShowBusinessPicker] = useState(false);

  const handleBusinessSelect = (vertical: Vertical) => {
    window.location.href = `/assess?vertical=${vertical}`;
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#05040a] text-white relative">

      {/* ========================================================= */}
      {/* BACKGROUND */}
      {/* ========================================================= */}

      <div className="absolute inset-0 pointer-events-none">

        <div className="absolute left-1/2 top-[15%] -translate-x-1/2 w-[750px] h-[500px] rounded-full bg-violet-600/20 blur-[150px]" />

        <div className="absolute left-[5%] bottom-[5%] w-[350px] h-[350px] rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute right-[5%] top-[40%] w-[350px] h-[350px] rounded-full bg-purple-600/10 blur-[130px]" />

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

      {/* ========================================================= */}
      {/* NAVBAR */}
      {/* ========================================================= */}

      <header className="relative z-10 px-6 py-5">

        <div className="max-w-6xl mx-auto flex items-center justify-between">

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

          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/[0.03]">

            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse" />

            <span className="text-xs text-gray-400">
              Secure & Private
            </span>

          </div>

        </div>

      </header>

      {/* ========================================================= */}
      {/* MAIN */}
      {/* ========================================================= */}

      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-14">

        {/* Badge */}

        <div className="flex justify-center mb-7">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08]">

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

            Understand your security posture, identify risks,
            and get practical recommendations tailored to your
            organization.

          </p>

        </div>

        {/* ======================================================= */}
        {/* START ASSESSMENT BUTTON */}
        {/* ======================================================= */}

        <div className="flex justify-center mt-12">

          <button
            type="button"
            onClick={() => setShowBusinessPicker(true)}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-lg font-semibold shadow-xl shadow-violet-500/20 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >

            <Shield className="w-5 h-5" />

            Start Security Assessment

            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />

          </button>

        </div>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-gray-600">

          <Lock className="w-3.5 h-3.5" />

          <span>
            Choose your business type to personalize your assessment
          </span>

        </div>

        {/* ======================================================= */}
        {/* QUICK SECURITY ASSESSMENTS */}
        {/* ======================================================= */}

        <div className="mt-16">

          <div className="flex items-center justify-center gap-2 mb-6">

            <Shield className="w-4 h-4 text-violet-400" />

            <span className="text-sm font-medium text-gray-400">
              Security areas covered
            </span>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

            {quickActions.map((action) => {

              const Icon = action.icon;

              return (

                <div
                  key={action.title}
                  className="p-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] backdrop-blur-sm"
                >

                  <div className="flex items-start gap-4">

                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-400/10 flex items-center justify-center">

                      <Icon className="w-5 h-5 text-violet-400" />

                    </div>

                    <div>

                      <h3 className="font-medium text-gray-200">
                        {action.title}
                      </h3>

                      <p className="mt-1 text-xs leading-relaxed text-gray-600">
                        {action.description}
                      </p>

                    </div>

                  </div>

                </div>

              );

            })}

          </div>

        </div>

        {/* ======================================================= */}
        {/* FRAMEWORKS */}
        {/* ======================================================= */}

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

      {/* ========================================================= */}
      {/* BUSINESS PICKER MODAL */}
      {/* ========================================================= */}

      {showBusinessPicker && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/70 backdrop-blur-md"
          onClick={() => setShowBusinessPicker(false)}
        >

          <div
            className="relative w-full max-w-4xl rounded-3xl border border-white/10 bg-[#0d0b15] shadow-2xl shadow-violet-950/50 p-7 sm:p-9"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Close button */}

            <button
              type="button"
              onClick={() => setShowBusinessPicker(false)}
              aria-label="Close business selection"
              className="absolute top-5 right-5 w-9 h-9 rounded-full border border-white/10 bg-white/[0.04] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.08] transition"
            >

              <X className="w-4 h-4" />

            </button>

            {/* Modal heading */}

            <div className="text-center mb-8">

              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-400/10 mb-4">

                <Shield className="w-6 h-6 text-violet-400" />

              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Select your business
              </h2>

              <p className="mt-2 text-sm sm:text-base text-gray-500 max-w-lg mx-auto">
                We'll tailor the assessment to your industry's
                specific risks and security requirements.
              </p>

            </div>

            {/* Business choices */}

            <div className="grid sm:grid-cols-3 gap-4">

              {businesses.map((business) => (

                <button
                  key={business.id}
                  type="button"
                  onClick={() => handleBusinessSelect(business.id)}
                  className="group text-left p-6 rounded-2xl border border-white/10 bg-white/[0.025] hover:bg-violet-500/[0.08] hover:border-violet-400/40 transition-all duration-200"
                >

                  <div className="text-3xl mb-5">
                    {business.icon}
                  </div>

                  <div className="flex items-center justify-between gap-3">

                    <h3 className="font-semibold text-lg text-gray-200 group-hover:text-white">
                      {business.title}
                    </h3>

                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />

                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-gray-500">
                    {business.description}
                  </p>

                </button>

              ))}

            </div>

            {/* Modal footer */}

            <div className="flex justify-center mt-7">

              <button
                type="button"
                onClick={() => setShowBusinessPicker(false)}
                className="text-sm text-gray-600 hover:text-gray-400 transition"
              >
                Cancel
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ========================================================= */}
      {/* FOOTER */}
      {/* ========================================================= */}

      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-8">

        <div className="border-t border-white/[0.06] pt-5 text-center">

          <p className="text-[11px] text-gray-700 tracking-wide">
            CYBERCISO • INTELLIGENT SECURITY ASSESSMENT
          </p>

        </div>

      </div>

    </main>
  );
}
