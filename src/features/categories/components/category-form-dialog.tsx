import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
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
import { Switch } from '@/shared/ui/switch';

import { ImagePreview } from '@/shared/components/image-preview';
import {
  categoryFormSchema,
  categoryFormDefaults,
  toApiFormat,
  type CategoryFormValues,
} from '../schemas/category.schema';
import { useCreateCategory, useUpdateCategory, useCategory, useCategories } from '../hooks/use-categories';

import type { CategoryListItem } from '../types/category.types';
import type { ApiErrorResponse } from '@/shared/api';

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
  const { t } = useTranslation();
  const isEditing = !!category;
  const { data: parentCategoriesData } = useCategories({ perPage: 100, parentOnly: true }, open);
  const { data: categoryDetail, isLoading: isDetailLoading } = useCategory(category?.id ?? 0);
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [desktopPreview, setDesktopPreview] = useState<string | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: categoryFormDefaults,
  });

  const parentId = useWatch({ control: form.control, name: 'parentId' });

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setDesktopPreview(null);
      setMobilePreview(null);
      form.reset(categoryFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  const prevCategoryIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (isEditing && category && categoryDetail?.data) {
      const d = categoryDetail.data;
      form.setValue('nameEn', d.name);
      form.setValue('nameAr', d.name);
      form.setValue('detailsEn', d.details || '');
      form.setValue('detailsAr', d.details || '');
      form.setValue('parentId', d.parent_id ?? null);
      form.setValue('status', d.status);
      setDesktopPreview(d.image?.desktop || null);
      setMobilePreview(d.image?.mobile || null);
      prevCategoryIdRef.current = category.id;
    }
  }, [categoryDetail, isEditing, category, form]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageDesktop' | 'imageMobile',
    setPreview: (preview: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    form.setValue(field, file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };


  const onSubmit = (values: CategoryFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && category) {
      updateMutation.mutate(
        { id: category.id, data: { ...apiData, _method: 'PUT' } },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(apiData, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || isDetailLoading;
  const parentCategories = parentCategoriesData?.data?.data || [];
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof CategoryFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('categories.editCategory') : t('categories.createCategory')}</DialogTitle>
          <DialogDescription>
            {isEditing ? t('categories.updateSubtitle') : t('categories.createSubtitle')}
          </DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="nameEn" className="text-sm font-medium">{t('categoriesForm.nameEn')} *</label>
              <Input
                id="nameEn"
                placeholder={t('categoriesForm.nameEn')}
                {...form.register('nameEn')}
              />
              {getError('nameEn') && (
                <p className="text-xs text-destructive">{getError('nameEn')}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nameAr" className="text-sm font-medium">{t('categoriesForm.nameAr')} *</label>
              <Input
                id="nameAr"
                placeholder={t('categoriesForm.nameAr')}
                dir="rtl"
                {...form.register('nameAr')}
              />
              {getError('nameAr') && (
                <p className="text-xs text-destructive">{getError('nameAr')}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="detailsEn" className="text-sm font-medium">{t('categoriesForm.detailsEn')}</label>
            <Textarea id="detailsEn" placeholder={t('categoriesForm.detailsEn')} rows={2} {...form.register('detailsEn')} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="detailsAr" className="text-sm font-medium">{t('categoriesForm.detailsAr')}</label>
            <Textarea id="detailsAr" placeholder={t('categoriesForm.detailsAr')} dir="rtl" rows={2} {...form.register('detailsAr')} />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('categoriesForm.parentCategory')}</label>
            <Select
              value={parentId?.toString() || 'none'}
              onValueChange={(value) => form.setValue('parentId', value === 'none' ? null : Number(value))}
            >
              <SelectTrigger><SelectValue placeholder={t('categories.selectParent')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('categories.rootCategory')}</SelectItem>
                {parentCategories.filter((c) => c.id !== category?.id).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>


          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="imageDesktop" className="text-sm font-medium">
                {t('categoriesForm.desktopImage')} {!isEditing && <span className="text-destructive">*</span>}
              </label>
              <Input id="imageDesktop" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageDesktop', setDesktopPreview)} />
              {desktopPreview && <ImagePreview src={desktopPreview} alt="Desktop preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
              {serverErrors['image-desktop']?.[0] && (
                <p className="text-xs text-destructive">{serverErrors['image-desktop'][0]}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="imageMobile" className="text-sm font-medium">
                {t('categoriesForm.mobileImage')} {!isEditing && <span className="text-destructive">*</span>}
              </label>
              <Input id="imageMobile" type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'imageMobile', setMobilePreview)} />
              {mobilePreview && <ImagePreview src={mobilePreview} alt="Mobile preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
              {serverErrors['image-mobile']?.[0] && (
                <p className="text-xs text-destructive">{serverErrors['image-mobile'][0]}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="status"
              checked={form.watch('status')}
              onCheckedChange={(checked) => form.setValue('status', checked)}
            />
            <label htmlFor="status" className="text-sm font-medium cursor-pointer">
              {form.watch('status') ? t('categories.active') : t('categories.inactive')}
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isPending}>
              {isDetailLoading
                ? t('common.loading')
                : isPending
                  ? (isEditing ? t('categories.updating') : t('categories.creating'))
                  : (isEditing ? t('categoriesForm.updateCategory') : t('categoriesForm.createCategory'))}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}



