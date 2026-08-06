export function formatUzbekDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function estimateReadingMinutes(
  text: string,
): number {
  const wordCount = text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(wordCount / 180));
}

export function issueLabel(
  year: number,
  issueNumber: number,
): string {
  return `${year}-yil, ${issueNumber}-son`;
}
