import {
  ArrowLeft,
  ArrowUpRight,
  BookOpenCheck,
  Check,
  Info,
  Layers3,
  Lightbulb,
  Quote,
  ScanSearch,
  Share2,
  Smartphone,
} from "lucide-react";
import { useEffect, useState } from "react";
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

const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  safety: "Safety claim",
  efficacy: "Efficacy claim",
  causation: "Causal claim",
  association: "Association claim",
  mechanism: "Mechanism claim",
  other: "Health claim",
};

export default function ResultsScreen({ result, onReset }: ResultsScreenProps) {
  const theme = verdictTheme[result.verdict];
  const [copied, setCopied] = useState(false);
  const studies = result.studies ?? [];
  const evidenceCount = studies.length || result.papers.length;

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function handleShare() {
    const text = `${result.label}: ${result.claim}\n\n${result.conclusion}`;

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: `SciBased verdict: ${result.label}`,
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
          New check
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
          <span aria-live="polite">{copied ? "Copied" : "Share"}</span>
        </button>
      </div>

      <section className="animate-fade-up mb-5" aria-label="Claim under review">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400">
            <Quote className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Claim under review
              </p>
              {result.isLive && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/[0.07] px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                  Live evidence scan
                </span>
              )}
              {result.isSample && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/20 bg-amber-300/[0.07] px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-amber-200">
                  Sample
                </span>
              )}
              {result.claimType && (
                <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-slate-400">
                  {CLAIM_TYPE_LABELS[result.claimType]}
                </span>
              )}
              {result.fromScreenshot && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-0.5 text-[8.5px] font-medium uppercase tracking-[0.1em] text-slate-400">
                  <Smartphone className="h-2.5 w-2.5" strokeWidth={2} aria-hidden="true" />
                  From screenshot
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
            <p>
              This is a preloaded sample verdict, not a live evidence scan. Use the claim box on the
              home screen to run a live search against PubMed, OpenAlex, and open-access full text.
            </p>
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
                The Breakdown
              </h2>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[8.5px] font-semibold uppercase tracking-[0.11em] text-slate-600">
                Plain English
              </span>
            </div>
            <p className="mt-2 max-w-lg text-[11.5px] leading-5 text-slate-500 sm:text-[12px]">
              What the research actually shows — and where the viral version stretches it.
            </p>
          </div>
        </div>

        <div className={`my-5 rounded-xl border px-4 py-3.5 ${theme.softDivider} ${theme.tint}`}>
          <p className="font-serif text-[16px] italic leading-[1.55] text-slate-700 sm:text-[17px]">
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
                <h3 className="text-[13px] font-semibold leading-5 tracking-[-0.01em] text-ink-950 sm:text-[13.5px]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-[12px] leading-[1.72] text-slate-500 sm:text-[12.5px]">
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
            <span className="font-semibold text-ink-950">Worth remembering: </span>
            {result.remember}
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
            Scientific evidence &amp; papers
          </div>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2
              id="evidence-heading"
              className="font-serif text-[29px] font-normal leading-none tracking-[-0.02em] text-white sm:text-[34px]"
            >
              The receipts<span className="text-slate-400">.</span>
            </h2>
            <span className="mb-0.5 rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-[9px] font-medium text-slate-400">
              {evidenceCount} {result.isLive ? "papers included" : "peer-reviewed sources"}
            </span>
          </div>
          <p className="mt-2 max-w-2xl text-[11.5px] leading-5 text-slate-400">
            {result.isLive
              ? "Each card shows the study design, sample, key result, methods, and limitations. Where the full text was legally open, the quoted passages come from the paper itself — not just the abstract's conclusion."
              : "Original research and systematic reviews, linked directly to their PubMed records."}
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
            <p className="font-semibold text-slate-200">No receipts yet.</p>
            <p className="mt-1.5">
              That doesn’t mean the claim is false. It means the search needs a more concrete claim —
              name the exposure, population, and outcome. For example: “Does creatine affect kidney
              function in healthy adults?” Then run it again.
            </p>
          </div>
        )}

        <div className="mt-4 flex items-start gap-2 px-1 text-[10px] leading-[1.7] text-slate-400">
          <BookOpenCheck className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" strokeWidth={2} aria-hidden="true" />
          <p>
            {result.isLive
              ? `Full text was read for ${result.coverage?.fullTextsRead ?? 0} of ${studies.length} included studies. The remaining papers were assessed from their abstracts only. No unauthorized full-text source was used.`
              : "Sample evidence set. Study details are taken from the indexed abstracts."}
          </p>
        </div>
      </section>

      <section className="animate-fade-up mt-9 overflow-hidden rounded-[24px] border border-white/[0.08] bg-gradient-to-br from-white/[0.065] to-white/[0.02] p-5 sm:mt-10 sm:p-6 [animation-delay:240ms]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-sm">
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-300/85">
              Keep digging
            </p>
            <h2 className="mt-1.5 font-serif text-[24px] font-normal leading-tight tracking-[-0.02em] text-white">
              Check the next claim<span className="text-slate-400">.</span>
            </h2>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
              Screenshot, quote, or a late-night health tip — get the evidence before you share.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[11.5px] font-semibold text-ink-950 transition hover:bg-emerald-50"
            >
              <ScanSearch className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />
              New claim
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
              {copied ? "Copied" : "Share the receipts"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
