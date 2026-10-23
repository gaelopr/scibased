import { ArrowDown, Link2 } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Paper, Study } from "../types";

interface StatementSourcesProps {
  /** IDs of the studies/papers this statement was synthesized from. */
  ids?: string[];
  studies: Study[];
  papers: Paper[];
  className?: string;
}

interface ResolvedSource {
  id: string;
  kind: "study" | "paper";
  index: number;
  title: string;
  authors: string;
  year: number;
}

/**
 * Statement-level traceability: every synthesis point links to the exact
 * study cards it draws from, not just to the evidence section as a whole.
 */
export default function StatementSources({
  ids,
  studies,
  papers,
  className = "mt-2.5",
}: StatementSourcesProps) {
  const { t } = useLanguage();
  const uniqueIds = Array.from(new Set(ids ?? []));
  const byId = new Map<string, ResolvedSource>();

  // ResultsScreen renders study cards when live studies exist; sample results
  // fall back to paper cards. Resolve against the list that is actually on the
  // page so every citation chip has a real anchor target.
  if (studies.length > 0) {
    studies.forEach((study, index) => {
      byId.set(study.id, {
        id: study.id,
        kind: "study",
        index,
        title: study.title,
        authors: study.authors,
        year: study.year,
      });
    });
  } else {
    papers.forEach((paper, index) => {
      byId.set(paper.id, {
        id: paper.id,
        kind: "paper",
        index,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
      });
    });
  }

  const sources = uniqueIds.flatMap((id) => {
    const source = byId.get(id);
    return source ? [source] : [];
  });

  if (sources.length === 0) {
    return (
      <p className={`${className} text-[10.5px] leading-4 text-faint`}>
        {t("results.statementNoSources")}
      </p>
    );
  }

  return (
    <div
      className={`${className} flex flex-wrap items-center gap-1.5`}
      role="group"
      aria-label={t("results.statementSourcesAria")}
    >
      <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold uppercase tracking-[0.09em] text-faint">
        <Link2 className="h-3 w-3" aria-hidden="true" />
        {t("results.statementSources")}
      </span>
      {sources.map((source) => {
        const number = String(source.index + 1).padStart(2, "0");
        const anchor =
          source.kind === "study"
            ? `#study-source-${source.index}`
            : `#paper-source-${source.index}`;
        const citation = `${source.authors} (${source.year}). ${source.title}`;
        return (
          <a
            key={`${source.kind}-${source.id}`}
            href={anchor}
            title={citation}
            aria-label={t("results.openSource", {
              number,
              title: source.title,
            })}
            className="group inline-flex items-center gap-1 rounded-full border border-line bg-chip px-2 py-1 text-[9.5px] font-semibold text-muted transition hover:border-brand-line hover:bg-brand-soft hover:text-brand-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {t("study.study")} {number}
            <ArrowDown
              className="h-3 w-3 opacity-60 transition group-hover:translate-y-0.5 group-hover:opacity-100"
              aria-hidden="true"
            />
          </a>
        );
      })}
    </div>
  );
}
