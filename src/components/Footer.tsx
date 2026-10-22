import { ArrowUpRight, FlaskConical, Heart } from "lucide-react";
import { useLanguage } from "../i18n";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative mt-16 border-t border-white/[0.06] sm:mt-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400">
            <FlaskConical className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[13px] font-semibold tracking-tight text-slate-200">SciBased</p>
            <p className="mt-1.5 max-w-md text-[11.5px] leading-5 text-slate-400">
              {t("footer.disclaimer")}
            </p>
          </div>
        </div>

        <div className="text-[11px] leading-5 text-slate-400 sm:text-right">
          <div className="mb-4 max-w-xs text-left sm:ml-auto">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
              {t("footer.support")}
            </p>
            <p className="mt-1.5 text-[11px] leading-5 text-slate-400">
              {t("footer.supportBody")}
            </p>
            <a
              href="https://www.paypal.com/ncp/payment/485LESHDZBELL"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3.5 py-2 text-[11px] font-semibold text-emerald-200 transition hover:-translate-y-px hover:border-emerald-300/35 hover:bg-emerald-400/[0.14] focus-visible:outline-offset-2"
            >
              <Heart className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              {t("footer.supportCta")}
              <ArrowUpRight className="h-3 w-3 opacity-70" strokeWidth={2} aria-hidden="true" />
            </a>
          </div>
          <p>
            {t("footer.evidenceVia")}{" "}
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline decoration-slate-700 underline-offset-2 transition hover:text-slate-200"
            >
              PubMed
            </a>
            ,{" "}
            <a
              href="https://openalex.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline decoration-slate-700 underline-offset-2 transition hover:text-slate-200"
            >
              OpenAlex
            </a>{" "}
            &amp;{" "}
            <a
              href="https://europepmc.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline decoration-slate-700 underline-offset-2 transition hover:text-slate-200"
            >
              Europe PMC
            </a>
          </p>
          <p className="mt-1">© {new Date().getFullYear()} SciBased</p>
        </div>
      </div>
    </footer>
  );
}
