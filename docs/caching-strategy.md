# React Query Caching Strategy — Meem Market CMS

> Date: 2026-07-04
> Status: Proposed

---

## 1. Current State Assessment

### 1.1 React Query Initialization (`src/app/main.tsx`)

```tsx
const queryClient = new QueryClient()  // zero options
```

**Effective defaults (all implicit):**

| Option | Value | Impact |
|---|---|---|
| `staleTime` | `0` | Every query refetches on mount — high network churn |
| `gcTime` | `5 * 60 * 1000` (5 min) | Reasonable default |
| `refetchOnWindowFocus` | `true` | Unnecessary for admin panel; wastes requests |
| `refetchOnReconnect` | `true` | Acceptable but triggers unexpected refetches |
| `retry` | `3` | Acceptable for an admin panel |

### 1.2 Existing staleTime Overrides

Only **5 out of ~45 queries** customize `staleTime`:

| Query Key | File | staleTime |
|---|---|---|
| `['section-types']` | `use-sections.ts:47` | 5 min |
| `['product-types']` | `use-sections.ts:59` | 5 min |
| `['permissions']` | `use-roles.ts:102` | 5 min |
| `['users', 'search', search]` | `use-roles.ts:126` | 30 sec |
| `['users', id]` | `use-roles.ts:134` | 30 sec |

No query uses `gcTime` explicitly.

### 1.3 Problems Identified

| # | Problem | Details |
|---|---|---|
| **P1** | No global defaults | `staleTime: 0` + `refetchOnWindowFocus: true` causes excessive refetching |
| **P2** | Coarse invalidation | All mutations invalidate only the top-level key (e.g., `['products']`), refetching *every* product query (list, detail, search) |
| **P3** | No query key factory | Keys are inline strings scattered across 17+ feature files — fragile, no type safety |
| **P4** | Cross-contamination | `['products', 'search', search]` is shared by brands, sliders, flash-sales, and promotions hooks — cache collisions if searched simultaneously |
| **P5** | Few optimistic updates | Only 2 mutations (reorder brands, delete role) use optimistic updates — most toggles/status changes wait for network |
| **P6** | Devtools unused | `@tanstack/react-query-devtools` is in `package.json` but never imported |
| **P7** | Import polling timeout | 3-minute hard-coded `setTimeout` in import status polling could leak if unmounted early |

---

## 2. Proposed Configuration

### 2.1 Global Defaults

