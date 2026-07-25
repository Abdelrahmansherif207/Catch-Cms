# Categories Module UI Implementation Plan

> [!NOTE]
> This document may not reflect the current implementation.
> See the final report for up-to-date state:
> [Final Report](../reports/categories-module-ui.md)

> **For agentic workers:** REQUIRED SUB-SKILL: Use compose:subagent (recommended) or compose:execute to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Categories module UI with list page, data table, create/edit dialog, and proper loading/empty/error states.

**Architecture:** Feature-based module under `src/features/categories/` with types, schemas, API layer (mocked), hooks, components, and pages. Uses shadcn/ui components, React Query for data fetching, React Hook Form + Zod for forms.

**Tech Stack:** React, TypeScript, TailwindCSS, shadcn/ui, React Query, React Hook Form, Zod

---

## File Structure

```
src/features/categories/
├── api/
│   └── categories.api.ts          # API functions (mocked for UI phase)
├── components/
│   ├── categories-table.tsx        # Data table component
│   ├── category-form-dialog.tsx    # Create/Edit dialog
│   ├── category-delete-dialog.tsx  # Delete confirmation
│   ├── category-image-cell.tsx     # Image display with fallback
│   └── category-level-badge.tsx    # Level indicator badge
├── hooks/
│   └── use-categories.ts          # React Query hooks
├── pages/
│   └── categories-page.tsx        # Main page component
├── schemas/
│   └── category.schema.ts         # Zod validation schemas
├── types/
│   └── category.types.ts          # TypeScript types
└── index.ts                       # Public API exports
```

---

### Task 1: Install Required shadcn Components

**Files:**
- Create: `src/shared/ui/table.tsx`
- Create: `src/shared/ui/dialog.tsx`
- Create: `src/shared/ui/select.tsx`
- Create: `src/shared/ui/textarea.tsx`

- [ ] **Step 1: Install shadcn table component**

Run: `npx shadcn@latest add table`

- [ ] **Step 2: Install shadcn dialog component**

Run: `npx shadcn@latest add dialog`

- [ ] **Step 3: Install shadcn select component**

Run: `npx shadcn@latest add select`

- [ ] **Step 4: Install shadcn textarea component**

Run: `npx shadcn@latest add textarea`

- [ ] **Step 5: Verify components installed**

Run: `ls src/shared/ui/`
Expected: table.tsx, dialog.tsx, select.tsx, textarea.tsx exist

---

### Task 2: Category Types

**Covers:** Data model definition

**Files:**
- Create: `src/features/categories/types/category.types.ts`

- [ ] **Step 1: Create category types**

```typescript
export interface CategoryImage {
  desktop: string | null;
  mobile: string | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  level: number;
  image: CategoryImage;
  products_count: number;
  details?: string;
}

export interface CategoryDetail extends Category {
  parent: Pick<Category, 'id' | 'name' | 'slug'> | null;
  children: Pick<Category, 'id' | 'name' | 'slug'>[];
}

export interface CategoryListItem {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  level: number;
  image: CategoryImage;
  products_count: number;
  details?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  from: number;
  to: number;
  last_page: number;
  path: string;
  per_page: number;
  total: number;
  next_page_url: string | null;
  prev_page_url: string | null;
  last_page_url: string;
  first_page_url: string;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  success: boolean;
  data: T;
}

export type CategoriesListResponse = PaginatedResponse<CategoryListItem>;
export type CategoryDetailResponse = ApiResponse<CategoryDetail>;

export interface CreateCategoryData {
  'name[en]': string;
  'name[ar]': string;
  'details[en]'?: string;
  'details[ar]'?: string;
  image_desktop?: File;
  image_mobile?: File;
  'shops_id[]': number[];
  parent_id?: number | null;
}

export interface UpdateCategoryData extends CreateCategoryData {
  _method: 'PUT';
}
```

- [ ] **Step 2: Update categories index.ts**

```typescript
export type {
  Category,
  CategoryDetail,
  CategoryListItem,
  CategoryImage,
  CreateCategoryData,
  UpdateCategoryData,
  CategoriesListResponse,
  CategoryDetailResponse,
  PaginatedResponse,
  ApiResponse,
} from './types/category.types';
```

