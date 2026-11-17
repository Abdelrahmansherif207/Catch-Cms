# Section settings — field system

Section editor rendering for `setting.front` / `setting.back` keys lives in one
place: `src/features/cms/lib/section-settings.ts`. The renderer component is
`section-settings-field.tsx`; the glue is `dynamic-settings-form.tsx`.

## Render pipeline (per section type)

`mergeSettingsFields(type, template, data)` merges three layers, deduped by key:

1. **Backend template** — `GET /section-types/{type}/settings` (`front`/`back`).
   Values may be plain defaults **or** enriched spec objects. An enriched spec
   (see below) is authoritative and beats the registry, including its
   `options`/`label`/`min`/`max`/`step` metadata. A plain default only
   contributes the key, so the registry (when present) still supplies the
   richer metadata.
2. **Registry** — `SECTION_FIELD_FALLBACKS[type]` fills keys the template
   omits and enriches plain template defaults. Add entries only for keys the
   backend doesn't spec yet — a backend spec always wins.
3. **Safety net** — any remaining key found in the section's saved data renders
   in the **Advanced** tab as read-only **"Other settings"** rows (path, type
   badge, plain-text value; per-row Edit opens a single-key JSON editor and
   per-row Remove deletes after confirmation). A key the storefront uses can
   therefore never be invisible in the editor, even if backend and registry
   both miss it.

## Groups (editor tabs)

The whole Edit Section form is one tab strip spanning the section-level
controls and the settings fields: **General** (type selector, titles EN/AR,
active, title visible, plus `subtitle`-style copy fields), **Content**
(everything saved under `back`: limit, order, ids, dates, slug,
`with_products`), **Layout** (layout, columns/rows, shape preview, hero
height/alignment/position/tone), **Media** (hero only: media paths via
HeroMediaPicker, `media_type`, autoplay/loop/muted, overlay), **Extras**
(badge, timer + end date, view-all label/link, CTA, product count) and
**Advanced** (declared legacy flags such as categories `pest_category`, plus
read-only Other Settings). A tab with no visible fields is not rendered.
Registry entries declare `group`; other keys derive one from `KEY_GROUP`
(or `content` for back keys); visibility rules gate `timer_end_at` on
`show_timer`, view-all label/link on `show_view_all` and the CTA fields on
`show_cta`. Categories `shape` stays in the preview panel
(`SectionTypeConfig`, now inside the Layout tab) and the hero media paths
live in `HeroMediaPicker` — both are listed in `INLINE_FRONT_KEYS` in
`dynamic-settings-form.tsx` so the same setting is never edited in two
places.

## Categories: responsive layout settings

The categories section mirrors the storefront `SectionFrontSetting` contract.
Its `front` fields are declared in the registry so they stay editable even when
the backend template omits them:

| Key | Kind | Range / options | Default |
| --- | --- | --- | --- |
| `show_product_count` | boolean | — | — |
| `columns_count` | number | 2–8 | 8 |
| `layout` | select | `grid`, `slider` | `grid` |
| `rows_count` | number | 1–4 | 1 |
| `tablet_columns_count` | number | 2–6 | 4 |
| `tablet_rows_count` | number | 1–4 | 2 |
| `mobile_columns_count` | number | 2–4 | 4 |
| `mobile_rows_count` | number | 1–4 | 2 |
| `subtitle` | localized | — | — |
| `show_title` | boolean | — | true |
| `show_view_all` | boolean | — | true |
| `action_label` | localized | — | — |
| `action_href` | string | — | — |

`shape` (`square` / `circle`) is still edited in the Layout & Display preview
panel, not in Display Settings. The storefront honors `shape` literally — a
multi-row grid keeps circular tiles. Tiles beyond a breakpoint's
`columns × rows` capacity are hidden on that breakpoint only; every layout
value is applied as-is, with no derivation. Removed storefront settings
(formerly categories `balance_last_row`) are stripped from `setting.front` on
every save via `DEAD_FRONT_KEYS` in `schemas/section.schema.ts`.

