export const orderRoutes = {
  list: '/orders',
  detail: (id: number) => `/orders/${id}`,
  myOrders: '/my-orders',
  myOrderInvoice: (uuid: string) => `/my-orders/invoice/${uuid}`,
} as const;
