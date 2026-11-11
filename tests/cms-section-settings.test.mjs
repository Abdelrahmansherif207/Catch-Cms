import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';

let server;
let toTitleDraft;
let toUpdatePayload;
let sectionFormDefaults;
let isPlainTitle;
let mergeSettingsFields;
let normalizeFieldSpec;
let inferKind;
let defaultFrontSettingsForType;
let heroMediaPatch;
let findLinkedHero;

before(async () => {
  server = await createServer({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
    optimizeDeps: { noDiscovery: true },
  });

  ({ toTitleDraft, toUpdatePayload, sectionFormDefaults, isPlainTitle } = await server.ssrLoadModule(
    '/src/features/cms/schemas/section.schema.ts'
  ));
  ({
    mergeSettingsFields,
    normalizeFieldSpec,
    inferKind,
    defaultFrontSettingsForType,
    heroMediaPatch,
    findLinkedHero,
  } = await server.ssrLoadModule('/src/features/cms/lib/section-settings.ts'));
});

after(async () => {
  await server?.close();
});

// ─── C1: title draft + per-locale update payload ────────────────

test('toTitleDraft reuses a plain resolved string for both locale inputs', () => {
  assert.deepEqual(toTitleDraft('Shop by Category'), {
    en: 'Shop by Category',
    ar: 'Shop by Category',
  });
});

test('toTitleDraft parses localized JSON and object titles', () => {
  assert.deepEqual(toTitleDraft('{"en":"Flash Sales","ar":"عروض"}'), {
    en: 'Flash Sales',
    ar: 'عروض',
  });
  assert.deepEqual(toTitleDraft({ en: 'Flash Sales' }), {
    en: 'Flash Sales',
    ar: '',
  });
  assert.deepEqual(toTitleDraft(null), { en: '', ar: '' });
});

test('isPlainTitle flags plain resolved titles, not localized ones', () => {
  assert.equal(isPlainTitle('Shop by Category'), true);
  assert.equal(isPlainTitle('{"en":"Flash Sales"}'), false);
  assert.equal(isPlainTitle({ en: 'Flash Sales' }), false);
  assert.equal(isPlainTitle(null), false);
  assert.equal(isPlainTitle(undefined), false);
});

test('editing one locale round-trips into a partial title payload', () => {
  const draft = toTitleDraft('Shop by Category');
  const values = {
    ...sectionFormDefaults,
    type: 'categories',
    titleEn: `${draft.en} 2`,
    titleAr: draft.ar,
  };

  const payload = toUpdatePayload(values, { en: values.titleEn });

  assert.deepEqual(payload.title, { en: 'Shop by Category 2' });
  assert.equal(Object.prototype.hasOwnProperty.call(payload.title, 'ar'), false);
});

test('an untouched title omits the title key entirely', () => {
  const payload = toUpdatePayload(
    { ...sectionFormDefaults, type: 'categories', titleEn: 'A', titleAr: 'ب' },
    {}
  );

  assert.equal(Object.prototype.hasOwnProperty.call(payload, 'title'), false);
  assert.equal(payload.is_active, 1);
  assert.deepEqual(payload.setting, { front: {}, back: {} });
});

test('omitting titleLocales keeps the previous both-locale behaviour', () => {
  const payload = toUpdatePayload({
    ...sectionFormDefaults,
    type: 'categories',
    titleEn: 'A',
    titleAr: 'ب',
  });

  assert.deepEqual(payload.title, { en: 'A', ar: 'ب' });
});

// ─── Settings merge order / safety net / spec precedence ───────

test('mergeSettingsFields orders template, registry gaps, then saved extras', () => {
  const { fields, extra } = mergeSettingsFields(
    'sliders',
    'front',
    { autoplay: true, custom_key: 'x' },
    { custom_key: 'x', saved_only: 3 }
  );

  assert.deepEqual(fields.map((field) => field.key), [
    'autoplay',
    'custom_key',
    'columns_count',
    'slider_speed',
  ]);
  assert.deepEqual(extra.map((field) => field.key), ['saved_only']);
  assert.equal(fields[0].kind, 'boolean');
});

test('mergeSettingsFields dedupes template and registry keys', () => {
  const { fields } = mergeSettingsFields(
    'sliders',
    'front',
    { columns_count: 4, autoplay: true },
    {}
  );

  assert.equal(fields.filter((field) => field.key === 'columns_count').length, 1);
});

