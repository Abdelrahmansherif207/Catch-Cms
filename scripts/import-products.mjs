/**
 * scripts/import-products.mjs
 *
 * One-off bulk product importer for Rawd Al Aseel CMS.
 * Source data: "بيانات الصنف ومكوناته والباركود.xlsx" — two tables:
 *   A) بيانات اصناف البقوليات (العلب)  — 5 items
 *   B) بيانات أصناف بهارات مذاق مطبخي 150 جرام — 32 items
 *
 * Usage:
 *   node scripts/import-products.mjs dry-run <AUTH_TOKEN> [--only=cans|spices]
 *   node scripts/import-products.mjs run      <AUTH_TOKEN> [--only=cans|spices] [--can-cat=ID] [--spice-cat=ID]
 *
 * Optional overrides:
 *   --can-cat=ID      category id for the cans table (skips auto-match)
 *   --spice-cat=ID    category id for the spices table (skips auto-match)
 *   --price=N         price for all items (default 10 placeholder)
 *   --qty=N           stock quantity for all items (default 100)
 *
 * Dry-run never mutates anything: it fetches categories + existing products,
 * shows the category mapping and 2 sample payloads, then exits.
 * "run" performs the same preflight, then POSTs every non-skipped item.
 * Re-running is safe: items whose SKU / piece barcode already exists are skipped.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE_URL = 'https://aseel.mohammedtareq.me/api/v1';
const LOGO_PATH = resolve(process.cwd(), 'public', 'rawd-logo.jpg');
const REPORT_PATH = resolve(process.cwd(), 'scripts', 'import-products-report.txt');

// ─────────────────────────────────────────────────────────────────────────────
// Source data (extracted from the Excel; barcodes kept verbatim)
// ─────────────────────────────────────────────────────────────────────────────

/** Table A — بيانات اصناف البقوليات (العلب): [sku, nameAr, nameEn, weightKg? -> grams, pieceBarcode, cartonBarcode] */
const CANS = [
  ['145026', 'فاصوليا حمراء', 'Red Kidney Beans', 400, '6287029971366', '6287029971403'],
  ['145027', 'فول مدمس', 'Foul Medames', 400, '6287029971373', '6287029971410'],
  ['145028', 'فاصوليا بيضاء', 'White Beans', 400, '6287029971380', '6287029971427'],
  ['145029', 'بازيلاء', 'Green Peas', 400, '6287029971397', '6287029971434'],
  ['145031', 'فاصوليا حمراء (فاتح)', 'Light Red Kidney Beans', 400, '6287029972622', '6287029972639'],
];

