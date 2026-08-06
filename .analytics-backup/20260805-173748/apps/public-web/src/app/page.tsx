import Link from "next/link";

import { ArticleCard } from "@/components/article-card";
import { FeaturedArticle } from "@/components/featured-article";
import { IssueCard } from "@/components/issue-card";
import { Icon } from "@/components/ui/icon";
import {
  getPublicHome,
  getPublicIssues,
} from "@/lib/public-api";

export default async function HomePage() {
  let data;
  let issues;

  try {
    [data, issues] = await Promise.all([
      getPublicHome(),
      getPublicIssues(),
    ]);
  } catch {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-700">
            <Icon name="close" size={28} />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-black text-red-900">
            Ma’lumotlarni yuklab bo‘lmadi
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-700">
            Backend server ishlayotganini tekshiring va sahifani yangilang.
          </p>
        </section>
      </main>
    );
  }

  const latestIssue = data.latest_issue;
  const featuredArticle =
    data.featured_articles[0] ?? null;
  const additionalFeatured =
    data.featured_articles.slice(1, 4);
  const recentIssues = issues
    .filter(
      (issue) =>
        issue.id !== latestIssue?.id,
    )
    .slice(0, 4);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#002244] border-t-4 border-t-[#D4AF37] bg-[#003366] p-5 text-white shadow-lg sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#D4AF37]/50 bg-[#D4AF37]/10 text-[#D4AF37]">
            <Icon name="nfc" size={22} />
          </span>
          <div>
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#D4AF37]">
              NFC avtomatik o‘quvchi
            </span>
            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-100">
              Bosma gazetadagi NFC stikerga telefoningizni yaqinlashtirsangiz, aynan o‘sha elektron son darhol ochiladi.
            </p>
          </div>
        </div>

        {latestIssue ? (
          <Link
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-5 text-xs font-black text-[#003366] shadow transition hover:bg-[#E5C358]"
            href={`/n/${latestIssue.nfc_slug}`}
          >
            Eng so‘nggi son
            <Icon name="arrow-right" size={16} />
          </Link>
        ) : null}
      </section>

      {latestIssue ? (
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Icon
                className="text-[#003366]"
                name="newspaper"
              />
              <h2 className="font-serif text-xl font-black text-[#003366] sm:text-2xl">
                Eng so‘nggi elektron nashr
              </h2>
            </div>
            <Link
              className="inline-flex items-center gap-1 text-xs font-bold text-[#003366] transition hover:text-[#D4AF37]"
              href="/arxiv"
            >
              Arxivga o‘tish
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>

          <IssueCard
            featured
            issue={latestIssue}
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
            <Icon name="newspaper" size={30} />
          </div>
          <h2 className="mt-4 font-serif text-xl font-bold text-[#003366]">
            Hozircha ommaviy nashr mavjud emas
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Admin panel orqali birinchi gazeta sonini ommaga chiqaring.
          </p>
        </section>
      )}

      {featuredArticle ? (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.17em] text-[#C59B27]">
                Tahririyat tanlovi
              </span>
              <h2 className="mt-1 font-serif text-2xl font-black text-[#003366] sm:text-3xl">
                Muhim maqola
              </h2>
            </div>
          </div>

          <FeaturedArticle article={featuredArticle} />

          {additionalFeatured.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {additionalFeatured.map((article) => (
                <ArticleCard
                  article={article}
                  key={article.id}
                />
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {data.categories.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#003366]">
            <Icon
              className="text-[#D4AF37]"
              name="archive"
              size={17}
            />
            Mavzular bo‘yicha ruknlar
          </div>
          <div className="flex flex-wrap gap-2">
            {data.categories.map((category) => (
              <Link
                className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-[#003366] hover:text-white"
                href={`/qidiruv?category=${encodeURIComponent(
                  category.slug,
                )}`}
                key={category.id}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.17em] text-[#C59B27]">
              So‘nggi materiallar
            </span>
            <h2 className="mt-1 font-serif text-2xl font-black text-[#003366] sm:text-3xl">
              Yangi maqolalar va tahlillar
            </h2>
          </div>
        </div>

        {data.latest_articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.latest_articles.map((article) => (
              <ArticleCard
                article={article}
                key={article.id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              Hozircha maqolalar nashr qilinmagan.
            </p>
          </div>
        )}
      </section>

      {recentIssues.length > 0 ? (
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm sm:p-8">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.17em] text-[#C59B27]">
                Elektron arxivdan
              </span>
              <h2 className="mt-1 font-serif text-2xl font-black text-[#003366]">
                O‘tgan gazeta sonlari
              </h2>
            </div>
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 text-xs font-bold text-white transition hover:bg-[#002244]"
              href="/arxiv"
            >
              <Icon
                className="text-[#D4AF37]"
                name="archive"
                size={17}
              />
              Barcha sonlarni ko‘rish
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {recentIssues.map((issue) => (
              <IssueCard
                issue={issue}
                key={issue.id}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="relative overflow-hidden rounded-2xl border-b-4 border-[#D4AF37] bg-[#003366] p-7 text-white shadow-xl sm:p-10">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="relative max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#003366]">
            <Icon name="nfc" size={14} />
            Rasmiy NFC integratsiya
          </span>
          <h2 className="mt-5 font-serif text-2xl font-black leading-tight sm:text-4xl">
            Bosma gazeta va elektron nashr bir tizimda
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            Har bir bosma sonning muqovasidagi NFC stiker foydalanuvchini aynan o‘sha gazetaning elektron nusxasiga olib boradi. Betlarni asl ko‘rinishda ko‘rish, matnni qulay o‘qish va audio shaklini tinglash mumkin.
          </p>
          <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-[#D4AF37]">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="shield" size={16} />
              Rasmiy elektron nusxa
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="book" size={16} />
              Betma-bet o‘qish
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Icon name="eye" size={16} />
              Maxsus imkoniyatlar
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
