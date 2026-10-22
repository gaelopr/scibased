import { FlaskConical } from "lucide-react";
import { DEMO_VERDICT_ORDER, MOCK_RESULTS } from "../data/mockResults";
import { verdictTheme } from "../lib/verdictTheme";
import type { MockKey } from "../types";

interface DemoSwitcherProps {
  onSelect: (key: MockKey) => void;
}

export default function DemoSwitcher({ onSelect }: DemoSwitcherProps) {
  return (
    <div className="flex flex-col gap-2.5 border-t border-slate-100 bg-slate-50/80 px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
        <FlaskConical className="h-3.5 w-3.5 text-slate-400" strokeWidth={2} aria-hidden="true" />
        Preview a verdict
      </div>

      <div
        className="grid w-full grid-cols-3 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:items-center"
        role="group"
        aria-label="Preview one of three sample verdicts"
      >
        {DEMO_VERDICT_ORDER.map((key) => {
          const result = MOCK_RESULTS[key];
          const theme = verdictTheme[result.verdict];

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              title={`Run a sample ${theme.label.toLowerCase()} analysis`}
              aria-label={`Preview a ${theme.label} verdict`}
              className="group inline-flex min-w-0 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-[10.5px] font-medium text-slate-600 shadow-[0_1px_1px_rgba(15,23,42,0.03)] transition hover:-translate-y-px hover:border-slate-300 hover:text-slate-900 hover:shadow-sm active:translate-y-0 sm:px-2.5 sm:text-[11px]"
            >
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.dot}`} aria-hidden="true" />
              {theme.shortLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