---

### Task 3: Category Validation Schema

**Covers:** Form validation

**Files:**
- Create: `src/features/categories/schemas/category.schema.ts`

- [ ] **Step 1: Create Zod schema**

```typescript
import { z } from 'zod';

export const categoryFormSchema = z.object({
  'name[en]': z.string().min(1, 'English name is required'),
  'name[ar]': z.string().min(1, 'Arabic name is required'),
  'details[en]': z.string().optional(),
  'details[ar]': z.string().optional(),
  image_desktop: z.instanceof(File).optional(),
  image_mobile: z.instanceof(File).optional(),
  parent_id: z.number().nullable().optional(),
  'shops_id[]': z.array(z.number()).min(1, 'Select at least one shop'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const categoryFormDefaults: CategoryFormValues = {
  'name[en]': '',
  'name[ar]': '',
  'details[en]': '',
  'details[ar]': '',
  image_desktop: undefined,
  image_mobile: undefined,
  parent_id: null,
  'shops_id[]': [],
};
```

---

### Task 4: Categories API Layer (Mocked)

**Covers:** API integration foundation

**Files:**
- Create: `src/features/categories/api/categories.api.ts`

- [ ] **Step 1: Create API functions with mock data**

```typescript
import type {
  CategoriesListResponse,
  CategoryDetailResponse,
  CategoryListItem,
  CreateCategoryData,
  UpdateCategoryData,
} from '../types/category.types';

const MOCK_CATEGORIES: CategoryListItem[] = [
  {
    id: 1,
    name: 'Fresh Food',
    slug: 'fresh-food',
    parent_id: null,
    level: 1,
    image: { desktop: null, mobile: null },
    products_count: 29,
    details: 'Details of Fresh Food',
  },
  {
    id: 25,
    name: 'Supermarket',
    slug: 'supermarket',
    parent_id: null,
    level: 1,
    image: {
      desktop: 'https://mohammedtareq.me/public/storage/categories/49/2c67dd43-90ac-474d-8c45-a416d15664c1.avif',
      mobile: 'https://mohammedtareq.me/public/storage/categories/50/b39086ad-1535-41bb-9eb7-2ff82db87e31.avif',
    },
    products_count: 28,
    details: 'Details of Supermarket',
  },
  {
    id: 38,
    name: 'Cooking Essentials',
    slug: 'cooking-essentials',
    parent_id: 25,
    level: 2,
    image: {
      desktop: 'https://mohammedtareq.me/public/storage/categories/75/67e0b7e4-e399-4ebf-ac30-477c3c68adcd.avif',
      mobile: 'https://mohammedtareq.me/public/storage/categories/76/129020f4-db2b-4595-a787-b80f462a3de6.avif',
    },
    products_count: 18,
    details: 'Details of Cooking Essentials',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchCategories(
  page: number = 1,
  perPage: number = 15,
  search?: string
): Promise<CategoriesListResponse> {
  await delay(800);

  let filtered = [...MOCK_CATEGORIES];
  if (search) {
    filtered = filtered.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = filtered.length;
  const from = (page - 1) * perPage;
  const to = Math.min(from + perPage, total);
  const data = filtered.slice(from, to);

  return {
    data,
    current_page: page,
    from: from + 1,
    to,
    last_page: Math.ceil(total / perPage),
    path: '/api/v1/categories',
    per_page: perPage,
    total,
    next_page_url: page < Math.ceil(total / perPage) ? `/api/v1/categories?page=${page + 1}` : null,
    prev_page_url: page > 1 ? `/api/v1/categories?page=${page - 1}` : null,
    last_page_url: `/api/v1/categories?page=${Math.ceil(total / perPage)}`,
    first_page_url: '/api/v1/categories?page=1',
  };
}

export async function fetchCategoryById(id: number): Promise<CategoryDetailResponse> {
  await delay(500);

  const category = MOCK_CATEGORIES.find((c) => c.id === id);
  if (!category) {
    throw new Error('Category not found');
  }

  return {
    status: 200,
    message: 'Data fetched successfully',
    success: true,
    data: {
      ...category,
      parent: null,
      children: [],
    },
  };
}

export async function createCategory(_data: CreateCategoryData): Promise<ApiResponse<CategoryListItem>> {
  await delay(1000);

  return {
    status: 201,
    message: 'Category created successfully',
    success: true,
    data: {
      id: Date.now(),
      name: _data['name[en]'],
      slug: _data['name[en]'].toLowerCase().replace(/\s+/g, '-'),
      parent_id: _data.parent_id ?? null,
      level: _data.parent_id ? 2 : 1,
      image: { desktop: null, mobile: null },
      products_count: 0,
      details: _data['details[en]'],
    },
  };
}

export async function updateCategory(
  _id: number,
  _data: UpdateCategoryData
): Promise<ApiResponse<CategoryListItem>> {
  await delay(1000);

  return {
    status: 200,
    message: 'Category updated successfully',
    success: true,
    data: {
      id: _id,
      name: _data['name[en]'],
      slug: _data['name[en]'].toLowerCase().replace(/\s+/g, '-'),
      parent_id: _data.parent_id ?? null,
      level: _data.parent_id ? 2 : 1,
      image: { desktop: null, mobile: null },
      products_count: 0,
      details: _data['details[en]'],
    },
  };
}

export async function deleteCategory(_id: number): Promise<ApiResponse<null>> {
  await delay(800);

  return {
    status: 200,
    message: 'Category deleted successfully',
    success: true,
    data: null,
  };
}

export async function fetchFeaturedCategories(): Promise<ApiResponse<CategoryListItem[]>> {
  await delay(600);

  return {
    status: 200,
    message: 'Featured categories fetched successfully',
    success: true,
    data: MOCK_CATEGORIES.filter((c) => c.level === 1),
  };
}
```

