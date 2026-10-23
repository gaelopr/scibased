import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import { MOCK_RESULTS, MOCK_RESULT_ORDER } from "../data/mockResults";
import { categoryLabel, useLanguage } from "../i18n";
import { verdictTheme } from "../lib/verdictTheme";
import type { MockKey } from "../types";
import VerdictBadge from "./VerdictBadge";

interface TrendingListProps {
  onSelect: (key: MockKey) => void;
}

export default function TrendingList({ onSelect }: TrendingListProps) {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="trending-heading" className="mt-12 sm:mt-16">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 sm:mb-6">
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.11em] text-brand">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {t("trending.eyebrow")}
          </div>
          <h2
            id="trending-heading"
            className="text-[26px] font-semibold leading-tight tracking-[-0.035em] text-ink-950 sm:text-[32px]"
          >
            {t("trending.title")}
          </h2>
        </div>
        <p className="hidden max-w-[310px] text-right text-[12px] leading-5 text-subtle md:block">
          {t("trending.body")}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {MOCK_RESULT_ORDER.map((key, index) => {
          const result = MOCK_RESULTS[key];
          const theme = verdictTheme[result.verdict];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className="group animate-fade-up flex h-full flex-col rounded-2xl border border-line bg-surface p-5 text-left shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift focus-visible:outline-offset-4"
              style={{ animationDelay: `${100 + index * 50}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <VerdictBadge verdict={result.verdict} size="sm" />
                <span className="text-[10.5px] font-medium text-faint">
                  {t("trending.sample")}
                </span>
              </div>

              <h3 className="mt-3.5 text-[15.5px] font-semibold leading-6 tracking-[-0.015em] text-ink-950">
                {result.claim}
              </h3>
              <p className="mt-2 line-clamp-2 flex-1 text-[12px] leading-5 text-subtle">
                {result.conclusion}
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-line pt-3">
                <span className="inline-flex items-center gap-1.5 text-[10.5px] font-medium text-subtle">
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  {result.papers.length} {t("common.papers")}
                  <span className="mx-0.5 h-0.5 w-0.5 rounded-full bg-decor" aria-hidden="true" />
                  <span>{categoryLabel(t, result.category)}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10.5px] font-semibold ${theme.accentText}`}
                >
                  {t("trending.preview")}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={2.3}
                    aria-hidden="true"
                  />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
