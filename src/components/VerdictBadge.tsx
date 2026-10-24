import {
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLanguage, verdictLabel } from "../i18n";
import type { Verdict } from "../types";
import { verdictTheme } from "../lib/verdictTheme";

interface VerdictBadgeProps {
  verdict: Verdict;
  variant?: "soft" | "overlay";
  size?: "sm" | "md";
  className?: string;
}

const icons: Record<Verdict, typeof ShieldCheck> = {
  verified: ShieldCheck,
  leans_for: TrendingUp,
  context: ShieldAlert,
  leans_against: TrendingDown,
  debunked: ShieldX,
};

export default function VerdictBadge({
  verdict,
  variant = "soft",
  size = "md",
  className = "",
}: VerdictBadgeProps) {
  const { t } = useLanguage();
  const theme = verdictTheme[verdict];
  const Icon = icons[verdict];
  const label = verdictLabel(t, verdict);

  const variantClasses =
    variant === "overlay" ? theme.overlayBadge : theme.softBadge;
  const sizeClasses =
    size === "sm"
      ? "gap-1.5 px-2.5 py-1 text-[10px]"
      : "gap-1.5 px-3 py-1.5 text-[10.5px]";

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full font-semibold uppercase tracking-[0.13em] ${variantClasses} ${sizeClasses} ${className}`}
      aria-label={`${t("verdictCard.verdict")}: ${label}`}
    >
      <Icon
        className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"}
        strokeWidth={2.4}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
