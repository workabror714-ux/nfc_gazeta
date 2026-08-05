import Link from "next/link";

import { IssueReview } from "@/components/issues/issue-review";

interface IssuePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function IssuePage({
  params,
}: IssuePageProps) {
  const { id } = await params;

  return (
    <>
      <header className="page-heading">
        <Link
          href="/nashrlar"
          className="back-link"
        >
          ← Nashrlarga qaytish
        </Link>

        <p className="eyebrow">
          Nashrni tekshirish
        </p>
      </header>

      <IssueReview issueId={id} />
    </>
  );
}