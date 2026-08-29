'use client';

import { useState } from 'react';

import {
  RotateCcw,
  Download,
  AlertCircle,
  Shield,
  Calendar,
  Target,
  ArrowUpRight,
  CheckCircle2,
  Activity,
  BarChart3,
  Lock,
  Network,
  Database,
  Mail,
  Siren,
  Sparkles,
  ChevronRight,
} from 'lucide-react';

import { ScorecardResponse } from '@/types';

import {
  cn,
  formatVertical,
  getPriorityColor,
  formatCategory,
} from '@/lib/utils';


/* ============================================================
   PROPS
   ============================================================ */

interface ScorecardViewProps {

  scorecard: ScorecardResponse;

  onRestart: () => void;

  onDownloadPDF: () => Promise<void>;

}


/* ============================================================
   DOMAIN ICONS
   ============================================================ */

const DOMAIN_ICONS: Record<string, any> = {

  'access_control': Shield,

  'data_backup': Database,

  'network_security': Network,

  'email_phishing_readiness': Mail,

  'incident_response': Siren,

};


/* ============================================================
   GRADE HELPERS
   ============================================================ */

function getGradeGradient(
  grade: string
): string {

  switch (grade.toUpperCase()) {

    case 'A':
      return 'from-emerald-400 via-green-400 to-cyan-400';

    case 'B':
      return 'from-violet-400 via-purple-400 to-blue-400';

    case 'C':
      return 'from-amber-300 via-yellow-400 to-orange-400';

    case 'D':
      return 'from-orange-400 via-red-400 to-pink-400';

    case 'F':
      return 'from-red-500 via-rose-500 to-fuchsia-500';

    default:
      return 'from-violet-400 to-blue-400';

  }

}


function getGradeText(
  grade: string
): string {

  switch (grade.toUpperCase()) {

    case 'A':
      return 'text-emerald-300';

    case 'B':
      return 'text-violet-300';

    case 'C':
      return 'text-amber-300';

    case 'D':
      return 'text-orange-300';

    case 'F':
      return 'text-red-300';

    default:
      return 'text-violet-300';

  }

}


function getScoreBar(
  grade: string
): string {

  switch (grade.toUpperCase()) {

    case 'A':
      return 'from-emerald-400 to-cyan-400';

    case 'B':
      return 'from-violet-500 to-blue-500';

    case 'C':
      return 'from-amber-400 to-orange-400';

    case 'D':
      return 'from-orange-400 to-red-500';

    case 'F':
      return 'from-red-500 to-fuchsia-500';

    default:
      return 'from-violet-500 to-blue-500';

  }

}


/* ============================================================
   SCORE RING
   ============================================================ */

function ScoreRing({
  score,
  grade,
}: {
  score: number;
  grade: string;
}) {

  const radius = 82;

  const circumference =
    2 * Math.PI * radius;

  const offset =
    circumference -
    (score / 100) *
      circumference;


  return (

    <div className="relative w-64 h-64 mx-auto">

      {/* Glow */}

      <div className="absolute inset-8 rounded-full bg-violet-600/20 blur-[55px]" />


      {/* SVG */}

      <svg
        viewBox="0 0 200 200"
        className="relative w-full h-full -rotate-90"
      >

        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />

        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />

        <defs>

          <linearGradient
            id="scoreGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >

            <stop
              offset="0%"
              stopColor="#8b5cf6"
            />

            <stop
              offset="50%"
              stopColor="#c084fc"
            />

            <stop
              offset="100%"
              stopColor="#38bdf8"
            />

          </linearGradient>

        </defs>

      </svg>


      {/* Center */}

      <div className="absolute inset-0 flex flex-col items-center justify-center">

        <div
          className={cn(
            'text-6xl font-black tracking-tight bg-gradient-to-br bg-clip-text text-transparent',
            getGradeGradient(grade)
          )}
        >
          {grade}
        </div>

        <div className="text-3xl font-bold text-white mt-1">

          {score}

          <span className="text-sm text-gray-600 font-normal">
            /100
          </span>

        </div>

        <div className="text-[9px] uppercase tracking-[0.22em] text-gray-600 mt-2">
          Security posture
        </div>

      </div>

    </div>
  );
}


