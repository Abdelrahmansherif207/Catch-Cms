export interface PaginatedPage<T> {
  data: T[];
  total: number;
  last_page: number;
  current_page: number;
}

const MAX_PAGES = 100;

export async function fetchAllPages<T>(
  fetchPage: (page: number) => Promise<PaginatedPage<T>>,
): Promise<T[]> {
  const first = await fetchPage(1);
  if (!first || first.last_page <= 1) return first?.data ?? [];

  const lastPage = Math.min(first.last_page, MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, i) => fetchPage(i + 2)),
  );

  const all = [...first.data];
  for (const page of rest) all.push(...page.data);
  return all;
}
