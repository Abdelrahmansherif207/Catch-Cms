export const batchRoutes = {
  list: '/batches',
  detail: (id: number) => '/batches/' + id,
} as const;
