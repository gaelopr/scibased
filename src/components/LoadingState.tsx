import {
  Check,
  Circle,
  Database,
  LoaderCircle,
  Quote,
  ScanLine,
  ScanSearch,
  Search,
  Sparkles,
} from "lucide-react";
import type { AnalysisProgress, AnalysisStep } from "../types";

interface LoadingStateProps {
  claimText: string;
  fromScreenshot: boolean;
  progress: AnalysisProgress | null;
}

export default function LoadingState({
  claimText,
  fromScreenshot,
  progress,
}: LoadingStateProps) {
  const percent = progress?.percent ?? 0;
  const steps = [
    {
      label: fromScreenshot ? "Reading your screenshot" : "Parsing the claim",
      icon: ScanLine,
      matches: ["ocr", "query"] as AnalysisStep[],
    },
    {
      label: "Searching PubMed + OpenAlex",
      icon: Search,
      matches: ["search"] as AnalysisStep[],
    },
    {
      label: "Reading the papers",
      icon: Database,
      matches: ["abstracts", "screen", "fulltext"] as AnalysisStep[],
    },
    {
      label: "Weighing the evidence",
      icon: Sparkles,
      matches: ["synthesize", "done"] as AnalysisStep[],
    },
  ];

  const currentStep = progress?.step ?? (fromScreenshot ? "ocr" : "query");
  const activeStep = steps.findIndex((step) =>
    step.matches.includes(currentStep),
  );
  const done = currentStep === "done";
  const message =
    progress?.message ??
    "Preparing the search and checking which full texts are legally open access.";

  return (
    <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-4 pt-7 sm:px-6 sm:pt-10">
      <div className="animate-fade-up mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400">
          <Quote className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Claim under review
          </p>
          <p className="mt-1 line-clamp-2 font-serif text-[16px] leading-6 text-slate-300 sm:text-[17px]">
            “{claimText}”
          </p>
        </div>
      </div>

      <section className="animate-scale-in overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.045] shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-4">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.09] text-emerald-300">
              <ScanSearch className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-emerald-300/10" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="font-serif text-[28px] font-normal leading-none tracking-[-0.02em] text-white sm:text-[32px]">
                  Reading the evidence<span className="text-emerald-300">.</span>
                </h1>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-medium tabular-nums text-slate-400">
                  {percent}%
                </span>
              </div>
              <p
                className="mt-2 max-w-lg text-[12px] leading-5 text-slate-400 sm:text-[12.5px]"
                aria-live="polite"
              >
                {message}
              </p>
            </div>
          </div>

          <div
            className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-label="Evidence analysis progress"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-300 shadow-[0_0_14px_rgba(52,211,153,0.5)] transition-[width] duration-300 ease-out"
              style={{ width: `${Math.max(3, percent)}%` }}
            />
          </div>

          <ol className="mt-5 grid gap-2 sm:grid-cols-2">
            {steps.map((step, index) => {
              const isDone = done || index < activeStep;
              const isActive = !done && index === activeStep;
              const StepIcon = step.icon;

              return (
                <li
                  key={step.label}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[10.5px] transition duration-300 ${
                    isDone
                      ? "border-emerald-400/10 bg-emerald-400/[0.04] text-slate-400"
                      : isActive
                        ? "border-white/[0.09] bg-white/[0.05] text-slate-200"
                        : "border-transparent bg-transparent text-slate-400"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      isDone
                        ? "bg-emerald-400/15 text-emerald-300"
                        : isActive
                          ? "bg-white/10 text-emerald-300"
                          : "bg-white/[0.035] text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                    ) : isActive ? (
                      <LoaderCircle className="h-3 w-3 animate-spin" strokeWidth={2.4} aria-hidden="true" />
                    ) : (
                      <Circle className="h-2 w-2" strokeWidth={2} aria-hidden="true" />
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <StepIcon
                      className={`h-3 w-3 ${isActive ? "text-emerald-300/80" : "text-slate-400"}`}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <div className="mt-4 space-y-4" aria-hidden="true">
        <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.028] p-5">
          <div className="flex items-center gap-3">
            <div className="skeleton h-9 w-9 !rounded-xl" />
            <div className="space-y-2">
              <div className="skeleton h-2.5 w-28" />
              <div className="skeleton h-2 w-44" />
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {[86, 72, 91, 64].map((width) => (
              <div key={width} className="flex items-start gap-3">
                <div className="skeleton h-6 w-6 shrink-0 !rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-2.5" style={{ width: `${width - 25}%` }} />
                  <div className="skeleton h-2" style={{ width: `${width}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[22px] border border-white/[0.07] bg-white/[0.028] p-5">
          <div className="flex items-center justify-between">
            <div className="skeleton h-2.5 w-32" />
            <div className="skeleton h-2.5 w-20" />
          </div>
          <div className="mt-5 space-y-3">
            {[1, 2].map((item) => (
              <div key={item} className="rounded-xl border border-white/[0.055] p-4">
                <div className="skeleton h-2.5 w-3/4" />
                <div className="mt-2.5 skeleton h-2 w-1/2" />
                <div className="mt-4 skeleton h-2 w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-[10px] text-slate-400">
        Checking the papers, not just the headline. This can take 10–30 seconds.
      </p>
    </main>
  );
}