The category `back` registry declares `limit` (number), `categoriesId`
(category multi-select), `order` (asc/desc), `pest_category` (boolean,
"Best categories (curated list)"), and `parent` (boolean, "Only categories
that have subcategories"). `parent_only` was a query no-op and is hidden from
the form — like `order_price`, which is hidden for every type; saved values
still round-trip untouched.

New sections are seeded with the documented defaults above by
`defaultFrontSettingsForType()` in `src/features/cms/lib/section-settings.ts`.
Edit mode never applies those defaults over stored values, preserving the
save-without-changes contract described below.

## Effective defaults

Unset keys are displayed with the storefront's effective fallback instead of a
blank control. A boolean with `defaultValue: true` shows its switch on when the
key is not stored; a select shows the effective option. The default is
display-only — it is written into `setting` only when the user edits the field,
so Edit → Save stays byte-identical. Registry entries carry these defaults
(`show_title`, `show_view_all`, `show_cta`, `show_overlay`, `autoplay`, `loop`,
`muted`, `show_hashtag`, plus per-type `layout`, `tone`, and the hero
alignment/height selects); an enriched backend spec can declare its own with
`{ "type": "boolean", "default": true }`.

## Storefront no-ops (hidden keys)

Keys the storefront does not consume are hidden per type, even when the backend
template or the saved data carries them. The saved record is still sent back
untouched — hiding removes an input, never a value — with one exception:
`categories` `balance_last_row` is both hidden and stripped from
`setting.front` on every save (see the categories section above):

| Type | Hidden `front` keys | Reason |
| --- | --- | --- |
| `categories` | `balance_last_row` | removed setting — hidden and stripped from the payload on save |
| `categories` (`back`) | `parent_only` | query no-op — hidden in the settings rework, values preserved |
| every type (`back`) | `order_price` | documented but never consumed — hidden everywhere, values preserved |
| `coupons` | `columns_count`, `layout` | the coupon grid derives full/half tiles from the coupon count |
| `promotions` | `columns_count`, `layout`, `autoplay`, `slider_speed` | fixed two-column grid, no slider |
| `flash-sales` | `autoplay`, `slider_speed`, `theme` | the shelf ignores these keys |
| `hero` (`back`) | `slug` | hero media is linked through the media picker / paths |

Per-type layout option lists mirror the storefront: categories
`grid`/`slider`, brands `grid`/`list`, and the shelf types (products, banners,
sliders, flash sales) `grid`/`list`/`slider`.

## ID lists vs `limit`

When a section's selected id list (e.g. `categoriesId`, `brandsId`) is longer
than its sibling `limit` value, the editor shows a warning that the extra
items will not be returned, with an explicit "Set Limit to {n}" action. The
editor never rewrites `limit` on its own.

## Hero media

Hero media paths (`video_desktop`, `video_mobile`, `poster`,
`image_desktop`, `image_mobile`) are edited inside `HeroMediaPicker`, which
also links a Hero library record onto those keys. They are excluded from the
generic grid (`INLINE_FRONT_KEYS`), and selecting a hero fills the paths plus
`media_type`.

## Field kinds

`boolean`, `number` (min/max/step), `string`, `localized` (`{ en, ar }` dual
inputs — detected from stored values, never stringified), `select`, `order`
(asc/desc), `date`, `datetime` (`*_at` keys), `ids` (`*Id`/`*Id[]` keys render a
`SearchableMultiSelect` wired to `/{resource}` search endpoints).

## Products: Preset / Custom

The Content tab of a products section opens with a segmented **Preset |
Custom** switch instead of a template dropdown. Mode is derived from the saved
`back.type` (Preset when set, Custom when null), so existing sections keep
working.

- **Preset** — a grouped, picker-only template list (Performance, Discounts,
  Flash Sales, Catalog, Other) built from the live `/product-type` keys, with
  the human label and a one-line description under each option; unknown keys
  render humanized in "Other" with no description. Only `limit` is offered;
  filters, order and order_price are hidden. Metadata lives in
  `lib/product-templates.ts`.
- **Custom** — the seven filter pickers (picker-only, no free-typed ids),
  `limit` and `order`; saving writes `back.type: null` explicitly
  (`applyProductBackType` in `schemas/section.schema.ts`).

Switching modes is confirmed when data would be cleared: to Preset removes
saved filters/order/order_price (the record is reduced to `type` + `limit`),
to Custom clears the template **and** all leftover filters (Custom starts
empty). Plain saves never strip anything: legacy leftovers are kept, listed
read-only under **Ignored settings** in the Advanced tab (one confirmed
"Remove ignored settings" action clears them). A Preset switch without a
picked template warns that saving stores a Custom section with no filters.
`PRODUCTS_TEMPLATE_HIDDEN_FIELDS` was removed — back-field visibility is
derived from the same mode logic.

## Phase 4: live result preview

The Content tab previews what the section will actually render on the
storefront. It covers **products, categories, brands and coupons**; the other
types (banners, hero, flash sales, sliders, promotions, tags) keep their form
without a result preview.

The **resulting endpoint** is rebuilt from the current (unsaved) form state
with effective params only — preset: `type` + `limit`; custom: filters +
`limit` + `order`. `order_price` and categories `parent_only` are no-ops and
are never sent. The path comes from the section's saved `endpoint` (backend
ground truth); create mode falls back to the per-type storefront path map.
`lib/section-preview.ts` owns the query building and is unchanged by the
preview UI.

### Requests and caching

- The preview requests `min(section limit, 12)` items
  (`SECTION_PREVIEW_MAX_ITEMS` via `withPreviewLimit`). The technical panel
  still shows the full effective endpoint without the preview cap.
- Endpoint changes are debounced by 500 ms (`useSectionPreview`).
- A superseded request is aborted through React Query's `AbortSignal`; the
  preview never renders results for stale params.
