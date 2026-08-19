export const pickupLocationRoutes = {
  list: '/pickup-locations',
  detail: (id: number) => '/pickup-locations/' + id,
} as const;