test('mergeSettingsFields lets an enriched backend spec beat the registry', () => {
  const { fields } = mergeSettingsFields(
    'hero',
    'front',
    { media_type: { type: 'localized' } },
    {}
  );

  const mediaType = fields.find((field) => field.key === 'media_type');
  assert.equal(mediaType.kind, 'localized');
});

test('mergeSettingsFields hides inline and explicitly hidden keys', () => {
  const { fields, extra } = mergeSettingsFields(
    'categories',
    'front',
    { shape: 'square', hero_key: 'x' },
    { shape: 'square', hero_key: 'x' },
    { inlineKeys: ['shape'], hiddenPredicate: (key) => key === 'hero_key' }
  );

  const keys = [...fields, ...extra].map((field) => field.key);
  assert.equal(keys.includes('shape'), false);
  assert.equal(keys.includes('hero_key'), false);
});

// ─── Categories responsive layout contract ──────────────────────

test('categories front registry exposes the responsive layout fields', () => {
  const { fields, extra } = mergeSettingsFields('categories', 'front', {}, {});
  const byKey = new Map(fields.map((field) => [field.key, field]));

  assert.equal(extra.length, 0);
  assert.equal(byKey.get('show_product_count').kind, 'boolean');

  assert.equal(byKey.get('columns_count').kind, 'number');
  assert.equal(byKey.get('columns_count').min, 2);
  assert.equal(byKey.get('columns_count').max, 8);

  assert.equal(byKey.get('layout').kind, 'select');
  assert.deepEqual(byKey.get('layout').options, ['grid', 'list', 'slider']);

  assert.equal(byKey.get('rows_count').min, 1);
  assert.equal(byKey.get('rows_count').max, 4);

  assert.equal(byKey.get('tablet_columns_count').min, 2);
  assert.equal(byKey.get('tablet_columns_count').max, 6);
  assert.equal(byKey.get('tablet_rows_count').min, 1);
  assert.equal(byKey.get('tablet_rows_count').max, 4);

  assert.equal(byKey.get('mobile_columns_count').min, 2);
  assert.equal(byKey.get('mobile_columns_count').max, 4);
  assert.equal(byKey.get('mobile_rows_count').min, 1);
  assert.equal(byKey.get('mobile_rows_count').max, 4);

  assert.equal(byKey.get('balance_last_row').kind, 'boolean');
});

test('categories back registry declares the full data-settings set', () => {
  const { fields, extra } = mergeSettingsFields('categories', 'back', {}, {});
  const byKey = new Map(fields.map((field) => [field.key, field]));

  assert.equal(extra.length, 0);
  assert.equal(byKey.get('parent_only').kind, 'boolean');
  assert.equal(byKey.get('limit').kind, 'number');
  assert.equal(byKey.get('limit').min, 1);
  assert.equal(byKey.get('categoriesId').kind, 'ids');
  assert.equal(byKey.get('order').kind, 'order');
  assert.equal(byKey.get('pest_category').kind, 'boolean');
  assert.equal(byKey.get('parent').kind, 'boolean');
});

test('categories template defaults are enriched by registry metadata', () => {
  const template = { columns_count: 8, mobile_rows_count: 2, balance_last_row: true };
  const { fields } = mergeSettingsFields('categories', 'front', template, template);
  const byKey = new Map(fields.map((field) => [field.key, field]));

  assert.equal(byKey.get('columns_count').min, 2);
  assert.equal(byKey.get('columns_count').max, 8);
  assert.equal(byKey.get('mobile_rows_count').max, 4);
  assert.equal(byKey.get('balance_last_row').kind, 'boolean');
});

test('defaultFrontSettingsForType seeds the documented category defaults', () => {
  assert.deepEqual(defaultFrontSettingsForType('categories'), {
    columns_count: 8,
    rows_count: 1,
    tablet_columns_count: 4,
    tablet_rows_count: 2,
    mobile_columns_count: 4,
    mobile_rows_count: 2,
    balance_last_row: true,
  });
  assert.deepEqual(defaultFrontSettingsForType('sliders'), {});
});

test('defaultFrontSettingsForType returns a fresh copy each call', () => {
  const defaults = defaultFrontSettingsForType('categories');
  defaults.columns_count = 2;

  assert.equal(defaultFrontSettingsForType('categories').columns_count, 8);
});