---

### Task 5: React Query Hooks

**Covers:** Data fetching layer

**Files:**
- Create: `src/features/categories/hooks/use-categories.ts`

- [ ] **Step 1: Create React Query hooks**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCategories,
  fetchCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api/categories.api';
import type { CreateCategoryData, UpdateCategoryData } from '../types/category.types';

export function useCategories(page: number = 1, perPage: number = 15, search?: string) {
  return useQuery({
    queryKey: ['categories', { page, perPage, search }],
    queryFn: () => fetchCategories(page, perPage, search),
  });
}

export function useCategory(id: number) {
  return useQuery({
    queryKey: ['categories', id],
    queryFn: () => fetchCategoryById(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryData) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryData }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}
```

---

### Task 6: Category Image Cell Component

**Covers:** Image display with fallback

**Files:**
- Create: `src/features/categories/components/category-image-cell.tsx`

- [ ] **Step 1: Create image cell component**

```typescript
import { ImageIcon } from 'lucide-react';
import type { CategoryImage } from '../types/category.types';

interface CategoryImageCellProps {
  image: CategoryImage;
  alt: string;
}

export function CategoryImageCell({ image, alt }: CategoryImageCellProps) {
  const imageUrl = image.desktop || image.mobile;

  if (!imageUrl) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className="h-10 w-10 rounded-lg object-cover"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.style.display = 'none';
      }}
    />
  );
}
```

---

### Task 7: Category Level Badge Component

**Covers:** Visual level indicator

**Files:**
- Create: `src/features/categories/components/category-level-badge.tsx`

- [ ] **Step 1: Create level badge component**

```typescript
import { Badge } from '@/shared/ui/badge';
import { cn } from '@/shared/lib/utils';

interface CategoryLevelBadgeProps {
  level: number;
}

const levelVariants: Record<number, { label: string; className: string }> = {
  1: { label: 'Root', className: 'bg-primary/10 text-primary' },
  2: { label: 'Sub', className: 'bg-secondary/10 text-secondary-foreground' },
  3: { label: 'Sub-sub', className: 'bg-muted text-muted-foreground' },
};

