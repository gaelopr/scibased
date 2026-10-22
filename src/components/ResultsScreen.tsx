import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  Check,
  Info,
  Languages,
  Layers3,
  Lightbulb,
  Quote,
  ScanSearch,
  Share2,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage, verdictLabel } from "../i18n";
import type { ClaimType, VerdictResult } from "../types";
import { verdictTheme } from "../lib/verdictTheme";
import EvidenceOverview from "./EvidenceOverview";
import PaperCard from "./PaperCard";
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
  const label = verdictLabel(t, result.verdict);
  const claimTypeLabels: Record<ClaimType, string> = {
    safety: t("claimType.safety"),
    efficacy: t("claimType.efficacy"),
    causation: t("claimType.causation"),
    association: t("claimType.association"),
    mechanism: t("claimType.mechanism"),
    other: t("claimType.other"),
  };

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleShare() {
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
      <div className="animate-fade-up mb-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="group inline-flex items-center gap-2.5 rounded-full text-[11.5px] font-medium text-slate-400 transition hover:text-white"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.035] transition group-hover:border-white/[0.15] group-hover:bg-white/[0.07]">
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
          </span>
          {t("results.newCheck")}
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.035] px-3.5 py-2 text-[10.5px] font-medium text-slate-300 transition hover:border-white/[0.15] hover:bg-white/[0.065] hover:text-white"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={2.6} aria-hidden="true" />
          ) : (
            <Share2 className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
          )}
          <span aria-live="polite">{copied ? t("results.copied") : t("results.share")}</span>
        </button>
      </div>

      <section className="animate-fade-up mb-5" aria-label={t("results.claimUnder")}>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400">
            <Quote className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {t("results.claimUnder")}
              </p>
              {result.isLive && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  {t("results.live")}
                </span>
              )}
              {result.isSample && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-amber-200">
                  {t("results.sample")}
                </span>
              )}
              {result.claimType && (
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-slate-400">
                  {claimTypeLabels[result.claimType]}
                </span>
              )}
              {result.fromScreenshot && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-slate-400">
                  <Smartphone className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
                  {t("results.fromScreenshot")}
                </span>
              )}
            </div>
            <p className="mt-1.5 font-serif text-[17px] leading-[1.5] text-slate-200 sm:text-[20px]">
              “{result.claim}”
            </p>
          </div>
        </div>

        {result.isSample && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.055] px-3 py-2.5 text-[10.5px] leading-5 text-amber-100/70">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300/80" strokeWidth={2} aria-hidden="true" />
            <p>{t("results.sampleNotice")}</p>
          </div>
        )}

        {language === "es" && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-sky-300/15 bg-sky-300/[0.045] px-3 py-2.5 text-[10.5px] leading-5 text-sky-100/75">
            <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300/80" strokeWidth={2} aria-hidden="true" />
            <p>{t("results.englishNote")}</p>
          </div>
        )}
      </section>

      <VerdictCard result={result} />

      <EvidenceOverview result={result} />

      <section
        className="animate-fade-up mt-4 rounded-[26px] bg-white p-5 text-ink-950 shadow-[0_28px_60px_-32px_rgba(0,0,0,0.85)] sm:mt-5 sm:p-7 [animation-delay:120ms]"
        aria-labelledby="breakdown-heading"
      >
        <div className="flex items-start gap-3.5">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${theme.iconTile}`}>
            <Layers3 className="h-4.5 w-4.5" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="breakdown-heading"
                className="font-serif text-[26px] font-normal leading-none tracking-[-0.02em] sm:text-[30px]"
              >
                {t("results.breakdownTitle")}
              </h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.11em] text-slate-600">
                {t("results.breakdownBadge")}
              </span>
            </div>
            <p className="mt-2 max-w-lg text-[11.5px] leading-5 text-slate-500 sm:text-[12px]">
              {t("results.breakdownBody")}
            </p>
          </div>
        </div>

        <div className={`my-5 rounded-xl border px-4 py-3.5 ${theme.softDivider} ${theme.tint}`}>
          <p
            lang="en"
            className="font-serif text-[16px] italic leading-[1.55] text-slate-700 sm:text-[17px]"
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
                  className="text-[13px] font-semibold leading-5 tracking-[-0.01em] text-ink-950 sm:text-[13.5px]"
                >
                  {item.title}
                </h3>
                <p
                  lang="en"
                  className="mt-1.5 text-[12px] leading-[1.72] text-slate-500 sm:text-[12.5px]"
                >
                  {item.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 p-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-amber-500 shadow-sm ring-1 ring-slate-200/70">
            <Lightbulb className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
          </span>
          <p className="text-[11.5px] leading-[1.7] text-slate-600 sm:text-[12px]">
            <span className="font-semibold text-ink-950">{t("results.worthRemembering")} </span>
            <span lang="en">{result.remember}</span>
          </p>
        </div>
      </section>

      <section
        className="animate-fade-up mt-9 sm:mt-10 [animation-delay:180ms]"
        aria-labelledby="evidence-heading"
      >
        <div className="mb-4 px-1">
          <div className="mb-2 flex items-center gap-2 text-[9.5px] font-semibold uppercase tracking-[0.17em] text-emerald-300/85">
            <BookOpenCheck className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
            {t("results.evidenceEyebrow")}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2
              id="evidence-heading"
              className="font-serif text-[29px] font-normal leading-none tracking-[-0.02em] text-white sm:text-[34px]"
            >
              {t("results.receipts")}<span className="text-slate-400">.</span>
            </h2>
            <span className="mb-0.5 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[9px] font-medium text-slate-400">
              {result.isLive
                ? t("results.papersIncluded", { count: evidenceCount })
                : t("results.sources", { count: result.papers.length })}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-[11.5px] leading-5 text-slate-400">
            {result.isLive
              ? t("results.liveEvidenceBody")
              : t("results.sampleEvidenceBody")}
          </p>
        </div>

        {studies.length > 0 ? (
          <div className="space-y-3.5">
            {studies.map((study, index) => (
              <StudyCard key={study.id} study={study} index={index} />
            ))}
          </div>
        ) : result.papers.length > 0 ? (
          <div className="space-y-3.5">
            {result.papers.map((paper, index) => (
              <PaperCard key={paper.id} paper={paper} index={index} />
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] p-5 text-[12px] leading-[1.7] text-slate-400">
            <p className="font-semibold text-slate-200">{t("results.noReceipts")}</p>
            <p className="mt-1.5">
              {t("results.noReceiptsBody")}
            </p>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 px-1 text-[10px] leading-[1.7] text-slate-400">
          <BookOpenCheck className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" strokeWidth={2} aria-hidden="true" />
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

      <section className="animate-fade-up mt-9 overflow-hidden rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-white/[0.065] to-white/[0.02] p-5 sm:mt-10 sm:p-6 [animation-delay:240ms]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-sm">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300/85">
              {t("results.keepDigging")}
            </p>
            <h2 className="mt-1.5 font-serif text-[24px] font-normal leading-tight tracking-[-0.02em] text-white">
              {t("results.nextClaim")}<span className="text-slate-400">.</span>
            </h2>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
              {t("results.nextBody")}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[11.5px] font-semibold text-ink-950 transition hover:bg-emerald-50"
            >
              <ScanSearch className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              {t("results.newClaim")}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2.5 text-[11.5px] font-medium text-slate-300 transition hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-300" strokeWidth={2.6} aria-hidden="true" />
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
