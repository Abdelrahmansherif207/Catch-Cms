import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { FileVideo, ImageIcon, Loader2, X } from 'lucide-react';
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
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { LocalizedContentEditor } from '../content-editor/localized-content-editor';
import {
  SECTION_IMAGE_ACCEPT,
  SECTION_IMAGE_MAX_BYTES,
  SECTION_VIDEO_ACCEPT,
  SECTION_VIDEO_MAX_BYTES,
  STATIC_SECTION_TYPES,
  isMediaSectionType,
  sectionFormDefaultsFor,
  sectionFormSchema,
  toCreateSectionPayload,
  toUpdateSectionPayload,
  tryParseConfigText,
  type SectionFormValues,
} from '../../schemas/static-page.schema';
import { useCreateStaticPageSection, useUpdateStaticPageSection } from '../../hooks/use-static-pages';
import type { JsonObject, LocaleMap, StaticPageSection } from '../../types/static-page.types';
import type { ApiErrorResponse } from '@/shared/api';

interface SectionFormDialogProps {
  slug: string;
  section?: StaticPageSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function mediaCollectionFor(type: string): 'static-section-image' | 'static-section-video' | null {
  if (type === 'image' || type === 'screenshot') return 'static-section-image';
  if (type === 'video') return 'static-section-video';
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// The dialog is keyed by section id + open state in the parent, so it
// remounts per open — state initializers below always reflect the latest
// section, avoiding setState-in-effect reset logic.
export function SectionFormDialog({
  slug,
  section,
  open,
  onOpenChange,
  onSuccess,
}: SectionFormDialogProps) {
  const { t } = useTranslation();
  const isEditing = !!section;
  const createMutation = useCreateStaticPageSection(slug);
  const updateMutation = useUpdateStaticPageSection(slug);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});
  const [contentValidation, setContentValidation] = useState<Record<string, string[]>>({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [content, setContent] = useState<LocaleMap<JsonObject>>(() => ({
    en: section?.content?.en ?? {},
    ar: section?.content?.ar ?? {},
  }));
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [removeMedia, setRemoveMedia] = useState(false);

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: sectionFormDefaultsFor(
      section
        ? { title: section.title, type: section.type, is_active: section.is_active, config: section.config ?? null }
        : null
    ),
  });

  const watchedType = form.watch('type');
  const watchedActive = form.watch('isActive');
  const isMediaType = isMediaSectionType(wantedType(watchedType));
  const accept = watchedType === 'video' ? SECTION_VIDEO_ACCEPT : SECTION_IMAGE_ACCEPT;
  const maxBytes = watchedType === 'video' ? SECTION_VIDEO_MAX_BYTES : SECTION_IMAGE_MAX_BYTES;

  const newFilePreviewUrl = useMemo(() => {
    if (!mediaFile) return null;
    return URL.createObjectURL(mediaFile);
  }, [mediaFile]);

  useEffect(() => {
    return () => {
      if (newFilePreviewUrl) URL.revokeObjectURL(newFilePreviewUrl);
    };
  }, [newFilePreviewUrl]);

  const handleContentChange = (next: LocaleMap<JsonObject>) => {
    setContent(next);
    setContentValidation({});
  };

  const validateMedia = (): string | null => {
    // text sections must not carry a file (contract: media prohibited).
    if (!isMediaType && mediaFile) {
      return t('staticPages.validation.mediaProhibited', 'Media files are not allowed for text sections.');
    }
    if (mediaFile && mediaFile.size > maxBytes) {
      return t('staticPages.validation.mediaTooLarge', `File is too large (max ${formatBytes(maxBytes)}).`, {
        max: formatBytes(maxBytes),
      });
    }
    if (!isEditing && isMediaType && !mediaFile) {
      return t('staticPages.validation.mediaRequired', 'A media file is required for this section type.');
    }
    if (isEditing && isMediaType && !mediaFile) {
      const needed = mediaCollectionFor(watchedType);
      const existingCollection = section?.media?.collection_name ?? null;
      const cleared = removeMedia || !section?.media;
      // Switching collections (image↔video) without a replacement file → 422.
      if (cleared || (needed && existingCollection && needed !== existingCollection)) {
        return t('staticPages.validation.mediaRequired', 'A media file is required for this section type.');
      }
    }
    return null;
  };

