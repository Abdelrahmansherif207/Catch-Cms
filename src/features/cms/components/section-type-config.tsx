import { useTranslation } from 'react-i18next';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';

import categoriesSvg from '@/shared/sectiontypes/categories.svg';
import categoriesCircleSvg from '@/shared/sectiontypes/categories-circle.svg';
import slidersSvg from '@/shared/sectiontypes/sliders.svg';
import promotionsSvg from '@/shared/sectiontypes/promotions.svg';
import flashSalesSvg from '@/shared/sectiontypes/flash-sales.svg';
import couponsSvg from '@/shared/sectiontypes/coupons.svg';
import brandsSvg from '@/shared/sectiontypes/brands.svg';
import productsSvg from '@/shared/sectiontypes/products.svg';
import bannersSvg from '@/shared/sectiontypes/banners.svg';

const TYPE_SVG_MAP: Record<string, string> = {
  sliders: slidersSvg,
  promotions: promotionsSvg,
  'flash-sales': flashSalesSvg,
  coupons: couponsSvg,
  brands: brandsSvg,
  categories: categoriesSvg,
  products: productsSvg,
  banners: bannersSvg,
};

interface SectionTypeConfigProps {
  type: string;
  frontSettings: Record<string, unknown>;
  onFrontChange: (settings: Record<string, unknown>) => void;
}

export function SectionTypeConfig({
  type,
  frontSettings,
  onFrontChange,
}: SectionTypeConfigProps) {
  const { t } = useTranslation();
  if (!type) return null;

  const set = (key: string, value: unknown) => {
    onFrontChange({ ...frontSettings, [key]: value });
  };

  const val = (key: string) => frontSettings[key];

  const shape = (val('shape') as string) || 'square';
  const layout = (val('layout') as string) || 'grid';
  const autoplay = !!val('autoplay');

  return (
    <div className="space-y-4">
      {/* ─── Categories live preview ─── */}
      {type === 'categories' && (
        <div className="flex justify-center rounded-lg border bg-muted/20 p-3">
          <img
            src={shape === 'circle' ? categoriesCircleSvg : categoriesSvg}
            alt={`Categories ${shape}`}
            className="h-auto w-full max-w-[260px] rounded-md"
          />
        </div>
      )}

      {/* ─── General type preview ─── */}
      {type !== 'categories' && TYPE_SVG_MAP[type] && (
        <div className="flex justify-center rounded-lg border bg-muted/20 p-3">
          <img
            src={TYPE_SVG_MAP[type]}
            alt={type}
            className="h-auto w-full max-w-[260px] rounded-md"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {/* columns_count */}
        {(type === 'promotions' ||
          type === 'flash-sales' ||
          type === 'coupons' ||
          type === 'brands' ||
          type === 'categories' ||
          type === 'products' ||
          type === 'banners') && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('sections.columnsCount')}
            </label>
            <Input
              type="number"
              min={1}
              max={type === 'categories' ? 8 : undefined}
              value={
                val('columns_count') !== undefined && val('columns_count') !== null
                  ? String(val('columns_count'))
                  : ''
              }
              onChange={(e) =>
                set(
                  'columns_count',
                  e.target.value ? Number(e.target.value) : null
                )
              }
              placeholder={type === 'categories' ? '4' : '4'}
            />
          </div>
        )}

        {/* layout */}
        {(type === 'promotions' ||
          type === 'flash-sales' ||
          type === 'coupons' ||
          type === 'brands') && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('sections.layout')}
            </label>
            <Select
              value={layout}
              onValueChange={(v) => set('layout', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">
                  {t('sections.layoutGrid')}
                </SelectItem>
                <SelectItem value="list">
                  {t('sections.layoutList')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* autoplay */}
        {(type === 'sliders' ||
          type === 'promotions' ||
          type === 'flash-sales') && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <label className="text-sm font-medium">
              {t('sections.autoplay')}
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={autoplay}
              onClick={() => set('autoplay', !autoplay)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                autoplay ? 'bg-primary' : 'bg-input'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
                  autoplay ? 'translate-x-4' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        )}

        {/* slider_speed */}
        {(type === 'sliders' || type === 'promotions') && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('sections.sliderSpeed')}
            </label>
            <Input
              type="number"
              min={500}
              step={500}
              value={
                val('slider_speed') !== undefined && val('slider_speed') !== null
                  ? String(val('slider_speed'))
                  : ''
              }
              onChange={(e) =>
                set(
                  'slider_speed',
                  e.target.value ? Number(e.target.value) : null
                )
              }
              placeholder="3000"
            />
          </div>
        )}

        {/* show_timer */}
        {type === 'flash-sales' && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <label className="text-sm font-medium">
              {t('sections.showTimer')}
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={!!val('show_timer')}
              onClick={() => set('show_timer', !val('show_timer'))}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors',
                val('show_timer') ? 'bg-primary' : 'bg-input'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-sm transition-transform',
                  val('show_timer') ? 'translate-x-4' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        )}

        {/* timer_end_at */}
        {type === 'flash-sales' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('sections.timerEndAt')}
            </label>
            <Input
              type="datetime-local"
              value={(val('timer_end_at') as string) || ''}
              onChange={(e) => set('timer_end_at', e.target.value || null)}
            />
          </div>
        )}

        {/* theme */}
        {type === 'flash-sales' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('sections.theme')}
            </label>
            <Select
              value={(val('theme') as string) || 'dark'}
              onValueChange={(v) => set('theme', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="colorful">Colorful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* shape (categories only) */}
        {type === 'categories' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('sections.shape')}
            </label>
            <Select
              value={shape}
              onValueChange={(v) => set('shape', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="square">
                  {t('sections.square')}
                </SelectItem>
                <SelectItem value="circle">
                  {t('sections.circle')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* badge_text */}
        {type === 'products' && (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {t('sections.badgeText')}
            </label>
            <Input
              type="text"
              value={(val('badge_text') as string) || ''}
              onChange={(e) => set('badge_text', e.target.value || null)}
              placeholder="e.g. Best Seller"
            />
          </div>
        )}
      </div>
    </div>
  );
}
