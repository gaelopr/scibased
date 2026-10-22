import {
  ArrowUpRight,
  BookMarked,
  ChevronDown,
  FileCheck2,
  FileText,
  FlaskConical,
  Microscope,
  Quote,
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
    className: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
  },
  contradicts: {
    className: "bg-red-50 text-red-800 ring-red-600/15",
  },
  mixed: {
    className: "bg-amber-50 text-amber-900 ring-amber-600/20",
  },
  unclear: {
    className: "bg-slate-100 text-slate-700 ring-slate-500/15",
  },
};

const ACCESS_STYLES: Record<
  StudyAccess,
  { className: string; icon: typeof FileText }
> = {
  "full-text": {
    className: "bg-emerald-50 text-emerald-800 ring-emerald-600/15",
    icon: FileCheck2,
  },
  "open-access-link": {
    className: "bg-sky-50 text-sky-800 ring-sky-600/15",
    icon: Unlock,
  },
  "abstract-only": {
    className: "bg-slate-100 text-slate-700 ring-slate-500/15",
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
    <article className="group animate-fade-up rounded-[22px] border border-black/[0.045] bg-white p-5 text-ink-950 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.65)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-26px_rgba(0,0,0,0.7)] sm:p-6">
      <div className="flex gap-4">
        <span
          className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-serif text-[15px] font-medium text-slate-600 sm:flex"
          aria-hidden="true"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              lang="en"
              className="rounded-md bg-slate-100 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-slate-700"
            >
              {study.designLabel}
            </span>
            <span
              className={`rounded-md px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.09em] ring-1 ring-inset ${direction.className}`}
            >
              {directionLabels[study.direction]}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.09em] ring-1 ring-inset ${access.className}`}
            >
              <AccessIcon className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden="true" />
              {accessLabels[study.access]}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.11em] text-slate-500">
              <BookMarked className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
              {study.source}
            </span>
          </div>

          <h3
            lang="en"
            className="mt-3.5 max-w-[64ch] text-[15.5px] font-semibold leading-[1.45] tracking-[-0.01em] text-ink-950"
          >
            {study.title}
          </h3>

          <p className="mt-2 text-[11.5px] font-medium leading-5 text-slate-500">
            {study.authors}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] leading-5 text-slate-500">
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

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.11em] text-slate-500">
                <Users className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
                {t("study.sample")}
              </p>
              <p className="mt-1 text-[11.5px] font-medium leading-4 text-slate-700">
                {study.sampleSize
                  ? `n = ${study.sampleSize.toLocaleString()}`
                  : t("study.notReported")}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.11em] text-slate-500">
                <Target className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
                {t("study.directness")}
              </p>
              <p className="mt-1 text-[11.5px] font-medium leading-4 text-slate-700">
                {directnessLabels[study.directness]}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.11em] text-slate-500">
                <Microscope className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
                {t("study.certainty")}
              </p>
              <p className="mt-1 text-[11.5px] font-medium leading-4 text-slate-700">
                {certaintyLabel(t, study.certainty)}
              </p>
            </div>
          </div>

          {study.population && (
            <p className="mt-2.5 text-[10.5px] leading-5 text-slate-500">
              <span className="font-semibold text-slate-600">{t("study.population")}</span>{" "}
              <span lang="en">{study.population}</span>
            </p>
          )}

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              <Quote className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
              {t("study.whatFound")}
            </p>
            <p lang="en" className="mt-1.5 text-[12.5px] leading-[1.68] text-slate-700">
              “{study.finding}”
            </p>
            <p lang="en" className="mt-2 text-[9.5px] leading-4 text-slate-500">
              {study.directionRationale}
            </p>
          </div>

          <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.11em] text-slate-500">
                <FlaskConical className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
                {t("study.howTested")}
              </p>
              <p lang="en" className="mt-1.5 text-[11px] leading-[1.65] text-slate-600">
                {study.methods}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 px-3.5 py-3">
              <p className="flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.11em] text-slate-500">
                <ShieldAlert className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
                {t("study.limitations")}
              </p>
              <p lang="en" className="mt-1.5 text-[11px] leading-[1.65] text-slate-600">
                {study.limitations}
              </p>
              <p lang="en" className="mt-1.5 text-[10px] leading-[1.55] text-slate-500">
                {study.riskOfBias}
              </p>
            </div>
          </div>

          {study.excerpts.length > 1 && (
            <details className="group/details mt-3 rounded-xl border border-slate-100 bg-slate-50/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-2.5 text-[10.5px] font-semibold text-slate-700 focus-visible:outline-offset-2">
                <span>
                  {t("study.moreEvidence", { count: study.excerpts.length })}
                </span>
                <ChevronDown
                  className="h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform group-open/details:rotate-180"
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
              </summary>
              <div className="space-y-2.5 border-t border-slate-200/70 px-3.5 py-3">
                {study.excerpts.map((excerpt, excerptIndex) => (
                  <div key={`${excerpt.section}-${excerptIndex}`}>
                    <p className="text-[8.5px] font-semibold uppercase tracking-[0.11em] text-slate-500">
                      {excerpt.section}
                    </p>
                    <p lang="en" className="mt-1 text-[11px] leading-[1.65] text-slate-600">
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
                    ? "inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink-950 px-4 py-2.5 text-[11.5px] font-semibold text-white shadow-[0_8px_20px_-12px_rgba(8,14,24,0.8)] transition hover:bg-slate-800 focus-visible:outline-offset-2"
                    : "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11.5px] font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-offset-2"
                }
              >
                {link.label}
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
              </a>
            ))}
            <span className="text-center text-[9.5px] text-slate-500 sm:ml-auto sm:text-right">
              {study.fullTextRead
                ? t("study.fullTextNote")
                : study.access === "open-access-link"
                  ? t("study.linkedNote")
                  : t("study.paywalledNote")}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
