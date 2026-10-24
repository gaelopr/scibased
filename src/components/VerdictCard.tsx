import { BookOpen, Microscope, Smartphone, Target } from "lucide-react";
import {
  categoryLabel,
  certaintyLabel,
  useLanguage,
  verdictLabel,
} from "../i18n";
import type { ClaimType, VerdictResult } from "../types";
import { verdictTheme } from "../lib/verdictTheme";
import VerdictBadge from "./VerdictBadge";

interface VerdictCardProps {
  result: VerdictResult;
}

export default function VerdictCard({ result }: VerdictCardProps) {
  const { t } = useLanguage();
  const theme = verdictTheme[result.verdict];
  const label = verdictLabel(t, result.verdict);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const evidenceCount = result.studies?.length ?? result.papers.length;
  const hasEvidence = !result.isLive || evidenceCount > 0;
  const scoreBasis = result.scoreBasis;
  const dash = hasEvidence ? (result.score / 100) * circumference : 0;
  const scoreLabel =
    scoreBasis === "indirect"
      ? t("verdictCard.indirectSignal")
      : scoreBasis === "directional"
        ? t("verdictCard.directionalSignal")
        : t("verdictCard.claimSupport");
  const claimTypeLabels: Record<ClaimType, string> = {
    safety: t("claimType.safety"),
    efficacy: t("claimType.efficacy"),
    causation: t("claimType.causation"),
    association: t("claimType.association"),
    mechanism: t("claimType.mechanism"),
    other: t("claimType.other"),
  };

  return (
    <section
      className="animate-scale-in overflow-hidden rounded-3xl border border-line bg-surface shadow-lift"
      aria-labelledby="verdict-title"
    >
      <div className={`h-1 w-full ${theme.dot}`} aria-hidden="true" />

      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <VerdictBadge verdict={result.verdict} />
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle">
              {t("verdictCard.verdict")}
            </p>
          </div>

          <div
            className="ml-auto flex shrink-0 flex-col items-center"
            role="img"
            aria-label={
              hasEvidence
                ? scoreBasis === "indirect"
                  ? t("verdictCard.indirectScoreAria", { score: result.score })
                  : scoreBasis === "directional"
                    ? t("verdictCard.directionalScoreAria", {
                        score: result.score,
                      })
                    : t("verdictCard.scoreAria", { score: result.score })
                : t("verdictCard.noScoreAria")
            }
          >
            <div className="relative h-[92px] w-[92px] sm:h-[104px] sm:w-[104px]">
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
                      <span className="text-[27px] font-semibold tracking-[-0.055em] text-ink-950 sm:text-[31px]">
                        {result.score}
                      </span>
                      <span className="ml-0.5 text-[10px] font-medium text-faint">/100</span>
                    </span>
                    <span className="mt-1 max-w-[68px] text-center text-[8.5px] font-medium uppercase leading-3 tracking-[0.06em] text-faint">
                      {scoreLabel}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[28px] font-semibold leading-none text-faint">—</span>
                    <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.06em] text-faint">
                      {t("verdictCard.noEvidence")}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <h1
          id="verdict-title"
          className="mt-1 font-serif text-[42px] font-normal leading-[0.95] tracking-[-0.035em] text-ink-950 sm:text-[54px]"
        >
          {label}
          <span className="text-decor">.</span>
        </h1>

        <p
          lang="en"
          className="mt-3 max-w-[620px] text-[15px] leading-7 text-muted sm:text-[16px]"
        >
          {result.conclusion}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[11.5px] font-medium text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {result.isLive
              ? t("verdictCard.papersIncluded", { count: evidenceCount })
              : t("verdictCard.papers", { count: result.papers.length })}
          </span>
          <span className="hidden h-0.5 w-0.5 rounded-full bg-decor sm:inline-block" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5">
            <Microscope className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {t("verdictCard.certainty", {
              value: certaintyLabel(t, result.evidenceQuality),
            })}
          </span>
          <span className="hidden h-0.5 w-0.5 rounded-full bg-decor sm:inline-block" aria-hidden="true" />
          <span className="inline-flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {categoryLabel(t, result.category)}
          </span>
        </div>
      </div>

      <div className="border-t border-line bg-surface-muted px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-1 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-subtle">
            {t("results.claimUnder")}
          </p>
          {result.isLive && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-brand ring-1 ring-brand-line">
              <span className="h-1.5 w-1.5 rounded-full bg-verified" aria-hidden="true" />
              {t("results.live")}
            </span>
          )}
          {result.isSample && (
            <span className="rounded-full bg-caution-soft px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-caution-text ring-1 ring-caution-line">
              {t("results.sample")}
            </span>
          )}
          {result.claimType && (
            <span className="rounded-full border border-line bg-surface px-2.5 py-1 text-[9.5px] font-medium text-subtle">
              {claimTypeLabels[result.claimType]}
            </span>
          )}
          {result.fromScreenshot && (
            <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[9.5px] font-medium text-subtle">
              <Smartphone className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
              {t("results.fromScreenshot")}
            </span>
          )}
        </div>
        <p className="mt-2 font-serif text-[17px] leading-7 text-ink-700 sm:text-[18px]">
          “{result.claim}”
        </p>
      </div>
    </section>
  );
}
