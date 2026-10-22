import { BookOpenCheck, LockKeyhole, ScanText, Sparkles } from "lucide-react";
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

const socialPlatforms = ["TikTok", "Instagram", "X"];

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
    <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-2 pt-9 sm:px-6 sm:pt-12 lg:pt-16">
      <section className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(400px,470px)] lg:gap-14 xl:gap-20">
        <div className="animate-fade-up lg:pt-7">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-emerald-300">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            {t("home.eyebrow")}
          </div>

          <h1 className="max-w-[620px] text-[46px] font-semibold leading-[0.96] tracking-[-0.055em] text-white sm:text-[62px] lg:text-[70px]">
            {t("home.heroLead")}
            <br />
            <span className="font-serif font-normal italic tracking-[-0.04em] text-emerald-300">
              {t("home.heroAccent")}
            </span>
          </h1>

          <p className="mt-5 max-w-[440px] text-[14.5px] leading-[1.75] text-slate-400 sm:mt-6 sm:text-[15.5px]">
            {t("home.body")}
          </p>

          <div className="mt-7 hidden flex-wrap gap-x-5 gap-y-3 text-[11px] font-medium text-slate-400 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <BookOpenCheck className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} aria-hidden="true" />
              PubMed + OpenAlex
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ScanText className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} aria-hidden="true" />
              {t("home.pastAbstract")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <LockKeyhole className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2} aria-hidden="true" />
              {t("home.noSignup")}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="mr-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t("home.worksWith")}
            </span>
            {socialPlatforms.map((platform) => (
              <span
                key={platform}
                className="rounded-full border border-white/[0.08] bg-white/[0.025] px-2.5 py-1 text-[10px] font-medium text-slate-400"
              >
                {platform}
              </span>
            ))}
            <span className="ml-1 hidden text-[10px] text-slate-400 sm:inline">
              {t("home.screenshots")}
            </span>
          </div>

          <div className="mt-10 hidden max-w-[410px] items-start gap-3 border-t border-white/[0.07] pt-5 lg:flex">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.035] text-emerald-300/80">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <p className="text-[11.5px] leading-[1.7] text-slate-400">
              {t("home.built")}
            </p>
          </div>
        </div>

        <div className="animate-fade-up [animation-delay:80ms]">
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

      <TrendingList onSelect={onDemo} />
    </main>
  );
}
