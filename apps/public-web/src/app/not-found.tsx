import Link from "next/link";

import { Icon } from "@/components/ui/icon";

export default function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-[65vh] w-full max-w-7xl place-items-center px-4 py-16 sm:px-6 lg:px-8">
      <section className="max-w-2xl text-center">
        <span className="font-serif text-8xl font-black text-[#D4AF37]">
          404
        </span>
        <h1 className="mt-3 font-serif text-3xl font-black text-[#003366] sm:text-4xl">
          Sahifa topilmadi
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
          Siz ochmoqchi bo‘lgan gazeta soni yoki maqola mavjud emas yoxud hali ommaga chiqarilmagan.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#003366] px-5 text-xs font-bold text-white"
            href="/"
          >
            <Icon name="newspaper" size={17} />
            Bosh sahifa
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 text-xs font-bold text-[#003366]"
            href="/arxiv"
          >
            <Icon name="archive" size={17} />
            Gazeta arxivi
          </Link>
        </div>
      </section>
    </main>
  );
}
