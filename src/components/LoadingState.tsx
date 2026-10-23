import {
  Check,
  Database,
  LoaderCircle,
  Quote,
  ScanLine,
  ScanSearch,
  Search,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../i18n";
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
  const { t } = useLanguage();
  const percent = progress?.percent ?? 0;
  const steps = [
    {
      label: fromScreenshot ? t("loading.stepScreenshot") : t("loading.stepParse"),
      icon: ScanLine,
      matches: ["ocr", "query"] as AnalysisStep[],
    },
    {
      label: t("loading.stepSearch"),
      icon: Search,
      matches: ["search"] as AnalysisStep[],
    },
    {
      label: t("loading.stepRead"),
      icon: Database,
      matches: ["abstracts", "screen", "fulltext"] as AnalysisStep[],
    },
    {
      label: t("loading.stepWeigh"),
      icon: Sparkles,
      matches: ["synthesize", "done"] as AnalysisStep[],
    },
  ];

  const currentStep = progress?.step ?? (fromScreenshot ? "ocr" : "query");
  const activeStep = steps.findIndex((step) =>
    step.matches.includes(currentStep),
  );
  const done = currentStep === "done";
  const message = progress?.message ?? t("loading.defaultMessage");

  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-4 pt-7 sm:px-6 sm:pt-10">
      <div className="animate-fade-up mb-4 flex items-start gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chip text-subtle">
          <Quote className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
            {t("loading.claimUnder")}
          </p>
          <p className="mt-1 line-clamp-2 font-serif text-[16px] leading-6 text-ink-700 sm:text-[17px]">
            “{claimText}”
          </p>
        </div>
      </div>

      <section className="animate-scale-in overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-lift sm:p-7">
        <div className="flex items-start gap-4">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand ring-1 ring-brand-line">
            <ScanSearch className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.03em] text-ink-950 sm:text-[28px]">
                {t("loading.heading")}
              </h1>
              <span className="rounded-full border border-line bg-surface-muted px-2.5 py-1 text-[10px] font-medium tabular-nums text-subtle">
                {percent}%
              </span>
            </div>
            <p
              className="mt-1.5 max-w-lg text-[12.5px] leading-5 text-subtle"
              aria-live="polite"
            >
              {message}
            </p>
          </div>
        </div>

        <div
          className="mt-5 h-2 overflow-hidden rounded-full bg-chip"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={t("loading.progressAria")}
        >
          <div
            className="h-full rounded-full bg-brand-strong transition-[width] duration-300 ease-out"
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
                className={`flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[11.5px] transition duration-200 ${
                  isDone
                    ? "border-brand-line bg-brand-soft/70 text-muted"
                    : isActive
                      ? "border-line bg-surface text-ink-950 shadow-sm"
                      : "border-transparent bg-transparent text-faint"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    isDone
                      ? "bg-brand-line text-brand"
                      : isActive
                        ? "bg-chip text-brand"
                        : "bg-chip text-faint"
                  }`}
                >
                  {isDone ? (
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                  ) : isActive ? (
                    <LoaderCircle className="h-3 w-3 animate-spin" strokeWidth={2.4} aria-hidden="true" />
                  ) : (
                    <StepIcon className="h-3 w-3" strokeWidth={2} aria-hidden="true" />
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <StepIcon
                    className={`h-3 w-3 ${isActive ? "text-brand" : "text-faint"}`}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-5 border-t border-line pt-4 text-center text-[10.5px] leading-5 text-subtle">
          {t("loading.note")}
        </p>
      </section>
    </main>
  );
}
