import {
  ArrowUpRight,
  BookMarked,
  ChevronDown,
  FileCheck2,
  FileText,
  FlaskConical,
  Microscope,
  Quote,
  Route,
  ShieldAlert,
  Target,
  Unlock,
  Users,
} from "lucide-react";
import { certaintyLabel, useLanguage } from "../i18n";
import type { Study, StudyAccess, StudyDirection } from "../types";
import { safeExternalUrl } from "../lib/evidence/utils";

interface StudyCardProps {
  study: Study;
  index: number;
}

const DIRECTION_STYLES: Record<StudyDirection, { className: string }> = {
  supports: {
    className: "bg-brand-soft text-brand-deep ring-brand-line",
  },
  contradicts: {
    className: "bg-debunked-soft text-debunked-text ring-debunked-line",
  },
  mixed: {
    className: "bg-caution-soft text-caution-text ring-caution-line",
  },
  unclear: {
    className: "bg-chip text-muted ring-line",
  },
};

const ACCESS_STYLES: Record<
  StudyAccess,
  { className: string; icon: typeof FileText }
> = {
  "full-text": {
    className: "bg-brand-soft text-brand ring-brand-line",
    icon: FileCheck2,
  },
  "open-access-link": {
    className: "bg-chip text-muted ring-line",
    icon: Unlock,
  },
  "abstract-only": {
    className: "bg-chip text-muted ring-line",
    icon: FileText,
  },
};

