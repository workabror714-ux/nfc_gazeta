"use client";

import { useEffect } from "react";

import { Icon } from "@/components/ui/icon";
import {
  useAccessibility,
} from "@/context/accessibility-context";

interface AccessibilityToolbarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessibilityToolbar({
  isOpen,
  onClose,
}: AccessibilityToolbarProps) {
  const {
    settings,
    setFontSize,
    setTheme,
    increaseFontSize,
    decreaseFontSize,
    resetSettings,
  } = useAccessibility();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      role="dialog"
    >
      <button
        aria-label="Maxsus imkoniyatlar oynasini yopish"
        className="absolute inset-0"
        onClick={onClose}
        type="button"
      />

      <section className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b-4 border-[#D4AF37] bg-[#003366] px-5 py-4 text-white sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#D4AF37]">
              <Icon name="eye" />
            </span>
            <div>
              <h2 className="font-serif text-lg font-bold">
                Maxsus imkoniyatlar
              </h2>
              <p className="text-xs text-slate-200">
                Sayt ko‘rinishini o‘zingizga qulaylashtiring
              </p>
            </div>
          </div>

          <button
            aria-label="Yopish"
            className="grid h-9 w-9 place-items-center rounded-lg text-white transition hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            <Icon name="close" size={19} />
          </button>
        </header>

        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <h3 className="mb-3 text-sm font-bold text-[#003366]">
              Shrift o‘lchami
            </h3>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ["small", "Kichik", "14px"],
                  ["medium", "O‘rtacha", "16px"],
                  ["large", "Katta", "19px"],
                ] as const
              ).map(([value, label, size]) => (
                <button
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    settings.fontSize === value
                      ? "border-[#003366] bg-[#003366] text-white shadow-md"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                  key={value}
                  onClick={() =>
                    setFontSize(value)
                  }
                  type="button"
                >
                  <strong className="block text-sm">
                    {label}
                  </strong>
                  <span className="text-xs opacity-75">
                    {size}
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                onClick={decreaseFontSize}
                type="button"
              >
                <Icon name="zoom-out" size={16} />
                Kichiklashtirish
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                onClick={increaseFontSize}
                type="button"
              >
                <Icon name="zoom-in" size={16} />
                Kattalashtirish
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-bold text-[#003366]">
              Ko‘rish rejimi
            </h3>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(
                [
                  ["normal", "Oddiy", "eye"],
                  ["contrast", "Yuqori kontrast", "contrast"],
                  ["grayscale", "Oq-qora", "grayscale"],
                ] as const
              ).map(([value, label, icon]) => (
                <button
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    settings.theme === value
                      ? "border-[#D4AF37] bg-amber-50 text-[#003366] ring-2 ring-[#D4AF37]/20"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                  }`}
                  key={value}
                  onClick={() => setTheme(value)}
                  type="button"
                >
                  <Icon name={icon} size={19} />
                  <span className="text-xs font-bold">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Sozlamalar ushbu brauzerda saqlanadi.
            </p>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-50"
              onClick={resetSettings}
              type="button"
            >
              <Icon name="reset" size={16} />
              Asliga qaytarish
            </button>
          </footer>
        </div>
      </section>
    </div>
  );
}