export function CategoryLevelBadge({ level }: CategoryLevelBadgeProps) {
  const variant = levelVariants[level] || {
    label: `Level ${level}`,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-normal', variant.className)}
    >
      {variant.label}
    </Badge>
  );
}
```

---

### Task 8: Category Delete Dialog

**Covers:** Delete confirmation

**Files:**
- Create: `src/features/categories/components/category-delete-dialog.tsx`

- [ ] **Step 1: Create delete confirmation dialog**

```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { useDeleteCategory } from '../hooks/use-categories';

interface CategoryDeleteDialogProps {
  categoryId: number;
  categoryName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function CategoryDeleteDialog({
  categoryId,
  categoryName,
  open,
  onOpenChange,
  onDeleted,
}: CategoryDeleteDialogProps) {
  const deleteMutation = useDeleteCategory();

  const handleDelete = () => {
    deleteMutation.mutate(categoryId, {
      onSuccess: () => {
        onDeleted();
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Category</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{categoryName}</strong>?
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 9: Category Form Dialog

**Covers:** Create/Edit form

**Files:**
- Create: `src/features/categories/components/category-form-dialog.tsx`

- [ ] **Step 1: Create form dialog component**

```typescript
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  categoryFormSchema,
  categoryFormDefaults,
  type CategoryFormValues,
} from '../schemas/category.schema';
import { useCreateCategory, useUpdateCategory, useCategories } from '../hooks/use-categories';
import type { CategoryListItem } from '../types/category.types';

interface CategoryFormDialogProps {
  category?: CategoryListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CategoryFormDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: CategoryFormDialogProps) {
  const isEditing = !!category;
  const { data: categoriesData } = useCategories(1, 100);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: categoryFormDefaults,
  });

  useEffect(() => {
    if (open) {
      if (category) {
        form.reset({
          'name[en]': category.name,
          'name[ar]': '',
          'details[en]': category.details || '',
          'details[ar]': '',
          image_desktop: undefined,
          image_mobile: undefined,
          parent_id: category.parent_id,
          'shops_id[]': [],
        });
      } else {
        form.reset(categoryFormDefaults);
      }
    }
  }, [open, category, form]);

  const onSubmit = (values: CategoryFormValues) => {
    if (isEditing && category) {
      updateMutation.mutate(
        {
          id: category.id,
          data: { ...values, _method: 'PUT' },
        },
        { onSuccess }
      );
    } else {
      createMutation.mutate(values, { onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const parentCategories = categoriesData?.data.filter(
    (c) => c.id !== category?.id
  ) || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Category' : 'Create Category'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the category details below.'
              : 'Add a new category to your store.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name-en" className="text-sm font-medium">
                Name (English) *
              </label>
              <Input
                id="name-en"
                placeholder="Category name"
                {...form.register('name[en]')}
              />
              {form.formState.errors['name[en]'] && (
                <p className="text-xs text-destructive">
                  {form.formState.errors['name[en]'].message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="name-ar" className="text-sm font-medium">
                Name (Arabic) *
              </label>
              <Input
                id="name-ar"
                placeholder="اسم التصنيف"
                dir="rtl"
                {...form.register('name[ar]')}
              />
              {form.formState.errors['name[ar]'] && (
                <p className="text-xs text-destructive">
                  {form.formState.errors['name[ar]'].message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="details-en" className="text-sm font-medium">
              Description (English)
            </label>
            <Textarea
              id="details-en"
              placeholder="Category description"
              rows={3}
              {...form.register('details[en]')}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="details-ar" className="text-sm font-medium">
              Description (Arabic)
            </label>
            <Textarea
              id="details-ar"
              placeholder="وصف التصنيف"
              dir="rtl"
              rows={3}
              {...form.register('details[ar]')}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Parent Category</label>
            <Select
              value={form.watch('parent_id')?.toString() || 'none'}
              onValueChange={(value) =>
                form.setValue('parent_id', value === 'none' ? null : Number(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parent (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Root category)</SelectItem>
                {parentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="image-desktop" className="text-sm font-medium">
                Desktop Image
              </label>
              <Input
                id="image-desktop"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  form.setValue('image_desktop', file);
                }}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="image-mobile" className="text-sm font-medium">
                Mobile Image
              </label>
              <Input
                id="image-mobile"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  form.setValue('image_mobile', file);
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Updating...'
                  : 'Creating...'
                : isEditing
                  ? 'Update Category'
                  : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Task 10: Categories Table Component

**Covers:** Data table with actions

**Files:**
- Create: `src/features/categories/components/categories-table.tsx`

- [ ] **Step 1: Create table component**

```typescript
import { useState } from 'react';
import {
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Skeleton } from '@/shared/ui/skeleton';
import { CategoryImageCell } from './category-image-cell';
import { CategoryLevelBadge } from './category-level-badge';
import { CategoryDeleteDialog } from './category-delete-dialog';
import type { CategoryListItem } from '../types/category.types';

interface CategoriesTableProps {
  data: CategoryListItem[];
  isLoading: boolean;
  onEdit: (category: CategoryListItem) => void;
  onRefresh: () => void;
}

export function CategoriesTable({
  data,
  isLoading,
  onEdit,
  onRefresh,
}: CategoriesTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<CategoryListItem | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[100px]">Level</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead className="w-[100px] text-right">Products</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <CategoryImageCell
                      image={category.image}
                      alt={category.name}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        /{category.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <CategoryLevelBadge level={category.level} />
                  </TableCell>
                  <TableCell>
                    {category.parent_id ? (
                      <span className="text-sm text-muted-foreground">
                        ID: {category.parent_id}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {category.products_count}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(category)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteTarget(category)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {deleteTarget && (
        <CategoryDeleteDialog
          categoryId={deleteTarget.id}
          categoryName={deleteTarget.name}
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          onDeleted={onRefresh}
        />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-[100px]">Level</TableHead>
            <TableHead>Parent</TableHead>
            <TableHead className="w-[100px] text-right">Products</TableHead>
            <TableHead className="w-[60px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-10 w-10 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-1 h-3 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-8" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

### Task 11: Categories Page

**Covers:** Main page with search, filters, and table

**Files:**
- Create: `src/features/categories/pages/categories-page.tsx`

- [ ] **Step 1: Create categories page**

```typescript
import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useCategories } from '../hooks/use-categories';
import { CategoriesTable } from '../components/categories-table';
import { CategoryFormDialog } from '../components/category-form-dialog';
import type { CategoryListItem } from '../types/category.types';

export function CategoriesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryListItem | null>(null);

  const { data, isLoading, refetch } = useCategories(page, 15, search);

  const handleEdit = (category: CategoryListItem) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingCategory(null);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Categories
          </h1>
          <p className="text-muted-foreground">
            Manage your product categories and subcategories.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <CategoriesTable
        data={data?.data || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onRefresh={refetch}
      />

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {data.from} to {data.to} of {data.total} categories
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {data.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
              disabled={page === data.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <CategoryFormDialog
        category={editingCategory}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}
```

---

### Task 12: Update Route and Index

**Covers:** Route integration

**Files:**
- Modify: `src/app/App.tsx`
- Modify: `src/features/categories/index.ts`

- [ ] **Step 1: Update App.tsx to add categories route**

Add import and route:

```typescript
import { CategoriesPage } from '@/features/categories/pages/categories-page';
```

Add route inside AdminLayout:

```typescript
<Route path="/categories" element={<CategoriesPage />} />
```

- [ ] **Step 2: Update categories index.ts**

```typescript
export { CategoriesPage } from './pages/categories-page';
export { useCategories, useCategory, useCreateCategory, useUpdateCategory, useDeleteCategory } from './hooks/use-categories';
export type {
  Category,
  CategoryDetail,
  CategoryListItem,
  CategoryImage,
  CreateCategoryData,
  UpdateCategoryData,
  CategoriesListResponse,
  CategoryDetailResponse,
} from './types/category.types';
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no errors

---

### Task 13: Final Verification

**Covers:** End-to-end verification

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No errors

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run dev server and verify UI**

Run: `npm run dev`
Navigate to `/categories`
Expected:
- Page loads with header, search, and table
- Table shows mock categories
- Search filters work
- Create button opens dialog
- Edit button opens dialog with data
- Delete button shows confirmation
- Loading skeletons appear briefly
- Empty state shows when no results
