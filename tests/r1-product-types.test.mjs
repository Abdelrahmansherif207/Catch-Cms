import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { createServer } from 'vite';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

const PRODUCT_TYPE_OPTIONS = [
  { value: 'best_product_sales', label: 'Best product sales' },
  { value: 'brands_product', label: 'Brands product' },
  { value: 'new_arrivals', label: 'New arrivals' },
];

let server;
let stubServer;
let apiServer;
let normalizeProductTypes;
let ProductTypeResponseError;
let fetchProductTypes;
let DynamicSettingsForm;
let StubDynamicSettingsForm;
let toCreatePayload;
let toUpdatePayload;
let queryKeys;

before(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          common: { loading: 'Loading...', retry: 'Retry' },
          sections: {
            productTemplate: 'Product Template',
            selectProductTemplate: 'Select a product template...',
            noTemplate: 'None (custom settings)',
            productTypesLoadError: 'Failed to load product templates.',
            productTypesMalformed: 'Received an invalid product template response.',
            productTypesEmpty: 'No product templates available.',
            templateSelectedHint: 'Using template - only type, order, and limit are needed.',
            templateNoneHint: 'No template selected - all settings fields are available.',
            loadingSettings: 'Loading settings template...',
            displaySettings: 'Display Settings',
            dataSettings: 'Data Settings',
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });

  const createServerConfig = (extra = {}) => ({
    root: process.cwd(),
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
    logLevel: 'error',
    ...extra,
  });

  server = await createServer(createServerConfig());
  stubServer = await createServer(
    createServerConfig({
      resolve: {
        alias: [
          {
            find: /^@\/shared\/ui\/select$/,
            replacement: path.resolve(process.cwd(), 'tests/stubs/select.tsx'),
          },
          { find: '@', replacement: path.resolve(process.cwd(), 'src') },
        ],
      },
    })
  );
  apiServer = await createServer(
    createServerConfig({
      resolve: {
        alias: [
          {
            find: /^@\/shared\/api$/,
            replacement: path.resolve(process.cwd(), 'tests/stubs/shared-api.ts'),
          },
          { find: '@', replacement: path.resolve(process.cwd(), 'src') },
        ],
      },
    })
  );

  ({ normalizeProductTypes, ProductTypeResponseError } = await server.ssrLoadModule(
    '/src/features/cms/api/sections.api.ts'
  ));
  ({ fetchProductTypes } = await apiServer.ssrLoadModule(
    '/src/features/cms/api/sections.api.ts'
  ));
  ({ DynamicSettingsForm } = await server.ssrLoadModule(
    '/src/features/cms/components/dynamic-settings-form.tsx'
  ));
  ({ DynamicSettingsForm: StubDynamicSettingsForm } = await stubServer.ssrLoadModule(
    '/src/features/cms/components/dynamic-settings-form.tsx'
  ));
  ({ toCreatePayload, toUpdatePayload } = await server.ssrLoadModule(
    '/src/features/cms/schemas/section.schema.ts'
  ));
  ({ queryKeys } = await server.ssrLoadModule('/src/shared/lib/query-keys.ts'));
});

after(async () => {
  await server?.close();
  await stubServer?.close();
  await apiServer?.close();
});

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        retryOnMount: false,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  });
}

function seedSettings(qc) {
  qc.setQueryData(queryKeys.sections.typeSettings('products'), {
    status: 200,
    message: 'ok',
    success: true,
    data: { front: {}, back: {} },
  });
}

function seedProductTypes(qc, options) {
  qc.setQueryData(queryKeys.sections.productTypes(), options);
}

async function seedProductTypesError(qc, error) {
  await qc.prefetchQuery({
    queryKey: queryKeys.sections.productTypes(),
    queryFn: () => Promise.reject(error),
    retry: false,
  });
}

function seedProductTypesPending(qc) {
  void qc.prefetchQuery({
    queryKey: queryKeys.sections.productTypes(),
    queryFn: () => new Promise(() => {}),
  });
}