export default function StudyCard({ study, index }: StudyCardProps) {
  const { t } = useLanguage();
  const direction = DIRECTION_STYLES[study.direction];
  const access = ACCESS_STYLES[study.access];
  const AccessIcon = access.icon;
  const directionLabels: Record<StudyDirection, string> = {
    supports: t("study.supports"),
    contradicts: t("study.contradicts"),
    mixed: t("study.mixed"),
    unclear: t("study.unclear"),
  };
  const accessLabels: Record<StudyAccess, string> = {
    "full-text": t("study.fullTextRead"),
    "open-access-link": t("study.openAccess"),
    "abstract-only": t("study.abstractOnly"),
  };
  const directnessLabels = {
    direct: t("study.direct"),
    partial: t("study.partial"),
    indirect: t("study.indirect"),
  } as const;

  const links = [
    study.pmid
      ? {
          label: t("study.pubmed"),
          href: `https://pubmed.ncbi.nlm.nih.gov/${study.pmid}/`,
        }
      : null,
    study.openAccessUrl
      ? {
          label: study.fullTextRead
            ? t("study.openFull")
            : t("study.openAccessLink"),
          href: study.openAccessUrl,
        }
      : null,
    study.doi
      ? {
          label: t("study.publisher"),
          href: `https://doi.org/${study.doi}`,
        }
      : null,
    {
      label: t("study.scholar"),
      href: `https://scholar.google.com/scholar?q=${encodeURIComponent(study.title)}`,
    },
  ].flatMap((link) => {
    if (!link) return [];
    const href = safeExternalUrl(link.href);
    return href ? [{ label: link.label, href }] : [];
  });

  return (
    <article
      id={`study-source-${index}`}
      className="group animate-fade-up scroll-mt-24 rounded-2xl border border-line bg-surface p-5 shadow-card transition duration-200 target:border-brand-line target:ring-2 target:ring-brand-line hover:border-line-strong sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
            {t("study.study")} {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] ring-1 ${direction.className}`}
          >
            {directionLabels[study.direction]}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-faint">
          <BookMarked className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
          {study.source}
        </span>
      </div>

      <h3
        lang="en"
        className="mt-3 max-w-[64ch] text-[16px] font-semibold leading-[1.45] tracking-[-0.015em] text-ink-950"
      >
        {study.title}
      </h3>

      <p className="mt-1.5 text-[11.5px] font-medium leading-5 text-subtle">
        {study.authors}
      </p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] leading-5 text-subtle">
        <span className="italic">{study.journal}</span>
        <span aria-hidden="true">·</span>
        <span>{study.year}</span>
        {study.pmid && (
          <>
            <span aria-hidden="true">·</span>
            <span>PMID {study.pmid}</span>
          </>
        )}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span
          lang="en"
          className="rounded-md bg-chip px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.07em] text-muted"
        >
          {study.designLabel}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium ring-1 ${access.className}`}
        >
          <AccessIcon className="h-2.5 w-2.5" strokeWidth={2.3} aria-hidden="true" />
          {accessLabels[study.access]}
        </span>
        {study.redirectedOutcome && (
          <span className="inline-flex items-center gap-1 rounded-md bg-caution-soft px-2 py-1 text-[10px] font-medium text-caution-text ring-1 ring-caution-line">
            <Route className="h-2.5 w-2.5" strokeWidth={2.3} aria-hidden="true" />
            {t("study.relatedOutcome")}: {study.redirectedOutcome}
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-line bg-surface-muted px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
          <Quote className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
          {t("study.whatFound")}
        </p>
        <p lang="en" className="mt-1.5 font-serif text-[15px] leading-7 text-ink-800">
          “{study.finding}”
        </p>
        <p lang="en" className="mt-1.5 text-[11px] leading-[1.65] text-subtle">
          {study.directionRationale}
        </p>
        {study.redirectNote && (
          <p lang="en" className="mt-1.5 rounded-lg bg-caution-soft/70 px-2.5 py-2 text-[10.5px] leading-[1.6] text-caution-text">
            {study.redirectNote}
          </p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-line px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-subtle">
            <Users className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
            {t("study.sample")}
          </p>
          <p className="mt-1 text-[12px] font-medium leading-4 text-ink-700">
            {study.sampleSize
              ? `n = ${study.sampleSize.toLocaleString()}`
              : t("study.notReported")}
          </p>
        </div>
        <div className="rounded-xl border border-line px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-subtle">
            <Target className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
            {t("study.directness")}
          </p>
          <p className="mt-1 text-[12px] font-medium leading-4 text-ink-700">
            {directnessLabels[study.directness]}
          </p>
        </div>
        <div className="rounded-xl border border-line px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-subtle">
            <Microscope className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
            {t("study.certainty")}
          </p>
          <p className="mt-1 text-[12px] font-medium leading-4 text-ink-700">
            {certaintyLabel(t, study.certainty)}
          </p>
        </div>
      </div>

      {study.population && (
        <p className="mt-2.5 text-[10.5px] leading-5 text-subtle">
          <span className="font-semibold text-muted">{t("study.population")}</span>{" "}
          <span lang="en">{study.population}</span>
        </p>
      )}

      <details className="group/method mt-3 rounded-xl border border-line bg-surface">
        <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-[11.5px] font-semibold text-muted focus-visible:outline-offset-2">
          <span className="inline-flex items-center gap-1.5">
            <FlaskConical className="h-3.5 w-3.5 text-faint" strokeWidth={2.1} aria-hidden="true" />
            {t("study.methodsAndLimits")}
          </span>
          <ChevronDown
            className="h-3.5 w-3.5 shrink-0 text-faint transition-transform group-open/method:rotate-180"
            strokeWidth={2.2}
            aria-hidden="true"
          />
        </summary>
        <div className="grid gap-3 border-t border-line px-3.5 py-3 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-subtle">
              <Microscope className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
              {t("study.howTested")}
            </p>
            <p lang="en" className="mt-1.5 text-[11px] leading-[1.65] text-muted">
              {study.methods}
            </p>
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-subtle">
              <ShieldAlert className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
              {t("study.limitations")}
            </p>
            <p lang="en" className="mt-1.5 text-[11px] leading-[1.65] text-muted">
              {study.limitations}
            </p>
            <p lang="en" className="mt-1.5 text-[10px] leading-[1.55] text-subtle">
              {study.riskOfBias}
            </p>
          </div>
        </div>
      </details>

      {study.excerpts.length > 1 && (
        <details className="group/excerpts mt-2.5 rounded-xl border border-line bg-surface-muted">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-[11px] font-semibold text-muted focus-visible:outline-offset-2">
            <span>{t("study.moreEvidence", { count: study.excerpts.length })}</span>
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 text-faint transition-transform group-open/excerpts:rotate-180"
              strokeWidth={2.2}
              aria-hidden="true"
            />
          </summary>
          <div className="space-y-2.5 border-t border-line px-3.5 py-3">
            {study.excerpts.map((excerpt, excerptIndex) => (
              <div key={`${excerpt.section}-${excerptIndex}`}>
                <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-subtle">
                  {excerpt.section}
                </p>
                <p lang="en" className="mt-1 text-[11px] leading-[1.65] text-muted">
                  “{excerpt.text}”
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        {links.map((link, linkIndex) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={
              linkIndex === 0
                ? "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-strong px-4 py-2.5 text-[11.5px] font-semibold text-on-strong transition hover:bg-strong-hover focus-visible:outline-offset-2"
                : "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[11.5px] font-medium text-muted transition hover:border-line-strong hover:bg-surface-muted hover:text-ink-950 focus-visible:outline-offset-2"
            }
          >
            {link.label}
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.3} aria-hidden="true" />
          </a>
        ))}
        <span className="text-center text-[10px] leading-4 text-faint sm:ml-auto sm:text-right">
          {study.fullTextRead
            ? t("study.fullTextNote")
            : study.access === "open-access-link"
              ? t("study.linkedNote")
              : t("study.paywalledNote")}
        </span>
      </div>
    </article>
  );
}