/* ============================================================
   MINI BAR CHART
   ============================================================ */

function MiniBarChart({
  categories,
}: {
  categories: ScorecardResponse['sub_categories'];
}) {

  return (

    <div className="space-y-4">

      {categories.map(
        (category, index) => {

          const Icon =
            DOMAIN_ICONS[
              category.category
            ] || Shield;

          return (

            <div
              key={index}
              className="group"
            >

              <div className="flex items-center justify-between mb-1.5">

                <div className="flex items-center gap-2 min-w-0">

                  <div className="w-7 h-7 rounded-lg bg-violet-500/[0.08] border border-violet-400/[0.08] flex items-center justify-center">

                    <Icon className="w-3.5 h-3.5 text-violet-400" />

                  </div>

                  <span className="text-xs text-gray-400 truncate">

                    {formatCategory(
                      category.category
                    )}

                  </span>

                </div>

                <div className="flex items-center gap-2">

                  <span className="text-xs font-semibold text-gray-300">
                    {category.score}
                  </span>

                  <span
                    className={cn(
                      'text-[9px] font-bold',
                      getGradeText(
                        category.grade
                      )
                    )}
                  >
                    {category.grade}
                  </span>

                </div>

              </div>


              <div className="h-2 rounded-full bg-white/[0.045] overflow-hidden">

                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r transition-all duration-1000',
                    getScoreBar(
                      category.grade
                    )
                  )}
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(
                        100,
                        category.score
                      )
                    )}%`,
                  }}
                />

              </div>

            </div>

          );

        }
      )}

    </div>
  );
}


/* ============================================================
   MAIN SCORECARD
   ============================================================ */

export default function ScorecardView({

  scorecard,

  onRestart,

  onDownloadPDF,

}: ScorecardViewProps) {

  const [downloading, setDownloading] =
    useState(false);


  const handleDownload =
    async () => {

      setDownloading(true);

      try {

        await onDownloadPDF();

      } finally {

        setDownloading(false);

      }

    };


  const weakestCategory =
    [...scorecard.sub_categories]
      .sort(
        (a, b) =>
          a.score - b.score
      )[0];


  const strongestCategory =
    [...scorecard.sub_categories]
      .sort(
        (a, b) =>
          b.score - a.score
      )[0];


  return (

    <div className="min-h-screen bg-[#05040b] text-white relative overflow-hidden">


      {/* ======================================================
          BACKGROUND
          ====================================================== */}

      <div className="fixed inset-0 pointer-events-none">

        <div className="absolute top-[-180px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-violet-700/[0.13] blur-[180px]" />

        <div className="absolute top-[35%] left-[-200px] w-[500px] h-[500px] rounded-full bg-blue-700/[0.07] blur-[170px]" />

        <div className="absolute bottom-[-200px] right-[-100px] w-[550px] h-[550px] rounded-full bg-fuchsia-700/[0.07] blur-[180px]" />

      </div>


      {/* GRID */}

      <div
        className="fixed inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize:
            '48px 48px',
        }}
      />


      <div className="relative z-10">


        {/* ====================================================
            HEADER
            ==================================================== */}

        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#08070e]/80 backdrop-blur-2xl">

          <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">


            {/* BRAND */}

            <div className="flex items-center gap-3">

              <div className="relative">

                <div className="absolute inset-0 bg-violet-500/30 blur-xl rounded-full" />

                <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">

                  <Shield className="w-4 h-4 text-white" />

                </div>

              </div>


              <div>

                <div className="font-semibold text-sm text-white">
                  CyberCISO
                </div>

                <div className="text-[9px] uppercase tracking-[0.16em] text-gray-600">
                  Security Intelligence
                </div>

              </div>

            </div>


            {/* RIGHT */}

            <div className="flex items-center gap-2">

              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-400/10 bg-emerald-500/[0.05]">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />

                <span className="text-[10px] text-emerald-400/80">
                  Assessment complete
                </span>

              </div>


              <div className="px-3 py-1.5 rounded-full border border-violet-400/10 bg-violet-500/[0.06] text-[10px] text-violet-300">

                {formatVertical(
                  scorecard.vertical
                )}

              </div>

            </div>

          </div>

        </header>


        {/* ====================================================
            MAIN
            ==================================================== */}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">


          {/* ==================================================
              PAGE TITLE
              ================================================== */}

          <div className="mb-8">

            <div className="flex items-center gap-2 text-violet-400/70 text-[10px] uppercase tracking-[0.22em] mb-2">

              <Sparkles className="w-3.5 h-3.5" />

              Security Intelligence Report

            </div>


            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">

              <div>

                <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">

                  Security posture

                  <span className="text-violet-400">
                    .
                  </span>

                </h1>

                <p className="text-gray-600 text-sm mt-2">
                  Your CyberCISO assessment results and prioritized security insights.
                </p>

              </div>


              <div className="flex items-center gap-2">

                <button
                  onClick={
                    handleDownload
                  }
                  disabled={
                    downloading
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-400/20 bg-violet-500/[0.08] text-violet-200 hover:bg-violet-500/[0.14] transition disabled:opacity-50 text-xs font-medium"
                >

                  <Download className="w-3.5 h-3.5" />

                  {downloading
                    ? 'Generating...'
                    : 'Download Report'}

                </button>


                <button
                  onClick={
                    onRestart
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] transition text-xs font-medium"
                >

                  <RotateCcw className="w-3.5 h-3.5" />

                  New Assessment

                </button>

              </div>

            </div>

          </div>


          {/* ==================================================
              TOP DASHBOARD
              ================================================== */}

          <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-4 mb-4">


            {/* =================================================
                SCORE PANEL
                ================================================= */}

            <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0911]/90 p-6">

              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-600/[0.08] blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between mb-2">

                  <div>

                    <p className="text-[10px] uppercase tracking-[0.18em] text-gray-600">
                      Overall assessment
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      Based on 5 security domains
                    </p>

                  </div>


                  <div className="w-8 h-8 rounded-lg bg-violet-500/[0.08] border border-violet-400/10 flex items-center justify-center">

                    <Shield className="w-4 h-4 text-violet-400" />

                  </div>

                </div>


                <ScoreRing
                  score={
                    scorecard.overall_score
                  }
                  grade={
                    scorecard.overall_grade
                  }
                />


                <div className="flex justify-center mt-1">

                  <div
                    className={cn(
                      'px-3 py-1.5 rounded-full border bg-white/[0.025] text-xs font-medium',
                      getGradeText(
                        scorecard.overall_grade
                      )
                    )}
                  >

                    {scorecard.overall_grade ===
                    'A'
                      ? 'Excellent security posture'
                      : scorecard.overall_grade ===
                        'B'
                      ? 'Good security posture'
                      : scorecard.overall_grade ===
                        'C'
                      ? 'Moderate security posture'
                      : scorecard.overall_grade ===
                        'D'
                      ? 'Needs improvement'
                      : 'Critical improvements required'}

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                ANALYTICS
                ================================================= */}

            <section className="rounded-2xl border border-white/[0.08] bg-[#0a0911]/90 p-6">

              <div className="flex items-center justify-between mb-6">

                <div>

                  <p className="text-sm font-medium text-gray-200">
                    Security domain analysis
                  </p>

                  <p className="text-[11px] text-gray-600 mt-1">
                    Comparative score across your security posture
                  </p>

                </div>


                <div className="flex items-center gap-2 text-[10px] text-gray-600">

                  <BarChart3 className="w-3.5 h-3.5 text-violet-400" />

                  5 domains

                </div>

              </div>


              <MiniBarChart
                categories={
                  scorecard.sub_categories
                }
              />


              <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/[0.06]">


                {/* STRONGEST */}

                <div className="rounded-xl border border-emerald-400/[0.08] bg-emerald-500/[0.035] p-3">

                  <div className="flex items-center gap-2 mb-2">

                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />

                    <span className="text-[9px] uppercase tracking-[0.15em] text-emerald-400/70">
                      Strongest
                    </span>

                  </div>

                  <p className="text-xs text-gray-300 font-medium">
                    {formatCategory(
                      strongestCategory.category
                    )}
                  </p>

                  <p className="text-lg font-semibold text-emerald-300 mt-1">
                    {strongestCategory.score}
                  </p>

                </div>


                {/* WEAKEST */}

                <div className="rounded-xl border border-red-400/[0.08] bg-red-500/[0.035] p-3">

                  <div className="flex items-center gap-2 mb-2">

                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />

                    <span className="text-[9px] uppercase tracking-[0.15em] text-red-400/70">
                      Priority
                    </span>

                  </div>

                  <p className="text-xs text-gray-300 font-medium">
                    {formatCategory(
                      weakestCategory.category
                    )}
                  </p>

                  <p className="text-lg font-semibold text-red-300 mt-1">
                    {weakestCategory.score}
                  </p>

                </div>

              </div>

            </section>

          </div>


          {/* ==================================================
              METRIC STRIP
              ================================================== */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

              <div className="flex items-center gap-2 text-gray-600 mb-2">

                <Activity className="w-3.5 h-3.5 text-violet-400" />

                <span className="text-[9px] uppercase tracking-[0.15em]">
                  Overall score
                </span>

              </div>

              <p className="text-2xl font-semibold text-white">
                {scorecard.overall_score}
                <span className="text-xs text-gray-700">
                  /100
                </span>
              </p>

            </div>


            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

              <div className="flex items-center gap-2 text-gray-600 mb-2">

                <Target className="w-3.5 h-3.5 text-blue-400" />

                <span className="text-[9px] uppercase tracking-[0.15em]">
                  Domains
                </span>

              </div>

              <p className="text-2xl font-semibold text-white">
                {scorecard.sub_categories.length}
              </p>

            </div>


            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

              <div className="flex items-center gap-2 text-gray-600 mb-2">

                <Calendar className="w-3.5 h-3.5 text-fuchsia-400" />

                <span className="text-[9px] uppercase tracking-[0.15em]">
                  Actions
                </span>

              </div>

              <p className="text-2xl font-semibold text-white">
                {scorecard.remediation_plan.length}
              </p>

            </div>


            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">

              <div className="flex items-center gap-2 text-gray-600 mb-2">

                <Lock className="w-3.5 h-3.5 text-emerald-400" />

                <span className="text-[9px] uppercase tracking-[0.15em]">
                  Framework
                </span>

              </div>

              <p className="text-sm font-semibold text-white mt-1">
                NIST + CIS
              </p>

            </div>

          </div>


          {/* ==================================================
              SUB CATEGORY CARDS
              ================================================== */}

          <section className="mb-8">

            <div className="flex items-end justify-between mb-4">

              <div>

                <div className="flex items-center gap-2">

                  <Target className="w-4 h-4 text-violet-400" />

                  <h2 className="text-lg font-semibold text-gray-200">
                    Security domains
                  </h2>

                </div>

                <p className="text-xs text-gray-600 mt-1">
                  Detailed findings across your assessment areas.
                </p>

              </div>

            </div>


            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

              {scorecard.sub_categories.map(
                (category, index) => {

                  const Icon =
                    DOMAIN_ICONS[
                      category.category
                    ] || Shield;

                  return (

                    <article
                      key={index}
                      className="group rounded-2xl border border-white/[0.07] bg-[#0a0911]/80 p-5 hover:border-violet-400/[0.18] hover:bg-white/[0.035] transition-all duration-300"
                    >

                      <div className="flex items-start justify-between mb-5">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-xl bg-violet-500/[0.08] border border-violet-400/10 flex items-center justify-center">

                            <Icon className="w-4 h-4 text-violet-400" />

                          </div>

                          <div>

                            <h3 className="text-sm font-medium text-gray-200">
                              {formatCategory(
                                category.category
                              )}
                            </h3>

                            <p className="text-[10px] text-gray-600 mt-0.5">
                              Security domain
                            </p>

                          </div>

                        </div>


                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg border flex items-center justify-center text-xs font-bold',
                            getGradeText(
                              category.grade
                            ),
                            'border-white/[0.07] bg-white/[0.025]'
                          )}
                        >

                          {category.grade}

                        </div>

                      </div>


                      {/* SCORE */}

                      <div className="flex items-end justify-between mb-2">

                        <div>

                          <span className="text-3xl font-semibold text-white">
                            {category.score}
                          </span>

                          <span className="text-xs text-gray-700 ml-1">
                            /100
                          </span>

                        </div>

                        <span
                          className={cn(
                            'text-[10px] font-medium',
                            getGradeText(
                              category.grade
                            )
                          )}
                        >

                          {category.grade ===
                          'A'
                            ? 'Excellent'
                            : category.grade ===
                              'B'
                            ? 'Good'
                            : category.grade ===
                              'C'
                            ? 'Moderate'
                            : category.grade ===
                              'D'
                            ? 'Weak'
                            : 'Critical'}

                        </span>

                      </div>


                      <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden mb-5">

                        <div
                          className={cn(
                            'h-full rounded-full bg-gradient-to-r',
                            getScoreBar(
                              category.grade
                            )
                          )}
                          style={{
                            width: `${category.score}%`,
                          }}
                        />

                      </div>


                      {/* FINDINGS */}

                      <div>

                        <p className="text-[9px] uppercase tracking-[0.16em] text-gray-600 mb-3">
                          Key findings
                        </p>


                        <div className="space-y-2">

                          {category.findings
                            .slice(0, 4)
                            .map(
                              (
                                finding,
                                findingIndex
                              ) => (

                                <div
                                  key={
                                    findingIndex
                                  }
                                  className="flex items-start gap-2"
                                >

                                  <span className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />

                                  <p className="text-xs text-gray-500 leading-relaxed">
                                    {finding}
                                  </p>

                                </div>

                              )
                            )}

                        </div>

                      </div>


                      {/* REFERENCES */}

                      <div className="mt-5 pt-4 border-t border-white/[0.05] space-y-1.5">

                        <p className="text-[9px] text-gray-700">

                          <span className="text-gray-500 font-medium">
                            NIST
                          </span>

                          {' '}
                          {category.nist_references.join(
                            ', '
                          )}

                        </p>

                        <p className="text-[9px] text-gray-700">

                          <span className="text-gray-500 font-medium">
                            CIS
                          </span>

                          {' '}
                          {category.cis_references.join(
                            ', '
                          )}

                        </p>

                      </div>

                    </article>

                  );

                }
              )}

            </div>

          </section>


          {/* ==================================================
              REMEDIATION PLAN
              ================================================== */}

          <section className="mb-8">

            <div className="flex items-end justify-between mb-4">

              <div>

                <div className="flex items-center gap-2">

                  <Calendar className="w-4 h-4 text-fuchsia-400" />

                  <h2 className="text-lg font-semibold text-gray-200">
                    30-day remediation plan
                  </h2>

                </div>

                <p className="text-xs text-gray-600 mt-1">
                  Prioritized actions generated from your assessment.
                </p>

              </div>


              <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-600">

                <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />

                Prioritized by risk

              </div>

            </div>


            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0911]/80 overflow-hidden">

              <div className="divide-y divide-white/[0.05]">

                {scorecard.remediation_plan.map(
                  (
                    action,
                    index
                  ) => (

                    <div
                      key={index}
                      className="p-5 hover:bg-white/[0.025] transition"
                    >

                      <div className="flex items-start gap-4">


                        {/* DAY */}

                        <div className="hidden sm:flex flex-col items-center w-12 flex-shrink-0">

                          <div className="w-9 h-9 rounded-xl bg-violet-500/[0.08] border border-violet-400/10 flex items-center justify-center">

                            <span className="text-xs font-semibold text-violet-300">
                              {action.day}
                            </span>

                          </div>

                          <span className="text-[8px] uppercase tracking-wider text-gray-700 mt-1">
                            Day
                          </span>

                        </div>


                        {/* CONTENT */}

                        <div className="flex-1 min-w-0">

                          <div className="flex flex-wrap items-center gap-2 mb-2">

                            <span className="sm:hidden text-[9px] text-gray-600">
                              Day {action.day}
                            </span>

                            <span
                              className={cn(
                                'px-2 py-1 rounded-md text-[9px] font-semibold',
                                getPriorityColor(
                                  action.priority
                                )
                              )}
                            >

                              {action.priority}

                            </span>

                            <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.05] text-[9px] text-gray-500">

                              {formatCategory(
                                action.category
                              )}

                            </span>

                          </div>


                          <p className="text-sm text-gray-300 leading-relaxed font-medium">

                            {action.action}

                          </p>


                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[9px] text-gray-700">

                            <span>

                              <span className="text-gray-500">
                                NIST:
                              </span>

                              {' '}

                              {action.nist_function}

                              {' / '}

                              {action.nist_category}

                            </span>


                            <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-800" />


                            <span>

                              <span className="text-gray-500">
                                CIS:
                              </span>

                              {' '}

                              {action.cis_control}

                            </span>


                            <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-800" />


                            <span>
                              {action.effort_estimate}
                            </span>

                          </div>

                        </div>


                        <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-violet-400 flex-shrink-0" />

                      </div>

                    </div>

                  )
                )}

              </div>

            </div>

          </section>


          {/* ==================================================
              FRAMEWORK CARD
              ================================================== */}

          <section className="grid md:grid-cols-2 gap-4 mb-8">


            <div className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-500/[0.025] p-5">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-9 h-9 rounded-xl bg-emerald-500/[0.08] border border-emerald-400/10 flex items-center justify-center">

                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />

                </div>

                <div>

                  <p className="text-sm font-medium text-gray-200">
                    NIST CSF 2.0
                  </p>

                  <p className="text-[10px] text-gray-600">
                    Framework-aligned assessment
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-2 text-xs text-emerald-400/70">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                Controls referenced in your findings

              </div>

            </div>


            <div className="rounded-2xl border border-blue-400/[0.08] bg-blue-500/[0.025] p-5">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-9 h-9 rounded-xl bg-blue-500/[0.08] border border-blue-400/10 flex items-center justify-center">

                  <Shield className="w-4 h-4 text-blue-400" />

                </div>

                <div>

                  <p className="text-sm font-medium text-gray-200">
                    CIS Controls v8
                  </p>

                  <p className="text-[10px] text-gray-600">
                    Control recommendations mapped
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-2 text-xs text-blue-400/70">

                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />

                Actionable control references

              </div>

            </div>

          </section>


          {/* ==================================================
              DISCLAIMER
              ================================================== */}

          <div className="rounded-2xl border border-amber-400/[0.08] bg-amber-500/[0.035] p-5 mb-10">

            <div className="flex items-start gap-3">

              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />

              <div>

                <p className="text-xs font-semibold text-amber-300">
                  Assessment disclaimer
                </p>

                <p className="text-[11px] text-amber-200/50 mt-1.5 leading-relaxed">

                  This assessment is based on self-reported information and should not replace a professional security audit. NIST CSF 2.0 and CIS Controls v8 references are thematic; verify control numbers against official publications.

                </p>

              </div>

            </div>

          </div>


        </main>


        {/* ====================================================
            FOOTER
            ==================================================== */}

        <footer className="border-t border-white/[0.06] py-8">

          <div className="max-w-7xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3">

            <div className="flex items-center gap-2">

              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center">

                <Shield className="w-3 h-3 text-white" />

              </div>

              <span className="text-xs text-gray-600">
                CyberCISO
              </span>

            </div>


            <div className="flex items-center gap-4 text-[9px] text-gray-700">

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
                Virtual CISO
              </span>

            </div>

          </div>

        </footer>

      </div>

    </div>
  );
}
