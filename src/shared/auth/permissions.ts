/**
 * Single source of truth for permission strings.
 * Mirrors the backend `Marvel\Enums\Permission` PHP enum exactly (kebab-case).
 *
 * Every guard in the app must reference this catalog — raw string literals
 * are rejected by TypeScript, so a typo becomes a compile error instead of
 * a silent authorization failure.
 */

export const SUPER_ADMIN_ROLE = 'super_admin' as const;

export type RoleType =
  | 'super_admin'
  | 'store_owner'
  | 'staff'
  | 'editor'
  | 'customer';

export const PERMISSIONS = {
  sliders: {
    view: 'view-slider',
    create: 'create-slider',
    update: 'update-slider',
    delete: 'delete-slider',
  },
  notifications: {
    view: 'view-notifications',
    manage: 'manage-notifications',
  },
  activityLogs: {
    view: 'view-activity-log',
  },

  products: {
    view: 'view-products',
    viewDetail: 'view-product',
    create: 'create-product',
    update: 'update-product',
    delete: 'delete-product',
    viewDraft: 'view-draft-products',
    viewLowStock: 'view-low-stock-products',
  },
  categories: {
    view: 'view-categories',
    viewDetail: 'view-category',
    create: 'create-category',
    update: 'update-category',
    delete: 'delete-category',
    import: 'import-category',
    export: 'export-category',
  },
  shops: {
    view: 'view-shops',
    viewDetail: 'view-shop',
  },
  types: {
    view: 'view-types',
    viewDetail: 'view-type',
    create: 'create-type',
    update: 'update-type',
    delete: 'delete-type',
  },
  tags: {
    view: 'view-tags',
    viewDetail: 'view-tag',
    create: 'create-tags',
    update: 'update-tags',
    delete: 'delete-tags',
    createSingle: 'create-tag',
    updateSingle: 'update-tag',
    deleteSingle: 'delete-tag',
  },
  brands: {
    view: 'view-brands',
    viewDetail: 'view-brand',
    create: 'create-brand',
    update: 'update-brand',
    delete: 'delete-brand',
    import: 'import-brand',
    export: 'export-brand',
  },
  contacts: {
    view: 'view-contacts',
    update: 'update-contact',
    delete: 'delete-contact',
    deleteRead: 'delete-read-contacts',
  },
  coupons: {
    view: 'view-coupons',
    verify: 'verify-coupon',
    create: 'create-coupon',
    update: 'update-coupon',
    delete: 'delete-coupon',
    approve: 'approve-coupon',
    disapprove: 'disapprove-coupon',
  },
  couponAssignments: {
    view: 'view-coupon-assignments',
    create: 'create-coupon-assignment',
    update: 'update-coupon-assignment',
    delete: 'delete-coupon-assignment',
  },
  cmsPages: {
    view: 'view-cms-pages',
    viewDetail: 'view-cms-page',
    create: 'create-cms-page',
    update: 'update-cms-page',
    delete: 'delete-cms-page',
  },
  faqs: {
    view: 'view-faqs',
    create: 'create-faq',
    update: 'update-faq',
    delete: 'delete-faq',
  },
  settings: {
    view: 'view-settings',
    update: 'update-settings',
  },
  roles: {
    view: 'view-roles',
    viewDetail: 'view-role',
    create: 'create-roles',
    update: 'update-roles',
    delete: 'delete-roles',
    assign: 'assign-role',
    remove: 'remove-role',
  },
  flashSale: {
    view: 'view-flash-sale',
    create: 'create-flash-sale',
    update: 'update-flash-sale',
    delete: 'delete-flash-sale',
  },
  banners: {
    view: 'view-banners',
    create: 'create-banners',
    update: 'update-banners',
    delete: 'delete-banners',
  },
  reviews: {
    approve: 'approve-reviews',
    delete: 'delete-reviews',
    deleteSingle: 'delete-review',
  },
  siteReviews: {
    view: 'view-site-reviews',
    approve: 'approve-site-reviews',
    reject: 'reject-site-reviews',
  },
  currencies: {
    view: 'view-currencies',
    create: 'create-currency',
    update: 'update-currency',
    delete: 'delete-currency',
    setBase: 'set-base-currency',
    setCatalog: 'set-catalog-currency',
  },
  exchangeRates: {
    view: 'view-exchange-rates',
    create: 'create-exchange-rate',
    update: 'update-exchange-rate',
    delete: 'delete-exchange-rate',
  },
  shipping: {
    countriesView: 'view-country',
    countriesCreate: 'create-country',
    countriesUpdate: 'update-country',
    countriesDelete: 'delete-country',
    governoratesView: 'view-governorate',
    governoratesCreate: 'create-governorate',
    governoratesUpdate: 'update-governorate',
    governoratesDelete: 'delete-governorate',
    citiesView: 'view-city',
    citiesCreate: 'create-city',
    citiesUpdate: 'update-city',
    citiesDelete: 'delete-city',
    managePrices: 'manage-shipping-prices',
    fastShippingView: 'view-fast-shipping',
    fastShippingUpdate: 'update-fast-shipping',
  },
  orders: {
    view: 'view-orders',
    viewDetail: 'view-order',
    updateStatus: 'update-order-status',
  },
  attributes: {
    view: 'view-attributes',
    create: 'create-attribute',
    update: 'update-attribute',
    delete: 'delete-attribute',
  },
  promotions: {
    view: 'view-promotion',
    create: 'create-promotion',
    update: 'update-promotion',
    delete: 'delete-promotion',
  },
  contentPages: {
    view: 'view-content-pages',
    create: 'create-content-pages',
    update: 'update-content-pages',
    delete: 'delete-content-pages',
  },
  sections: {
    view: 'view-sections',
    create: 'create-sections',
    update: 'update-sections',
    delete: 'delete-sections',
  },
  sectionTypes: {
    view: 'view-section-types',
    create: 'create-section-types',
    update: 'update-section-types',
    delete: 'delete-section-types',
  },
  staticPages: {
    view: 'view-static-pages',
    update: 'update-static-pages',
    createSection: 'create-static-sections',
    updateSection: 'update-static-sections',
    deleteSection: 'delete-static-sections',
  },
  users: {
    view: 'view-users',
    viewAdmins: 'view-admins',
    viewVendors: 'view-vendors',
    viewCustomers: 'view-customers',
    create: 'create-user',
    update: 'update-user',
    delete: 'delete-user',
    ban: 'ban-user',
    activate: 'activate-user',
    updateActivation: 'update-user-activation',
    restore: 'restore-user',
    makeAdmin: 'make-admin',
  },
  pickupLocations: {
    view: 'view-pickup-locations',
    create: 'create-pickup-location',
    update: 'update-pickup-location',
    delete: 'delete-pickup-location',
  },
  invoices: {
    view: 'view-invoices',
    viewDetail: 'view-invoice',
    download: 'view-invoice-download',
    regenerate: 'regenerate-invoice',
    correct: 'correct-invoice',
    cancel: 'cancel-invoice',
    issueDebitNote: 'issue-debit-note',
  },
  analytics: {
    view: 'view-analytics',
  },
  profile: {
    view: 'view-profile',
    update: 'update-profile',
    changePassword: 'change-password',
  },
} as const;

type ModuleShape = Record<string, string>;

/** Union of every permission string literal defined above. */
export type Permission = {
  [M in keyof typeof PERMISSIONS]: (typeof PERMISSIONS)[M] extends ModuleShape
    ? (typeof PERMISSIONS)[M][keyof (typeof PERMISSIONS)[M]]
    : never;
}[keyof typeof PERMISSIONS];

export type PermissionModule = keyof typeof PERMISSIONS;
