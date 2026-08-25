export const invoiceRoutes = {
  list: '/invoices',
  detail: (id: number) => `/invoices/${id}`,
  verify: (uuid: string) => `/invoices/${uuid}/verify`,
  myInvoices: '/my-invoices',
} as const;