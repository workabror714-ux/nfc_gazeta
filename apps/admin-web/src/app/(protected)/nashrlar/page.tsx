import Link from "next/link";

import { IssueList } from "@/components/issues/issue-list";

export default function IssuesPage() {
  return (
    <>
      <header className="page-heading page-heading-row">
        <div>
          <p className="eyebrow">
            Kontent boshqaruvi
          </p>

          <h1>Gazeta nashrlari</h1>

          <p>
            Temiryo‘lchi gazetasining barcha sonlarini boshqaring.
          </p>
        </div>

        <Link
          href="/nashrlar/yangi"
          className="primary-link-button"
        >
          + Yangi nashr
        </Link>
      </header>

      <IssueList />
    </>
  );
}