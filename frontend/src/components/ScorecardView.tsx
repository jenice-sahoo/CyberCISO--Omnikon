'use client';

import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Database,
  Download,
  Mail,
  Network,
  RotateCcw,
  Shield,
  Siren,
  Target,
} from 'lucide-react';

import type {
  ScorecardResponse,
} from '@/types';

import {
  formatCategory,
  formatVertical,
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
   ICONS
   ============================================================ */

const DOMAIN_ICONS: Record<
  string,
  typeof Shield
> = {
  access_control: Shield,
  data_backup: Database,
  network_security: Network,
  email_phishing: Mail,
  incident_response: Siren,
};

/* ============================================================
   HELPERS
   ============================================================ */

function safeScore(
  score: number
): number {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.max(
    0,
    Math.min(100, score)
  );
}

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
      return 'from-emerald-300 via-green-400 to-cyan-400';

    case 'B':
      return 'from-violet-300 via-purple-400 to-blue-400';

    case 'C':
      return 'from-amber-300 via-yellow-400 to-orange-400';

    case 'D':
      return 'from-orange-300 via-red-400 to-pink-400';

    case 'F':
      return 'from-red-400 via-rose-500 to-fuchsia-500';

    default:
      return 'from-violet-300 to-blue-400';
  }
}

function scoreGradient(
  grade: string
): string {
  switch (
    grade.toUpperCase()
  ) {
    case 'A':
      return 'from-emerald-400 to-cyan-400';

    case 'B':
      return 'from-violet-500 to-blue-400';

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

function priorityClasses(
  priority: string
): string {
  switch (
    priority.toLowerCase()
  ) {
    case 'critical':
      return 'border-red-400/20 bg-red-500/[0.08] text-red-300';

    case 'high':
      return 'border-orange-400/20 bg-orange-500/[0.08] text-orange-300';

    case 'medium':
      return 'border-amber-400/20 bg-amber-500/[0.08] text-amber-300';

    case 'low':
      return 'border-blue-400/20 bg-blue-500/[0.08] text-blue-300';

    default:
      return 'border-white/10 bg-white/[0.04] text-gray-400';
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

  const safe =
    safeScore(score);

  const offset =
    circumference -
    (safe / 100) *
      circumference;

  return (
    <div className="relative mx-auto h-64 w-64">
      <div className="absolute inset-8 rounded-full bg-violet-600/20 blur-[55px]" />

      <svg
        viewBox="0 0 200 200"
        className="relative h-full w-full -rotate-90"
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
          stroke="url(#cyberScoreGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />

        <defs>
          <linearGradient
            id="cyberScoreGradient"
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

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          className={`bg-gradient-to-br bg-clip-text text-6xl font-black text-transparent ${gradeGradient(
            grade
          )}`}
        >
          {grade}
        </div>

        <div className="mt-1 text-3xl font-bold text-white">
          {safe}
          <span className="text-sm font-normal text-gray-600">
            /100
          </span>
        </div>

        <div className="mt-2 text-[9px] uppercase tracking-[0.22em] text-gray-600">
          Security posture
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   DOMAIN BARS
   ============================================================ */

function DomainBars({
  categories,
}: {
  categories:
    ScorecardResponse['sub_categories'];
}) {
  return (
    <div className="space-y-5">
      {categories.map(
        (
          category,
          index
        ) => {
          const Icon =
            DOMAIN_ICONS[
              category.category
            ] || Shield;

          const score =
            safeScore(
              category.score
            );

          return (
            <div
              key={`${category.category}-${index}`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-violet-400/10 bg-violet-500/[0.07]">
                    <Icon className="h-3.5 w-3.5 text-violet-400" />
                  </div>

                  <span className="truncate text-xs text-gray-400">
                    {formatCategory(
                      category.category
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-300">
                    {score}
                  </span>

                  <span
                    className={`text-[9px] font-bold ${gradeText(
                      category.grade
                    )}`}
                  >
                    {category.grade}
                  </span>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${scoreGradient(
                    category.grade
                  )}`}
                  style={{
                    width: `${score}%`,
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
  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const overallScore =
    safeScore(
      scorecard.overall_score
    );

  const handleDownload =
    async () => {
      if (downloading) {
        return;
      }

      setDownloading(true);

      try {
        await onDownloadPDF();
      } finally {
        setDownloading(false);
      }
    };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#05040b] text-white">
      {/* ======================================================
          BACKGROUND
          ====================================================== */}

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-[25%] top-[-220px] h-[600px] w-[700px] rounded-full bg-violet-700/[0.08] blur-[180px]" />

        <div className="absolute right-[-180px] top-[35%] h-[550px] w-[550px] rounded-full bg-blue-700/[0.05] blur-[180px]" />

        <div className="absolute bottom-[-200px] left-[15%] h-[500px] w-[500px] rounded-full bg-fuchsia-700/[0.05] blur-[180px]" />
      </div>

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10">
        {/* ==================================================
            HEADER
            ================================================== */}

        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#07060d]/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 shadow-lg shadow-violet-500/20">
                <Shield className="h-4 w-4 text-white" />
              </div>

              <div>
                <div className="text-sm font-semibold">
                  CyberCISO
                </div>

                <div className="text-[8px] uppercase tracking-[0.18em] text-gray-600">
                  Security Intelligence
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-400/10 bg-emerald-500/[0.05] px-3 py-1.5 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                <span className="text-[10px] text-emerald-400/80">
                  Assessment complete
                </span>
              </div>

              <div className="rounded-full border border-violet-400/10 bg-violet-500/[0.06] px-3 py-1.5 text-[10px] text-violet-300">
                {formatVertical(
                  scorecard.vertical
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ==================================================
            MAIN
            ================================================== */}

        <main className="mx-auto max-w-7xl px-5 py-8">
          {/* TITLE */}
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2 text-[9px] uppercase tracking-[0.25em] text-violet-400/70">
              <Target className="h-3.5 w-3.5" />
              Security intelligence report
            </div>

            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Security posture
                  <span className="text-violet-400">
                    .
                  </span>
                </h1>

                <p className="mt-2 max-w-xl text-sm leading-6 text-gray-600">
                  Your CyberCISO assessment results,
                  security insights and prioritized
                  remediation plan.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={
                    handleDownload
                  }
                  disabled={
                    downloading
                  }
                  className="flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/[0.08] px-4 py-2.5 text-xs font-medium text-violet-200 transition hover:bg-violet-500/[0.14] disabled:opacity-40"
                >
                  <Download className="h-3.5 w-3.5" />

                  {downloading
                    ? 'Generating...'
                    : 'Download report'}
                </button>

                <button
                  type="button"
                  onClick={
                    onRestart
                  }
                  className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-xs font-medium text-gray-400 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  New assessment
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================
              TOP DASHBOARD
              ================================================== */}

          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            {/* SCORE */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#08070e]/90 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-gray-600">
                    Overall security score
                  </p>

                  <p className="mt-1 text-xs text-gray-700">
                    Based on your assessment
                  </p>
                </div>

                <BarChart3 className="h-4 w-4 text-violet-400" />
              </div>

              <ScoreRing
                score={
                  overallScore
                }
                grade={
                  scorecard.overall_grade
                }
              />

              <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <p className="text-[9px] uppercase tracking-[0.18em] text-gray-700">
                  Business type
                </p>

                <p className="mt-1 text-sm font-medium text-gray-300">
                  {formatVertical(
                    scorecard.vertical
                  )}
                </p>
              </div>
            </section>

            {/* ANALYSIS */}
            <section className="rounded-2xl border border-white/[0.07] bg-[#08070e]/90 p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-violet-400" />

                    <h2 className="text-sm font-semibold text-gray-200">
                      Security domain analysis
                    </h2>
                  </div>

                  <p className="mt-1 text-[10px] text-gray-600">
                    Performance across your assessment areas.
                  </p>
                </div>

                <span className="rounded-full border border-violet-400/10 bg-violet-500/[0.05] px-2.5 py-1 text-[9px] text-violet-300">
                  {scorecard.sub_categories.length}{' '}
                  domains
                </span>
              </div>

              <DomainBars
                categories={
                  scorecard.sub_categories
                }
              />
            </section>
          </div>

          {/* ==================================================
              STATS
              ================================================== */}

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-[8px] uppercase tracking-[0.18em] text-gray-600">
                Overall score
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {overallScore}
                <span className="text-xs font-normal text-gray-700">
                  /100
                </span>
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-[8px] uppercase tracking-[0.18em] text-gray-600">
                Security domains
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {
                  scorecard
                    .sub_categories
                    .length
                }
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-[8px] uppercase tracking-[0.18em] text-gray-600">
                Remediation actions
              </p>

              <p className="mt-2 text-2xl font-semibold">
                {
                  scorecard
                    .remediation_plan
                    .length
                }
              </p>
            </div>

            <div className="rounded-xl border border-emerald-400/[0.08] bg-emerald-500/[0.025] p-4">
              <p className="text-[8px] uppercase tracking-[0.18em] text-gray-600">
                Framework
              </p>

              <p className="mt-2 text-sm font-semibold">
                NIST + CIS
              </p>
            </div>
          </div>

          {/* ==================================================
              DOMAIN CARDS
              ================================================== */}

          <section className="mt-8">
            <div className="mb-5">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-violet-400" />

                <h2 className="text-lg font-semibold text-gray-200">
                  Security domains
                </h2>
              </div>

              <p className="mt-1 text-xs text-gray-600">
                Detailed findings across your assessment.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {scorecard.sub_categories.map(
                (
                  category,
                  index
                ) => {
                  const Icon =
                    DOMAIN_ICONS[
                      category.category
                    ] || Shield;

                  const score =
                    safeScore(
                      category.score
                    );

                  return (
                    <article
                      key={`${category.category}-${index}`}
                      className="rounded-2xl border border-white/[0.07] bg-[#08070e]/90 p-5 transition hover:border-violet-400/20"
                    >
                      <div className="mb-5 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/[0.08]">
                            <Icon className="h-4 w-4 text-violet-400" />
                          </div>

                          <div>
                            <h3 className="text-sm font-medium text-gray-200">
                              {formatCategory(
                                category.category
                              )}
                            </h3>

                            <p className="mt-0.5 text-[9px] text-gray-600">
                              Security domain
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-sm font-bold ${gradeText(
                            category.grade
                          )}`}
                        >
                          {category.grade}
                        </span>
                      </div>

                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-2xl font-semibold">
                          {score}
                        </span>

                        <span className="text-[9px] text-gray-600">
                          /100
                        </span>
                      </div>

                      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${scoreGradient(
                            category.grade
                          )}`}
                          style={{
                            width: `${score}%`,
                          }}
                        />
                      </div>

                      {category
                        .findings
                        .length >
                        0 && (
                        <div>
                          <p className="mb-2 text-[9px] uppercase tracking-[0.16em] text-gray-700">
                            Key findings
                          </p>

                          <ul className="space-y-2">
                            {category.findings
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  finding,
                                  findingIndex
                                ) => (
                                  <li
                                    key={`${finding}-${findingIndex}`}
                                    className="flex gap-2 text-[10px] leading-5 text-gray-500"
                                  >
                                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-violet-400/60" />

                                    <span>
                                      {
                                        finding
                                      }
                                    </span>
                                  </li>
                                )
                              )}
                          </ul>
                        </div>
                      )}
                    </article>
                  );
                }
              )}
            </div>
          </section>

          {/* ==================================================
              REMEDIATION
              ================================================== */}

          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-400" />

                  <h2 className="text-lg font-semibold text-gray-200">
                    30-day remediation plan
                  </h2>
                </div>

                <p className="mt-1 text-xs text-gray-600">
                  Prioritized actions to strengthen your security posture.
                </p>
              </div>

              <span className="text-[9px] text-gray-700">
                {
                  scorecard
                    .remediation_plan
                    .length
                }{' '}
                actions
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#08070e]/90">
              {scorecard.remediation_plan.map(
                (
                  action,
                  index
                ) => (
                  <div
                    key={`${action.day}-${index}`}
                    className="border-b border-white/[0.06] p-5 last:border-b-0"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-violet-400/10 bg-violet-500/[0.06] text-xs font-semibold text-violet-300">
                        {action.day}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full border px-2 py-1 text-[8px] font-medium ${priorityClasses(
                              action.priority
                            )}`}
                          >
                            {
                              action.priority
                            }
                          </span>

                          <span className="rounded-full border border-white/[0.06] bg-white/[0.025] px-2 py-1 text-[8px] text-gray-600">
                            {formatCategory(
                              action.category
                            )}
                          </span>
                        </div>

                        <p className="text-sm leading-6 text-gray-300">
                          {
                            action.action
                          }
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[8px] text-gray-600">
                            NIST:{' '}
                            {
                              action.nist_function
                            }
                          </span>

                          <span className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[8px] text-gray-600">
                            CIS:{' '}
                            {
                              action.cis_control
                            }
                          </span>

                          <span className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-1.5 text-[8px] text-gray-600">
                            Effort:{' '}
                            {
                              action.effort_estimate
                            }
                          </span>
                        </div>
                      </div>

                      <ArrowUpRight className="hidden h-4 w-4 shrink-0 text-gray-700 sm:block" />
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {/* ==================================================
              FRAMEWORKS
              ================================================== */}

          <section className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/[0.08] bg-emerald-500/[0.025] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-500/[0.08]">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
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
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Controls referenced in your findings
              </div>
            </div>

            <div className="rounded-2xl border border-blue-400/[0.08] bg-blue-500/[0.025] p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/10 bg-blue-500/[0.08]">
                  <Shield className="h-4 w-4 text-blue-400" />
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
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                Actionable control references
              </div>
            </div>
          </section>

          {/* ==================================================
              DISCLAIMER
              ================================================== */}

          <div className="mt-8 rounded-2xl border border-amber-400/[0.08] bg-amber-500/[0.035] p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />

              <div>
                <p className="text-xs font-semibold text-amber-300">
                  Assessment disclaimer
                </p>

                <p className="mt-1.5 text-[11px] leading-5 text-amber-200/50">
                  This assessment is based on self-reported information
                  and should not replace a professional security audit.
                  NIST CSF 2.0 and CIS Controls v8 references are
                  thematic; verify control numbers against official
                  publications.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="mt-10 border-t border-white/[0.06] py-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-blue-600">
                <Shield className="h-3 w-3 text-white" />
              </div>

              <span className="text-xs text-gray-600">
                CyberCISO
              </span>
            </div>

            <div className="flex items-center gap-3 text-[9px] text-gray-700">
              <span>NIST CSF 2.0</span>
              <span>•</span>
              <span>CIS Controls v8</span>
              <span>•</span>
              <span>Virtual CISO</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
