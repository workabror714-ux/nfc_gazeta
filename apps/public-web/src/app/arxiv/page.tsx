import type { Metadata } from "next";

import { ArchiveBrowser } from "@/components/archive/archive-browser";
import { Icon } from "@/components/ui/icon";
import { getPublicIssues } from "@/lib/public-api";

export const metadata: Metadata = {
  title: "Gazeta arxivi",
  description:
    "Temiryo‘lchi gazetasining barcha elektron sonlari arxivi.",
};

export default async function ArchivePage() {
  let issues;

  try {
    issues = await getPublicIssues();
  } catch {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-100 text-red-700">
            <Icon name="close" size={28} />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-black text-red-900">
            Gazeta arxivini yuklab bo‘lmadi
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-red-700">
            Backend server ishlayotganini tekshiring va sahifani yangilang.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="mb-10 max-w-3xl">
        <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
          <Icon name="archive" size={16} />
          Elektron kutubxona
        </span>
        <h1 className="mt-3 font-serif text-4xl font-black tracking-tight text-[#003366] sm:text-5xl lg:text-6xl">
          Gazeta arxivi
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
          Temiryo‘lchi gazetasining barcha elektron sonlarini yil, nashr raqami yoki sarlavha bo‘yicha toping.
        </p>
      </header>

      {issues.length > 0 ? (
        <ArchiveBrowser issues={issues} />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
            <Icon name="archive" size={30} />
          </div>
          <h2 className="mt-4 font-serif text-xl font-bold text-[#003366]">
            Arxivda nashr mavjud emas
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Ommaga chiqarilgan gazeta sonlari shu yerda ko‘rinadi.
          </p>
        </section>
      )}
    </main>
  );
}