/** Table B — بيانات أصناف بهارات مذاق مطبخي 150 جرام: [sku, nameAr, nameEn, weightGrams, pieceBarcode, cartonBarcode] */
const SPICES = [
  ['145401', 'بهارات بحريني (مذاق 150)', 'Bahraini Spices (Mazaq 150g)', 150, '6287029972752', '6287029972769'],
  ['145402', 'بهارات الكبسة السعودية (مذاق 150)', 'Saudi Kabsa Spices (Mazaq 150g)', 150, '6287029973063', '6287029973070'],
  ['145403', 'مسحوق الثوم (مذاق 150)', 'Garlic Powder (Mazaq 150g)', 150, '6287029973025', '6287029973032'],
  ['145404', 'بهارات برياني (مذاق 150)', 'Biryani Spices (Mazaq 150g)', 150, '6287029972790', '6287029973124'],
  ['145405', 'بهارات كاري (مذاق 150)', 'Curry Spices (Mazaq 150g)', 150, '6287029972844', '6287029972851'],
  ['145406', 'مسحوق الكركم (مذاق 150)', 'Turmeric Powder (Mazaq 150g)', 150, '6287029972929', '6287029972936'],
  ['145407', 'كمون مطحون (مذاق 150)', 'Ground Cumin (Mazaq 150g)', 150, '6287029972967', '6287029972974'],
  ['145408', 'فلفل اسود مطحون (مذاق 150)', 'Ground Black Pepper (Mazaq 150g)', 150, '6287029973001', '6287029973018'],
  ['145409', 'زنجبيل مطحون (مذاق 150)', 'Ginger Powder (Mazaq 150g)', 150, '6287029972738', '6287029972745'],
  ['145410', 'بهارات اللحم (مذاق 150)', 'Meat Spices (Mazaq 150g)', 150, '6287029973100', '6287029973117'],
  ['145411', 'بهارات الدجاج (مذاق 150)', 'Chicken Spices (Mazaq 150g)', 150, '6287029972776', '6287029972783'],
  ['145412', 'ليمون اسود مطحون (مذاق 150)', 'Ground Black Lime (Mazaq 150g)', 150, '6287029973049', '6287029973056'],
  ['145413', 'كزبرة مطحون (مذاق 150)', 'Ground Coriander (Mazaq 150g)', 150, '6287029972905', '6287029972912'],
  ['145414', 'بهارات السبعة (مذاق 150)', 'Seven Spices (Mazaq 150g)', 150, '6287029972820', '6287029972837'],
  ['145415', 'توابل السلطة (مذاق 150)', 'Salad Seasoning (Mazaq 150g)', 150, '6287029972882', '6287029972899'],
  ['145416', 'بهارات الشوي (مذاق 150)', 'Grill Spices (Mazaq 150g)', 150, '6287029972868', '6287029972875'],
  ['145417', 'بهارات بيضاء (مذاق 150)', 'White Spices (Mazaq 150g)', 150, '6287029972806', '6287029972813'],
  ['145418', 'بهارات إيطالي (مذاق 150)', 'Italian Spices (Mazaq 150g)', 150, '6287029973087', '6287029973094'],
  ['145419', 'بهارات مضغوط (مذاق 150)', 'Pressed Spices (Mazaq 150g)', 150, '6287029972691', '6287029972707'],
  ['145420', 'بهارات مسالا (مذاق 150)', 'Masala Spices (Mazaq 150g)', 150, '6287029972981', '6287029972998'],
  ['145421', 'كربونات الصوديوم (مذاق 150)', 'Sodium Carbonate (Mazaq 150g)', 150, '6287029972714', '6287029972721'],
  ['145422', 'بهارات البروستد الحراق (مذاق 150)', 'Hot Broasted Spices (Mazaq 150g)', 150, '6287029972943', '6287029972950'],
  ['145423', 'سماق (مذاق 150)', 'Sumac (Mazaq 100g)', 100, '6287029973131', '6287029973148'],
  ['145424', 'بهارات الشوربة (مذاق 150)', 'Soup Spices (Mazaq 150g)', 150, '6287029973155', '6287029973162'],
  ['145425', 'حبة البركة (مذاق 150)', 'Nigella Seeds (Mazaq 150g)', 150, '6287029973230', '6287029973247'],
  ['145426', 'سمسم محمص (مذاق 150)', 'Roasted Sesame (Mazaq 150g)', 150, '6287029973193', '6287029973209'],
  ['145427', 'زعتر (مذاق 150)', 'Thyme Zaatar (Mazaq 150g)', 150, '6287029973254', '6287029973261'],
  ['145428', 'بابريكا حلو مجروش (مذاق 150)', 'Crushed Sweet Paprika (Mazaq 150g)', 150, '6287029973278', '6287029973285'],
  ['145429', 'بصل مجروش (مذاق 150)', 'Crushed Onion (Mazaq 150g)', 150, '6287029973292', '6287029973308'],
  ['145430', 'قرفة مطحون (مذاق 150)', 'Ground Cinnamon (Mazaq 150g)', 150, '6287029973179', '6287029973186'],
  ['145431', 'مسحوق شطة حار (150)', 'Hot Chili Powder (150g)', 150, '6287029973216', '6287029973223'],
  ['145432', 'مسحوق بابريكا حلو (150)', 'Sweet Paprika Powder (150g)', 150, '6287029973315', '6287029973322'],
];

const TABLES = {
  cans: { label: 'بيانات اصناف البقوليات (العلب)', rows: CANS, match: { ar: 'بقول', en: 'bean|legume|pulse' } },
  spices: { label: 'بيانات أصناف بهارات مذاق مطبخي 150 جرام', rows: SPICES, match: { ar: 'بهار', en: 'spice' } },
};

