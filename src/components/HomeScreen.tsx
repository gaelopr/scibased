import { BookOpenCheck, LockKeyhole, ScanText } from "lucide-react";
import { useLanguage } from "../i18n";
import type { MockKey } from "../types";
import ClaimInput from "./ClaimInput";
import TrendingList from "./TrendingList";

interface HomeScreenProps {
  claimText: string;
  onClaimChange: (value: string) => void;
  imageFile: File | null;
  onImageChange: (file: File | null) => void;
  onAnalyze: (claimOverride?: string, imageOverride?: File | null) => void;
  onDemo: (key: MockKey) => void;
  analysisError: string | null;
}

export default function HomeScreen({
  claimText,
  onClaimChange,
  imageFile,
  onImageChange,
  onAnalyze,
  onDemo,
  analysisError,
}: HomeScreenProps) {
  const { t } = useLanguage();

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-2 pt-8 sm:px-6 sm:pt-12 lg:pt-16">
      <section className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(400px,470px)] lg:gap-16">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-medium text-muted shadow-sm">
            <span className="h-2 w-2 rounded-full bg-verified" aria-hidden="true" />
            {t("home.eyebrow")}
          </div>

          <h1 className="mt-5 max-w-[680px] text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-ink-950 sm:text-[58px] lg:text-[64px]">
            {t("home.heroLead")}{" "}
            <span className="text-brand">{t("home.heroAccent")}</span>
          </h1>

          <p className="mt-5 max-w-[520px] text-[15px] leading-7 text-muted sm:text-[16px]">
            {t("home.body")}
          </p>

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2.5 text-[12px] font-medium text-muted">
            <span className="inline-flex items-center gap-1.5">
              <BookOpenCheck className="h-4 w-4 text-brand-strong" strokeWidth={2} aria-hidden="true" />
              PubMed + OpenAlex
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ScanText className="h-4 w-4 text-brand-strong" strokeWidth={2} aria-hidden="true" />
              {t("home.pastAbstract")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LockKeyhole className="h-4 w-4 text-brand-strong" strokeWidth={2} aria-hidden="true" />
              {t("home.noSignup")}
            </span>
          </div>

          <p className="mt-6 max-w-[460px] text-[12px] leading-5 text-subtle">
            {t("home.worksWith")}
          </p>
        </div>

        <div className="animate-fade-up [animation-delay:70ms]">
          <ClaimInput
            claimText={claimText}
            onClaimChange={onClaimChange}
            imageFile={imageFile}
            onImageChange={onImageChange}
            onAnalyze={() => onAnalyze()}
            onDemo={onDemo}
            analysisError={analysisError}
          />
        </div>
      </section>

      <section
        className="animate-fade-up mt-10 border-y border-line py-6 sm:mt-14 sm:py-7 [animation-delay:120ms]"
        aria-labelledby="how-heading"
      >
        <p
          id="how-heading"
          className="text-[11px] font-semibold uppercase tracking-[0.12em] text-subtle"
        >
          {t("home.howEyebrow")}
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-3 sm:gap-8">
          {[
            { title: t("home.how1Title"), body: t("home.how1Body") },
            { title: t("home.how2Title"), body: t("home.how2Body") },
            { title: t("home.how3Title"), body: t("home.how3Body") },
          ].map((step, index) => (
            <div key={step.title} className="flex gap-3">
              <span className="mt-0.5 text-[12px] font-semibold tabular-nums text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-[13px] font-semibold text-ink-950">{step.title}</p>
                <p className="mt-1 text-[12px] leading-5 text-subtle">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <TrendingList onSelect={onDemo} />
    </main>
  );
}
