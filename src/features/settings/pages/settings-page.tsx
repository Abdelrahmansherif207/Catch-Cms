import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Separator } from '@/shared/ui/separator';
import { Skeleton } from '@/shared/ui/skeleton';
import { Switch } from '@/shared/ui/switch';
import { useSettings, useUpdateSettings } from '../hooks/use-settings';
import { settingsSchema, toApiFormat, type SettingsFormValues } from '../schemas/settings.schema';
import type { UpdateSettingsPayload } from '../types/settings.types';
import type { ApiErrorResponse } from '@/shared/api';

export function SettingsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const [logoPreview, setLogoPreview] = useState<string | null>(data?.data?.logo || null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(data?.data?.favicon || null);
  const [footerLogoPreview, setFooterLogoPreview] = useState<string | null>(data?.data?.footer_logo || null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    mode: 'onBlur',
    values: {
      siteNameEn: data?.data?.site_name?.en || '',
      siteNameAr: data?.data?.site_name?.ar || '',
      siteDescEn: data?.data?.site_desc?.en || '',
      siteDescAr: data?.data?.site_desc?.ar || '',
      metaDescEn: data?.data?.meta_desc?.en || '',
      metaDescAr: data?.data?.meta_desc?.ar || '',
      siteCopyRightEn: data?.data?.site_copy_right?.en || '',
      siteCopyRightAr: data?.data?.site_copy_right?.ar || '',
      siteEmail: data?.data?.site_email || '',
      emailSupport: data?.data?.email_support || '',
      facebook: data?.data?.facebook || '',
      instagram: data?.data?.instagram || '',
      linkedin: data?.data?.linkedin || '',
      promotionVideoUrl: data?.data?.promotion_video_url || '',
      youtube: data?.data?.youtube || '',
      tiktok: data?.data?.tiktok || '',
      snapchat: data?.data?.snapchat || '',
      phone: data?.data?.phone || '',
      minimumOrderAmount: String(data?.data?.minimumOrderAmount ?? '0'),
      fastShippingPagePublish: Boolean(data?.data?.fast_shipping_page_publish),
      currencySelectionEnabled: Boolean(data?.data?.currency_selection_enabled),
    },
  });

  const fastShippingPagePublish = useWatch({ control: form.control, name: 'fastShippingPagePublish' });
  const currencySelectionEnabled = useWatch({ control: form.control, name: 'currencySelectionEnabled' });

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'logo' | 'favicon' | 'footerLogo',
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

  const onSubmit = (values: SettingsFormValues) => {
    setServerErrors({});
    const apiData = toApiFormat(values);
    const logo = form.getValues('logo');
    const favicon = form.getValues('favicon');
    const footerLogo = form.getValues('footerLogo');

    updateMutation.mutate({ ...apiData, logo, footer_logo: footerLogo, favicon } as UpdateSettingsPayload, {
      onError: (error: unknown) => {
        const apiError = error as ApiErrorResponse;
        if (apiError?.status === 422 && apiError.errors) {
          setServerErrors(apiError.errors);
        }
      },
    });
  };

  const getError = (field: string): string | undefined => {
    const clientErr = form.formState.errors[field as keyof SettingsFormValues]?.message as string | undefined;
    const serverErr = serverErrors[field]?.[0];
    const errMsg = clientErr || serverErr;
    if (!errMsg) return undefined;
    return t(errMsg, errMsg);
  };

  const isPending = updateMutation.isPending;

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t('sidebar.settings')}
        </h1>
        <p className="text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('settings.general')}</h2>
          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.siteNameEn')} *</label>
              <Input {...form.register('siteNameEn')} placeholder="Site Name" />
              {getError('siteNameEn') && <p className="text-xs text-destructive">{getError('siteNameEn')}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.siteNameAr')} *</label>
              <Input {...form.register('siteNameAr')} placeholder="اسم الموقع" dir="rtl" />
              {getError('siteNameAr') && <p className="text-xs text-destructive">{getError('siteNameAr')}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.siteDescEn')}</label>
              <Textarea {...form.register('siteDescEn')} rows={2} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.siteDescAr')}</label>
              <Textarea {...form.register('siteDescAr')} rows={2} dir="rtl" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.metaDescEn')}</label>
              <Textarea {...form.register('metaDescEn')} rows={2} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.metaDescAr')}</label>
              <Textarea {...form.register('metaDescAr')} rows={2} dir="rtl" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.copyRightEn')}</label>
              <Input {...form.register('siteCopyRightEn')} placeholder="© 2026" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.copyRightAr')}</label>
              <Input {...form.register('siteCopyRightAr')} placeholder="© 2026" dir="rtl" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('settings.contact')}</h2>
          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.siteEmail')}</label>
              <Input {...form.register('siteEmail')} type="email" placeholder="info@example.com" />
              {getError('siteEmail') && <p className="text-xs text-destructive">{getError('siteEmail')}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.emailSupport')}</label>
              <Input {...form.register('emailSupport')} type="email" placeholder="support@example.com" />
              {getError('emailSupport') && <p className="text-xs text-destructive">{getError('emailSupport')}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('settings.phone')}</label>
            <Input {...form.register('phone')} placeholder="+201111111111" />
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('settings.social')}</h2>
          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Facebook</label>
              <Input {...form.register('facebook')} placeholder="https://facebook.com/..." />
              {getError('facebook') && <p className="text-xs text-destructive">{getError('facebook')}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Instagram</label>
              <Input {...form.register('instagram')} placeholder="https://instagram.com/..." />
              {getError('instagram') && <p className="text-xs text-destructive">{getError('instagram')}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">LinkedIn</label>
              <Input {...form.register('linkedin')} placeholder="https://linkedin.com/..." />
              {getError('linkedin') && <p className="text-xs text-destructive">{getError('linkedin')}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">YouTube</label>
              <Input {...form.register('youtube')} placeholder="https://youtube.com/..." />
              {getError('youtube') && <p className="text-xs text-destructive">{getError('youtube')}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">TikTok</label>
              <Input {...form.register('tiktok')} placeholder="https://tiktok.com/..." />
              {getError('tiktok') && <p className="text-xs text-destructive">{getError('tiktok')}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Snapchat</label>
              <Input {...form.register('snapchat')} placeholder="https://snapchat.com/..." />
              {getError('snapchat') && <p className="text-xs text-destructive">{getError('snapchat')}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('settings.promoVideo')}</label>
            <Input {...form.register('promotionVideoUrl')} placeholder="https://youtube.com/watch?v=..." />
            {getError('promotionVideoUrl') && <p className="text-xs text-destructive">{getError('promotionVideoUrl')}</p>}
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('settings.branding')}</h2>
          <Separator />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.logo')}</label>
              <Input type="file" accept="image/jpeg,image/png,image/gif,image/svg+xml" onChange={(e) => handleFileChange(e, 'logo', setLogoPreview)} />
              {getError('logo') && <p className="text-xs text-destructive">{getError('logo')}</p>}
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-16 rounded border object-contain mt-1" />}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.footerLogo')}</label>
              <Input type="file" accept="image/jpeg,image/png,image/gif,image/svg+xml" onChange={(e) => handleFileChange(e, 'footerLogo', setFooterLogoPreview)} />
              {getError('footerLogo') && <p className="text-xs text-destructive">{getError('footerLogo')}</p>}
              {footerLogoPreview && <img src={footerLogoPreview} alt="Footer Logo" className="h-16 rounded border object-contain mt-1" />}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t('settings.favicon')}</label>
              <Input type="file" accept="image/jpeg,image/png,image/gif,image/svg+xml" onChange={(e) => handleFileChange(e, 'favicon', setFaviconPreview)} />
              {getError('favicon') && <p className="text-xs text-destructive">{getError('favicon')}</p>}
              {faviconPreview && <img src={faviconPreview} alt="Favicon" className="h-10 rounded border object-contain mt-1" />}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('settings.shipping')}</h2>
          <Separator />
          <div className="space-y-1.5">
            <label className="text-sm font-medium">{t('settings.minimumOrderAmount')}</label>
            <Input
              type="number"
              min={0}
              {...form.register('minimumOrderAmount')}
              placeholder="100"
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <label className="text-sm font-medium">{t('settings.fastShippingPage')}</label>
              <p className="text-xs text-muted-foreground">{t('settings.fastShippingPageHint')}</p>
            </div>
            <Switch
              checked={fastShippingPagePublish}
              onCheckedChange={(checked) => form.setValue('fastShippingPagePublish', !!checked)}
            />
          </div>
        </div>

        <div className="rounded-lg border p-6 space-y-4">
          <h2 className="text-lg font-semibold">{t('settings.currency')}</h2>
          <Separator />
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <label className="text-sm font-medium">{t('settings.currencySelection')}</label>
              <p className="text-xs text-muted-foreground">{t('settings.currencySelectionHint')}</p>
            </div>
            <Switch
              checked={currencySelectionEnabled}
              onCheckedChange={(checked) => form.setValue('currencySelectionEnabled', !!checked)}
            />
          </div>

          {data?.data?.options && (
            <div className="grid gap-4 sm:grid-cols-3 rounded-lg border bg-muted/30 p-4">
              <div>
                <p className="text-xs text-muted-foreground">{t('settings.currencyActive')}</p>
                <p className="mt-0.5 font-medium">{data.data.options.currency || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('settings.currencyBase')}</p>
                <p className="mt-0.5 font-medium">{data.data.options.base_currency_code || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('settings.currencyCatalog')}</p>
                <p className="mt-0.5 font-medium">{data.data.options.catalog_currency_code || '—'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('common.loading')}</>
            ) : (
              <><Save className="mr-2 h-4 w-4" /> {t('common.save')}</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-px w-full" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