- Results are cached for 45 s per effective endpoint + dashboard language, so
  returning to the same settings is instant.
- The preview never blocks saving: it can fail, stall or be absent and **Save**
  stays enabled.

### Cards and layout

- Products: image, localized name (dashboard language, falling back to the
  other), and the discounted price when a flash sale or discount is active
  (the original price is struck through). A product without an active discount
  shows its normal price.
- Categories and brands: image (brands fall back to `logo`) plus name.
- Coupons: code and value (percentage or amount).
- Cards sit in a single row sized by the effective `columns_count` and scroll
  horizontally when the panel is narrower than that row. A skeleton row is
  shown while loading. Coupons always preview four columns: that type has no
  `columns_count` setting, and its storefront layout is fixed.
- When there are more cards than columns, **Show all N** expands to a wrapped
  grid; **Show fewer** collapses it again.
- A small **Refresh** button re-runs the check. **Technical details** is a
  collapsed disclosure containing the effective endpoint and a Copy button.

### Caption

The caption prefixes the subject — the preset label for a preset section, or a
custom filter summary — and then the match count:

- `Categories: 2 · Brands: 1: 23 products match. Showing the first 10.`
- `All products: 3,167 match. Showing the first 10.`
- `Category: Fragrance: 45 products match.`
- `Brands: 3: 12 products match.`

Rules:

- The exact total is used when the endpoint returns paginator metadata.
- Without a total, the received count is exact only when it comes back short
  of the request limit. If it fills the limit, the caption says
  `"N or more"` — never an approximation (`≈`).
- **Showing the first &lt;limit&gt;.** is appended only when more results exist
  than the preview fetched.
- Empty filter groups are skipped. A filter with one selected value uses the
  name only if the entity picker already cached it (`Category: Fragrance`);
  otherwise it shows the count (`Categories: 1`). The preview never shows raw
  `#123` ids and never makes extra requests to resolve names.
- With two or more active filter groups, a hint explains
  **Products must match every filter.**

### Empty, unavailable and order

- Empty products: "No products match these settings. This section will be
  empty on the storefront." In Custom mode with filters, the message adds
  "Products must match every filter you set. Try removing one."
- Preset selected without a template: "Choose a preset to see what this
  section will show." with no request.
- A failed check shows "Couldn't check right now." plus **Retry**, styled as an
  error and distinct from the empty state.
- The storefront renders these endpoints in the order they are returned; it
  does not sort or shuffle them, so the preview caption carries no ordering
  note.

Non-blocking amber warnings appear under the Arabic title input (in the
General slot) and under the localized subtitle when the Arabic value is
empty while the English one has content, or when both are identical. The
brands "selection exceeds limit → Set limit to N" warning remains in the id
picker itself (`sections.selectionExceedsLimit`).

## Backend contract (phase 2)

The template may return enriched specs per key; the CMS renders them without
further frontend work:

```json
{
  "front": {
    "media_type": { "type": "select", "options": ["image", "video"] },
    "eyebrow": { "type": "localized" },
    "columns_count": { "type": "number", "min": 1, "max": 12 },
    "show_title": { "type": "boolean", "default": true }
  },
  "back": { "categoriesId[]": { "type": "ids" } }
}
```

Unknown keys keep working: they fall back to value-based inference and the
"Other settings" group.

Precedence when a key exists in several places: enriched backend spec >
registry entry > inference from the stored/template value. A `string` field
that has declared options (backend spec or registry) renders as a `select`;
if the saved value is not in the option list, the editor falls back to a text
input plus an amber hint (`sections.unknownSelectValue`) instead of hiding or
destroying the stored value.

## Title editing

`title` may arrive as a localized JSON string, an object, a plain string, or
`null`. A plain string is the resolved current-locale value (the API resolves
it and returns no `title_translations`), so both locale inputs start from that
same value. On update, only the title inputs the user actually edited are sent
(`toUpdatePayload(values, dirtyLocales)`); the API merges `title` per locale,
so an untouched locale keeps its stored translation. Create still sends both
locales, and both inputs remain required client-side — but only in create mode:
stored sections such as the hero can have a `null` title, so the edit schema
allows empty title inputs and saving unrelated settings is never blocked.
While one locale is being edited on a plain title, the untouched input shows
`sections.untouchedLocaleHint` to explain why it is not simply copied over.

## Plain-string localized settings

Localized fields (`subtitle`, `badge_text`, …) may be stored as a plain string
by older sections. `toLocalizedDraft` shows that string in both locale inputs
(the storefront resolves a plain string for every locale) instead of an empty
control, and `fromLocalizedDraft` keeps it until the user edits a locale.

## Regression rule

Open Edit → Save without touching anything → the stored `setting` must be
byte-identical. The save payload sends the full `front`/`back` records, so
hidden-but-present keys survive; localized fields now preserve `{en, ar}` shape
(previously `badge_text` was corrupted to a plain string).
