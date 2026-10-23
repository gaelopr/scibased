import { FlaskConical } from "lucide-react";
import { DEMO_VERDICT_ORDER, MOCK_RESULTS } from "../data/mockResults";
import { useLanguage, verdictLabel, verdictShortLabel } from "../i18n";
import { verdictTheme } from "../lib/verdictTheme";
import type { MockKey } from "../types";

interface DemoSwitcherProps {
  onSelect: (key: MockKey) => void;
}

export default function DemoSwitcher({ onSelect }: DemoSwitcherProps) {
  const { t } = useLanguage();

  return (
    <div className="border-t border-line bg-surface-muted px-5 py-3.5 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-subtle">
          <FlaskConical className="h-3.5 w-3.5 text-faint" strokeWidth={2} aria-hidden="true" />
          {t("demo.preview")}
        </div>

        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label={t("demo.group")}
        >
          {DEMO_VERDICT_ORDER.map((key) => {
            const result = MOCK_RESULTS[key];
            const theme = verdictTheme[result.verdict];

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                title={t("demo.title", {
                  verdict: verdictLabel(t, result.verdict).toLowerCase(),
                })}
                aria-label={t("demo.aria", {
                  verdict: verdictLabel(t, result.verdict),
                })}
                className="group inline-flex min-h-8 min-w-0 items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1.5 text-[10.5px] font-medium text-muted shadow-sm transition hover:-translate-y-px hover:border-line-strong hover:text-ink-950 active:translate-y-0"
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`} aria-hidden="true" />
                {verdictShortLabel(t, result.verdict)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
