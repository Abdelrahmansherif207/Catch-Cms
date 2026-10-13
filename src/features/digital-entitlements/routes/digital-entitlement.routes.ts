export const digitalEntitlementRoutes = {
  list: '/digital-entitlements',
  byOrder: (orderId: number) => `/digital-entitlements?order_id=${orderId}`,
} as const;
