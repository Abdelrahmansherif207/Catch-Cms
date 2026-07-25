export const roleRoutes = {
  list: '/roles',
  detail: (id: number) => '/roles/' + id,
} as const;
