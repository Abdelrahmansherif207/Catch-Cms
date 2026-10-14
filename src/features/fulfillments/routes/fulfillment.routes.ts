export const fulfillmentRoutes = {
  list: '/fulfillments',
  detail: (id: number) => '/fulfillments/' + id,
} as const;
