export const promotionRoutes = {
  list: '/promotions',
  detail: (id: number) => `/promotions/${id}`,
} as const;