// ─────────────────────────────────────────────────────────────────────────────
// CLI
// ─────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const mode = argv[0];
const token = argv[1] && !argv[1].startsWith('--') ? argv[1] : '';

const flag = (name) => {
  const hit = argv.find((a) => a === `--${name}`) || argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? (hit.includes('=') ? hit.split('=')[1] : true) : undefined;
};
const optPrice = flag('price');
const optQty = flag('qty');
const optCanCat = flag('can-cat');
const optSpiceCat = flag('spice-cat');
const optOnly = flag('only');

const PRICE = optPrice ? Number(optPrice) : 10; // placeholder per plan
const QTY = optQty ? Number(optQty) : 100;
const DELAY_MS = 1200;

if (mode !== 'dry-run' && mode !== 'run') {
  console.error('Usage: node scripts/import-products.mjs <dry-run|run> <AUTH_TOKEN> [options]');
  console.error('Options: [--only=cans|spices] [--can-cat=ID] [--spice-cat=ID] [--price=N] [--qty=N]');
  console.error('Get the token from: DevTools → Application → Local Storage → auth_token (while logged into the CMS).');
  process.exit(1);
}
if (!token) {
  console.error('ERROR: missing AUTH_TOKEN. Paste it from DevTools → Application → Local Storage → auth_token.');
  process.exit(1);
}

const activeTables = optOnly && TABLES[optOnly] ? [TABLES[optOnly]] : Object.values(TABLES);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const report = [];
function log(line) {
  report.push(line);
  console.log(line);
}

async function api(path, init = {}) {
  const res = await fetch(BASE_URL + path, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', ...(init.headers || {}) },
    signal: AbortSignal.timeout(60000),
  });
  const text = await res.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 500);
  }
  return { ok: res.ok, status: res.status, body };
}

/** Normalizes the mixed name shape ({en,ar} | string). */
function splitName(n) {
  if (!n) return { en: '', ar: '' };
  if (typeof n === 'object' && !Array.isArray(n)) {
    const norm = (v) => (v && typeof v === 'object' ? v.value || v.text || '' : v || '');
    return { en: String(norm(n.en) || ''), ar: String(norm(n.ar) || '') };
  }
  return { en: String(n), ar: String(n) };
}

const normalizeAr = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0640]/g, '') // diacritics + kashida
    .replace(/[إأآا]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();

async function fetchAllCategories() {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const res = await api(`/categories?page=${page}&per_page=200`);
    if (!res.ok) throw new Error(`GET /categories ${page} → ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`);
    const data = Array.isArray(res.body?.data) ? res.body.data : [];
    out.push(
      ...data.map((c) => {
        const n = splitName(c.name);
        return { id: c.id, nameEn: n.en, nameAr: n.ar, parent_id: c.parent_id ?? null, level: c.level ?? null };
      }),
    );
    if (data.length < 200) break;
  }
  return out;
}

async function fetchExistingProducts() {
  const out = [];
  for (let page = 1; page <= 40; page++) {
    const res = await api(`/products?page=${page}&limit=100`);
    if (res.status === 404) break;
    if (!res.ok) throw new Error(`GET /products ${page} → ${res.status}: ${JSON.stringify(res.body).slice(0, 300)}`);
    const data = Array.isArray(res.body?.data) ? res.body.data : [];
    out.push(...data);
    if (data.length < 100) break;
  }
  const skus = new Set();
  const barcodes = new Set();
  const arNames = new Set();
  for (const p of out) {
    if (p.sku) skus.add(String(p.sku).trim());
    if (p.piece_barcode) barcodes.add(String(p.piece_barcode).trim());
    const { ar } = splitName(p.name);
    if (ar) arNames.add(normalizeAr(ar));
  }
  return { skus, barcodes, arNames };
}

