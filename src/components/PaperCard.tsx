import { ArrowUpRight, BookMarked, FileText, Unlock } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Paper } from "../types";
import { safeExternalUrl } from "../lib/evidence/utils";

interface PaperCardProps {
  paper: Paper;
  index: number;
}

export default function PaperCard({ paper, index }: PaperCardProps) {
  const { t } = useLanguage();
  const buttonLabel = t("paper.viewVia", { source: paper.source });

  return (
    <article
      id={`paper-source-${index}`}
      className="group animate-fade-up scroll-mt-24 rounded-2xl border border-line bg-surface p-5 shadow-card transition duration-200 target:border-brand-line target:ring-2 target:ring-brand-line hover:border-line-strong sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-faint">
            {t("study.study")} {String(index + 1).padStart(2, "0")}
          </span>
          <span
            lang="en"
            className="rounded-md bg-chip px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.07em] text-muted"
          >
            {paper.studyType}
          </span>
          {paper.openAccess && (
            <span className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-1 text-[9.5px] font-medium text-brand ring-1 ring-brand-line">
              <Unlock className="h-2.5 w-2.5" strokeWidth={2.3} aria-hidden="true" />
              {t("paper.openAccess")}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.08em] text-faint">
          <BookMarked className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
          {paper.source}
        </span>
      </div>

      <h3
        lang="en"
        className="mt-3 max-w-[58ch] text-[16px] font-semibold leading-[1.45] tracking-[-0.015em] text-ink-950"
      >
        {paper.title}
      </h3>

      <p className="mt-1.5 text-[11.5px] font-medium leading-5 text-subtle">
        {paper.authors}
      </p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] leading-5 text-subtle">
        <span className="italic">{paper.journal}</span>
        <span aria-hidden="true">·</span>
        <span>{paper.year}</span>
        {paper.pmid && (
          <>
            <span aria-hidden="true">·</span>
            <span>PMID {paper.pmid}</span>
          </>
        )}
      </p>

      <div className="mt-4 rounded-xl border border-line bg-surface-muted px-4 py-3.5">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-subtle">
          <FileText className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
          {t("paper.whatFound")}
        </p>
        <p lang="en" className="mt-1.5 text-[12.5px] leading-[1.65] text-muted">
          {paper.finding}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={safeExternalUrl(paper.url) ?? "https://pubmed.ncbi.nlm.nih.gov/"}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-strong px-4 py-2.5 text-[11.5px] font-semibold text-on-strong transition hover:bg-strong-hover focus-visible:outline-offset-2 sm:w-auto"
        >
          {buttonLabel}
          <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.3} aria-hidden="true" />
        </a>
        <span className="text-center text-[10px] text-faint sm:text-right">
          {t("paper.newTab")}
        </span>
      </div>
    </article>
  );
}
