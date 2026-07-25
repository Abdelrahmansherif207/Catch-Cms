export const userRoutes = {
  list: '/users',
  detail: (id: number) => '/users/' + id,
} as const;
