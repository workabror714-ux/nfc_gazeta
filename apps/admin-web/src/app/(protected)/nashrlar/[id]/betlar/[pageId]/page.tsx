import Link from "next/link";

import { PageEditor } from "@/components/issues/page-editor";

interface PageEditorPageProps {
  params: Promise<{
    id: string;
    pageId: string;
  }>;
}

export default async function PageEditorPage({
  params,
}: PageEditorPageProps) {
  const {
    id,
    pageId,
  } = await params;

  return (
    <>
      <header className="page-heading">
        <Link
          href={`/nashrlar/${id}`}
          className="back-link"
        >
          ← Gazeta betlariga qaytish
        </Link>

        <p className="eyebrow">
          Betni tekshirish
        </p>

        <h1>Gazeta beti tahriri</h1>

        <p>
          Original betni ajratilgan matn bilan
          solishtiring va xatolarni tuzating.
        </p>
      </header>

      <PageEditor
        issueId={id}
        pageId={pageId}
      />
    </>
  );
}