  const onSubmit = (values: SectionFormValues) => {
    setServerErrors({});
    setContentValidation({});
    setMediaError(null);
    setConfigError(null);

    // text sections require content in both locales (stricter than the
    // backend, kept intentionally per product decision).
    if (wantedType(values.type) === 'text') {
      const message = t('staticPages.validation.contentRequired');
      const missing: Record<string, string[]> = {};
      if (!content.en || Object.keys(content.en).length === 0) missing['content.en'] = [message];
      if (!content.ar || Object.keys(content.ar).length === 0) missing['content.ar'] = [message];
      if (Object.keys(missing).length > 0) {
        setContentValidation(missing);
        return;
      }
    }

    const parsed = tryParseConfigText(values.configText);
    if (parsed.error) {
      setConfigError(t(parsed.error, parsed.error));
      return;
    }

    const mediaErr = validateMedia();
    if (mediaErr) {
      setMediaError(mediaErr);
      return;
    }

    const commonOptions = {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
          if (apiError.errors.media) setMediaError(apiError.errors.media[0]);
          if (apiError.errors.config) setConfigError(apiError.errors.config[0]);
        }
      },
    };

    if (isEditing && section) {
      // type=text without a replacement clears media server-side; reflect
      // that when the user switches to text with no new file.
      const switchingToText = wantedType(values.type) === 'text' && values.type !== (section.type ?? 'text');
      const payload = toUpdateSectionPayload(
        values,
        content,
        section.content ?? {},
        { type: section.type, config: section.config ?? null, is_active: section.is_active },
        {
          config: parsed.config,
          ...(mediaFile ? { media: mediaFile } : {}),
          ...(removeMedia || switchingToText ? { removeMedia: true } : {}),
        }
      );
      updateMutation.mutate(
        { id: section.id, data: payload },
        { ...commonOptions, onSuccess }
      );
    } else {
      const payload = toCreateSectionPayload(values, content, {
        config: parsed.config,
        ...(mediaFile ? { media: mediaFile } : {}),
      });
      createMutation.mutate(payload, { ...commonOptions, onSuccess });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errors = form.formState.errors;

  const getError = (field: 'titleEn' | 'titleAr' | 'type'): string | undefined => {
    const clientErr = errors[field]?.message;
    let serverErr: string | undefined;
    if (field === 'titleEn') serverErr = serverErrors['title.en']?.[0] ?? serverErrors.title?.[0];
    if (field === 'titleAr') serverErr = serverErrors['title.ar']?.[0];
    if (field === 'type') serverErr = serverErrors.type?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  const contentErrors: Record<string, string[]> = { ...contentValidation };
  const formLevelErrors: Record<string, string[]> = {};
  Object.entries(serverErrors).forEach(([field, messages]) => {
    if (field.startsWith('content')) contentErrors[field] = messages;
    else if (!['title.en', 'title.ar', 'title', 'titleEn', 'titleAr', 'media', 'config', 'type'].includes(field)) {
      formLevelErrors[field] = messages;
    }
  });
  if (serverErrors.is_active) formLevelErrors.is_active = serverErrors.is_active;
  if (serverErrors.remove_media) formLevelErrors.remove_media = serverErrors.remove_media;

  const showExistingMedia = isEditing && section?.media && !removeMedia && !mediaFile;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('staticPages.editSection') : t('staticPages.addSection')}
          </DialogTitle>
          <DialogDescription>{t('staticPages.sectionFormSubtitle')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('staticPages.titleEn')} *</label>
              <Input placeholder={t('staticPages.titleEn')} {...form.register('titleEn')} />
              {getError('titleEn') && (
                <p className="text-xs text-destructive">{getError('titleEn')}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('staticPages.titleAr')} *</label>
              <Input placeholder={t('staticPages.titleAr')} dir="rtl" {...form.register('titleAr')} />
              {getError('titleAr') && (
                <p className="text-xs text-destructive">{getError('titleAr')}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('staticPages.sectionType', 'Section type')} *</label>
              <Select
                value={watchedType}
                onValueChange={(value) => {
                  if (value === 'text' || value === 'image' || value === 'video' || value === 'screenshot') {
                    form.setValue('type', value, { shouldValidate: true });
                    setMediaError(null);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('staticPages.sectionType', 'Section type')} />
                </SelectTrigger>
                <SelectContent>
                  {STATIC_SECTION_TYPES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`staticPages.sectionTypes.${option}`, option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getError('type') && <p className="text-xs text-destructive">{getError('type')}</p>}
              <p className="text-xs text-muted-foreground">{t('staticPages.typeHint', 'Text is JSON content. Image, screenshot and video upload a media file.')}</p>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <label className="text-sm font-medium">{t('staticPages.sectionActive', 'Visible')}</label>
                <p className="text-xs text-muted-foreground">{t('staticPages.sectionActiveHint', 'Hidden sections are excluded from the public page.')}</p>
              </div>
              <Switch
                checked={!!watchedActive}
                onCheckedChange={(checked) => form.setValue('isActive', !!checked)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('staticPages.content')}</label>
            <LocalizedContentEditor
              value={content}
              onChange={handleContentChange}
              errors={contentErrors}
            />
            <p className="text-xs text-muted-foreground">
              {isMediaType
                ? t('staticPages.contentHintMedia', 'Optional alt text / caption per locale, e.g. name "alt", value "Our team photo".')
                : t('staticPages.contentHint')}
            </p>
          </div>

          {Object.keys(contentErrors).length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(contentErrors).map(([field, messages]) =>
                  messages.map((msg, i) => (
                    <li key={`${field}-${i}`} className="text-xs text-destructive">
                      {t(msg, msg)}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

          {isMediaType ? (
            <div className="space-y-2 rounded-lg border p-3">
              <label className="text-sm font-medium">{t('staticPages.media', 'Media')} *</label>
              {showExistingMedia && (
                <ExistingMediaPreview section={section!} onRemove={() => setRemoveMedia(true)} />
              )}
              {removeMedia && !mediaFile && (
                <p className="text-xs text-amber-600">{t('staticPages.mediaWillBeRemoved', 'Existing media will be removed on save. Pick a file below to replace it instead.')}</p>
              )}
              {mediaFile ? (
                <div className="flex items-center gap-3 rounded-md bg-muted/40 p-2">
                  {watchedType === 'video' ? (
                    newFilePreviewUrl ? (
                      <video src={newFilePreviewUrl} className="h-16 w-24 rounded object-cover" muted playsInline />
                    ) : (
                      <FileVideo className="h-8 w-8 text-muted-foreground" />
                    )
                  ) : newFilePreviewUrl ? (
                    <img src={newFilePreviewUrl} alt="" className="h-16 w-24 rounded object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{mediaFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(mediaFile.size)} · {t('staticPages.mediaMax', `Max ${formatBytes(maxBytes)}`, { max: formatBytes(maxBytes) })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMediaFile(null)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={t('staticPages.mediaClear', 'Remove selected file')}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept={accept}
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setMediaFile(file);
                    setMediaError(null);
                    if (file) setRemoveMedia(false);
                  }}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {watchedType === 'video'
                  ? t('staticPages.mediaHintVideo', `MP4, WebM, OGG, MOV or AVI up to ${formatBytes(SECTION_VIDEO_MAX_BYTES)}.`, { max: formatBytes(SECTION_VIDEO_MAX_BYTES) })
                  : t('staticPages.mediaHintImage', `JPEG, PNG, WebP or GIF up to ${formatBytes(SECTION_IMAGE_MAX_BYTES)}.`, { max: formatBytes(SECTION_IMAGE_MAX_BYTES) })}
              </p>
              {!mediaFile && isEditing && section?.media && (
                <label className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={removeMedia}
                    onChange={(e) => setRemoveMedia(e.target.checked)}
                    className="h-4 w-4 accent-current"
                  />
                  {t('staticPages.removeMedia', 'Remove existing media')}
                </label>
              )}
              {mediaError && <p className="text-xs text-destructive">{mediaError}</p>}
              {serverErrors.media && !mediaError && (
                <p className="text-xs text-destructive">{serverErrors.media[0]}</p>
              )}
            </div>
          ) : (
            mediaFile && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-600">
                {t('staticPages.validation.mediaProhibited', 'Media files are not allowed for text sections.')}
              </p>
            )
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('staticPages.config', 'Config (JSON)')}</label>
            <Textarea
              rows={3}
              dir="ltr"
              className="font-mono text-xs"
              placeholder={watchedType === 'video' ? '{"poster": "https://..."}' : '{"foo": "bar"}'}
              {...form.register('configText')}
            />
            <p className="text-xs text-muted-foreground">{t('staticPages.configHint', 'Optional per-type metadata as a JSON object. Leave empty for none.')}</p>
            {configError && <p className="text-xs text-destructive">{configError}</p>}
            {serverErrors.config && !configError && (
              <p className="text-xs text-destructive">{serverErrors.config[0]}</p>
            )}
          </div>

          {Object.keys(formLevelErrors).length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(formLevelErrors).map(([field, messages]) =>
                  messages.map((msg, i) => (
                    <li key={`${field}-${i}`} className="text-xs text-destructive">
                      {field}: {msg}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}

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
              {isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {isEditing ? t('staticPages.updating') : t('staticPages.creating')}
                </>
              ) : isEditing ? (
                t('staticPages.updateSection')
              ) : (
                t('staticPages.addSection')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function wantedType(value: unknown): string {
  return typeof value === 'string' ? value : 'text';
}

function ExistingMediaPreview({ section, onRemove }: { section: StaticPageSection; onRemove: () => void }) {
  const { t } = useTranslation();
  const media = section.media;
  if (!media) return null;
  const poster = configPoster(section.config);
  return (
    <div className="flex items-center gap-3 rounded-md bg-muted/40 p-2">
      {section.type === 'video' ? (
        <video src={media.url} poster={poster ?? undefined} className="h-16 w-24 rounded object-cover" muted playsInline preload="metadata" />
      ) : (
        <img src={media.thumb_url ?? media.url} alt="" className="h-16 w-24 rounded object-cover" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium">{media.file_name ?? media.name ?? media.url}</p>
        <p className="text-xs text-muted-foreground">{media.mime_type} · {formatBytes(media.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={t('staticPages.removeMedia', 'Remove existing media')}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function configPoster(config: StaticPageSection['config']): string | null {
  if (!config || typeof config !== 'object') return null;
  const poster = (config as Record<string, unknown>).poster;
  return typeof poster === 'string' && poster.length > 0 ? poster : null;
}
