"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Icon } from "@/components/ui/icon";

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccessibility: () => void;
  onOpenSearch: () => void;
}

const links = [
  ["/", "Bosh sahifa", "newspaper"],
  ["/arxiv", "Gazeta arxivi", "archive"],
] as const;

export function MobileNavigation({
  isOpen,
  onClose,
  onOpenAccessibility,
  onOpenSearch,
}: MobileNavigationProps) {
  const pathname = usePathname();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[75] lg:hidden">
      <button
        aria-label="Mobil menyuni yopish"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      <aside className="relative ml-auto flex h-full w-[min(88vw,360px)] flex-col bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b-4 border-[#D4AF37] bg-[#003366] px-5 py-5 text-white">
          <div>
            <strong className="block font-serif text-xl">
              Temiryo‘lchi
            </strong>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#D4AF37]">
              Elektron gazeta
            </span>
          </div>
          <button
            aria-label="Yopish"
            className="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" />
          </button>
        </header>

        <nav className="space-y-2 p-5">
          {links.map(([href, label, icon]) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  isActive
                    ? "bg-[#003366] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
                href={href}
                key={href}
                onClick={onClose}
              >
                <Icon
                  className={
                    isActive
                      ? "text-[#D4AF37]"
                      : "text-[#003366]"
                  }
                  name={icon}
                  size={19}
                />
                {label}
              </Link>
            );
          })}

          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            onClick={() => {
              onClose();
              onOpenSearch();
            }}
            type="button"
          >
            <Icon
              className="text-[#003366]"
              name="search"
              size={19}
            />
            Qidiruv
          </button>

          <button
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            onClick={() => {
              onClose();
              onOpenAccessibility();
            }}
            type="button"
          >
            <Icon
              className="text-[#003366]"
              name="eye"
              size={19}
            />
            Maxsus imkoniyatlar
          </button>
        </nav>

        <div className="mt-auto border-t border-slate-200 p-5">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
            <Icon
              className="text-emerald-600"
              name="nfc"
            />
            <div>
              <strong className="block text-xs">
                NFC tizimi faol
              </strong>
              <span className="text-[11px] text-emerald-700">
                Bosma gazeta sonini darhol oching
              </span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
