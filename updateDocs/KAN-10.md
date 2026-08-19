# KAN-10: Brand Module Changes

## Changes

1. **Brand Form Dialog — Details JSON Parsing** (`src/features/brands/components/brand-form-dialog.tsx`):
   - Fixed edit mode to parse `details` field from JSON string `{"en": "...", "ar": "..."}` into separate form fields instead of showing raw JSON
   - Previously editing a brand would show the raw JSON string in the description fields

2. **Brand Form Dialog — Translation Key Fix** (`src/features/brands/components/brand-form-dialog.tsx`):
   - Changed product-related translation key prefixes from `slidersForm.*` to `brandsForm.*` (e.g., `slidersForm.selectProducts` → `brandsForm.selectProducts`)

3. **Brand Form Dialog — Accept Attribute** (`src/features/brands/components/brand-form-dialog.tsx`):
   - Tightened image upload `accept` attribute from generic `image/*` to explicit `image/jpeg,image/png,image/gif,image/svg+xml` matching Settings module pattern

4. **Brands Table — dnd-kit Drag-and-Drop Reorder** (`src/features/brands/components/brands-table.tsx`):
   - Replaced simple up-arrow button reorder with full `@dnd-kit` drag-and-drop
   - Adds `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` imports
   - Uses `DndContext` + `SortableContext` + `useSortable` for sortable table rows
   - Pointer sensor with 8px activation distance to prevent accidental drags
   - Optimistic UI: local state updates immediately on drag, API call on drag end, reverts on error
   - Drag handle (GripVertical icon) as activator via `setActivatorNodeRef`
   - Visual feedback: 50% opacity while dragging, CSS transform for smooth animation
   - Only desktop table view (mobile cards retain old move-up button)

## API Bugs

- None found in this module
