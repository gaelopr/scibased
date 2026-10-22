import { ScanSearch, ShieldCheck } from "lucide-react";

interface HeaderProps {
  onHome: () => void;
}

export default function Header({ onHome }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#080e18]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-6">
        <button
          type="button"
          onClick={onHome}
          className="group flex items-center gap-3 rounded-xl text-left focus-visible:outline-offset-4"
        >
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-white text-ink-950 shadow-[0_10px_28px_-12px_rgba(255,255,255,0.5)] ring-1 ring-white/60 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-[1.03]">
            <ScanSearch className="h-[22px] w-[22px]" strokeWidth={2.25} aria-hidden="true" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-[2.5px] border-[#080e18] bg-emerald-400" />
          </span>
          <span className="min-w-0">
            <span className="block text-[19px] font-semibold leading-none tracking-[-0.035em] text-white">
              SciBased<span className="text-emerald-400">.</span>
            </span>
            <span className="mt-1.5 block text-[10.5px] font-medium leading-none text-slate-400 sm:text-[11px]">
              Science-based receipts for your feed
            </span>
          </span>
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.035] px-3.5 py-2 text-[11px] font-medium text-slate-300 sm:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" strokeWidth={2.2} aria-hidden="true" />
          Peer-reviewed evidence
          <span className="ml-0.5 h-1 w-1 rounded-full bg-emerald-400/80" />
        </div>
      </div>
    </header>
  );
}
