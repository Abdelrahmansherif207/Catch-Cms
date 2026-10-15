export const shipmentRoutes = {
  /** The WMS list is fulfillment-scoped — the page tokenizes a fulfillment. */
  list: '/shipments',
  detail: (id: number) => '/shipments/' + id,
  forFulfillment: (fulfillmentId: number) => '/shipments?fulfillment_id=' + fulfillmentId,
} as const;
