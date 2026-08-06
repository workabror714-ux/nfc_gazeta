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

export function FeaturedArticle({
  article,
}: {
  article: PublicArticleCard;
}) {
  const date = formatUzbekDate(
    article.published_at,
  );
  const minutes = estimateReadingMinutes(
    `${article.title} ${article.summary}`,
  );

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 border-t-4 border-t-[#D4AF37] bg-white shadow-lg">
      <div className="grid lg:grid-cols-12">
        <Link
          aria-label={article.title}
          className="group relative min-h-[300px] overflow-hidden bg-slate-100 lg:col-span-7 lg:min-h-[440px]"
          href={`/maqola/${article.id}`}
        >
          {article.main_image ? (
            <img
              alt={article.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              src={article.main_image}
            />
          ) : (
            <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#E4EAF0] to-[#F8FAFC] font-serif text-lg font-black tracking-[0.2em] text-[#003366]/40">
              TEMIRYO‘LCHI
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent lg:hidden" />
          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#003366] px-3 py-1.5 text-[10px] font-bold text-white shadow-lg">
              <span className="text-[#D4AF37]">★</span>
              Asosiy maqola
            </span>
            <span className="rounded-full bg-[#D4AF37] px-3 py-1.5 text-[10px] font-black text-[#003366] shadow-lg">
              {article.category?.name ?? "Yangiliklar"}
            </span>
          </div>
        </Link>

        <div className="flex flex-col justify-between p-6 sm:p-8 lg:col-span-5 lg:p-10">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] font-medium text-slate-500">
              {date ? (
                <span className="inline-flex items-center gap-1.5">
                  <Icon
                    className="text-[#D4AF37]"
                    name="calendar"
                    size={15}
                  />
                  {date}
                </span>
              ) : null}
              <span>{minutes} daqiqa mutolaa</span>
            </div>

            <h2 className="font-serif text-2xl font-black leading-tight text-[#003366] sm:text-3xl lg:text-4xl">
              <Link
                className="transition hover:text-[#004080]"
                href={`/maqola/${article.id}`}
              >
                {article.title}
              </Link>
            </h2>

            {article.summary ? (
              <p className="mt-5 text-sm leading-7 text-slate-600 sm:text-base">
                {article.summary}
              </p>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs">
              <strong className="block text-[#003366]">
                {article.author || "Temiryo‘lchi tahririyati"}
              </strong>
              <span className="text-slate-500">
                {article.newspaper_name}
              </span>
            </div>

            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 text-xs font-bold text-white shadow transition hover:bg-[#002244]"
              href={`/maqola/${article.id}`}
            >
              Maqolani o‘qish
              <Icon
                className="text-[#D4AF37]"
                name="arrow-right"
                size={17}
              />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
