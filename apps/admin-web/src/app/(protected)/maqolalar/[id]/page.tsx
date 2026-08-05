import Link from "next/link";

import { ArticleEditor } from "@/components/articles/article-editor";

interface ArticlePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ArticlePage({
  params,
}: ArticlePageProps) {
  const { id } = await params;

  return (
    <>
      <header className="page-heading">
        <Link
          href="/maqolalar"
          className="back-link"
        >
          ← Maqolalarga qaytish
        </Link>

        <p className="eyebrow">
          Kontent tahriri
        </p>

        <h1>Maqolani tahrirlash</h1>

        <p>
          Maqolani tekshiring, tahrirlang va
          ommaviy saytga chiqaring.
        </p>
      </header>

      <ArticleEditor articleId={id} />
    </>
  );
}