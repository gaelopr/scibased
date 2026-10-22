import { ArrowUpRight, BookMarked, FileText, Unlock } from "lucide-react";
import type { Paper } from "../types";
import { safeExternalUrl } from "../lib/evidence/utils";

interface PaperCardProps {
  paper: Paper;
  index: number;
}

export default function PaperCard({ paper, index }: PaperCardProps) {
  const buttonLabel = `View Paper via ${paper.source}`;

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
            <span className="rounded-md bg-slate-100 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-slate-600">
              {paper.studyType}
            </span>
            {paper.openAccess && (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-emerald-700">
                <Unlock className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden="true" />
                Open access
              </span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.11em] text-slate-500">
              <BookMarked className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
              {paper.source}
            </span>
          </div>

          <h3 className="mt-3.5 max-w-[58ch] text-[15.5px] font-semibold leading-[1.45] tracking-[-0.01em] text-ink-950">
            {paper.title}
          </h3>

          <p className="mt-2 text-[11.5px] font-medium leading-5 text-slate-500">
            {paper.authors}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11.5px] leading-5 text-slate-500">
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

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3">
            <p className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              <FileText className="h-3 w-3" strokeWidth={2.2} aria-hidden="true" />
              What it found
            </p>
            <p className="mt-1.5 text-[12.5px] leading-[1.65] text-slate-600">{paper.finding}</p>
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={safeExternalUrl(paper.url) ?? "https://pubmed.ncbi.nlm.nih.gov/"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-ink-950 px-4 py-2.5 text-[11.5px] font-semibold text-white shadow-[0_8px_20px_-12px_rgba(8,14,24,0.8)] transition hover:bg-slate-800 focus-visible:outline-offset-2 sm:w-auto"
            >
              {buttonLabel}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />
            </a>
            <span className="text-center text-[9.5px] text-slate-500 sm:text-right">
              Opens in a new tab
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