/** Auto-match a table's category by keywords. */
function matchCategory(categories, table, overrideId) {
  if (overrideId) {
    const hit = categories.find((c) => String(c.id) === String(overrideId));
    return { id: Number(overrideId), nameEn: hit?.nameEn ?? '', nameAr: hit?.nameAr ?? '', source: 'override' };
  }
  const arKey = table.match.ar;
  const enKeys = table.match.en.split('|');
  const score = (c) => {
    const ar = normalizeAr(c.nameAr);
    const en = (c.nameEn || '').toLowerCase();
    const arHit = arKey ? ar.includes(arKey) : false;
    const enHit = enKeys.some((k) => en.includes(k));
    const arExact = ar === arKey + 'iat' ? 2 : 0; // e.g. بقوليات
    return { arHit, enHit, arExact };
  };
  const candidates = categories
    .map((c) => ({ c, s: score(c) }))
    .filter((x) => x.s.arHit || x.s.enHit)
    .map((x) => ({
      ...x,
      rank: (x.s.arExact ? 4 : 0) + (x.s.arHit ? 2 : 0) + (x.s.enHit ? 1 : 0) - (x.c.level ?? 0) * 0.1,
    }))
    .sort((a, b) => b.rank - a.rank);
  if (candidates.length === 0) return { id: null, source: 'none' };
  return { id: candidates[0].c.id, nameEn: candidates[0].c.nameEn, nameAr: candidates[0].c.nameAr, source: 'auto-match' };
}

/** Builds the full create payload (mirror of products.api.ts createProduct). */
function buildPayload(row, categoryId, logoBuf) {
  const [sku, nameAr, nameEn, weight, pieceBarcode, cartonBarcode] = row;
  const isCan = CANS.includes(row);
  const descriptions =
    isCan
      ? {
          ar: `${nameAr} من روض الأصيل بعبوة ${weight} جرام — منتج جاهز للاستخدام الفوري.`,
          en: `${nameEn} by Rawd Al Aseel — ${weight}g can, ready to use.`,
        }
      : {
          ar: `${nameAr} من مجموعة مذاق مطبخي بعبوة ${weight} جرام. بهارات عالية الجودة تمنح أطباقك نكهة أصيلة مميزة.`,
          en: `${nameEn} from Mazaq Matbakhi — ${weight}g pack of premium spices for authentic flavor.`,
        };

  const fd = new FormData();
  fd.append('name[en]', nameEn);
  fd.append('name[ar]', nameAr);
  fd.append('description[en]', descriptions.en);
  fd.append('description[ar]', descriptions.ar);
  fd.append('sku', sku);
  fd.append('product_type', 'simple');
  fd.append('item_type', 'PHYSICAL');
  fd.append('in_stock', '1');
  fd.append('status', '1');
  fd.append('price', String(PRICE));
  fd.append('quantity', String(QTY));
  fd.append('categories[]', String(categoryId));
  fd.append('piece_barcode', pieceBarcode);
  fd.append('carton_barcode', cartonBarcode);
  fd.append('pieces_per_carton', '24');
  fd.append('weight', String(weight));
  fd.append('has_discount', '0');
  fd.append('has_flash_sale', '0');
  fd.append('is_fast_shipping_available', '0');
  fd.append('images[]', new Blob([logoBuf], { type: 'image/jpeg' }), 'rawd-logo.jpg');
  return fd;
}

