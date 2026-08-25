import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { ImagePreview } from '@/shared/components/image-preview';
import {
  tagFormSchema,
  tagFormDefaults,
  toApiFormat,
  type TagFormValues,
} from '../schemas/tag.schema';
import { useCreateTag, useUpdateTag, useTag } from '../hooks/use-tags';
import type { Tag } from '../types/tag.types';

interface TagFormDialogProps {
  tag?: Tag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TagFormDialog({
  tag,
  open,
  onOpenChange,
  onSuccess,
}: TagFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!tag;
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const { data: tagDetail, isLoading: isDetailLoading } = useTag(tag?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: tagFormDefaults,
  });

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setImagePreview(null);
      setIconPreview(null);
      form.reset(tagFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && tag && tagDetail) {
      form.setValue('name', tagDetail.name);
      form.setValue('slug', tagDetail.slug || '');
    }
  }, [tagDetail, isEditing, tag, form]);

  const resolvedImagePreview = imagePreview ?? (tagDetail?.image || null);
  const resolvedIconPreview = iconPreview ?? (tagDetail?.icon || null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'image' | 'icon',
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

  const onSubmit = (values: TagFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as { status?: number; errors?: Record<string, string[]> };
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && tag) {
      updateMutation.mutate(
        { id: tag.id, data: { ...apiData, _method: 'PUT' } },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(apiData, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: string): string | undefined => {
    const clientErr = (errors as Record<string, { message?: string }>)[field]?.message;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('tags.editTag') : t('tags.createTag')}</DialogTitle>
          <DialogDescription>{t('tags.subtitle')}</DialogDescription>
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-sm font-medium">{t('tagsForm.name')} *</label>
              <Input id="name" placeholder={t('tagsForm.name')} {...form.register('name')} />
              {getError('name') && <p className="text-xs text-destructive">{getError('name')}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="slug" className="text-sm font-medium">{t('tagsForm.slug')}</label>
              <Input
                id="slug"
                dir="ltr"
                placeholder={t('tagsForm.slugPlaceholder')}
                {...form.register('slug')}
              />
              {getError('slug') && <p className="text-xs text-destructive">{getError('slug')}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="image" className="text-sm font-medium">{t('tagsForm.image')}</label>
                <Input id="image" type="file" accept=".jpeg,.png,.jpg,.gif,.svg" onChange={(e) => handleFileChange(e, 'image', setImagePreview)} />
                {resolvedImagePreview && <ImagePreview src={resolvedImagePreview} alt="Image preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="icon" className="text-sm font-medium">{t('tagsForm.icon')}</label>
                <Input id="icon" type="file" accept=".jpeg,.png,.jpg,.gif,.svg" onChange={(e) => handleFileChange(e, 'icon', setIconPreview)} />
                {resolvedIconPreview && <ImagePreview src={resolvedIconPreview} alt="Icon preview" thumbnailClassName="h-16 rounded border object-cover mt-1" />}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending || isDetailLoading}>
                {isDetailLoading
                  ? t('common.loading')
                  : isPending
                    ? (isEditing ? t('tags.updating') : t('tags.creating'))
                    : (isEditing ? t('tagsForm.updateTag') : t('tagsForm.createTag'))}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
