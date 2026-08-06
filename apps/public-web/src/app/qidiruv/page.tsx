import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/article-card";
import { Icon } from "@/components/ui/icon";
import { getPublicArticles } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Qidiruv",
};

interface SearchPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
  }>;
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;
  const search = params.search?.trim() ?? "";
  const category = params.category?.trim() ?? "";

  let articles;

  try {
    articles = await getPublicArticles({
      search: search || undefined,
      category: category || undefined,
    });
  } catch {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <h1 className="font-serif text-2xl font-black text-red-900">
            Qidiruv natijalarini yuklab bo‘lmadi
          </h1>
        </section>
      </main>
    );
  }

  const heading = search
    ? `“${search}” bo‘yicha natijalar`
    : category
      ? "Tanlangan rukn maqolalari"
      : "Barcha maqolalar";

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-9 max-w-3xl">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
          <Icon name="search" size={16} />
          Sayt bo‘yicha qidiruv
        </span>
        <h1 className="mt-3 font-serif text-4xl font-black tracking-tight text-[#003366] sm:text-5xl">
          {heading}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {articles.length} ta maqola topildi.
        </p>
      </header>

      {articles.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <ArticleCard
              article={article}
              key={article.id}
            />
          ))}
        </div>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
            <Icon name="search" size={30} />
          </div>
          <h2 className="mt-4 font-serif text-xl font-bold text-[#003366]">
            Hech narsa topilmadi
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Boshqa kalit so‘z bilan qidiring yoki gazeta arxivini ko‘ring.
          </p>
          <Link
            className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 text-xs font-bold text-white"
            href="/arxiv"
          >
            <Icon name="archive" size={17} />
            Gazeta arxivi
          </Link>
        </section>
      )}
    </main>
  );
}