function payloadPreview(fd) {
  const obj = {};
  for (const [k, v] of fd.entries()) obj[k] = typeof v === 'string' ? v : `[File ${v.name}]`;
  return obj;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

log(`# Import report — ${new Date().toISOString()}`);
log(`mode: ${mode} | tables: ${activeTables.map((t) => t.label).join(' + ')} | price: ${PRICE} | qty: ${QTY}`);

let categories;
try {
  categories = await fetchAllCategories();
} catch (err) {
  console.error(String(err?.message || err));
  if (String(err).includes('401')) {
    console.error('→ AUTH_TOKEN looks invalid/expired. Re-copy it from DevTools → Application → Local Storage → auth_token.');
  }
  process.exit(1);
}
log(`fetched categories: ${categories.length}`);

let existing;
try {
  existing = await fetchExistingProducts();
} catch (err) {
  console.error(String(err?.message || err));
  process.exit(1);
}
log(`fetched existing products: ${existing.skus.size} skus / ${existing.barcodes.size} barcodes`);

const mappings = {};
for (const table of activeTables) {
  const m = matchCategory(categories, table, table === TABLES.cans ? optCanCat : optSpiceCat);
  mappings[table.label] = m;
  log(`category for "${table.label}": ${m.source} → id=${m.id ?? 'NONE'} (${m.nameAr}${m.nameEn ? ' / ' + m.nameEn : ''})`);
}

let logoBuf;
try {
  logoBuf = readFileSync(LOGO_PATH);
} catch (err) {
  console.error(`ERROR reading logo ${LOGO_PATH}: ${err.message}`);
  process.exit(1);
}
log(`logo image: ${LOGO_PATH} (${logoBuf.length} bytes)`);
log('');

const brandNew = [];
if (mode === 'dry-run') {
  log('── dry-run: no products will be created ──');
  const firstTable = activeTables[0];
  for (const table of activeTables) {
    const cat = mappings[table.label];
    if (!cat.id) {
      log(`!! NO category matched for "${table.label}" — pass --can-cat=ID / --spice-cat=ID or create the category first.`);
    }
    const skipInfo = table.rows.filter((r) => existing.skus.has(r[0]) || existing.barcodes.has(r[4]));
    if (skipInfo.length) log(`duplicates to skip in "${table.label}": ${skipInfo.map((r) => r[0] + ' ' + r[1]).join(', ')}`);
  }
  log('');
  log(`sample payload (first item of "${firstTable.label}"):`);
  log(JSON.stringify(payloadPreview(buildPayload(firstTable.rows[0], mappings[firstTable.label].id ?? 0, logoBuf)), null, 2));
  if (activeTables.length > 1) {
    log(`sample payload (first item of "${activeTables[1].label}"):`);
    log(JSON.stringify(payloadPreview(buildPayload(activeTables[1].rows[0], mappings[activeTables[1].label].id ?? 0, logoBuf)), null, 2));
  }
  log('');
  log(`total to create: ${activeTables.reduce((n, t) => n + t.rows.length, 0)} items`);
  log('→ run with: node scripts/import-products.mjs run <AUTH_TOKEN>');
  writeFileSync(REPORT_PATH, '\uFEFF' + report.join('\n'), 'utf8');
  process.exit(0);
}

// ---- run mode ----
if (!logoBuf) process.exit(1);

const results = [];
for (const table of activeTables) {
  const cat = mappings[table.label];
  if (!cat.id) {
    log(`!! skipping "${table.label}" (no category). Fix with --can-cat / --spice-cat.`);
    continue;
  }
  log(`── table: ${table.label} → category ${cat.id} (${cat.nameAr}) ──`);

  for (const row of table.rows) {
    const [sku, nameAr] = row;
    if (existing.skus.has(sku)) {
      log(`SKIP ${sku} ${nameAr} (sku exists)`);
      results.push({ sku, status: 'skipped-exists', name: nameAr });
      continue;
    }
    if (existing.barcodes.has(row[4])) {
      log(`SKIP ${sku} ${nameAr} (piece barcode exists)`);
      results.push({ sku, status: 'skipped-exists', name: nameAr });
      continue;
    }
    const fd = buildPayload(row, cat.id, logoBuf);
    const res = await api('/products', { method: 'POST', body: fd });
    if (res.ok) {
      const id = res.body?.data?.id ?? '?';
      log(`OK   ${sku} ${nameAr} → product id=${id}`);
      results.push({ sku, status: 'created', id, name: nameAr });
    } else {
      const errs = res.body?.errors ? JSON.stringify(res.body.errors) : '';
      log(`FAIL ${sku} ${nameAr} → ${res.status} ${(res.body?.message || '')} ${errs}`);
      results.push({ sku, status: 'failed', http: res.status, message: res.body?.message, errors: res.body?.errors, name: nameAr });
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }
}

const grouped = results.reduce((acc, r) => {
  acc[r.status] = (acc[r.status] || 0) + 1;
  return acc;
}, {});
log('');
log('─── summary ───');
for (const [status, count] of Object.entries(grouped)) log(`${status}: ${count}`);
const failed = results.filter((r) => r.status === 'failed');
if (failed.length) {
  log('failed skus (retry by running again; safe-idempotent):');
  failed.forEach((r) => log(` - ${r.sku} ${r.name}: ${r.http} ${r.message || ''}`));
}
writeFileSync(REPORT_PATH, '\uFEFF' + report.join('\n'), 'utf8');
log(`report saved: ${REPORT_PATH}`);
