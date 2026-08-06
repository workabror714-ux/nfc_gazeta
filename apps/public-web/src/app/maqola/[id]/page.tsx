import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ArticleReader } from "@/components/articles/article-reader";
import { getPublicArticle } from "@/lib/public-api";

interface ArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const article = await getPublicArticle(id);

    if (!article) {
      return {
        title: "Maqola topilmadi",
      };
    }

    return {
      title: article.title,
      description:
        article.summary ||
        article.content.slice(0, 160),
    };
  } catch {
    return {
      title: "Elektron maqola",
    };
  }
}

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { id } = await params;

  let article;

  try {
    article = await getPublicArticle(id);
  } catch {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <h1 className="font-serif text-2xl font-black text-red-900">
            Maqolani yuklab bo‘lmadi
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-700">
            Backend server bilan aloqa mavjudligini tekshiring.
          </p>
        </section>
      </main>
    );
  }

  if (!article) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <ArticleReader article={article} />
    </main>
  );
}