Update `src/app/main.tsx`:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,            // 30s — avoids refetch on rapid navigation
      gcTime: 5 * 60 * 1000,        // 5 min (default, explicit for clarity)
      refetchOnWindowFocus: false,   // admin panel: unnecessary
      refetchOnReconnect: true,      // keep default
      retry: 2,                      // reduce from default 3
    },
    mutations: {
      retry: 0,                      // mutations should fail fast
    },
  },
})
```

### 2.2 staleTime Tiers

| Tier | staleTime | Entities | Rationale |
|---|---|---|---|
| **Static** | 10 min | `permissions`, `section-types`, `product-types` | Almost never changes |
| **Slow** | 5 min | `settings`, `roles` (list), `sections`, `profile` | Only changes via admin action |
| **Moderate** | 2 min | `brands`, `categories`, `attributes`, `shops` | Admin changes occasionally |
| **Normal** | 1 min | `sliders`, `flash-sales`, `promotions`, `faqs`, `coupons`, `users` | Moderate change frequency |
| **Dynamic** | 30s | `products` (list), `orders`, `contacts` | Can change from outside system or bulk ops |
| **Volatile** | 0 | `product-search` (any feature), filter comboboxes, import-status | One-time use / polling — always fresh |
| **Detail** | 2 min | Entity details (`products/:id`, `categories/:id`, etc.) | Stale longer than lists — explicitly invalidated on update |

### 2.3 Per-Entity staleTime Map

| Query Key Pattern | Tier | staleTime | Notes |
|---|---|---|---|
| `['permissions']` | Static | 10 min | |
| `['section-types']` | Static | 10 min | |
| `['product-types']` | Static | 10 min | |
| `['settings']` | Slow | 5 min | |
| `['roles', params]` | Slow | 5 min | |
| `['roles', id]` | Slow | 5 min | |
| `['sections']` / `['sections', id]` | Slow | 5 min | |
| `['profile']` | Slow | 5 min | |
| `['section-types', type, 'settings']` | Moderate | 2 min | |
| `['brands', params]` / `['brands', id]` | Moderate | 2 min | |
| `['categories', params]` / `['categories', id]` | Moderate | 2 min | |
| `['categories', 'featured', ...]` | Moderate | 2 min | |
| `['attributes', params]` / `['attributes', id]` | Moderate | 2 min | |
| `['shops', params]` | Moderate | 2 min | |
| `['sliders', params]` / `['sliders', id]` | Normal | 1 min | |
| `['flash-sales', params]` / `['flash-sales', id]` | Normal | 1 min | |
| `['promotions', params]` / `['promotions', id]` | Normal | 1 min | |
| `['faqs', params]` / `['faqs', id]` | Normal | 1 min | |
| `['coupons', params]` / `['coupons', id]` | Normal | 1 min | |
| `['users', params]` / `['users', id]` | Normal | 1 min | |
| `['products', params]` | Dynamic | 30s | |
| `['orders', params]` / `['orders', id]` | Dynamic | 30s | |
| `['contacts', params]` / `['contacts', id]` | Dynamic | 30s | |
| `['banners', params]` | Dynamic | 30s | |
| `['products', 'search', q]` | Volatile | 0 | Cross-feature search |
| `['*', 'filter', q]` (combobox) | Volatile | 0 | Infinite query filter |
| `['import-status', id]` | Volatile | 0 | Polling (refetchInterval: 1s) |
| `['*', 'search', q]` (entity search) | Volatile | 0 | Dynamic key |

---

## 3. Query Key Factory

Create `src/shared/lib/query-keys.ts` to centralize all keys.

### 3.1 Pattern

```ts
// Each entity has: all, lists(), list(params), details(), detail(id), and optional extras
export const queryKeys = {
  products: {
    all:       ['products'] as const,
    lists:     () => ['products', 'list'] as const,
    list:      (params: Record<string, unknown>) => ['products', 'list', params] as const,
    details:   () => ['products', 'detail'] as const,
    detail:    (id: number | string) => ['products', 'detail', id] as const,
    search:    (q: string) => ['products', 'search', q] as const,
    importStatus: (id: string) => ['products', 'import-status', id] as const,
  },
  categories: {
    all:       ['categories'] as const,
    lists:     () => ['categories', 'list'] as const,
    list:      (params: Record<string, unknown>) => ['categories', 'list', params] as const,
    details:   () => ['categories', 'detail'] as const,
    detail:    (id: number | string) => ['categories', 'detail', id] as const,
    featured:  (page: number, perPage: number) => ['categories', 'featured', { page, perPage }] as const,
    filter:    (q: string) => ['categories', 'filter', q] as const,
  },
  brands: {
    all:       ['brands'] as const,
    lists:     () => ['brands', 'list'] as const,
    list:      (params: Record<string, unknown>) => ['brands', 'list', params] as const,
    details:   () => ['brands', 'detail'] as const,
    detail:    (id: number | string) => ['brands', 'detail', id] as const,
    productSearch: (q: string) => ['brands', 'product-search', q] as const,  // FIX P4
  },
  sliders: {
    all:       ['sliders'] as const,
    lists:     () => ['sliders', 'list'] as const,
    list:      (params: Record<string, unknown>) => ['sliders', 'list', params] as const,
    details:   () => ['sliders', 'detail'] as const,
    detail:    (id: number | string) => ['sliders', 'detail', id] as const,
    filter:    (q: string) => ['sliders', 'filter', q] as const,
    productSearch: (q: string) => ['sliders', 'product-search', q] as const,  // FIX P4
  },
  // ... same pattern for:
  // flashSales, banners, orders, users, roles, coupons, faqs,
  // sections, promotions, attributes, contacts, settings, shops
}
```

### 3.2 Benefits

- **Type safety** — `as const` prevents accidental key mutations
- **Selective invalidation** — `invalidateQueries({ queryKey: queryKeys.products.lists() })` refetches only lists, not details
- **Centralized** — changing a key pattern updates everywhere
- **Namespaces product search** — eliminates cross-contamination (P4)

---

## 4. Refined Invalidation Strategy

### 4.1 Principles

| Mutation Type | Invalidate | Rationale |
|---|---|---|
| **Create** | `entity.lists()` | New item appears in lists; existing details unaffected |
| **Delete** | `entity.lists()` | Item removed from lists; detail will 404 on next access |
| **Update** | `entity.lists()` + `entity.detail(id)` | Both list entries and the specific detail changed |
| **Bulk delete** | `entity.all` | Many items changed — safest to refetch all |
| **Toggle / Reorder** | `entity.lists()` | Only ordering / status changed |
| **Import** | `entity.all` | Large-scale data change |
| **Settings / Profile** | key directly | Single source of truth |

### 4.2 Invalidation Table

Current → Proposed mapping for every mutation:

| Mutation | Current | Proposed | Notes |
|---|---|---|---|
| `useCreateProduct` | `['products']` | `queryKeys.products.lists()` | |
| `useDeleteProduct` | `['products']` | `queryKeys.products.lists()` | |
| `useBulkDeleteProducts` | `['products']` | `queryKeys.products.all` | Broad change |
| `useDeleteAllProducts` | `['products']` | `queryKeys.products.all` | Broad change |
| `useProductsImport` | triggers polling | after polling: `queryKeys.products.all` | |
| `useCreateCategory` | `['categories']` | `queryKeys.categories.lists()` | |
| `useUpdateCategory` | `['categories']` | `queryKeys.categories.lists()` + `detail(id)` | |
| `useDeleteCategory` | `['categories']` | `queryKeys.categories.lists()` | |
| `useToggleFeatured` | `['categories']` | `queryKeys.categories.lists()` + `featured(...)` | If featured params known |
| `useCreateBrand` | `['brands']` | `queryKeys.brands.lists()` | |
| `useUpdateBrand` | `['brands']` | `queryKeys.brands.lists()` + `detail(id)` | |
| `useDeleteBrand` | `['brands']` | `queryKeys.brands.lists()` | |
| `useReorderBrands` | `['brands']` | `queryKeys.brands.lists()` | Already has optimistic update |
| `useCreateSlider` | `['sliders']` | `queryKeys.sliders.lists()` | |
| `useUpdateSlider` | `['sliders']` | `queryKeys.sliders.lists()` + `detail(id)` | |
| `useDeleteSlider` | `['sliders']` | `queryKeys.sliders.lists()` | |
| `useChangeSliderStatus` | `['sliders']` | `queryKeys.sliders.lists()` | |
| `useReorderSliders` | `['sliders']` | `queryKeys.sliders.lists()` | |
| `useCreateFlashSale` | `['flash-sales']` | `queryKeys.flashSales.lists()` | |
| `useUpdateFlashSale` | `['flash-sales']` | `queryKeys.flashSales.lists()` + `detail(id)` | |
| `useDeleteFlashSale` | `['flash-sales']` | `queryKeys.flashSales.lists()` | |
| `useReorderFlashSales` | `['flash-sales']` | `queryKeys.flashSales.lists()` | |
| `useDeleteOrder` | `['orders']` | `queryKeys.orders.lists()` | Also navigates away |
| `useCreateUser` | `['users']` | `queryKeys.users.lists()` | |
| `useToggleActivation` | `['users']` | `queryKeys.users.lists()` | |
| `useDeleteUser` / `useForceDeleteUser` / `useRestoreUser` | `['users']` | `queryKeys.users.lists()` | |
| `useCreateCoupon` | `['coupons']` | `queryKeys.coupons.lists()` | |
| `useUpdateCoupon` | `['coupons']` | `queryKeys.coupons.lists()` + `detail(id)` | |
| `useDeleteCoupon` | `['coupons']` | `queryKeys.coupons.lists()` | |
| `useCreateFaq` | `['faqs']` | `queryKeys.faqs.lists()` | |
| `useUpdateFaq` | `['faqs']` | `queryKeys.faqs.lists()` + `detail(id)` | |
| `useDeleteFaq` | `['faqs']` | `queryKeys.faqs.lists()` | |
| `useReorderFaqs` | `['faqs']` | `queryKeys.faqs.lists()` | |
| `useCreateSection` | `['sections']` | `queryKeys.sections.lists()` | |
| `useUpdateSection` | `['sections']` | `queryKeys.sections.lists()` + `detail(id)` | |
| `useDeleteSection` | `['sections']` | `queryKeys.sections.lists()` | |
| `useToggleSectionActive` | `['sections']` | `queryKeys.sections.lists()` | |
| `useReorderSections` | `['sections']` | `queryKeys.sections.lists()` | |
| `useCreateRole` | `['roles']` | `queryKeys.roles.lists()` | |
| `useUpdateRole` | `['roles']` | `queryKeys.roles.lists()` + `detail(id)` | |
| `useDeleteRole` | `['roles']` | `queryKeys.roles.lists()` | Already has optimistic update |
| `useAssignPermissions` | `['roles']` | `queryKeys.roles.lists()` + `detail(roleId)` | |
| `useAssignUserRoles` / `useRemoveUserRoles` | `['users']` | `queryKeys.users.lists()` + `detail(userId)` | |
| `useCreatePromotion` | `['promotions']` | `queryKeys.promotions.lists()` | |
| `useUpdatePromotion` | `['promotions']` | `queryKeys.promotions.lists()` + `detail(id)` | |
| `useDeletePromotion` | `['promotions']` | `queryKeys.promotions.lists()` | |
| `useCreateAttribute` | `['attributes']` | `queryKeys.attributes.lists()` | |
| `useUpdateAttribute` | `['attributes']` | `queryKeys.attributes.lists()` + `detail(id)` | |
| `useDeleteAttribute` | `['attributes']` | `queryKeys.attributes.lists()` | |
| `useSendReply` / `useDeleteContact` / etc | `['contacts']` | `queryKeys.contacts.lists()` | |
| `useUpdateSettings` | `['settings']` | `queryKeys.settings.all` | Single key |

---

## 5. Optimistic Updates

### 5.1 Candidates for Optimistic Updates

Add optimistic updates where the user expects instant UI feedback:

| Mutation | Current Behavior | Recommended |
|---|---|---|
| Toggle slider status | Waits for network → invalidates | Optimistic update + rollback on error |
| Toggle section active | Waits for network → invalidates | Optimistic update + rollback on error |
| Toggle featured category | Waits for network → invalidates | Optimistic update + rollback on error |
| Toggle user activation | Waits for network → invalidates | Optimistic update + rollback on error |
| Reorder operations | Already optimistic for brands/sliders | Extend same pattern to flash-sales, faqs, sections |
| Delete operations | Show loading spinner | Already acceptable — skip |

### 5.2 Pattern

```ts
useMutation({
  mutationFn: () => changeSliderStatus(id),
  onMutate: async () => {
    await queryClient.cancelQueries({ queryKey: queryKeys.sliders.lists() })
    const previous = queryClient.getQueryData(queryKeys.sliders.lists())
    // Optimistically update cache...
    return { previous }
  },
  onError: (_, __, context) => {
    queryClient.setQueryData(queryKeys.sliders.lists(), context?.previous)
    toast.error('Failed to update status')
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.sliders.lists() })
  },
})
```

---

## 6. Cross-Contamination Fix (P4)

Rename product search keys per feature to avoid cache collisions:

| Feature | Current Key | Proposed Key | Change in |
|---|---|---|---|
| Brands product search | `['products', 'search', q]` | `['brands', 'product-search', q]` | `use-brands.ts` |
| Sliders product search | `['products', 'search', q]` | `['sliders', 'product-search', q]` | `use-sliders.ts` |
| Flash-sale product search | `['products', 'search', q]` | `['flash-sales', 'product-search', q]` | `use-flash-sale.ts` |
| Promotions product search | `['products', 'search', q]` | `['promotions', 'product-search', q]` | `use-promotions.ts` |

---

## 7. Devtools Enablement (P6)

Add to `src/app/main.tsx`:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
// Inside QueryClientProvider:
<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools buttonPosition="bottom-left" />
  <Toaster position="top-right" richColors />
</QueryClientProvider>
```

