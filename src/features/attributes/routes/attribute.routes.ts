export const attributeRoutes = {
  list: '/attributes',
  detail: (id: number) => '/attributes/' + id,
} as const;
