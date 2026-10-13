export const locationRoutes = {
  list: '/locations',
  detail: (id: number | string) => '/locations/' + id,
} as const;
