export const invoiceRoutes = {
  list: '/invoices',
  detail: (id: number) => `/invoices/${id}`,
  detailUuid: (uuid: string) => `/invoices/uuid/${uuid}`,
  verify: (uuid: string) => `/invoices/${uuid}/verify`,
  myInvoices: '/my-invoices',
} as const;