export const orderFlowRoutes = {
  list: '/order-flows',
  create: '/order-flows/create',
  detail: (id: number | string) => `/order-flows/${id}`,
  statuses: '/order-statuses',
} as const;
