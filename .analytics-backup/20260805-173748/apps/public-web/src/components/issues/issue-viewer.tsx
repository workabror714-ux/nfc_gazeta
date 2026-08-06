"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Icon } from "@/components/ui/icon";
import type {
  PublicIssueDetail,
} from "@/lib/public-types";

interface IssueViewerProps {
  issue: PublicIssueDetail;
}

type ViewerMode = "image" | "text";
type FitMode = "manual" | "width";

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(
    Math.max(value, minimum),
    maximum,
  );
}

export function IssueViewer({
  issue,
}: IssueViewerProps) {
  const pages = issue.pages;
  const viewerRef = useRef<HTMLElement | null>(null);

  const [currentIndex, setCurrentIndex] =
    useState(0);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] =
    useState<ViewerMode>("image");
  const [fitMode, setFitMode] =
    useState<FitMode>("width");
  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const currentPage = useMemo(
    () => pages[currentIndex] ?? null,
    [currentIndex, pages],
  );

  const selectPage = useCallback(
    (pageIndex: number) => {
      setCurrentIndex(
        clamp(
          pageIndex,
          0,
          Math.max(pages.length - 1, 0),
        ),
      );
      setZoom(1);
      setFitMode("width");
    },
    [pages.length],
  );

  const goToPreviousPage = useCallback(() => {
    selectPage(currentIndex - 1);
  }, [currentIndex, selectPage]);

  const goToNextPage = useCallback(() => {
    selectPage(currentIndex + 1);
  }, [currentIndex, selectPage]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.key === "ArrowLeft") {
        goToPreviousPage();
      }

      if (event.key === "ArrowRight") {
        goToNextPage();
      }

      if (event.key === "+" || event.key === "=") {
        setFitMode("manual");
        setZoom((current) =>
          clamp(current + 0.2, 0.5, 3),
        );
      }

      if (event.key === "-") {
        setFitMode("manual");
        setZoom((current) =>
          clamp(current - 0.2, 0.5, 3),
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [goToNextPage, goToPreviousPage]);

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(
        document.fullscreenElement ===
          viewerRef.current,
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  async function toggleFullscreen() {
    const viewer = viewerRef.current;

    if (!viewer) {
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await viewer.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by the browser.
    }
  }

  if (!currentPage || pages.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
          <Icon name="file-text" size={30} />
        </div>
        <h2 className="mt-4 font-serif text-xl font-bold text-[#003366]">
          Gazeta betlari topilmadi
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Ushbu nashr betlari hali ommaviy ko‘rish uchun tayyorlanmagan.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`issue-reader overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${
        isFullscreen
          ? "h-screen w-screen rounded-none border-0"
          : ""
      }`}
      ref={viewerRef}
    >
      <div className="flex flex-col border-b border-slate-200 bg-[#003366] text-white xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3 py-3 xl:border-b-0 xl:px-4">
          <div className="flex items-center gap-2">
            <button
              aria-label="Oldingi bet"
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
              disabled={currentIndex === 0}
              onClick={goToPreviousPage}
              type="button"
            >
              <Icon name="chevron-left" />
            </button>
            <span className="min-w-24 text-center text-xs font-black">
              {currentPage.page_number} / {pages.length}
            </span>
            <button
              aria-label="Keyingi bet"
              className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/5 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
              disabled={
                currentIndex === pages.length - 1
              }
              onClick={goToNextPage}
              type="button"
            >
              <Icon name="chevron-right" />
            </button>
          </div>

          <span className="hidden items-center gap-1.5 text-[10px] text-slate-300 sm:inline-flex">
            <Icon
              className="text-[#D4AF37]"
              name="nfc"
              size={14}
            />
            NFC elektron o‘quvchi
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-3 py-3 xl:justify-end xl:px-4">
          <div className="flex rounded-lg border border-white/15 bg-white/5 p-1">
            <button
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-[10px] font-bold transition ${
                mode === "image"
                  ? "bg-[#D4AF37] text-[#003366]"
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => setMode("image")}
              type="button"
            >
              <Icon name="newspaper" size={15} />
              Gazeta
            </button>
            <button
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-[10px] font-bold transition ${
                mode === "text"
                  ? "bg-[#D4AF37] text-[#003366]"
                  : "text-white hover:bg-white/10"
              }`}
              onClick={() => setMode("text")}
              type="button"
            >
              <Icon name="text" size={15} />
              Matn
            </button>
          </div>

          {mode === "image" ? (
            <>
              <button
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-bold transition ${
                  fitMode === "width"
                    ? "border-[#D4AF37] bg-[#D4AF37] text-[#003366]"
                    : "border-white/15 bg-white/5 text-white hover:bg-white/10"
                }`}
                onClick={() => {
                  setFitMode("width");
                  setZoom(1);
                }}
                type="button"
              >
                <Icon name="fullscreen" size={15} />
                Eniga moslash
              </button>

              <div className="flex items-center rounded-lg border border-white/15 bg-white/5 p-1">
                <button
                  aria-label="Kichraytirish"
                  className="grid h-8 w-8 place-items-center rounded-md hover:bg-white/10"
                  onClick={() => {
                    setFitMode("manual");
                    setZoom((current) =>
                      clamp(current - 0.2, 0.5, 3),
                    );
                  }}
                  type="button"
                >
                  <Icon name="minus" size={16} />
                </button>
                <span className="min-w-14 text-center text-[10px] font-bold">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  aria-label="Kattalashtirish"
                  className="grid h-8 w-8 place-items-center rounded-md hover:bg-white/10"
                  onClick={() => {
                    setFitMode("manual");
                    setZoom((current) =>
                      clamp(current + 0.2, 0.5, 3),
                    );
                  }}
                  type="button"
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </>
          ) : null}

          <button
            aria-label="To‘liq ekran"
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 bg-white/5 transition hover:bg-white/10"
            onClick={() => {
              void toggleFullscreen();
            }}
            type="button"
          >
            <Icon name="fullscreen" size={17} />
          </button>
        </div>
      </div>

      <div className="grid min-h-[720px] lg:grid-cols-[150px_minmax(0,1fr)]">
        <aside className="custom-scrollbar flex gap-2 overflow-x-auto border-b border-slate-200 bg-slate-100 p-3 lg:block lg:max-h-[850px] lg:space-y-3 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          {pages.map((page, index) => (
            <button
              aria-current={
                index === currentIndex
                  ? "page"
                  : undefined
              }
              className={`w-24 shrink-0 rounded-xl border-2 bg-white p-1.5 text-left transition lg:w-full ${
                index === currentIndex
                  ? "border-[#D4AF37] shadow-md ring-2 ring-[#D4AF37]/20"
                  : "border-transparent hover:border-slate-300"
              }`}
              key={page.id}
              onClick={() => selectPage(index)}
              type="button"
            >
              <span className="grid aspect-[0.72] place-items-center overflow-hidden rounded-md bg-slate-200">
                {page.page_image ? (
                  <img
                    alt={`${page.page_number}-bet`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    src={page.page_image}
                  />
                ) : (
                  <Icon
                    className="text-slate-400"
                    name="file-text"
                  />
                )}
              </span>
              <strong className="mt-1.5 block text-center text-[10px] text-[#003366]">
                {page.page_number}-bet
              </strong>
            </button>
          ))}
        </aside>

        <div className="min-w-0 bg-slate-200/80">
          {mode === "image" ? (
            <div className="custom-scrollbar h-[760px] overflow-auto p-3 text-center sm:p-6 lg:h-[850px]">
              {currentPage.page_image ? (
                <div
                  className={`mx-auto transition-all duration-200 ${
                    fitMode === "width"
                      ? "w-full max-w-5xl"
                      : "w-max"
                  }`}
                  style={
                    fitMode === "manual"
                      ? {
                          transform: `scale(${zoom})`,
                          transformOrigin: "top center",
                        }
                      : undefined
                  }
                >
                  <img
                    alt={`${currentPage.page_number}-bet`}
                    className={`mx-auto block bg-white shadow-2xl ${
                      fitMode === "width"
                        ? "h-auto w-full object-contain"
                        : "h-auto max-w-none"
                    }`}
                    src={currentPage.page_image}
                  />
                </div>
              ) : (
                <div className="grid h-full place-items-center text-sm text-slate-500">
                  Bet rasmi mavjud emas.
                </div>
              )}
            </div>
          ) : (
            <article className="custom-scrollbar h-[760px] overflow-y-auto bg-white px-5 py-8 sm:px-10 lg:h-[850px] lg:px-16 lg:py-14">
              <div className="mx-auto max-w-3xl">
                <div className="mb-7 flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#C59B27]">
                      Qulay o‘qish rejimi
                    </span>
                    <h2 className="mt-1 font-serif text-2xl font-black text-[#003366]">
                      {currentPage.page_number}-bet
                    </h2>
                  </div>
                  <Icon
                    className="text-slate-300"
                    name="text"
                    size={28}
                  />
                </div>

                <div className="space-y-5 font-serif text-[1.05rem] leading-8 text-slate-800">
                  {currentPage.final_text ? (
                    currentPage.final_text
                      .split(/\n{2,}/)
                      .map((paragraph) =>
                        paragraph.trim(),
                      )
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index}>
                          {paragraph}
                        </p>
                      ))
                  ) : (
                    <p className="text-slate-500">
                      Ushbu bet uchun matn mavjud emas.
                    </p>
                  )}
                </div>

                {currentPage.audio ? (
                  <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#003366]">
                      <Icon
                        className="text-[#D4AF37]"
                        name="volume"
                        size={17}
                      />
                      Betni tinglash
                    </div>
                    <audio
                      className="w-full"
                      controls
                      src={currentPage.audio}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          )}
        </div>
      </div>

      <footer className="flex flex-col gap-2 border-t border-slate-200 bg-white px-4 py-3 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Klaviatura: ← → bet almashtirish, + − masshtab
        </span>
        <span>
          {issue.newspaper_name} · {issue.year}-yil, {issue.issue_number}-son
        </span>
      </footer>
    </section>
  );
}
