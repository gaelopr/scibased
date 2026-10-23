import { Globe2, Moon, ScanSearch, ShieldCheck, Sun } from "lucide-react";
import { useLanguage } from "../i18n";
import type { Theme } from "../lib/useTheme";

interface HeaderProps {
  onHome: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

export default function Header({ onHome, theme, onToggleTheme }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/88 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="group flex min-w-0 items-center gap-2.5 rounded-xl text-left focus-visible:outline-offset-4"
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-strong text-on-strong shadow-sm transition-transform duration-200 group-hover:-translate-y-0.5">
            <ScanSearch className="h-[18px] w-[18px]" strokeWidth={2.2} aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-canvas bg-verified" />
          </span>
          <span className="min-w-0">
            <span className="block text-[18px] font-semibold leading-none tracking-[-0.035em] text-ink-950">
              SciBased<span className="text-brand-strong">.</span>
            </span>
            <span className="mt-1 hidden max-w-[210px] truncate text-[10.5px] font-medium leading-none text-subtle min-[360px]:block">
              {t("header.tagline")}
            </span>
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium text-muted lg:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-strong" strokeWidth={2.1} aria-hidden="true" />
            {t("header.evidence")}
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={t(isDark ? "theme.toLight" : "theme.toDark")}
            aria-pressed={isDark}
            title={t(isDark ? "theme.toLight" : "theme.toDark")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-sm transition duration-200 hover:border-line-strong hover:bg-surface-muted hover:text-ink-950 focus-visible:outline-offset-2"
          >
            {isDark ? (
              <Sun className="h-4 w-4" strokeWidth={2.1} aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={2.1} aria-hidden="true" />
            )}
          </button>

          <div
            className="flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5"
            role="group"
            aria-label={t("language.label")}
          >
            <Globe2
              className="ml-1.5 mr-0.5 hidden h-3.5 w-3.5 text-faint sm:block"
              strokeWidth={2}
              aria-hidden="true"
            />
            {(["en", "es"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLanguage(option)}
                aria-pressed={language === option}
                aria-label={t(option === "en" ? "language.english" : "language.spanish")}
                title={t("language.note")}
                className={`min-h-9 rounded-full px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-strong ${
                  language === option
                    ? "bg-strong text-on-strong"
                    : "text-subtle hover:bg-chip hover:text-ink-950"
                }`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
