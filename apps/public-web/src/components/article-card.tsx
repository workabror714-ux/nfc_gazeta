/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import {
  estimateReadingMinutes,
  formatUzbekDate,
} from "@/lib/format";
import type {
  PublicArticleCard,
} from "@/lib/public-types";

interface ArticleCardProps {
  article: PublicArticleCard;
  variant?:
    | "standard"
    | "horizontal"
    | "compact";
}

export function ArticleCard({
  article,
  variant = "standard",
}: ArticleCardProps) {
  const category =
    article.category?.name ?? "Yangiliklar";
  const date = formatUzbekDate(
    article.published_at,
  );
  const readingMinutes =
    estimateReadingMinutes(
      `${article.title} ${article.summary}`,
    );

  if (variant === "compact") {
    return (
      <article className="group border-b border-slate-100 py-4 last:border-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#C59B27]">
          <span>{category}</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">
            {article.issue_year}-yil, {article.issue_number}-son
          </span>
        </div>
        <h3 className="font-serif text-sm font-bold leading-snug text-[#003366] transition group-hover:text-[#004080]">
          <Link href={`/maqola/${article.id}`}>
            {article.title}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-400">
          {date ? <span>{date}</span> : null}
          <span>{readingMinutes} daqiqa</span>
        </div>
      </article>
    );
  }

  if (variant === "horizontal") {
    return (
      <article className="group overflow-hidden rounded-2xl border border-slate-200 border-t-4 border-t-[#D4AF37] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:flex">
        <Link
          aria-label={article.title}
          className="relative block h-52 overflow-hidden bg-slate-100 sm:h-auto sm:w-2/5"
          href={`/maqola/${article.id}`}
        >
          {article.main_image ? (
            <img
              alt={article.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
              src={article.main_image}
            />
          ) : (
            <div className="grid h-full min-h-48 place-items-center bg-gradient-to-br from-[#E9EEF4] to-[#F8FAFC] font-serif text-sm font-black tracking-[0.14em] text-[#003366]/45">
              TEMIRYO‘LCHI
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-md bg-[#003366] px-2.5 py-1 text-[10px] font-bold text-white shadow">
            {category}
          </span>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
              {date ? (
                <span className="inline-flex items-center gap-1">
                  <Icon
                    className="text-[#D4AF37]"
                    name="calendar"
                    size={14}
                  />
                  {date}
                </span>
              ) : null}
              <span>{readingMinutes} daqiqa o‘qish</span>
            </div>

            <h3 className="font-serif text-lg font-bold leading-snug text-[#003366] transition group-hover:text-[#004080]">
              <Link href={`/maqola/${article.id}`}>
                {article.title}
              </Link>
            </h3>

            {article.summary ? (
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
                {article.summary}
              </p>
            ) : null}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
            <span className="truncate text-slate-500">
              {article.author || "Tahririyat"}
            </span>
            <Link
              className="inline-flex shrink-0 items-center gap-1 font-bold text-[#003366] transition hover:text-[#D4AF37]"
              href={`/maqola/${article.id}`}
            >
              O‘qish
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <Link
        aria-label={article.title}
        className="relative block aspect-[16/10] overflow-hidden bg-slate-100"
        href={`/maqola/${article.id}`}
      >
        {article.main_image ? (
          <img
            alt={article.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
            src={article.main_image}
          />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-[#E7EDF3] to-[#F8FAFC] font-serif text-xs font-black tracking-[0.15em] text-[#003366]/45">
            TEMIRYO‘LCHI
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-[#003366] px-2.5 py-1 text-[10px] font-bold text-white shadow">
          {category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
          {date ? (
            <span className="inline-flex items-center gap-1">
              <Icon
                className="text-[#D4AF37]"
                name="calendar"
                size={14}
              />
              {date}
            </span>
          ) : null}
          <span>{readingMinutes} daq.</span>
        </div>

        <h3 className="font-serif text-lg font-bold leading-snug text-[#003366] transition group-hover:text-[#004080]">
          <Link href={`/maqola/${article.id}`}>
            {article.title}
          </Link>
        </h3>

        {article.summary ? (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">
            {article.summary}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs">
          <span className="truncate text-slate-500">
            {article.author || "Tahririyat"}
          </span>
          <Link
            className="inline-flex shrink-0 items-center gap-1 font-bold text-[#003366] transition hover:text-[#D4AF37]"
            href={`/maqola/${article.id}`}
          >
            Batafsil
            <Icon name="arrow-right" size={15} />
          </Link>
        </div>
      </div>
    </article>
  );
}
