import {
  ArrowUpRight,
  BookOpen,
  Droplets,
  Dumbbell,
  Flame,
  MoonStar,
} from "lucide-react";
import { MOCK_RESULTS, MOCK_RESULT_ORDER } from "../data/mockResults";
import { categoryLabel, useLanguage } from "../i18n";
import { verdictTheme } from "../lib/verdictTheme";
import type { MockKey } from "../types";
import VerdictBadge from "./VerdictBadge";

interface TrendingListProps {
  onSelect: (key: MockKey) => void;
}

const categoryIcons = {
  iceWater: Droplets,
  magnesium: MoonStar,
  creatine: Dumbbell,
} as const;

export default function TrendingList({ onSelect }: TrendingListProps) {
  const { t } = useLanguage();

  return (
    <section aria-labelledby="trending-heading" className="mt-16 sm:mt-24">
      <div className="mb-6 flex items-end justify-between gap-6 sm:mb-7">
        <div>
          <div className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/90">
            <Flame className="h-3.5 w-3.5" strokeWidth={2.1} aria-hidden="true" />
            {t("trending.eyebrow")}
          </div>
          <h2
            id="trending-heading"
            className="font-serif text-[30px] font-normal leading-none tracking-[-0.02em] text-white sm:text-[38px]"
          >
            {t("trending.title")}
          </h2>
        </div>
        <p className="hidden max-w-[260px] text-right text-[12.5px] leading-5 text-slate-400 md:block">
          {t("trending.body")}
        </p>
      </div>

      <div className="grid gap-3.5 md:grid-cols-3">
        {MOCK_RESULT_ORDER.map((key, index) => {
          const result = MOCK_RESULTS[key];
          const theme = verdictTheme[result.verdict];
          const CategoryIcon = categoryIcons[key];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className="group animate-fade-up relative flex h-full flex-col overflow-hidden rounded-[22px] border border-white/10 bg-white p-5 text-left shadow-[0_18px_45px_-26px_rgba(0,0,0,0.85)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_60px_-28px_rgba(0,0,0,0.9)] focus-visible:outline-offset-4"
              style={{ animationDelay: `${120 + index * 60}ms` }}
            >
              <span className={`absolute inset-x-0 top-0 h-[3px] ${theme.dot}`} aria-hidden="true" />
              <CategoryIcon
                className="pointer-events-none absolute -bottom-4 -right-4 h-32 w-32 text-ink-950/[0.035]"
                strokeWidth={1.25}
                aria-hidden="true"
              />

              <div className="relative flex items-center justify-between gap-3">
                <VerdictBadge verdict={result.verdict} size="sm" />
                <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                  {t("trending.sample")}
                </span>
              </div>

              <h3 className="relative mt-4 font-serif text-[22px] font-normal leading-[1.25] tracking-[-0.012em] text-ink-950">
                {result.claim}
              </h3>
              <p className="relative mt-2.5 line-clamp-2 flex-1 text-[12.5px] leading-5 text-slate-500">
                {result.conclusion}
              </p>

              <div className="relative mt-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3.5">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[10.5px] font-medium text-slate-500">
                  <BookOpen className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                  {result.papers.length} {t("common.papers")}
                  <span className="mx-0.5 hidden h-0.5 w-0.5 rounded-full bg-slate-300 min-[360px]:inline-block" aria-hidden="true" />
                  <span className="hidden min-[360px]:inline">{categoryLabel(t, result.category)}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 whitespace-nowrap text-[10.5px] font-semibold ${theme.accentText}`}
                >
                  {t("trending.preview")}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={2.4}
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
