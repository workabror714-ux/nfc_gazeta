"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";

interface SiteHeaderProps {
  currentDate: string;
  onOpenAccessibility: () => void;
  onOpenSearch: () => void;
  onOpenMobileNav: () => void;
}

export function SiteHeader({
  currentDate,
  onOpenAccessibility,
  onOpenSearch,
  onOpenMobileNav,
}: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="border-b-4 border-[#D4AF37] bg-[#003366] text-white">
        <div className="mx-auto flex min-h-9 w-full max-w-7xl items-center justify-between gap-4 px-4 text-[11px] font-medium sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <span className="hidden truncate text-slate-200 sm:inline">
              {currentDate}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/70 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
              <Icon
                className="text-emerald-400"
                name="nfc"
                size={13}
              />
              NFC tizimi faol
            </span>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <button
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-white/10 hover:text-[#D4AF37]"
              onClick={onOpenAccessibility}
              type="button"
            >
              <Icon
                className="text-[#D4AF37]"
                name="eye"
                size={14}
              />
              Maxsus imkoniyatlar
            </button>
            <span className="h-3 w-px bg-white/20" />
            <button
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition hover:bg-white/10 hover:text-[#D4AF37]"
              onClick={onOpenSearch}
              type="button"
            >
              <Icon name="search" size={14} />
              Qidiruv
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          aria-label="Temiryo‘lchi bosh sahifasi"
          className="flex min-w-0 items-center gap-3"
          href="/"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#003366] text-xl font-black text-[#D4AF37] shadow-md ring-1 ring-[#002244]">
            T
          </span>
          <span className="min-w-0">
            <strong className="block truncate font-serif text-xl font-black tracking-tight text-[#003366] sm:text-2xl">
              Temiryo‘lchi
            </strong>
            <small className="block text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
              Rasmiy elektron gazeta
            </small>
          </span>
        </Link>

        <nav
          aria-label="Asosiy navigatsiya"
          className="hidden items-center gap-1 lg:flex"
        >
          <Link
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              pathname === "/"
                ? "bg-[#003366] text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-[#003366]"
            }`}
            href="/"
          >
            Bosh sahifa
          </Link>
          <Link
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              pathname.startsWith("/arxiv")
                ? "bg-[#003366] text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-[#003366]"
            }`}
            href="/arxiv"
          >
            Gazeta arxivi
          </Link>
          <button
            className="ml-2 grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-[#003366] hover:text-[#003366]"
            onClick={onOpenSearch}
            type="button"
          >
            <Icon name="search" size={18} />
          </button>
        </nav>

        <button
          aria-label="Mobil menyuni ochish"
          className="grid h-11 w-11 place-items-center rounded-lg border border-slate-200 text-[#003366] lg:hidden"
          onClick={onOpenMobileNav}
          type="button"
        >
          <Icon name="menu" />
        </button>
      </div>
    </header>
  );
}
