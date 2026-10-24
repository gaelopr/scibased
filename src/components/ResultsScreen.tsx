import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  Check,
  Info,
  Languages,
  Layers3,
  Lightbulb,
  Link2,
  Route,
  ScanSearch,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage, verdictLabel } from "../i18n";
import type { VerdictResult } from "../types";
import { verdictTheme } from "../lib/verdictTheme";
import EvidenceOverview from "./EvidenceOverview";
import PaperCard from "./PaperCard";
import StatementSources from "./StatementSources";
import StudyCard from "./StudyCard";
import VerdictCard from "./VerdictCard";

interface ResultsScreenProps {
  result: VerdictResult;
  onReset: () => void;
}

export default function ResultsScreen({ result, onReset }: ResultsScreenProps) {
  const { language, t } = useLanguage();
  const theme = verdictTheme[result.verdict];
  const [copied, setCopied] = useState(false);
  const studies = result.studies ?? [];
  const evidenceCount = studies.length || result.papers.length;
  const sourcedStatements = result.breakdown.filter(
    (item) => (item.studyIds?.length ?? 0) > 0,
  ).length;
  const allStatementsSourced =
    result.breakdown.length > 0 && sourcedStatements === result.breakdown.length;

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleShare() {
    const label = verdictLabel(t, result.verdict);
    const text = `${label}: ${result.claim}\n\n${result.conclusion}`;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `SciBased: ${label}`,
          text,
          url: window.location.href,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(`${text}\n\n${window.location.href}`);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = `${text}\n\n${window.location.href}`;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      setCopied(true);
    } catch {
      // The user may have dismissed the native share sheet. No error state needed.
    }
  }

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-4 pt-5 sm:px-6 sm:pt-8">
      <div className="animate-fade-up mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[12px] font-medium text-muted shadow-sm transition hover:border-line-strong hover:text-ink-950"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
          {t("results.newCheck")}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line bg-surface px-3.5 text-[12px] font-medium text-muted shadow-sm transition hover:border-line-strong hover:text-ink-950"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-brand-strong" strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <Share2 className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
          )}
          <span aria-live="polite">{copied ? t("results.copied") : t("results.share")}</span>
        </button>
      </div>

      <VerdictCard result={result} />

      {result.isSample && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-caution-line bg-caution-soft px-4 py-3 text-[11.5px] leading-5 text-caution-text">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-caution-text" strokeWidth={2} aria-hidden="true" />
          <p>{t("results.sampleNotice")}</p>
        </div>
      )}

      {language === "es" && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-line bg-surface px-4 py-3 text-[11.5px] leading-5 text-muted shadow-sm">
          <Languages className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2} aria-hidden="true" />
          <p>{t("results.englishNote")}</p>
        </div>
      )}

      {result.isLive && result.coverage?.redirect && (
        <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-caution-line bg-caution-soft px-4 py-3.5 text-caution-text shadow-sm">
          <Route className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold leading-5">
              {t("results.redirectTitle", {
                from: result.coverage.redirect.from,
                to: result.coverage.redirect.to.join(", "),
              })}
            </p>
            <p className="mt-1 text-[11.5px] leading-[1.65]">
              {t("results.redirectBody", {
                from: result.coverage.redirect.from,
                to: result.coverage.redirect.to.join(", "),
              })}
            </p>
            <p className="mt-1.5 text-[10.5px] font-medium leading-4 opacity-90">
              {result.coverage.redirect.relatedStudiesFound > 0
                ? t("results.redirectCount", {
                    count: result.coverage.redirect.relatedStudiesFound,
                  })
                : t("results.redirectNone")}
            </p>
          </div>
        </div>
      )}

      <section
        className="animate-fade-up mt-4 rounded-3xl border border-line bg-surface p-5 shadow-card sm:mt-5 sm:p-6 [animation-delay:120ms]"
        aria-labelledby="breakdown-heading"
      >
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${theme.iconTile}`}>
            <Layers3 className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="breakdown-heading"
              className="text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink-950 sm:text-[26px]"
            >
              {t("results.breakdownTitle")}
            </h2>
            <p className="mt-1.5 max-w-xl text-[12.5px] leading-5 text-subtle">
              {t("results.breakdownBody")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <p className="max-w-xl text-[10.5px] leading-4 text-faint">
                {t("results.traceabilityNote")}
              </p>
              {evidenceCount > 0 && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.07em] ${
                    allStatementsSourced
                      ? "border-brand-line bg-brand-soft text-brand"
                      : "border-caution-line bg-caution-soft text-caution-text"
                  }`}
                >
                  <Link2 className="h-2.5 w-2.5" aria-hidden="true" />
                  {t("results.statementsSourced", {
                    sourced: sourcedStatements,
                    total: result.breakdown.length,
                  })}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className={`my-4 rounded-2xl border px-4 py-3.5 ${theme.softDivider} ${theme.tint}`}>
          <p
            lang="en"
            className="font-serif text-[16px] italic leading-[1.55] text-ink-700 sm:text-[17px]"
          >
            “{result.contextLine}”
          </p>
        </div>

        <ol>
          {result.breakdown.map((item, index) => (
            <li key={item.title} className="relative flex gap-3.5 pb-5 last:pb-0">
              {index < result.breakdown.length - 1 && (
                <span
                  className={`absolute bottom-0 left-[13.5px] top-7 w-px ${theme.connector}`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`relative z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${theme.numberBadge}`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 pt-0.5">
                <h3
                  lang="en"
                  className="text-[13.5px] font-semibold leading-5 tracking-[-0.01em] text-ink-950 sm:text-[14px]"
                >
                  {item.title}
                </h3>
                <p
                  lang="en"
                  className="mt-1.5 text-[12.5px] leading-[1.72] text-muted sm:text-[13px]"
                >
                  {item.body}
                </p>
                <StatementSources
                  ids={item.studyIds}
                  studies={studies}
                  papers={result.papers}
                />
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-field p-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface text-caution-text shadow-sm ring-1 ring-line">
            <Lightbulb className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-[12px] leading-[1.7] text-muted sm:text-[12.5px]">
              <span className="font-semibold text-ink-950">{t("results.worthRemembering")} </span>
              <span lang="en">{result.remember}</span>
            </p>
            <StatementSources
              ids={result.rememberStudyIds}
              studies={studies}
              papers={result.papers}
            />
          </div>
        </div>
      </section>

      <EvidenceOverview result={result} />

      <section
        className="animate-fade-up mt-9 sm:mt-10 [animation-delay:180ms]"
        aria-labelledby="evidence-heading"
      >
        <div className="mb-4 px-1">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-brand">
            <BookOpenCheck className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
            {t("results.evidenceEyebrow")}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2
              id="evidence-heading"
              className="text-[26px] font-semibold leading-tight tracking-[-0.035em] text-ink-950 sm:text-[30px]"
            >
              {t("results.receipts")}<span className="text-decor">.</span>
            </h2>
            <span className="mb-0.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[10px] font-medium text-subtle shadow-sm">
              {result.isLive
                ? t("results.papersIncluded", { count: evidenceCount })
                : t("results.sources", { count: result.papers.length })}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-[12px] leading-5 text-subtle">
            {result.isLive
              ? t("results.liveEvidenceBody")
              : t("results.sampleEvidenceBody")}
          </p>
        </div>

        {studies.length > 0 ? (
          <div className="space-y-3">
            {studies.map((study, index) => (
              <StudyCard key={study.id} study={study} index={index} />
            ))}
          </div>
        ) : result.papers.length > 0 ? (
          <div className="space-y-3">
            {result.papers.map((paper, index) => (
              <PaperCard key={paper.id} paper={paper} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-5 text-[12.5px] leading-6 text-muted shadow-card">
            <p className="font-semibold text-ink-950">{t("results.noReceipts")}</p>
            <p className="mt-1.5">
              {t("results.noReceiptsBody")}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 px-1 text-[10.5px] leading-5 text-subtle">
          <BookOpenCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={2} aria-hidden="true" />
          <p>
            {result.isLive
              ? t("results.fullTextNote", {
                  read: result.coverage?.fullTextsRead ?? 0,
                  total: studies.length,
                })
              : t("results.sampleEvidenceNote")}
          </p>
        </div>
      </section>

      <section className="animate-fade-up mt-9 overflow-hidden rounded-3xl border border-brand-line bg-brand-soft/70 p-5 sm:mt-10 sm:p-6 [animation-delay:240ms]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-brand">
              {t("results.keepDigging")}
            </p>
            <h2 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink-950 sm:text-[25px]">
              {t("results.nextClaim")}<span className="text-brand-strong">.</span>
            </h2>
            <p className="mt-1.5 text-[12px] leading-5 text-muted">
              {t("results.nextBody")}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-strong px-4 py-2.5 text-[12px] font-semibold text-on-strong shadow-sm transition hover:bg-strong-hover sm:w-auto"
            >
              <ScanSearch className="h-3.5 w-3.5 text-on-strong-accent" strokeWidth={2.2} aria-hidden="true" />
              {t("results.newClaim")}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-[12px] font-medium text-muted shadow-sm transition hover:border-line-strong hover:text-ink-950 sm:w-auto"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-brand-strong" strokeWidth={2.6} aria-hidden="true" />
              ) : (
                <Share2 className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
              )}
              {copied ? t("results.copied") : t("results.shareReceipts")}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
