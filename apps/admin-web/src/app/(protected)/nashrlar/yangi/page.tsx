import Link from "next/link";

import { CreateIssueForm } from "@/components/issues/create-issue-form";

export default function NewIssuePage() {
  return (
    <>
      <header className="page-heading">
        <div>
          <Link
            href="/nashrlar"
            className="back-link"
          >
            ← Nashrlarga qaytish
          </Link>

          <p className="eyebrow">
            Yangi material
          </p>

          <h1>Yangi gazeta soni</h1>

          <p>
            Gazeta sonini yarating va original PDF faylini yuklang.
          </p>
        </div>
      </header>

      <CreateIssueForm />
    </>
  );
}