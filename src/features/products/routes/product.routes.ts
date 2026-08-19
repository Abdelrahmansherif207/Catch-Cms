export const productRoutes = {
  list: '/products',
  create: '/products/create',
  detail: (id: number) => `/products/${id}`,
  edit: (id: number) => `/products/${id}/edit`,
} as const;
