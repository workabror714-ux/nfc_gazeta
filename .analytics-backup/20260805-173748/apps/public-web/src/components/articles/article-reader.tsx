"use client";

/* eslint-disable @next/next/no-img-element */

import {
  useRef,
  useState,
} from "react";
import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import {
  estimateReadingMinutes,
  formatUzbekDate,
} from "@/lib/format";
import type {
  PublicArticleDetail,
} from "@/lib/public-types";

interface ArticleReaderProps {
  article: PublicArticleDetail;
}

type ArticleFontSize = "base" | "large" | "xlarge";

export function ArticleReader({
  article,
}: ArticleReaderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [fontSize, setFontSize] =
    useState<ArticleFontSize>("large");
  const [isPlaying, setIsPlaying] =
    useState(false);
  const [speed, setSpeed] = useState(1);
  const [copied, setCopied] = useState(false);

  const paragraphs = article.content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const readingMinutes = estimateReadingMinutes(
    article.content,
  );

  const fontClass = {
    base: "text-[1.02rem] leading-8",
    large: "text-[1.15rem] leading-9",
    xlarge: "text-[1.3rem] leading-10",
  }[fontSize];

  async function handleShare() {
    const shareData = {
      title: article.title,
      text: article.summary || article.title,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          window.location.href,
        );
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // Share cancellation is ignored.
    }
  }

  async function toggleAudio() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function changeSpeed(value: number) {
    setSpeed(value);

    if (audioRef.current) {
      audioRef.current.playbackRate = value;
    }
  }

  return (
    <article className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          className="inline-flex items-center gap-2 text-xs font-bold text-[#003366] transition hover:text-[#D4AF37]"
          href={`/n/${article.issue_nfc_slug}`}
        >
          <Icon name="arrow-left" size={16} />
          {article.issue_year}-yil, {article.issue_number}-songa qaytish
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500">
            Shrift:
          </span>
          {(
            [
              ["base", "Kichik"],
              ["large", "O‘rtacha"],
              ["xlarge", "Katta"],
            ] as const
          ).map(([value, label]) => (
            <button
              className={`rounded-lg px-3 py-1.5 text-[10px] font-bold transition ${
                fontSize === value
                  ? "bg-[#003366] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              key={value}
              onClick={() => setFontSize(value)}
              type="button"
            >
              {label}
            </button>
          ))}

          <button
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-bold text-[#003366] transition hover:bg-slate-200"
            onClick={() => {
              void handleShare();
            }}
            type="button"
          >
            <Icon
              name={copied ? "check" : "share"}
              size={14}
            />
            {copied ? "Nusxalandi" : "Ulashish"}
          </button>
        </div>
      </div>

      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#003366] px-3 py-1 text-[10px] font-bold text-white">
            {article.category?.name ??
              article.newspaper_name}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {article.issue_year}-yil, {article.issue_number}-son
          </span>
        </div>

        <h1 className="max-w-4xl font-serif text-4xl font-black leading-[1.05] tracking-tight text-[#003366] sm:text-5xl lg:text-6xl">
          {article.title}
        </h1>

        {article.summary ? (
          <p className="max-w-4xl border-l-4 border-[#D4AF37] pl-5 font-serif text-lg leading-8 text-slate-600 sm:text-xl">
            {article.summary}
          </p>
        ) : null}

        <div className="flex flex-col gap-4 border-y border-slate-200 py-4 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-[#003366] text-[#D4AF37]">
              <Icon name="user" size={20} />
            </span>
            <div>
              <strong className="block text-sm text-[#003366]">
                {article.author || "Temiryo‘lchi tahririyati"}
              </strong>
              <span className="text-slate-500">
                Muallif
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-500">
            {article.published_at ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon
                  className="text-[#D4AF37]"
                  name="calendar"
                  size={15}
                />
                {formatUzbekDate(
                  article.published_at,
                )}
              </span>
            ) : null}
            <span>{readingMinutes} daqiqa o‘qish</span>
          </div>
        </div>
      </header>

      {article.audio ? (
        <section className="flex flex-col gap-4 rounded-2xl border border-[#004080] border-t-4 border-t-[#D4AF37] bg-[#003366] p-5 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <audio
            onEnded={() => setIsPlaying(false)}
            ref={audioRef}
            src={article.audio}
          />
          <div className="flex items-center gap-4">
            <button
              aria-label={
                isPlaying
                  ? "Audio pauza"
                  : "Audioni ijro etish"
              }
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#D4AF37] text-[#003366] shadow transition hover:scale-105"
              onClick={() => {
                void toggleAudio();
              }}
              type="button"
            >
              <Icon
                name={isPlaying ? "pause" : "play"}
                size={22}
              />
            </button>
            <div>
              <strong className="flex items-center gap-2 text-sm">
                <Icon
                  className="text-[#D4AF37]"
                  name="volume"
                  size={17}
                />
                Maqolani tinglash
              </strong>
              <p className="mt-1 text-xs text-slate-300">
                Audio shakli mavjud
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 text-[10px]">
            <span className="px-2 text-slate-300">
              Tezlik:
            </span>
            {[1, 1.25, 1.5].map((value) => (
              <button
                className={`rounded-md px-2.5 py-1.5 font-bold transition ${
                  speed === value
                    ? "bg-[#D4AF37] text-[#003366]"
                    : "text-white hover:bg-white/10"
                }`}
                key={value}
                onClick={() => changeSpeed(value)}
                type="button"
              >
                {value}x
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {article.main_image ? (
        <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl">
          <img
            alt={article.title}
            className="max-h-[680px] w-full object-contain"
            src={article.main_image}
          />
        </figure>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10 lg:p-12">
        <div
          className={`mx-auto max-w-3xl space-y-6 font-serif text-slate-800 ${fontClass}`}
        >
          {paragraphs.length > 0 ? (
            paragraphs.map((paragraph, index) => (
              <p
                className={
                  index === 0
                    ? "first-letter:float-left first-letter:mr-2 first-letter:font-serif first-letter:text-5xl first-letter:font-black first-letter:leading-none first-letter:text-[#003366]"
                    : undefined
                }
                key={index}
              >
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-slate-500">
              Maqola matni mavjud emas.
            </p>
          )}
        </div>

        <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 text-xs font-bold text-white transition hover:bg-[#002244]"
            href={`/n/${article.issue_nfc_slug}`}
          >
            <Icon
              className="text-[#D4AF37]"
              name="book"
              size={17}
            />
            Gazeta soniga qaytish
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-[#003366] transition hover:text-[#D4AF37]"
            onClick={() => {
              void handleShare();
            }}
            type="button"
          >
            <Icon name="share" size={16} />
            Havolani ulashish
          </button>
        </div>
      </div>
    </article>
  );
}