function renderForm(FormComponent, qc, { productType = null, onProductTypeChange = () => {} } = {}) {
  return renderToStaticMarkup(
    React.createElement(
      QueryClientProvider,
      { client: qc },
      React.createElement(
        I18nextProvider,
        { i18n },
        React.createElement(FormComponent, {
          sectionType: 'products',
          frontSettings: {},
          backSettings: {},
          productType,
          onFrontChange() {},
          onBackChange() {},
          onProductTypeChange,
        })
      )
    )
  );
}

// ─── Normalization ───────────────────────────────────────────────

test('normalizes the documented raw key-to-label map and preserves keys as values', () => {
  const result = normalizeProductTypes({
    best_product_sales: 'Best product sales',
    brands_product: 'Brands product',
    new_arrivals: 'New arrivals',
  });

  assert.deepEqual(result, PRODUCT_TYPE_OPTIONS);
});

test('returns an empty option list for a valid empty object', () => {
  assert.deepEqual(normalizeProductTypes({}), []);
});

test('throws ProductTypeResponseError for malformed payloads', () => {
  const malformedPayloads = [
    null,
    undefined,
    [],
    'not-an-object',
    42,
    { best_product_sales: 123 },
    { best_product_sales: null },
    { best_product_sales: { label: 'Best product sales' } },
  ];

  for (const payload of malformedPayloads) {
    assert.throws(
      () => normalizeProductTypes(payload),
      (error) => {
        assert.ok(error instanceof ProductTypeResponseError);
        assert.equal(error.name, 'ProductTypeResponseError');
        return true;
      }
    );
  }
});

// ─── API fetch behavior ─────────────────────────────────────────

test('fetchProductTypes normalizes the raw map returned by the endpoint', async () => {
  let requestedUrl;
  globalThis.__TEST_AXIOS_GET__ = async (url) => {
    requestedUrl = url;
    return {
      data: {
        best_product_sales: 'Best product sales',
        new_arrivals: 'New arrivals',
      },
    };
  };

  const result = await fetchProductTypes();

  assert.equal(requestedUrl, '/product-type');
  assert.deepEqual(result, [
    { value: 'best_product_sales', label: 'Best product sales' },
    { value: 'new_arrivals', label: 'New arrivals' },
  ]);
});

test('fetchProductTypes rejects when the request fails', async () => {
  const requestError = new Error('network down');
  globalThis.__TEST_AXIOS_GET__ = async () => {
    throw requestError;
  };

  await assert.rejects(fetchProductTypes, (error) => error === requestError);
});

test('fetchProductTypes rejects a malformed payload instead of returning an empty list', async () => {
  globalThis.__TEST_AXIOS_GET__ = async () => ({ data: ['best_product_sales'] });

  await assert.rejects(
    fetchProductTypes,
    (error) =>
      error?.name === 'ProductTypeResponseError' &&
      error?.message === 'Malformed product-type response'
  );
});

// ─── Payload mapping ─────────────────────────────────────────────

test('writes the original option key to setting.back.type on create', () => {
  const payload = toCreatePayload({
    type: 'products',
    titleEn: 'Best products',
    titleAr: 'أفضل المنتجات',
    isActive: true,
    titleVisible: true,
    frontSettings: {},
    backSettings: {},
    productType: 'best_product_sales',
  });

  assert.equal(payload.setting.back.type, 'best_product_sales');
});

test('writes the original option key to setting.back.type on update', () => {
  const payload = toUpdatePayload({
    type: 'products',
    titleEn: 'Best products',
    titleAr: 'أفضل المنتجات',
    isActive: true,
    titleVisible: true,
    frontSettings: {},
    backSettings: {},
    productType: 'new_arrivals',
  });

  assert.equal(payload.setting.back.type, 'new_arrivals');
});

// ─── Dropdown states (real shared Select) ────────────────────────

test('renders the product template label and a loading state while fetching', () => {
  const qc = createQueryClient();
  seedSettings(qc);
  seedProductTypesPending(qc);

  const html = renderForm(DynamicSettingsForm, qc);

  assert.match(html, /Product Template/);
  assert.match(html, /Loading\.\.\./);
  assert.doesNotMatch(html, /role="combobox"/);
});

