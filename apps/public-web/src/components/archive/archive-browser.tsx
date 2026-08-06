"use client";

import {
  type ChangeEvent,
  useMemo,
  useState,
} from "react";

import { IssueCard } from "@/components/issue-card";
import { Icon } from "@/components/ui/icon";
import type {
  PublicIssueListItem,
} from "@/lib/public-types";

interface ArchiveBrowserProps {
  issues: PublicIssueListItem[];
}

export function ArchiveBrowser({
  issues,
}: ArchiveBrowserProps) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("all");

  const years = useMemo(
    () =>
      Array.from(
        new Set(issues.map((issue) => issue.year)),
      ).sort((a, b) => b - a),
    [issues],
  );

  const filteredIssues = useMemo(() => {
    const normalized = query
      .trim()
      .toLocaleLowerCase("uz");

    return issues.filter((issue) => {
      const matchesYear =
        year === "all" ||
        issue.year === Number(year);

      if (!matchesYear) {
        return false;
      }

      if (!normalized) {
        return true;
      }

      return [
        issue.title,
        issue.description,
        issue.newspaper_name,
        String(issue.issue_number),
        String(issue.year),
      ]
        .join(" ")
        .toLocaleLowerCase("uz")
        .includes(normalized);
    });
  }, [issues, query, year]);

  const grouped = useMemo(() => {
    return filteredIssues.reduce<
      Record<number, PublicIssueListItem[]>
    >((accumulator, issue) => {
      accumulator[issue.year] ??= [];
      accumulator[issue.year].push(issue);
      return accumulator;
    }, {});
  }, [filteredIssues]);

  const groupedYears = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  function resetFilters() {
    setQuery("");
    setYear("all");
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <label className="relative block">
            <Icon
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              name="search"
              size={18}
            />
            <input
              className="h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setQuery(event.target.value)
              }
              placeholder="Nashr nomi yoki soni bo‘yicha qidirish"
              type="search"
              value={query}
            />
          </label>

          <label className="relative block">
            <Icon
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              name="calendar"
              size={18}
            />
            <select
              className="h-12 w-full appearance-none rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#003366] focus:bg-white focus:ring-4 focus:ring-[#003366]/10"
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setYear(event.target.value)
              }
              value={year}
            >
              <option value="all">
                Barcha yillar
              </option>
              {years.map((value) => (
                <option key={value} value={value}>
                  {value}-yil
                </option>
              ))}
            </select>
          </label>

          <button
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:border-[#003366] hover:text-[#003366] disabled:opacity-40"
            disabled={!query && year === "all"}
            onClick={resetFilters}
            type="button"
          >
            <Icon name="reset" size={16} />
            Tozalash
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <span>
            {filteredIssues.length} ta nashr topildi
          </span>
          <span>
            {years.length} yil arxivi
          </span>
        </div>
      </section>

      {groupedYears.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-slate-400">
            <Icon name="search" size={29} />
          </div>
          <h2 className="mt-4 font-serif text-xl font-bold text-[#003366]">
            Nashr topilmadi
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Qidiruv so‘zi yoki yil filtrini o‘zgartirib ko‘ring.
          </p>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#003366] px-5 py-3 text-xs font-bold text-white"
            onClick={resetFilters}
            type="button"
          >
            <Icon name="reset" size={16} />
            Filtrlarni tozalash
          </button>
        </section>
      ) : (
        <div className="space-y-12">
          {groupedYears.map((groupYear) => (
            <section key={groupYear}>
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#C59B27]">
                    Elektron arxiv
                  </span>
                  <h2 className="mt-1 font-serif text-3xl font-black text-[#003366]">
                    {groupYear}-yil
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  {grouped[groupYear].length} ta nashr
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                {grouped[groupYear].map((issue) => (
                  <IssueCard
                    issue={issue}
                    key={issue.id}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
