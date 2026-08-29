'use client';

import { useState } from 'react';
import { RotateCcw, Download, AlertCircle, Shield, Calendar, Target, ArrowUpRight } from 'lucide-react';
import { ScorecardResponse } from '@/types';
import { cn, formatVertical, getPriorityColor, formatCategory } from '@/lib/utils';

interface ScorecardViewProps {
  scorecard: ScorecardResponse;
  onRestart: () => void;
  onDownloadPDF: () => Promise<void>;
}

function getGradeGradient(grade: string): string {
  switch (grade) {
    case 'A': return 'from-emerald-500 to-emerald-600';
    case 'B': return 'from-primary-500 to-primary-600';
    case 'C': return 'from-amber-400 to-amber-500';
    case 'D': return 'from-orange-400 to-orange-500';
    case 'F': return 'from-red-500 to-red-600';
    default: return 'from-gray-400 to-gray-500';
  }
}

function getGradeBg(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    case 'B': return 'bg-primary-50 border-primary-200 text-primary-700';
    case 'C': return 'bg-amber-50 border-amber-200 text-amber-700';
    case 'D': return 'bg-orange-50 border-orange-200 text-orange-700';
    case 'F': return 'bg-red-50 border-red-200 text-red-700';
    default: return 'bg-gray-50 border-gray-200 text-gray-700';
  }
}

function getScoreBarColor(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
    case 'B': return 'bg-gradient-to-r from-primary-400 to-primary-500';
    case 'C': return 'bg-gradient-to-r from-amber-400 to-amber-500';
    case 'D': return 'bg-gradient-to-r from-orange-400 to-orange-500';
    case 'F': return 'bg-gradient-to-r from-red-400 to-red-500';
    default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
  }
}

export default function ScorecardView({ scorecard, onRestart, onDownloadPDF }: ScorecardViewProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownloadPDF();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="glass-strong border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/images/logo.svg" alt="CyberCISO" className="w-9 h-9 relative z-10" />
              <div className="absolute inset-0 bg-primary-400/15 blur-lg rounded-full" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 text-sm tracking-tight">CyberCISO</h1>
              <p className="text-[11px] text-gray-400">Security Scorecard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('px-3 py-1.5 text-sm font-semibold rounded-xl border', getGradeBg(scorecard.overall_grade))}>
              {scorecard.overall_grade} Grade
            </span>
            <span className="px-3 py-1.5 bg-primary-50 text-primary-700 text-xs font-medium rounded-xl border border-primary-100">
              {formatVertical(scorecard.vertical)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-10 opacity-0 animate-fade-in-up">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white text-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-5">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div className={cn('text-8xl font-extrabold mb-2 tracking-tighter bg-gradient-to-br bg-clip-text text-transparent', getGradeGradient(scorecard.overall_grade))}>
                  {scorecard.overall_grade}
                </div>
                <div className="text-sm text-gray-300 font-medium uppercase tracking-widest mb-3">Overall Grade</div>
                <div className="text-4xl font-bold">{scorecard.overall_score}<span className="text-lg text-gray-400 font-normal">/100</span></div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-5">Assessment Summary</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Vertical</p>
                  <p className="font-semibold text-gray-900">{formatVertical(scorecard.vertical)}</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Framework</p>
                  <p className="font-semibold text-gray-900">NIST CSF 2.0 + CIS v8</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Categories Assessed</p>
                  <p className="font-semibold text-gray-900">5 (Equally Weighted)</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-1">Remediation Actions</p>
                  <p className="font-semibold text-gray-900">{scorecard.remediation_plan.length} over 30 days</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 transition-all duration-200 font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generating...' : 'Download PDF Report'}
          </button>
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            New Assessment
          </button>
        </div>

        <section className="mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary-500" />
            Sub-Category Scores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scorecard.sub_categories.map((sc, idx) => (
              <div
                key={idx}
                className="scorecard-glow bg-white rounded-2xl border border-gray-100 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">{formatCategory(sc.category)}</h3>
                  <span className={cn('px-2.5 py-1 rounded-lg text-sm font-bold border', getGradeBg(sc.grade))}>
                    {sc.grade}
                  </span>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-2xl font-bold text-gray-900">{sc.score}</span>
                    <span className="text-xs text-gray-400">/100</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full progress-bar-animated', getScoreBarColor(sc.grade))}
                      style={{ width: `${sc.score}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <p className="font-medium text-gray-700 text-xs uppercase tracking-wide">Key Findings</p>
                  <ul className="space-y-1.5">
                    {sc.findings.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-gray-600">
                        <span className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-gray-50 space-y-1 text-[11px] text-gray-400">
                  <p><span className="font-semibold text-gray-500">NIST:</span> {sc.nist_references.join(', ')}</p>
                  <p><span className="font-semibold text-gray-500">CIS:</span> {sc.cis_references.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            30-Day Prioritized Remediation Plan
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-50">
              {scorecard.remediation_plan.map((action, idx) => (
                <div key={idx} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                          Day {action.day}
                        </span>
                        <span className={cn('px-2 py-0.5 rounded-md text-[11px] font-semibold', getPriorityColor(action.priority))}>
                          {action.priority}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatCategory(action.category)}</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium leading-relaxed">{action.action}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        <span>NIST: {action.nist_function} / {action.nist_category}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>CIS: {action.cis_control}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{action.effort_estimate}</span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Disclaimer</p>
              <p className="mt-1 leading-relaxed">This assessment is based on self-reported information and should not replace a professional security audit. NIST CSF 2.0 and CIS Controls v8 references are thematic; verify control numbers against official publications.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-8 mt-8">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/images/logo.svg" alt="CyberCISO" className="w-5 h-5 opacity-50" />
            <span className="text-sm font-medium text-gray-400">CyberCISO</span>
          </div>
          <p className="text-xs text-gray-400">Virtual CISO for Small Business</p>
        </div>
      </footer>
    </div>
  );
}
