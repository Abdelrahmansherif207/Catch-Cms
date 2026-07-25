import { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
import {
  attributeFormSchema,
  attributeFormDefaults,
  toCreateApiFormat,
  toUpdateApiFormat,
  type AttributeFormValues,
} from '../schemas/attribute.schema';
import { useCreateAttribute, useUpdateAttribute, useAttribute } from '../hooks/use-attributes';
import type { Attribute } from '../types/attribute.types';
import type { ApiErrorResponse } from '@/shared/api';

interface AttributeFormDialogProps {
  attribute: Attribute | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AttributeFormDialog({
  attribute,
  open,
  onOpenChange,
  onSuccess,
}: AttributeFormDialogProps) {
  const { t } = useTranslation();
  const createMutation = useCreateAttribute();
  const updateMutation = useUpdateAttribute();
  const { data: attrDetail, isLoading: isDetailLoading } = useAttribute(attribute?.id ?? null);
  const isEditing = !!attribute;

  const form = useForm<AttributeFormValues>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: attributeFormDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'values',
  });

  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const getError = (field: string) => {
    const error = form.formState.errors[field as keyof typeof form.formState.errors];
    if (error?.message) return t(error.message as string);
    if (serverErrors[field]) return serverErrors[field][0];
    return null;
  };

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      form.reset(attributeFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && attrDetail?.data) {
      const d = attrDetail.data;
      let parsedName: Record<string, string> = {};
      if (d.name && typeof d.name === 'object') {
        parsedName = d.name as Record<string, string>;
      } else if (typeof d.name === 'string') {
        try { parsedName = JSON.parse(d.name); } catch { parsedName = { en: d.name, ar: '' }; }
      }
      form.setValue('nameEn', parsedName.en || '');
      form.setValue('nameAr', parsedName.ar || '');

      if (d.values && d.values.length > 0) {
        form.setValue(
          'values',
          d.values.map((v) => {
            let parsedValue: Record<string, string> = {};
            if (v.value && typeof v.value === 'object') {
              parsedValue = v.value as Record<string, string>;
            } else if (typeof v.value === 'string') {
              try { parsedValue = JSON.parse(v.value); } catch { parsedValue = { en: v.value, ar: '' }; }
            }
            return { valueEn: parsedValue.en || '', valueAr: parsedValue.ar || '' };
          })
        );
      }
    }
  }, [attrDetail, isEditing, form]);

  const handleSubmit = (values: AttributeFormValues) => {
    setServerErrors({});

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && attribute) {
      updateMutation.mutate(
        { id: attribute.id, data: toUpdateApiFormat(values) },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(
        toCreateApiFormat(values),
        { ...commonOptions, onSuccess }
      );
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('attributes.editAttribute') : t('attributes.createAttribute')}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="nameEn" className="text-sm font-medium">{t('attributesForm.nameEn')} *</label>
              <Input id="nameEn" {...form.register('nameEn')} />
              {getError('nameEn') && (
                <p className="text-xs text-destructive">{getError('nameEn')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="nameAr" className="text-sm font-medium">{t('attributesForm.nameAr')} *</label>
              <Input id="nameAr" {...form.register('nameAr')} />
              {getError('nameAr') && (
                <p className="text-xs text-destructive">{getError('nameAr')}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">{t('attributesForm.values')}</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ valueEn: '', valueAr: '' })}
              >
                <Plus className="me-1 h-3.5 w-3.5" />
                {t('attributesForm.addValue')}
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="grid flex-1 grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Input
                      {...form.register(`values.${index}.valueEn` as const)}
                      placeholder={t('attributesForm.valueEnPlaceholder')}
                    />
                    {form.formState.errors.values?.[index]?.valueEn && (
                      <p className="text-xs text-destructive">
                        {t(form.formState.errors.values[index].valueEn?.message as string)}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input
                      {...form.register(`values.${index}.valueAr` as const)}
                      placeholder={t('attributesForm.valueArPlaceholder')}
                    />
                    {form.formState.errors.values?.[index]?.valueAr && (
                      <p className="text-xs text-destructive">
                        {t(form.formState.errors.values[index].valueAr?.message as string)}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="mt-0.5 shrink-0"
                  onClick={() => remove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? (isEditing ? t('attributes.updating') : t('attributes.creating'))
                : (isEditing ? t('common.update') : t('common.create'))
              }
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
