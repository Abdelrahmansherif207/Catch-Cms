import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Film, ImageIcon, Loader2, Upload, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import { DataErrorState } from '@/shared/components/data-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { heroFormDefaults, heroMediaError, heroFormSchema, type HeroFormValues } from '../schemas/hero.schema';
import {
  useCreateHero,
  useUpdateHero,
  useHero,
  heroDescriptionOf,
} from '../hooks/use-heroes';
import type { Hero, HeroType } from '../types/hero.types';
import type { ApiErrorResponse } from '@/shared/api';

interface HeroFormDialogProps {
  hero?: Hero | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/** Video previews must use the playable file, never the thumbnail. */
function heroMediaPreview(media: Hero['media'], type: string): string | null {
  if (!media) return null;
  return type === 'video' ? media.url : media.thumb_url || media.url;
}

export function HeroFormDialog({
  hero,
  open,
  onOpenChange,
  onSuccess,
}: HeroFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!hero;
  const createMutation = useCreateHero();
  const updateMutation = useUpdateHero();
  const {
    data: heroDetail,
    isLoading: isDetailLoading,
    isError: isDetailError,
    refetch: refetchHeroDetail,
  } = useHero(hero?.id ?? 0);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaError, setMediaError] = useState<string | undefined>(undefined);
  const [replacingMedia, setReplacingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<HeroFormValues>({
    resolver: zodResolver(heroFormSchema),
    defaultValues: heroFormDefaults,
  });

  const selectedType = form.watch('type');

  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setServerErrors({});
      setMediaPreview(null);
      setMediaError(undefined);
      setReplacingMedia(false);
      form.reset(heroFormDefaults);
    }
    prevOpenRef.current = open;
  }, [open, form]);

  useEffect(() => {
    if (isEditing && hero && heroDetail?.data) {
      const d = heroDetail.data;
      const description = heroDescriptionOf(d);
      form.setValue('type', d.type === 'image' ? 'image' : 'video');
      form.setValue('descriptionEn', description.en || '');
      form.setValue('descriptionAr', description.ar || '');
      form.setValue('isActive', d.is_active ? '1' : '0');
      if (!replacingMedia) {
        setMediaPreview(heroMediaPreview(d.media, d.type === 'image' ? 'image' : 'video'));
      }
    }
  }, [heroDetail, isEditing, hero, form, replacingMedia]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    form.setValue('media', file ?? undefined);
    setReplacingMedia(!!file);
    setMediaError(undefined);
    if (!file) {
      setMediaPreview(
        heroMediaPreview(hero?.media || heroDetail?.data?.media || null, selectedType)
      );
      return;
    }
    const err = heroMediaError(selectedType, file);
    if (err) {
      setMediaError(err);
      form.setValue('media', undefined);
      setReplacingMedia(false);
      e.target.value = '';
      return;
    }
    if (selectedType === 'video') {
      setMediaPreview(URL.createObjectURL(file));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearSelectedFile = () => {
    form.setValue('media', undefined);
    setReplacingMedia(false);
    setMediaError(undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setMediaPreview(
      heroMediaPreview(hero?.media || heroDetail?.data?.media || null, selectedType)
    );
  };

  const onSubmit = (values: HeroFormValues) => {
    setServerErrors({});

    if (!isEditing && !values.media) {
      setServerErrors({ media: [t('heroes.mediaRequired')] });
      return;
    }

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if ((apiError?.status === 422 || apiError?.status === 400) && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    };

    if (isEditing && hero) {
      updateMutation.mutate(
        {
          id: hero.id,
          data: {
            _method: 'PUT',
            type: values.type,
            media: values.media,
            'description[en]': values.descriptionEn,
            'description[ar]': values.descriptionAr,
            is_active: values.isActive,
          },
        },
        { ...commonOptions, onSuccess }
      );
    } else {
      createMutation.mutate(
        {
          type: values.type,
          media: values.media as File,
          'description[en]': values.descriptionEn,
          'description[ar]': values.descriptionAr,
          is_active: values.isActive,
        },
        { ...commonOptions, onSuccess }
      );
    }
  };

  const isDetailReady = !isEditing || !!heroDetail?.data;
  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    isDetailLoading ||
    !isDetailReady;
  const errors = form.formState.errors;

  // Server 422 keys can be camelCase, dot-nested or bracketed for the same
  // field; map every shape back to the input that renders it.
  const SERVER_FIELD_ALIASES: Record<string, string[]> = {
    media: ['media'],
    type: ['type'],
    descriptionEn: ['descriptionEn', 'description.en', 'description[en]'],
    descriptionAr: ['descriptionAr', 'description.ar', 'description[ar]'],
    isActive: ['isActive', 'is_active'],
  };

  const serverErrorFor = (field: string): string | undefined => {
    const keys = SERVER_FIELD_ALIASES[field] ?? [field];
    for (const key of keys) {
      const message = serverErrors[key]?.[0];
      if (message) return message;
    }
    return undefined;
  };

  const getError = (field: string): string | undefined => {
    const clientErr = errors[field as keyof HeroFormValues]?.message as string | undefined;
    const errMsg = clientErr || serverErrorFor(field);
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  const isVideo = selectedType === 'video';
  const currentMedia = heroDetail?.data?.media;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? t('heroes.editHero') : t('heroes.createHero')}</DialogTitle>
          <DialogDescription>{t('heroes.formSubtitle')}</DialogDescription>
        </DialogHeader>

        {isEditing && isDetailLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isEditing && isDetailError ? (
          // Never let a failed detail load fall back to defaults — updating
          // from defaults would overwrite the stored hero.
          <DataErrorState
            message={t('common.loadError')}
            onRetry={() => {
              void refetchHeroDetail();
            }}
          />
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {Object.keys(serverErrors).length > 0 && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 p-3"
              >
                <p className="text-xs font-medium text-destructive">
                  {t('common.validationSummary')}
                </p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {Object.entries(serverErrors).flatMap(([field, messages]) =>
                    messages.map((msg, i) => (
                      <li key={`${field}-${i}`} className="text-xs text-destructive">
                        {t(msg, msg)}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="hero-type" className="text-sm font-medium">
                  {t('heroes.heroType')} *
                </label>
                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    if (!value) return;
                    form.setValue('type', value as HeroType);
                    // Media rules differ per type — drop a pending file that
                    // no longer matches, and cancel validation errors.
                    const pending = form.getValues('media');
                    if (pending && heroMediaError(value, pending)) {
                      form.setValue('media', undefined);
                      setReplacingMedia(false);
                      setMediaError(undefined);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                      setMediaPreview(heroMediaPreview(currentMedia ?? null, value));
                    }
                  }}
                >
                  <SelectTrigger id="hero-type">
                    <SelectValue placeholder={t('heroes.selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">{t('heroes.typeImage')}</SelectItem>
                    <SelectItem value="video">{t('heroes.typeVideo')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t('heroes.typeHint')}</p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="hero-media-input" className="text-sm font-medium">
                  {t('heroes.media')} {!isEditing && '*'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={isVideo ? 'video/mp4,video/webm,video/ogg,video/mov,video/avi' : 'image/jpeg,image/png,image/webp,image/gif'}
                  onChange={handleFileChange}
                  className="hidden"
                  id="hero-media-input"
                />
                {replacingMedia ? (
                  <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                    <span className="truncate">{t('heroes.fileSelected')}</span>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={t('heroes.clearFile')}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-card text-sm text-muted-foreground hover:border-ring hover:bg-muted/40"
                  >
                    <Upload className="h-5 w-5" />
                    {currentMedia ? t('heroes.replaceMedia') : t('heroes.chooseMedia')}
                  </button>
                )}
                {currentMedia && !replacingMedia && !mediaPreview && (
                  <p className="text-xs text-muted-foreground">
                    {currentMedia.file_name || currentMedia.name || currentMedia.url}
                  </p>
                )}
                {mediaError && (
                  <p className="text-xs text-destructive">{t(mediaError)}</p>
                )}
                {getError('media') && !mediaError && (
                  <p className="text-xs text-destructive">{getError('media')}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {isVideo
                    ? t('heroes.mediaHintVideo')
                    : t('heroes.mediaHintImage')}
                </p>
              </div>
            </div>

            {/* Preview */}
            {mediaPreview && (
              <div className="relative overflow-hidden rounded-lg border bg-muted/20">
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="absolute end-2 top-2 z-10 rounded-full bg-background/80 p-1 text-muted-foreground hover:text-destructive"
                  aria-label={t('heroes.clearFile')}
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center justify-center bg-black/90 p-3">
                  {isVideo ? (
                    <video src={mediaPreview} controls autoPlay muted playsInline className="max-h-56 w-full rounded" />
                  ) : (
                    <img src={mediaPreview} alt={t('heroes.media')} className="max-h-56 w-auto rounded object-contain" />
                  )}
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
                  {isVideo ? <Film className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />}
                  <span>{currentMedia && !replacingMedia ? currentMedia.file_name || currentMedia.url : t('heroes.fileSelected')}</span>
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="heroDescEn" className="text-sm font-medium">{t('heroes.description')}</label>
                <Textarea
                  id="heroDescEn"
                  dir="ltr"
                  placeholder={t('heroes.descriptionPlaceholder')}
                  aria-invalid={!!getError('descriptionEn')}
                  {...form.register('descriptionEn')}
                />
                {getError('descriptionEn') && (
                  <p className="text-xs text-destructive">{getError('descriptionEn')}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="heroDescAr" className="text-sm font-medium">{t('heroes.description')}</label>
                <Textarea
                  id="heroDescAr"
                  dir="rtl"
                  placeholder={t('heroes.descriptionPlaceholder')}
                  aria-invalid={!!getError('descriptionAr')}
                  {...form.register('descriptionAr')}
                />
                {getError('descriptionAr') && (
                  <p className="text-xs text-destructive">{getError('descriptionAr')}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <label className="text-sm font-medium">{t('heroes.isActive')}</label>
                <p className="text-xs text-muted-foreground">{t('heroes.isActiveHint')}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={form.watch('isActive') === '1'}
                aria-label={t('heroes.isActive')}
                onClick={() => form.setValue('isActive', form.getValues('isActive') === '1' ? '0' : '1')}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${
                  form.watch('isActive') === '1' ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`pointer-events-none absolute start-0.5 top-0.5 block h-4 w-4 rounded-full bg-background shadow-sm transition-[inset-inline-start] ${
                    form.watch('isActive') === '1' ? 'start-[18px]' : ''
                  }`}
                />
              </button>
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
              <Button type="submit" disabled={isPending || !!mediaError}>
                {isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                {isEditing ? t('heroes.updateHero') : t('heroes.createHero')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}