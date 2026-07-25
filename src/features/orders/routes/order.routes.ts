export const orderRoutes = {
  list: '/orders',
  detail: (id: number) => `/orders/${id}`,
} as const;
