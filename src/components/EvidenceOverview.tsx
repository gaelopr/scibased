import {
  CalendarDays,
  ChevronDown,
  Database,
  FileCheck2,
  Info,
  Scale,
  Search,
  ShieldCheck,
  Target,
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
  const direct = studies.filter((study) => study.directness === "direct").length;
  const total = Math.max(1, supports + contradicts + mixed + unclear);

  const certainty = result.certainty ?? "Very low";
  const certaintyTone =
    certainty === "High"
      ? "text-brand"
      : certainty === "Moderate"
        ? "text-brand-strong"
        : certainty === "Low"
          ? "text-caution-text"
          : "text-debunked-text";

  return (
    <section
      className="animate-fade-up mt-4 rounded-3xl border border-line bg-surface p-5 shadow-card sm:mt-5 sm:p-6"
      aria-labelledby="evidence-overview-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-brand">
            <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
            {t("evidenceCheck.eyebrow")}
          </div>
          <h2
            id="evidence-overview-heading"
            className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-ink-950 sm:text-[26px]"
          >
            {t("evidenceCheck.title")}<span className="text-decor">.</span>
          </h2>
        </div>
        <span className="rounded-full border border-line bg-surface-muted px-3 py-1.5 text-[10px] font-medium text-subtle">
          {coverage.databases.join(" + ") || t("evidenceCheck.databasesFallback")}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
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
          icon={Target}
          label={t("evidenceCheck.directTests")}
          value={`${direct}/${studies.length}`}
          detail={t("evidenceCheck.directTestsDetail")}
        />
      </div>

      <div className="mt-3 rounded-2xl border border-line bg-surface-muted p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
            {t("evidenceCheck.whichWay")}
          </p>
          <p className="text-[10px] tabular-nums text-faint">
            {t("evidenceCheck.classified", {
              count: supports + contradicts + mixed + unclear,
            })}
          </p>
        </div>
        <div
          className="mt-2.5 flex h-2 overflow-hidden rounded-full bg-chip-strong/70"
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
              className="h-full bg-verified"
              style={{ width: `${(supports / total) * 100}%` }}
            />
          )}
          {mixed > 0 && (
            <span
              className="h-full bg-caution"
              style={{ width: `${(mixed / total) * 100}%` }}
            />
          )}
          {contradicts > 0 && (
            <span
              className="h-full bg-debunked"
              style={{ width: `${(contradicts / total) * 100}%` }}
            />
          )}
          {unclear > 0 && (
            <span
              className="h-full bg-faint"
              style={{ width: `${(unclear / total) * 100}%` }}
            />
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-subtle">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-verified" aria-hidden="true" />
            {t("evidenceCheck.supports", { count: supports })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-caution" aria-hidden="true" />
            {t("evidenceCheck.mixed")} {mixed}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-debunked" aria-hidden="true" />
            {t("evidenceCheck.contradicts", { count: contradicts })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-faint" aria-hidden="true" />
            {t("evidenceCheck.unclear", { count: unclear })}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-2xl border border-line bg-surface px-3.5 py-3 text-[11px] leading-[1.65] text-subtle">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-faint" strokeWidth={2} aria-hidden="true" />
        <p>
          <span className="font-semibold text-ink-700">{t("evidenceCheck.scopeLabel")}</span>{" "}
          {t("evidenceCheck.scopeBody")}
        </p>
      </div>

      <details className="group mt-3 rounded-2xl border border-line bg-surface">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[11.5px] font-semibold text-ink-700 focus-visible:outline-offset-2">
          <span className="inline-flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-faint" strokeWidth={2.1} aria-hidden="true" />
            {t("evidenceCheck.details")}
          </span>
          <ChevronDown
            className="h-4 w-4 shrink-0 text-faint transition-transform group-open:rotate-180"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </summary>

        <div className="space-y-4 border-t border-line px-4 py-4">
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
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
              {t("evidenceCheck.querySent")}
            </p>
            <code
              lang="en"
              className="mt-1.5 block break-words rounded-lg border border-line bg-surface-muted px-3 py-2.5 font-mono text-[10px] leading-[1.65] text-muted"
            >
              {coverage.query}
            </code>
            {coverage.translatedFrom === "Spanish" && (
              <p className="mt-1.5 text-[10.5px] leading-4 text-subtle">
                {t("evidenceCheck.translatedNote")}
              </p>
            )}
            {coverage.searchFocus === "nutrition-fitness" && (
              <p className="mt-1.5 text-[10.5px] leading-4 text-brand">
                {t("evidenceCheck.nicheFocus")}
              </p>
            )}
          </div>

          {coverage.redirect && (
            <div className="rounded-xl border border-caution-line bg-caution-soft/60 px-3.5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-caution-text">
                {t("evidenceCheck.redirect")}
              </p>
              <p lang="en" className="mt-1.5 text-[11px] leading-[1.7] text-muted">
                {coverage.redirect.explanation}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
                {t("evidenceCheck.redirectQuery")}
              </p>
              <code
                lang="en"
                className="mt-1.5 block break-words rounded-lg border border-line bg-surface px-3 py-2.5 font-mono text-[10px] leading-[1.65] text-muted"
              >
                {coverage.redirect.query}
              </code>
              <p className="mt-2 text-[10.5px] leading-4 text-caution-text">
                {coverage.redirect.relatedStudiesFound > 0
                  ? t("evidenceCheck.redirectCount", {
                      count: coverage.redirect.relatedStudiesFound,
                    })
                  : t("results.redirectNone")}
              </p>
            </div>
          )}

          {result.methodology && result.methodology.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                {t("evidenceCheck.methodology")}
              </p>
              <ol className="mt-2 space-y-2">
                {result.methodology.map((item, index) => (
                  <li key={item} className="flex gap-2.5 text-[11px] leading-[1.7] text-subtle">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-chip text-[8px] font-semibold tabular-nums text-muted">
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
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                {t("evidenceCheck.scoreCalculation")}
              </p>
              <p lang="en" className="mt-1.5 text-[11px] leading-[1.7] text-subtle">
                {result.rationale}
              </p>
            </div>
          )}

          {result.limitations && result.limitations.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
                {t("evidenceCheck.limitations")}
              </p>
              <ul className="mt-2 space-y-1.5">
                {result.limitations.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-[11px] leading-[1.65] text-subtle"
                  >
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden="true" />
                    <span lang="en">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {language === "es" && (
            <p className="text-[10.5px] leading-4 text-subtle">
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
  valueClassName = "text-ink-950",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  detailLang?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface-muted px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
        <Icon className="h-3 w-3" strokeWidth={2.1} aria-hidden="true" />
        {label}
      </p>
      <p className={`mt-1.5 text-[19px] font-semibold leading-none tracking-[-0.03em] ${valueClassName}`}>
        {value}
      </p>
      <p lang={detailLang} className="mt-1.5 text-[11px] leading-[1.5] text-subtle">{detail}</p>
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
    <div className="rounded-xl border border-line bg-surface-muted px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
        <Icon className="h-3 w-3" strokeWidth={2.1} aria-hidden="true" />
        {label}
      </p>
      <p className="mt-1 text-[12px] font-medium text-ink-700">{value}</p>
    </div>
  );
}
