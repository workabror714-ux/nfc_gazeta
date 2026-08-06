"use client";

import Link from "next/link";

import { Icon } from "@/components/ui/icon";

interface SiteFooterProps {
  onOpenAccessibility: () => void;
}

export function SiteFooter({
  onOpenAccessibility,
}: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t-4 border-[#D4AF37] bg-[#002244] text-slate-300">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 font-serif text-xl font-black text-[#D4AF37]">
              T
            </span>
            <div>
              <strong className="block font-serif text-xl text-white">
                Temiryo‘lchi
              </strong>
              <small className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
                Elektron gazeta
              </small>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-xs leading-6 text-slate-400">
            Temir yo‘l sohasi yangiliklari, rasmiy materiallar va gazetaning elektron arxivi.
          </p>
        </div>

        <div>
          <h2 className="font-serif text-sm font-bold text-white">
            Asosiy bo‘limlar
          </h2>
          <div className="mt-4 flex flex-col items-start gap-3 text-xs font-semibold">
            <Link
              className="transition hover:text-[#D4AF37]"
              href="/"
            >
              Bosh sahifa
            </Link>
            <Link
              className="transition hover:text-[#D4AF37]"
              href="/arxiv"
            >
              Gazeta arxivi
            </Link>
            <button
              className="transition hover:text-[#D4AF37]"
              onClick={onOpenAccessibility}
              type="button"
            >
              Maxsus imkoniyatlar
            </button>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-sm font-bold text-white">
            NFC gazeta tizimi
          </h2>
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
            <Icon
              className="mt-0.5 shrink-0 text-[#D4AF37]"
              name="nfc"
            />
            <p className="text-xs leading-6 text-slate-400">
              Bosma gazetadagi NFC stikerga telefonni yaqinlashtiring va aynan o‘sha elektron sonni oching.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex min-h-14 w-full max-w-7xl flex-col justify-center gap-2 px-4 py-3 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span>© {year} Temiryo‘lchi. Barcha huquqlar himoyalangan.</span>
          <span className="inline-flex items-center gap-1.5">
            <Icon name="shield" size={13} />
            Rasmiy elektron nashr
          </span>
        </div>
      </div>
    </footer>
  );
}
