export const pickingTaskRoutes = {
  list: '/picking-tasks',
  detail: (id: number) => '/picking-tasks/' + id,
} as const;