// ─── Kind inference / select promotion ──────────────────────────

test('inferKind detects booleans, numbers, localized, ids, and datetime keys', () => {
  assert.equal(inferKind('autoplay', true, undefined), 'boolean');
  assert.equal(inferKind('columns_count', 4, undefined), 'number');
  assert.equal(inferKind('subtitle', { en: 'Hi' }, undefined), 'localized');
  assert.equal(inferKind('flashSalesId', 1, undefined), 'ids');
  assert.equal(inferKind('timer_end_at', '', undefined), 'datetime');
});

test('normalizeFieldSpec promotes string-with-options to a select', () => {
  const shape = normalizeFieldSpec('shape', 'square', 'diamond');
  assert.equal(shape.kind, 'select');
  assert.deepEqual(shape.options, ['square', 'circle']);

  const mediaType = normalizeFieldSpec('media_type', 'image', undefined);
  assert.equal(mediaType.kind, 'select');
});

test('normalizeFieldSpec promotes an enriched string spec that declares options', () => {
  const spec = normalizeFieldSpec(
    'custom_enum',
    { type: 'string', options: ['a', 'b'] },
    'a'
  );

  assert.equal(spec.kind, 'select');
  assert.deepEqual(spec.options, ['a', 'b']);
});

test('normalizeFieldSpec keeps unknown string values editable as text', () => {
  const spec = normalizeFieldSpec('shape', 'square', 'diamond');

  // The field component renders a text input for a value outside the list;
  // the spec itself must still expose the accepted options for that check.
  assert.ok(spec.options.includes('diamond') === false);
});

// ─── Hero media mapping (storefront contract) ───────────────────

test('heroMediaPatch maps a video onto plain media paths', () => {
  assert.deepEqual(
    heroMediaPatch({
      id: 1,
      type: 'video',
      media: { url: 'https://cdn.example.com/hero.mp4', thumb_url: 'https://cdn.example.com/hero.jpg' },
    }),
    {
      media_type: 'video',
      video_desktop: 'https://cdn.example.com/hero.mp4',
      video_mobile: 'https://cdn.example.com/hero.mp4',
      poster: 'https://cdn.example.com/hero.jpg',
    }
  );
});

test('heroMediaPatch omits poster when the video has no thumbnail', () => {
  const patch = heroMediaPatch({
    id: 2,
    type: 'video',
    media: { url: '/storage/hero.mp4', thumb_url: null },
  });

  assert.equal(Object.prototype.hasOwnProperty.call(patch, 'poster'), false);
});

test('heroMediaPatch maps an image to poster (documented M1 behavior)', () => {
  assert.deepEqual(
    heroMediaPatch({
      id: 3,
      type: 'image',
      media: { url: '/storage/hero.jpg', thumb_url: '/storage/hero-thumb.jpg' },
    }),
    { media_type: 'image', poster: '/storage/hero.jpg' }
  );
});

test('heroMediaPatch returns an empty patch when media is missing', () => {
  assert.deepEqual(heroMediaPatch({ id: 4, type: 'video', media: null }), {});
});

// ─── Linked hero lookup / path normalization ────────────────────

test('findLinkedHero matches paths that differ only by a trailing slash', () => {
  const heroes = [
    { id: 10, type: 'video', media: { url: 'https://cdn.example.com/videos/hero.mp4' } },
  ];

  const linked = findLinkedHero(heroes, {
    video_desktop: 'https://cdn.example.com/videos/hero.mp4/',
  });

  assert.equal(linked?.id, 10);
});

test('findLinkedHero matches relative stored paths against absolute API URLs', () => {
  const heroes = [
    { id: 11, type: 'image', media: { url: 'https://cdn.example.com/storage/hero.jpg' } },
  ];

  const linked = findLinkedHero(heroes, { poster: '/storage/hero.jpg' });

  assert.equal(linked?.id, 11);
});

test('findLinkedHero returns undefined when nothing matches', () => {
  const heroes = [
    { id: 12, type: 'image', media: { url: '/storage/other.jpg' } },
  ];

  assert.equal(findLinkedHero(heroes, { poster: '/storage/hero.jpg' }), undefined);
  assert.equal(findLinkedHero(heroes, {}), undefined);
});
