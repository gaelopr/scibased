import { BookOpen, Microscope, Target } from "lucide-react";
import type { VerdictResult } from "../types";
import { verdictTheme } from "../lib/verdictTheme";
import VerdictBadge from "./VerdictBadge";

interface VerdictCardProps {
  result: VerdictResult;
}

export default function VerdictCard({ result }: VerdictCardProps) {
  const theme = verdictTheme[result.verdict];
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const evidenceCount = result.studies?.length ?? result.papers.length;
  const hasEvidence = !result.isLive || evidenceCount > 0;
  const dash = hasEvidence ? (result.score / 100) * circumference : 0;

  return (
    <section
      className={`animate-scale-in relative overflow-hidden rounded-[28px] p-5 sm:p-7 ${theme.card} ${theme.glow}`}
      aria-labelledby="verdict-title"
    >
      <div className="verdict-texture pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictBadge verdict={result.verdict} variant="overlay" />
          {result.isSample && (
            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] ${theme.overlayBadge}`}
            >
              Demo result
            </span>
          )}
          {result.isLive && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.13em] ${theme.overlayBadge}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
              Live scan
            </span>
          )}
        </div>

        <div
          className="flex shrink-0 flex-col items-center pr-1"
          aria-label={
            hasEvidence
              ? `Claim support score: ${result.score} out of 100`
              : "No evidence score available because no studies were included"
          }
        >
          <div className="relative h-[84px] w-[84px] sm:h-[106px] sm:w-[106px]">
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth="7"
                className={theme.scoreTrack}
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                className={theme.scoreFill}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {hasEvidence ? (
                <>
                  <span className="flex items-baseline leading-none">
                    <span className="text-[27px] font-semibold tracking-[-0.06em] sm:text-[33px]">
                      {result.score}
                    </span>
                    <span className={`ml-0.5 text-[9px] font-medium ${theme.mutedText}`}>/100</span>
                  </span>
                  <span
                    className={`mt-1 text-[8px] font-semibold uppercase tracking-[0.08em] ${theme.mutedText} sm:text-[8px]`}
                  >
                    Claim support
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[30px] font-semibold leading-none opacity-80">—</span>
                  <span
                    className={`mt-1 text-[8px] font-semibold uppercase tracking-[0.08em] ${theme.mutedText} sm:text-[8px]`}
                  >
                    No evidence
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-1 sm:mt-0">
        <p
          className={`text-[9px] font-semibold uppercase tracking-[0.19em] ${theme.mutedText}`}
        >
          SciBased verdict
        </p>
        <h1
          id="verdict-title"
          className="mt-1 font-serif text-[45px] font-normal leading-[0.94] tracking-[-0.035em] sm:text-[58px]"
        >
          {result.label}
          <span className="opacity-55">.</span>
        </h1>
        <p className={`mt-3 max-w-[580px] text-[14.5px] leading-[1.7] sm:text-[16px] ${theme.mutedText}`}>
          {result.conclusion}
        </p>
      </div>

      <div
        className={`relative z-10 mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t pt-3.5 text-[9.5px] font-medium sm:text-[10px] ${theme.divider} ${theme.mutedText}`}
      >
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
          {result.isLive
            ? `${evidenceCount} papers included`
            : `${result.papers.length} peer-reviewed papers`}
        </span>
        <span className="hidden h-0.5 w-0.5 rounded-full bg-current opacity-40 sm:inline-block" aria-hidden="true" />
        <span className="inline-flex items-center gap-1.5">
          <Microscope className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
          {result.evidenceQuality} certainty
        </span>
        <span className="hidden h-0.5 w-0.5 rounded-full bg-current opacity-40 sm:inline-block" aria-hidden="true" />
        <span className="inline-flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
          {result.category}
        </span>
      </div>
    </section>
  );
}
