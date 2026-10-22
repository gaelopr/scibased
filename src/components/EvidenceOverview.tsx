import {
  CalendarDays,
  ChevronDown,
  Database,
  FileCheck2,
  Info,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { certaintyLabel, useLanguage } from "../i18n";
import type { VerdictResult } from "../types";

interface EvidenceOverviewProps {
  result: VerdictResult;
}

export default function EvidenceOverview({ result }: EvidenceOverviewProps) {
  const { t, language } = useLanguage();
  if (!result.isLive || !result.coverage) return null;

  const studies = result.studies ?? [];
  const coverage = result.coverage;
  const supports = studies.filter((study) => study.direction === "supports").length;
  const contradicts = studies.filter((study) => study.direction === "contradicts").length;
  const mixed = studies.filter((study) => study.direction === "mixed").length;
  const unclear = studies.filter((study) => study.direction === "unclear").length;
  const total = Math.max(1, supports + contradicts + mixed + unclear);

  const certainty = result.certainty ?? "Very low";
  const certaintyTone =
    certainty === "High"
      ? "text-emerald-300"
      : certainty === "Moderate"
        ? "text-teal-300"
        : certainty === "Low"
          ? "text-amber-300"
          : "text-rose-300";

  return (
    <section
      className="animate-fade-up mt-4 rounded-[26px] border border-white/[0.09] bg-white/[0.035] p-5 sm:mt-5 sm:p-6"
      aria-labelledby="evidence-overview-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.17em] text-emerald-300/90">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
            {t("evidenceCheck.eyebrow")}
          </div>
          <h2
            id="evidence-overview-heading"
            className="mt-1.5 font-serif text-[24px] font-normal leading-none tracking-[-0.02em] text-white sm:text-[28px]"
          >
            {t("evidenceCheck.title")}<span className="text-slate-400">.</span>
          </h2>
        </div>
        <span className="rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[9px] font-medium text-slate-300">
          {coverage.databases.join(" + ") || t("evidenceCheck.databasesFallback")}
        </span>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Database}
          label={t("evidenceCheck.papersIncluded")}
          value={String(studies.length)}
          detail={t("evidenceCheck.abstractsScreened", {
            count: coverage.recordsScreened,
          })}
        />
        <Stat
          icon={FileCheck2}
          label={t("evidenceCheck.fullPapersRead")}
          value={`${coverage.fullTextsRead}`}
          detail={t("evidenceCheck.openAccessLinks", {
            count: coverage.openAccessAvailable,
          })}
        />
        <Stat
          icon={Scale}
          label={t("evidenceCheck.howSure")}
          value={certaintyLabel(t, certainty)}
          detail={
            result.certaintyRationale ??
            t("evidenceCheck.automatedAssessment")
          }
          detailLang={result.certaintyRationale ? "en" : undefined}
          valueClassName={certaintyTone}
        />
        <Stat
          icon={Sparkles}
          label={t("evidenceCheck.whatFound")}
          value={`${supports} / ${mixed} / ${contradicts}`}
          detail={`${supports} ${t("evidenceCheck.supporting")} · ${mixed} ${t("evidenceCheck.mixed")} · ${contradicts} ${t("evidenceCheck.contradicting")}`}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-white/[0.075] bg-ink-950/35 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {t("evidenceCheck.whichWay")}
          </p>
          <p className="text-[9px] tabular-nums text-slate-400">
            {t("evidenceCheck.classified", {
              count: supports + contradicts + mixed + unclear,
            })}
          </p>
        </div>
        <div
          className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-white/[0.06]"
          role="img"
          aria-label={t("evidenceCheck.chartAria", {
            supports,
            contradicts,
            mixed,
            unclear,
          })}
        >
          {supports > 0 && (
            <span
              className="h-full bg-emerald-400"
              style={{ width: `${(supports / total) * 100}%` }}
            />
          )}
          {mixed > 0 && (
            <span
              className="h-full bg-amber-400"
              style={{ width: `${(mixed / total) * 100}%` }}
            />
          )}
          {contradicts > 0 && (
            <span
              className="h-full bg-red-400"
              style={{ width: `${(contradicts / total) * 100}%` }}
            />
          )}
          {unclear > 0 && (
            <span
              className="h-full bg-slate-500"
              style={{ width: `${(unclear / total) * 100}%` }}
            />
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[9.5px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
            {t("evidenceCheck.supports", { count: supports })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
            {t("evidenceCheck.mixed")} {mixed}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" aria-hidden="true" />
            {t("evidenceCheck.contradicts", { count: contradicts })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" aria-hidden="true" />
            {t("evidenceCheck.unclear", { count: unclear })}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-sky-300/10 bg-sky-300/[0.045] px-3.5 py-3 text-[10.5px] leading-[1.65] text-sky-100/70">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300/80" strokeWidth={2} aria-hidden="true" />
        <p>
          <span className="font-semibold text-sky-100/90">{t("evidenceCheck.scopeLabel")}</span>{" "}
          {t("evidenceCheck.scopeBody")}
        </p>
      </div>

      <details className="group mt-3 rounded-2xl border border-white/[0.075] bg-white/[0.02]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[11px] font-semibold text-slate-200 focus-visible:outline-offset-2">
          <span className="inline-flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.1} aria-hidden="true" />
            {t("evidenceCheck.details")}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </summary>

        <div className="space-y-4 border-t border-white/[0.07] px-4 py-4">
          <div className="grid gap-2.5 sm:grid-cols-3">
            <CoverageItem
              icon={CalendarDays}
              label={t("evidenceCheck.searchDate")}
              value={new Date(coverage.searchedAt).toLocaleDateString(
                language === "es" ? "es" : "en",
              )}
            />
            <CoverageItem
              icon={Search}
              label={t("evidenceCheck.recordsFound")}
              value={coverage.recordsFound.toLocaleString(language === "es" ? "es" : "en")}
            />
            <CoverageItem
              icon={Database}
              label={t("evidenceCheck.publicationYears")}
              value={
                coverage.dateRange === "No dated studies"
                  ? t("evidenceCheck.noDatedStudies")
                  : coverage.dateRange
              }
            />
          </div>

          <div>
            <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
              {t("evidenceCheck.querySent")}
            </p>
            <code
              lang="en"
              className="mt-1.5 block break-words rounded-lg border border-white/[0.06] bg-black/25 px-3 py-2.5 font-mono text-[9.5px] leading-[1.65] text-slate-300"
            >
              {coverage.query}
            </code>
            {coverage.translatedFrom === "Spanish" && (
              <p className="mt-1.5 text-[9.5px] leading-4 text-slate-400">
                {t("evidenceCheck.translatedNote")}
              </p>
            )}
          </div>

          {result.methodology && result.methodology.length > 0 && (
            <div>
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("evidenceCheck.methodology")}
              </p>
              <ol className="mt-2 space-y-2">
                {result.methodology.map((item, index) => (
                  <li key={item} className="flex gap-2.5 text-[10.5px] leading-[1.7] text-slate-400">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[8px] font-semibold tabular-nums text-slate-300">
                      {index + 1}
                    </span>
                    <span lang="en">{item}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {result.rationale && (
            <div>
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("evidenceCheck.scoreCalculation")}
              </p>
              <p lang="en" className="mt-1.5 text-[10.5px] leading-[1.7] text-slate-400">
                {result.rationale}
              </p>
            </div>
          )}

          {result.limitations && result.limitations.length > 0 && (
            <div>
              <p className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                {t("evidenceCheck.limitations")}
              </p>
              <ul className="mt-2 space-y-1.5">
                {result.limitations.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[10.5px] leading-[1.65] text-slate-400"
                  >
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-500" aria-hidden="true" />
                    <span lang="en">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {language === "es" && (
            <p className="text-[9.5px] leading-4 text-slate-500">
              {t("evidenceCheck.englishNote")}
            </p>
          )}
        </div>
      </details>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  detail,
  detailLang,
  valueClassName = "text-white",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  detailLang?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.075] bg-white/[0.03] px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-slate-400">
        <Icon className="h-3 w-3" strokeWidth={2.1} aria-hidden="true" />
        {label}
      </p>
      <p className={`mt-1.5 text-[19px] font-semibold leading-none tracking-[-0.03em] ${valueClassName}`}>
        {value}
      </p>
      <p lang={detailLang} className="mt-1.5 text-[9.5px] leading-[1.55] text-slate-400">{detail}</p>
    </div>
  );
}

function CoverageItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.11em] text-slate-400">
        <Icon className="h-3 w-3" strokeWidth={2.1} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-[11px] font-medium text-slate-200">{value}</p>
    </div>
  );
}
