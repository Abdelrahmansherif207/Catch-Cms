// Public API — features/static-pages
// Exports: types, hooks, permissions, pages

export type {
  StaticPage,
  StaticPageSection,
  JsonValue,
  JsonObject,
  LocaleMap,
  StaticPageUpdatePayload,
  CreateSectionPayload,
  UpdateSectionPayload,
} from './types/static-page.types';

export { STATIC_PAGE_PERMISSIONS } from './permissions/static-pages.permissions';

export {
  useStaticPages,
  useStaticPage,
  useStaticPagePreview,
  useUpdateStaticPage,
  useCreateStaticPageSection,
  useUpdateStaticPageSection,
  useDeleteStaticPageSection,
  useReorderStaticPageSections,
} from './hooks/use-static-pages';

export { resolveLocaleContent, sectionTitle } from './lib/static-page-utils';
export { FieldsEditor } from './components/content-editor/fields-editor';
export { LocalizedContentEditor } from './components/content-editor/localized-content-editor';
export { SectionErrorBoundary } from './components/preview/section-error-boundary';