export const packingTaskRoutes = {
  list: '/packing-tasks',
  detail: (id: number) => '/packing-tasks/' + id,
} as const;
