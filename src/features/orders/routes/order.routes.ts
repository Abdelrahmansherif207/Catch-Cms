export const orderRoutes = {
  list: '/orders',
  detail: (id: number) => `/orders/${id}`,
  myOrders: '/my-orders',
} as const;
