'use client';

import {
  useState,
} from 'react';

import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  FileText,
  Lock,
  Mail,
  Network,
  RotateCcw,
  Shield,
  Siren,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';

import {
  ScorecardResponse,
} from '@/types';

import {
  cn,
  formatCategory,
  formatVertical,
  getPriorityColor,
} from '@/lib/utils';


/* ============================================================
   PROPS
   ============================================================ */

interface ScorecardViewProps {

  scorecard:
    ScorecardResponse;

  onRestart:
    () => void;

  onDownloadPDF:
    () => Promise<void>;

}


/* ============================================================
   DOMAIN ICONS
   ============================================================ */

const DOMAIN_ICONS: Record<
  string,
  typeof Shield
> = {

  access_control:
    Shield,

  data_backup:
    Database,

  network_security:
    Network,

  email_phishing_readiness:
    Mail,

  email_phishing:
    Mail,

  incident_response:
    Siren,

};


/* ============================================================
   GRADE HELPERS
   ============================================================ */

function gradeText(
  grade: string
): string {

  switch (
    grade.toUpperCase()
  ) {

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


function gradeGradient(
  grade: string
): string {

  switch (
    grade.toUpperCase()
  ) {

    case 'A':
      return 'from-emerald-400 via-cyan-400 to-blue-400';

    case 'B':
      return 'from-violet-400 via-fuchsia-400 to-blue-400';

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


function scoreBarGradient(
  grade: string
): string {

  switch (
    grade.toUpperCase()
  ) {

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


function gradeDescription(
  grade: string
): string {

  switch (
    grade.toUpperCase()
  ) {

    case 'A':
      return 'Excellent security posture';

    case 'B':
      return 'Good security posture';

    case 'C':
      return 'Moderate security posture';

    case 'D':
      return 'Needs improvement';

    case 'F':
      return 'Critical improvements required';

    default:
      return 'Assessment completed';

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

  const radius =
    82;

  const circumference =
    2 *
    Math.PI *
    radius;

  const safeScore =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    );

  const offset =
    circumference -
    (safeScore /
      100) *
      circumference;


  return (

    <div className="relative w-60 h-60 mx-auto">

      <div className="absolute inset-10 rounded-full bg-violet-600/20 blur-[55px]" />


      <svg
        viewBox="0 0 200 200"
        className="relative w-full h-full -rotate-90"
      >

        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
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
              stopColor="#d946ef"
            />

            <stop
              offset="100%"
              stopColor="#38bdf8"
            />

          </linearGradient>

        </defs>

      </svg>


      <div className="absolute inset-0 flex flex-col items-center justify-center">

        <div
          className={cn(
            'text-6xl font-black bg-gradient-to-br bg-clip-text text-transparent',
            gradeGradient(grade)
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


        <p className="text-[8px] uppercase tracking-[0.22em] text-gray-600 mt-2">
          Security posture
        </p>

      </div>

    </div>

  );
}


/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function ScorecardView({

  scorecard,

  onRestart,

  onDownloadPDF,

}: ScorecardViewProps) {

  const [
    downloading,
    setDownloading,
  ] = useState(false);


  const sortedCategories =
    [...scorecard.sub_categories]
      .sort(
        (a, b) =>
          a.score -
          b.score
      );


  const weakest =
    sortedCategories[0];


  const strongest =
    sortedCategories[
      sortedCategories.length - 1
    ];


  const handleDownload =
    async () => {

      setDownloading(
        true
      );

      try {

        await onDownloadPDF();

      } finally {

        setDownloading(
          false
        );

      }

    };


  return (

    <div className="min-h-screen bg-[#05040b] text-white">


      {/* ======================================================
          BACKGROUND
          ====================================================== */}

      <div className="fixed inset-0 pointer-events-none">

        <div className="absolute top-[-250px] left-[30%] w-[750px] h-[550px] rounded-full bg-violet-700/[0.09] blur-[180px]" />

        <div className="absolute right-[-200px] top-[35%] w-[600px] h-[600px] rounded-full bg-fuchsia-700/[0.04] blur-[180px]" />

        <div className="absolute bottom-[-250px] left-[10%] w-[550px] h-[450px] rounded-full bg-blue-700/[0.04] blur-[170px]" />

      </div>


      {/* GRID */}

      <div
        className="fixed inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize:
            '48px 48px',
        }}
      />


      <div className="relative z-10 min-h-screen">


        {/* ====================================================
            HEADER
            ==================================================== */}

        <header className="h-16 border-b border-white/[0.06] bg-[#07050d]/90 backdrop-blur-xl">

          <div className="max-w-[1400px] mx-auto h-full px-5 lg:px-8 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <button
                type="button"
                onClick={
                  onRestart
                }
                className="w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/[0.05] transition"
                aria-label="Back"
              >

                <ArrowLeft className="w-3.5 h-3.5" />

              </button>


              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">

                <Shield className="w-4 h-4 text-white" />

              </div>


              <div>

                <p className="text-[10px] font-semibold">
                  CyberCISO
                </p>

                <p className="text-[7px] text-gray-600 uppercase tracking-[0.2em]">
                  Security Report
                </p>

              </div>

            </div>


            <div className="flex items-center gap-3">

              <div className="hidden sm:flex items-center gap-2 text-[8px] text-gray-600">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                Assessment complete

              </div>


              <span className="px-3 py-1.5 rounded-full border border-violet-400/10 bg-violet-500/[0.06] text-[9px] text-violet-300">

                {formatVertical(
                  scorecard.vertical
                )}

              </span>

            </div>

          </div>

        </header>


        {/* ====================================================
            PAGE
            ==================================================== */}

        <main className="max-w-[1400px] mx-auto px-5 lg:px-8 py-8">


          {/* TITLE */}

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5 mb-6">

            <div>

              <div className="flex items-center gap-2 mb-2">

                <span className="text-[8px] uppercase tracking-[0.24em] text-violet-400">
                  Assessment Results
                </span>

                <span className="px-2 py-0.5 rounded-full bg-emerald-500/[0.07] border border-emerald-400/10 text-[7px] text-emerald-400">
                  COMPLETE
                </span>

              </div>


              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">

                Security posture
                <span className="text-violet-400">
                  .
                </span>

              </h1>


              <p className="text-[10px] text-gray-600 mt-2">
                Your CyberCISO assessment results and prioritized security insights.
              </p>

            </div>


            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={
                  handleDownload
                }
                disabled={
                  downloading
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-violet-400/20 bg-violet-500/[0.08] text-violet-200 hover:bg-violet-500/[0.14] transition disabled:opacity-50 text-[10px] font-medium"
              >

                <Download className="w-3.5 h-3.5" />

                {downloading
                  ? 'Generating...'
                  : 'Download Report'}

              </button>


              <button
                type="button"
                onClick={
                  onRestart
                }
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-gray-400 hover:text-white hover:bg-white/[0.06] transition text-[10px] font-medium"
              >

                <RotateCcw className="w-3.5 h-3.5" />

                New Assessment

              </button>

            </div>

          </div>


          {/* =================================================
              TOP DASHBOARD
              ================================================= */}

          <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-4 mb-5">


            {/* SCORE */}

            <section className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0911]/90 p-6">

              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-violet-600/[0.08] blur-3xl" />

              <div className="relative">

                <div className="flex items-center justify-between mb-2">

                  <div>

                    <p className="text-[9px] uppercase tracking-[0.18em] text-gray-600">
                      Overall assessment
                    </p>

                    <p className="text-[8px] text-gray-700 mt-1">
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
                      'px-3 py-1.5 rounded-full border border-white/[0.07] bg-white/[0.025] text-[9px] font-medium',
                      gradeText(
                        scorecard.overall_grade
                      )
                    )}
                  >

                    {gradeDescription(
                      scorecard.overall_grade
                    )}

                  </div>

                </div>

              </div>

            </section>


            {/* ANALYTICS */}

            <section className="rounded-2xl border border-white/[0.08] bg-[#0a0911]/90 p-6">

              <div className="flex items-center justify-between mb-5">

                <div>

                  <p className="text-[10px] text-gray-300">
                    Security domain analysis
                  </p>

                  <p className="text-[8px] text-gray-700 mt-1">
                    Performance across your assessment areas
                  </p>

                </div>


                <BarChart3 className="w-4 h-4 text-violet-400" />

              </div>


              <div className="space-y-4">

                {scorecard.sub_categories.map(
                  (
                    category
                  ) => {

                    const Icon =
                      DOMAIN_ICONS[
                        category.category
                      ] || Shield;

                    const score =
                      Math.max(
                        0,
                        Math.min(
                          100,
                          category.score
                        )
                      );


                    return (

                      <div
                        key={
                          category.category
                        }
                      >

                        <div className="flex items-center justify-between mb-1.5">

                          <div className="flex items-center gap-2.5">

                            <div className="w-7 h-7 rounded-lg bg-violet-500/[0.08] border border-violet-400/[0.08] flex items-center justify-center">

                              <Icon className="w-3.5 h-3.5 text-violet-400" />

                            </div>


                            <span className="text-[9px] text-gray-400">
                              {formatCategory(
                                category.category
                              )}
                            </span>

                          </div>


                          <div className="flex items-center gap-2">

                            <span className="text-[9px] font-semibold text-gray-300">
                              {category.score}
                            </span>

                            <span
                              className={cn(
                                'text-[8px] font-bold',
                                gradeText(
                                  category.grade
                                )
                              )}
                            >
                              {category.grade}
                            </span>

                          </div>

                        </div>


                        <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">

                          <div
                            className={cn(
                              'h-full rounded-full bg-gradient-to-r transition-all duration-1000',
                              scoreBarGradient(
                                category.grade
                              )
                            )}
                            style={{
                              width:
                                `${score}%`,
                            }}
                          />

                        </div>

                      </div>

                    );

                  }
                )}

              </div>


              {/* INSIGHT BOXES */}

              <div className="grid sm:grid-cols-2 gap-3 mt-5">

                <div className="rounded-xl border border-emerald-400/[0.08] bg-emerald-500/[0.025] p-3">

                  <div className="flex items-center gap-2 mb-1">

                    <TrendingUp className="w-3 h-3 text-emerald-400" />

                    <span className="text-[8px] uppercase tracking-wider text-gray-600">
                      Strongest
                    </span>

                  </div>

                  <p className="text-[10px] text-gray-300">
                    {strongest
                      ? formatCategory(
                          strongest.category
                        )
                      : '—'}
                  </p>

                  {strongest && (
                    <p className="text-[8px] text-emerald-400 mt-1">
                      {strongest.score}/100
                    </p>
                  )}

                </div>


                <div className="rounded-xl border border-red-400/[0.08] bg-red-500/[0.025] p-3">

                  <div className="flex items-center gap-2 mb-1">

                    <TriangleAlert className="w-3 h-3 text-red-400" />

                    <span className="text-[8px] uppercase tracking-wider text-gray-600">
                      Priority
                    </span>

                  </div>

                  <p className="text-[10px] text-gray-300">
                    {weakest
                      ? formatCategory(
                          weakest.category
                        )
                      : '—'}
                  </p>

                  {weakest && (
                    <p className="text-[8px] text-red-400 mt-1">
                      {weakest.score}/100
                    </p>
                  )}

                </div>

              </div>

            </section>

          </div>


          {/* =================================================
              SUMMARY STATS
              ================================================= */}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

            <div className="rounded-xl border border-white/[0.07] bg-[#090811]/90 p-4">

              <div className="flex items-center gap-2 text-gray-600 mb-2">

                <Shield className="w-3.5 h-3.5 text-violet-400" />

                <span className="text-[8px] uppercase tracking-[0.15em]">
                  Score
                </span>

              </div>

              <p className="text-2xl font-semibold text-white">
                {scorecard.overall_score}
              </p>

            </div>


            <div className="rounded-xl border border-white/[0.07] bg-[#090811]/90 p-4">

              <div className="flex items-center gap-2 text-gray-600 mb-2">

                <Target className="w-3.5 h-3.5 text-fuchsia-400" />

                <span className="text-[8px] uppercase tracking-[0.15em]">
                  Domains
                </span>

              </div>

              <p className="text-2xl font-semibold text-white">
                {scorecard.sub_categories.length}
              </p>

            </div>


            <div className="rounded-xl border border-white/[0.07] bg-[#090811]/90 p-4">

              <div className="flex items-center gap-2 text-gray-600 mb-2">

                <FileText className="w-3.5 h-3.5 text-blue-400" />

                <span className="text-[8px] uppercase tracking-[0.15em]">
                  Actions
                </span>

              </div>

              <p className="text-2xl font-semibold text-white">
                {scorecard.remediation_plan.length}
              </p>

            </div>


            <div className="rounded-xl border border-white/[0.07] bg-[#090811]/90 p-4">

              <div className="flex items-center gap-2 text-gray-600 mb-2">

                <Lock className="w-3.5 h-3.5 text-emerald-400" />

                <span className="text-[8px] uppercase tracking-[0.15em]">
                  Framework
                </span>

              </div>

              <p className="text-[13px] font-semibold text-white mt-1">
                NIST + CIS
              </p>

            </div>

          </div>


          {/* =================================================
              SECURITY DOMAINS
              ================================================= */}

          <section className="mb-7">

            <div className="flex items-end justify-between mb-4">

              <div>

                <div className="flex items-center gap-2">

                  <Target className="w-4 h-4 text-violet-400" />

                  <h2 className="text-lg font-semibold text-gray-200">
                    Security domains
                  </h2>

                </div>

                <p className="text-[9px] text-gray-600 mt-1">
                  Detailed findings across your assessment areas.
                </p>

              </div>

            </div>


            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

              {scorecard.sub_categories.map(
                (
                  category
                ) => {

                  const Icon =
                    DOMAIN_ICONS[
                      category.category
                    ] || Shield;


                  return (

                    <article
                      key={
                        category.category
                      }
                      className="rounded-2xl border border-white/[0.07] bg-[#0a0911]/90 p-5 hover:border-violet-400/[0.18] transition-all"
                    >

                      <div className="flex items-start justify-between mb-5">

                        <div className="flex items-center gap-3">

                          <div className="w-10 h-10 rounded-xl bg-violet-500/[0.08] border border-violet-400/10 flex items-center justify-center">

                            <Icon className="w-4 h-4 text-violet-400" />

                          </div>


                          <div>

                            <h3 className="text-[11px] font-medium text-gray-200">
                              {formatCategory(
                                category.category
                              )}
                            </h3>

                            <p className="text-[8px] text-gray-600 mt-0.5">
                              Security domain
                            </p>

                          </div>

                        </div>


                        <div
                          className={cn(
                            'w-8 h-8 rounded-lg border border-white/[0.07] bg-white/[0.025] flex items-center justify-center text-[10px] font-bold',
                            gradeText(
                              category.grade
                            )
                          )}
                        >
                          {category.grade}
                        </div>

                      </div>


                      <div className="flex items-end justify-between mb-2">

                        <div>

                          <span className="text-3xl font-semibold text-white">
                            {category.score}
                          </span>

                          <span className="text-[9px] text-gray-700 ml-1">
                            /100
                          </span>

                        </div>

                      </div>


                      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-4">

                        <div
                          className={cn(
                            'h-full rounded-full bg-gradient-to-r',
                            scoreBarGradient(
                              category.grade
                            )
                          )}
                          style={{
                            width:
                              `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  category.score
                                )
                              )}%`,
                          }}
                        />

                      </div>


                      {category.findings.length > 0 && (

                        <div className="space-y-2">

                          <p className="text-[8px] uppercase tracking-[0.16em] text-gray-700">
                            Findings
                          </p>


                          {category.findings
                            .slice(0, 3)
                            .map(
                              (
                                finding,
                                index
                              ) => (

                                <div
                                  key={
                                    index
                                  }
                                  className="flex gap-2"
                                >

                                  <span className="w-1 h-1 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />

                                  <p className="text-[8px] leading-relaxed text-gray-600">
                                    {finding}
                                  </p>

                                </div>

                              )
                            )}

                        </div>

                      )}

                    </article>

                  );

                }
              )}

            </div>

          </section>


          {/* =================================================
              REMEDIATION PLAN
              ================================================= */}

          <section className="mb-7">

            <div className="flex items-center gap-2 mb-1">

              <Sparkles className="w-4 h-4 text-violet-400" />

              <h2 className="text-lg font-semibold text-gray-200">
                Prioritized remediation plan
              </h2>

            </div>

            <p className="text-[9px] text-gray-600 mb-4">
              Recommended actions based on your assessment findings.
            </p>


            <div className="rounded-2xl border border-white/[0.07] bg-[#0a0911]/90 overflow-hidden">

              {scorecard.remediation_plan.map(
                (
                  action,
                  index
                ) => (

                  <div
                    key={`${action.day}-${index}`}
                    className="group flex gap-4 p-5 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.02] transition"
                  >

                    <div className="flex flex-col items-center">

                      <div className="w-9 h-9 rounded-xl bg-violet-500/[0.08] border border-violet-400/10 flex items-center justify-center">

                        <span className="text-[10px] font-semibold text-violet-300">
                          {action.day}
                        </span>

                      </div>

                      <span className="text-[7px] uppercase tracking-wider text-gray-700 mt-1">
                        Day
                      </span>

                    </div>


                    <div className="flex-1 min-w-0">

                      <div className="flex flex-wrap items-center gap-2 mb-2">

                        <span
                          className={cn(
                            'px-2 py-1 rounded-md text-[8px] font-semibold',
                            getPriorityColor(
                              action.priority
                            )
                          )}
                        >
                          {action.priority}
                        </span>


                        <span className="px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.05] text-[8px] text-gray-500">
                          {formatCategory(
                            action.category
                          )}
                        </span>

                      </div>


                      <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
                        {action.action}
                      </p>


                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[8px] text-gray-700">

                        <span>

                          <span className="text-gray-500">
                            NIST:
                          </span>{' '}

                          {action.nist_function}

                          {' / '}

                          {action.nist_category}

                        </span>


                        <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-800" />


                        <span>

                          <span className="text-gray-500">
                            CIS:
                          </span>{' '}

                          {action.cis_control}

                        </span>


                        <span className="hidden sm:block w-1 h-1 rounded-full bg-gray-800" />


                        <span>
                          {action.effort_estimate}
                        </span>

                      </div>

                    </div>


                    <ArrowUpRight className="w-4 h-4 text-gray-700 group-hover:text-violet-400 flex-shrink-0 transition" />

                  </div>

                )
              )}

            </div>

          </section>


          {/* =================================================
              FRAMEWORKS
              ================================================= */}

          <section className="grid md:grid-cols-2 gap-4 mb-6">

            <div className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-500/[0.025] p-5">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-9 h-9 rounded-xl bg-emerald-500/[0.08] border border-emerald-400/10 flex items-center justify-center">

                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />

                </div>


                <div>

                  <p className="text-[11px] font-medium text-gray-200">
                    NIST CSF 2.0
                  </p>

                  <p className="text-[8px] text-gray-600">
                    Framework-aligned assessment
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-2 text-[8px] text-emerald-400/70">

                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />

                Controls referenced in your findings

              </div>

            </div>


            <div className="rounded-2xl border border-blue-400/[0.08] bg-blue-500/[0.025] p-5">

              <div className="flex items-center gap-3 mb-4">

                <div className="w-9 h-9 rounded-xl bg-blue-500/[0.08] border border-blue-400/10 flex items-center justify-center">

                  <Lock className="w-4 h-4 text-blue-400" />

                </div>


                <div>

                  <p className="text-[11px] font-medium text-gray-200">
                    CIS Controls v8
                  </p>

                  <p className="text-[8px] text-gray-600">
                    Security controls referenced
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-2 text-[8px] text-blue-400/70">

                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />

                Recommendations mapped to controls

              </div>

            </div>

          </section>


          {/* FOOTER */}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 border-t border-white/[0.05]">

            <div className="flex items-center gap-2 text-[8px] text-gray-700">

              <Lock className="w-3 h-3 text-emerald-400" />

              Assessment generated securely by CyberCISO AI.

            </div>


            <button
              type="button"
              onClick={
                onRestart
              }
              className="flex items-center gap-2 text-[8px] text-gray-600 hover:text-violet-300 transition"
            >

              <RotateCcw className="w-3 h-3" />

              Start another assessment

              <ChevronRight className="w-3 h-3" />

            </button>

          </div>

        </main>

      </div>

    </div>

  );
}
