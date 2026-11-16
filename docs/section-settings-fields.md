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
   in the collapsible **"Other settings"** group. A key the storefront uses can
   therefore never be invisible in the editor, even if backend and registry
   both miss it.

Groups: "Display Settings" = `front`, "Data Settings" = `back`.
Categories `shape` stays in the preview panel (`SectionTypeConfig`) because it
switches the preview image — keep `INLINE_FRONT_KEYS` in
`dynamic-settings-form.tsx` in sync with that panel.

## Categories: responsive layout settings

The categories section mirrors the storefront `SectionFrontSetting` contract.
Its `front` fields are declared in the registry so they stay editable even when
the backend template omits them:

| Key | Kind | Range / options | Default |
| --- | --- | --- | --- |
| `show_product_count` | boolean | — | — |
| `columns_count` | number | 2–8 | 8 |
| `layout` | select | `grid`, `list`, `slider` | — |
| `rows_count` | number | 1–4 | 1 |
| `tablet_columns_count` | number | 2–6 | 4 |
| `tablet_rows_count` | number | 1–4 | 2 |
| `mobile_columns_count` | number | 2–4 | 4 |
| `mobile_rows_count` | number | 1–4 | 2 |
| `balance_last_row` | boolean | — | true |
| `subtitle` | localized | — | — |
| `show_view_all` | boolean | — | — |
| `action_label` | localized | — | — |
| `action_href` | string | — | — |

`shape` (`square` / `circle`) is still edited in the Layout & Display preview
panel, not in Display Settings.

The category `back` registry declares `parent_only` (boolean), `limit`
(number), `categoriesId` (category multi-select), `order` (asc/desc),
`pest_category` (boolean), and `parent` (boolean).

New sections are seeded with the documented defaults above by
`defaultFrontSettingsForType()` in `src/features/cms/lib/section-settings.ts`.
Edit mode never applies those defaults over stored values, preserving the
save-without-changes contract described below.

## Field kinds

`boolean`, `number` (min/max/step), `string`, `localized` (`{ en, ar }` dual
inputs — detected from stored values, never stringified), `select`, `order`
(asc/desc), `date`, `datetime` (`*_at` keys), `ids` (`*Id`/`*Id[]` keys render a
`SearchableMultiSelect` wired to `/{resource}` search endpoints).

## Backend contract (phase 2)

The template may return enriched specs per key; the CMS renders them without
further frontend work:

```json
{
  "front": {
    "media_type": { "type": "select", "options": ["image", "video"] },
    "eyebrow": { "type": "localized" },
    "columns_count": { "type": "number", "min": 1, "max": 12 }
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

`title` may arrive as a localized JSON string, an object, or a plain string. A
plain string is the resolved current-locale value (the API resolves it and
returns no `title_translations`), so both locale inputs start from that same
value. On update, only the title inputs the user actually edited are sent
(`toUpdatePayload(values, dirtyLocales)`); the API merges `title` per locale,
so an untouched locale keeps its stored translation. Create still sends both
locales, and both inputs remain required client-side. While one locale is
being edited on a plain title, the untouched input shows
`sections.untouchedLocaleHint` to explain why it is not simply copied over.

## Regression rule

Open Edit → Save without touching anything → the stored `setting` must be
byte-identical. The save payload sends the full `front`/`back` records, so
hidden-but-present keys survive; localized fields now preserve `{en, ar}` shape
(previously `badge_text` was corrupted to a plain string).
