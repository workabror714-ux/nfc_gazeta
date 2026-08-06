"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { Icon } from "@/components/ui/icon";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({
  isOpen,
  onClose,
}: SearchDialogProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen, onClose]);

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return;
    }

    onClose();
    router.push(
      `/qidiruv?search=${encodeURIComponent(
        normalizedQuery,
      )}`,
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[85] flex items-start justify-center bg-slate-950/60 px-4 pt-[12vh] backdrop-blur-sm"
      role="dialog"
    >
      <button
        aria-label="Qidiruv oynasini yopish"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-[#003366]">
              Sayt bo‘yicha qidiruv
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Maqola sarlavhasi, muallif yoki matn bo‘yicha qidiring.
            </p>
          </div>
          <button
            aria-label="Yopish"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={19} />
          </button>
        </div>

        <form
          className="p-5 sm:p-6"
          onSubmit={handleSubmit}
        >
          <label className="relative block">
            <Icon
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              name="search"
              size={20}
            />
            <input
              className="h-14 w-full rounded-xl border border-slate-300 bg-slate-50 pl-12 pr-4 text-base text-slate-900 outline-none transition focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setQuery(event.target.value)
              }
              placeholder="Masalan: elektrlashtirish, logistika..."
              ref={inputRef}
              type="search"
              value={query}
            />
          </label>

          <button
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 text-sm font-bold text-white transition hover:bg-[#002244] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!query.trim()}
            type="submit"
          >
            <Icon name="search" size={18} />
            Qidirish
          </button>
        </form>
      </section>
    </div>
  );
}
