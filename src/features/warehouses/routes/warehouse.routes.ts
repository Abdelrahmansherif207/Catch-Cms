export const warehouseRoutes = {
  list: '/warehouses',
  detail: (id: number | string) => '/warehouses/' + id,
} as const;