test('renders the dropdown and an empty-state message for a valid empty response', () => {
  const qc = createQueryClient();
  seedSettings(qc);
  qc.setQueryData(queryKeys.sections.productTypes(), []);

  const html = renderForm(DynamicSettingsForm, qc);

  assert.match(html, /role="combobox"/);
  assert.match(html, /No product templates available\./);
  assert.doesNotMatch(html, /Failed to load product templates\./);
});

test('renders a retryable error state when the query fails', async () => {
  const qc = createQueryClient();
  seedSettings(qc);
  await seedProductTypesError(qc, new Error('network down'));

  const html = renderForm(DynamicSettingsForm, qc);

  assert.match(html, /role="alert"/);
  assert.match(html, /Failed to load product templates\./);
  assert.match(html, /Retry/);
  assert.doesNotMatch(html, /role="combobox"/);
  assert.doesNotMatch(html, /No product templates available\./);
});

test('renders a distinct error state for a malformed response', async () => {
  const qc = createQueryClient();
  seedSettings(qc);
  await seedProductTypesError(qc, new ProductTypeResponseError());

  const html = renderForm(DynamicSettingsForm, qc);

  assert.match(html, /role="alert"/);
  assert.match(html, /Received an invalid product template response\./);
  assert.doesNotMatch(html, /Failed to load product templates\./);
  assert.doesNotMatch(html, /No product templates available\./);
});

test('renders a combobox for a successful response', () => {
  const qc = createQueryClient();
  seedSettings(qc);
  seedProductTypes(qc, PRODUCT_TYPE_OPTIONS);

  const html = renderForm(DynamicSettingsForm, qc);

  assert.match(html, /role="combobox"/);
  assert.doesNotMatch(html, /No product templates available\./);
  assert.doesNotMatch(html, /role="alert"/);
});

// ─── Option rendering and selection (Select stub) ────────────────

test('renders option labels while keeping original keys as option values', () => {
  const qc = createQueryClient();
  seedSettings(qc);
  seedProductTypes(qc, PRODUCT_TYPE_OPTIONS);

  const html = renderForm(StubDynamicSettingsForm, qc);

  assert.match(html, /data-value="best_product_sales"/);
  assert.match(html, />Best product sales</);
  assert.match(html, /data-value="brands_product"/);
  assert.match(html, />Brands product</);
  assert.match(html, /data-value="new_arrivals"/);
  assert.match(html, />New arrivals</);
  assert.match(html, /data-value="__none__"/);
  assert.match(html, />None \(custom settings\)</);
});

test('emits the original key when an option is selected and submits it unchanged', () => {
  const qc = createQueryClient();
  seedSettings(qc);
  seedProductTypes(qc, PRODUCT_TYPE_OPTIONS);

  const selectedValues = [];
  renderForm(StubDynamicSettingsForm, qc, {
    onProductTypeChange: (value) => selectedValues.push(value),
  });

  const handler = globalThis.__TEST_SELECT_HANDLER__;
  assert.equal(typeof handler, 'function');

  handler('best_product_sales');
  assert.deepEqual(selectedValues, ['best_product_sales']);

  const payload = toCreatePayload({
    type: 'products',
    titleEn: 'Best products',
    titleAr: 'أفضل المنتجات',
    isActive: true,
    titleVisible: true,
    frontSettings: {},
    backSettings: {},
    productType: selectedValues[0],
  });

  assert.equal(payload.setting.back.type, 'best_product_sales');
});

test('emits null when the none option is selected', () => {
  const qc = createQueryClient();
  seedSettings(qc);
  seedProductTypes(qc, PRODUCT_TYPE_OPTIONS);

  const selectedValues = [];
  renderForm(StubDynamicSettingsForm, qc, {
    onProductTypeChange: (value) => selectedValues.push(value),
  });

  const handler = globalThis.__TEST_SELECT_HANDLER__;
  assert.equal(typeof handler, 'function');

  handler('__none__');
  assert.deepEqual(selectedValues, [null]);
});