---

## 8. Implementation Order

| Phase | Steps | Impact |
|---|---|---|
| **Phase 1** (low effort, high impact) | 1. Add global `staleTime: 30_000` and `refetchOnWindowFocus: false` in `main.tsx`<br>2. Enable Devtools<br>3. Add per-query `staleTime` to all hooks (tiers) | Reduces network churn ~60-80% immediately |
| **Phase 2** (medium effort) | 1. Create `query-keys.ts` factory<br>2. Refactor all 45+ queries to use factory keys<br>3. Refactor all 63 mutations to use factory keys for invalidation | Selective invalidation, type safety, fixes P4 |
| **Phase 3** (low effort) | 1. Add optimistic updates for toggle/status mutations<br>2. Verify reorder optimistic updates work correctly | Better UX for frequent actions |

---

## 9. Edge Cases & Risks

| Edge Case | Risk | Mitigation |
|---|---|---|
| **Import polling + 3-min timeout** | `setTimeout` race if component unmounts | Use `signal` from `useQuery` or clean up timeout in `useEffect` return |
| **Infinite query filter keys** | `['categories', 'filter', q]` with variable `q` can grow unbounded | Set `gcTime` lower for volatile keys or use `maxPages` |
| **Dynamic entity search key** | `[endpoint, 'search', search]` is fully dynamic — no type safety | Keep as-is but document; or validate `endpoint` against whitelist |
| **Multiple tabs** | If admin opens 2 tabs, changes in one tab are invisible in the other | `refetchOnWindowFocus: true` could help but is wasteful. Better to add a periodic `refetchInterval` for critical data (orders) or use `broadcastQueryClient` |
| **Stale list + fresh detail** | If list is cached but detail is viewed, stale list might show outdated info | Detail has its own staleTime; update mutation invalidates both. On navigation to list, list refetches if stale. |

---

## 10. Migration Strategy

Per-feature migration (e.g., products first):

1. Add `queryKey` factory entry for the feature
2. Update the query hook to use factory key + new `staleTime`
3. Update all related mutations to use factory key for invalidation
4. Update any inline `queryClient.invalidateQueries` in pages/components

This is fully incremental — each feature can be migrated independently without breaking others.
