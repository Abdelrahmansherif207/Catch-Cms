export const warehouseMapRoutes = {
  /** Read-only bin map for one warehouse (guarded by locations.view). */
  detail: (warehouseId: number | string) => '/warehouses/' + warehouseId + '/map',
} as const;
