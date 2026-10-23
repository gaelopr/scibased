import { ArrowUpRight, FlaskConical, Heart } from "lucide-react";
import { useLanguage } from "../i18n";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative mt-14 border-t border-line bg-surface/60 sm:mt-20">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-9 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-subtle shadow-sm">
            <FlaskConical className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[13px] font-semibold tracking-tight text-ink-950">SciBased</p>
            <p className="mt-1.5 max-w-md text-[11.5px] leading-5 text-subtle">
              {t("footer.disclaimer")}
            </p>
            <p className="mt-4 text-[10.5px] text-faint">
              © {new Date().getFullYear()} SciBased
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
            <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-subtle">
              {t("footer.support")}
            </p>
            <p className="mt-1.5 text-[11.5px] leading-5 text-subtle">
              {t("footer.supportBody")}
            </p>
            <a
              href="https://www.paypal.com/ncp/payment/485LESHDZBELL"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[11.5px] font-semibold text-ink-700 transition hover:border-brand-line hover:bg-brand-soft hover:text-brand-deep focus-visible:outline-offset-2"
            >
              <Heart className="h-3.5 w-3.5 text-brand-strong" strokeWidth={2} aria-hidden="true" />
              {t("footer.supportCta")}
              <ArrowUpRight className="h-3 w-3 opacity-60" strokeWidth={2.2} aria-hidden="true" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10.5px] leading-5 text-subtle">
            <span>{t("footer.evidenceVia")}</span>
            <a
              href="https://pubmed.ncbi.nlm.nih.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-muted underline decoration-line-strong underline-offset-2 transition hover:text-ink-950"
            >
              PubMed
            </a>
            <a
              href="https://openalex.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-muted underline decoration-line-strong underline-offset-2 transition hover:text-ink-950"
            >
              OpenAlex
            </a>
            <a
              href="https://europepmc.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-muted underline decoration-line-strong underline-offset-2 transition hover:text-ink-950"
            >
              Europe PMC
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
