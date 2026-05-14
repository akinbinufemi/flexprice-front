# i18n Localization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully localize the Flexprice frontend (English + Arabic) using eight feature namespaces, a lazy-loading i18next backend, and a hybrid extract→review→apply migration workflow.

**Architecture:** `i18next-resources-to-backend` dynamically imports each `locales/{lang}/{namespace}.json` file on demand (Vite code-splits them automatically). A Node.js extract script generates draft JSON + replacement maps from ESLint violations; a companion apply script patches source files. Each namespace is migrated in order: common first (unblocks others), then billing, catalog, customers, developers, settings, customer-portal.

**Tech Stack:** i18next v26, react-i18next v17, i18next-resources-to-backend v1.2, eslint-plugin-i18next (already installed), Node.js ESM scripts, Vite dynamic imports

---

## File Structure

**New files:**
- `src/i18n/locales/en/common.json` — shared strings (buttons, status, validation, toast templates)
- `src/i18n/locales/en/billing.json` — invoices, payments, credit notes, subscriptions
- `src/i18n/locales/en/catalog.json` — features, plans, coupons, addons, price units, groups, cost sheets
- `src/i18n/locales/en/customers.json` — customer list, customer detail, usage analytics
- `src/i18n/locales/en/developers.json` — events, API keys, service accounts, webhooks, workflows
- `src/i18n/locales/en/settings.json` — org settings, team members, integrations, imports, exports
- `src/i18n/locales/en/customer-portal.json` — customer-facing portal surface
- `src/i18n/locales/ar/*.json` — Arabic mirrors of every en/ file (empty values for translator)
- `scripts/extract-i18n.mjs` — scans file globs via ESLint, generates draft JSON + replacement map
- `scripts/apply-i18n.mjs` — reads replacement map, patches source files with `t()` calls
- `scripts/i18n-replacements/*.json` — generated replacement maps (one per namespace, gitignored after apply)

**Modified files:**
- `src/i18n/index.ts` — replace hardcoded Promise.all with lazy resourcesToBackend
- `package.json` — add `i18next-resources-to-backend`
- All component/page files touched during namespace migrations

---

## Task 1: Install dependency and update i18n init

**Files:**
- Modify: `src/i18n/index.ts`
- Modify: `package.json`

- [ ] **Step 1: Install i18next-resources-to-backend**

```bash
npm install i18next-resources-to-backend
```

Expected: `added 1 package` in output, no errors.

- [ ] **Step 2: Replace src/i18n/index.ts**

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { Direction } from '@/config/branding';

export const NAMESPACES = [
	'auth',
	'common',
	'billing',
	'catalog',
	'customers',
	'developers',
	'settings',
	'customer-portal',
] as const;

export type Namespace = (typeof NAMESPACES)[number];

export async function initI18n(locale: string, direction: Direction): Promise<void> {
	if (i18n.isInitialized) {
		await i18n.changeLanguage(locale);
		document.documentElement.lang = locale;
		document.documentElement.dir = direction;
		return;
	}

	try {
		await i18n
			.use(resourcesToBackend((language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`)))
			.use(initReactI18next)
			.init({
				lng: locale,
				fallbackLng: 'en',
				defaultNS: 'common',
				ns: NAMESPACES,
				partialBundledLanguages: true,
				interpolation: { escapeValue: false },
			});
	} catch (err) {
		console.error('[i18n] Initialization failed:', err);
		throw err;
	}

	document.documentElement.lang = locale;
	document.documentElement.dir = direction;
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Verify auth pages still work**

```bash
npm run dev
```

Open `http://localhost:3000` → navigate to login page → verify all labels render (not blank). The `auth` namespace lazy-loads on first `useTranslation('auth')` call.

- [ ] **Step 5: Commit**

```bash
git add src/i18n/index.ts package.json package-lock.json
git commit -m "feat(i18n): switch to lazy namespace loading via resourcesToBackend"
```

---

## Task 2: Create skeleton locale files for all new namespaces

**Files:**
- Create: `src/i18n/locales/en/common.json`
- Create: `src/i18n/locales/en/billing.json`
- Create: `src/i18n/locales/en/catalog.json`
- Create: `src/i18n/locales/en/customers.json`
- Create: `src/i18n/locales/en/developers.json`
- Create: `src/i18n/locales/en/settings.json`
- Create: `src/i18n/locales/en/customer-portal.json`
- Create: `src/i18n/locales/ar/common.json` (and ar/ mirrors for all 6 others)

- [ ] **Step 1: Create en/common.json with the full predefined structure**

`src/i18n/locales/en/common.json`:
```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "add": "Add",
    "edit": "Edit",
    "archive": "Archive",
    "delete": "Delete",
    "confirm": "Confirm",
    "close": "Close",
    "search": "Search",
    "export": "Export",
    "import": "Import",
    "viewAll": "View all",
    "back": "Back",
    "create": "Create",
    "update": "Update",
    "done": "Done",
    "continue": "Continue",
    "skip": "Skip",
    "retry": "Retry",
    "refresh": "Refresh",
    "copy": "Copy",
    "copied": "Copied!",
    "generate": "Generate",
    "download": "Download",
    "upload": "Upload",
    "submit": "Submit",
    "apply": "Apply",
    "reset": "Reset",
    "clear": "Clear"
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "draft": "Draft",
    "cancelled": "Cancelled",
    "loading": "Loading...",
    "processing": "Processing...",
    "success": "Success",
    "failed": "Failed",
    "archived": "Archived",
    "published": "Published",
    "scheduled": "Scheduled"
  },
  "validation": {
    "required": "This field is required",
    "email": "Please enter a valid email address",
    "minLength": "Must be at least {{min}} characters",
    "maxLength": "Must be at most {{max}} characters",
    "invalidFormat": "Invalid format"
  },
  "table": {
    "noResults": "No results found",
    "empty": "No data yet",
    "loading": "Loading...",
    "showing": "Showing {{count}} results"
  },
  "pagination": {
    "previous": "Previous",
    "next": "Next",
    "page": "Page {{current}} of {{total}}"
  },
  "toast": {
    "createSuccess": "{{entity}} created successfully",
    "updateSuccess": "{{entity}} updated successfully",
    "archiveSuccess": "{{entity}} archived successfully",
    "deleteSuccess": "{{entity}} deleted successfully",
    "copySuccess": "Copied to clipboard",
    "genericError": "Something went wrong. Please try again.",
    "networkError": "Network error. Please check your connection."
  },
  "confirm": {
    "archiveTitle": "Archive {{entity}}?",
    "archiveDescription": "This action can be undone from the settings page.",
    "deleteTitle": "Delete {{entity}}?",
    "deleteDescription": "This action cannot be undone."
  },
  "empty": {
    "noData": "No data found",
    "noResults": "No results match your search",
    "getStarted": "Get started by creating your first {{entity}}"
  },
  "nav": {
    "home": "Home",
    "billing": "Billing",
    "catalog": "Product Catalog",
    "customers": "Customers",
    "subscriptions": "Subscriptions",
    "invoices": "Invoices",
    "payments": "Payments",
    "creditNotes": "Credit Notes",
    "taxes": "Taxes",
    "features": "Features",
    "plans": "Plans",
    "coupons": "Coupons",
    "addons": "Addons",
    "costSheets": "Cost Sheets",
    "priceUnits": "Price Units",
    "groups": "Groups",
    "revenue": "Revenue",
    "tools": "Tools",
    "imports": "Imports",
    "exports": "Exports",
    "developers": "Developers",
    "eventsDebugger": "Events Debugger",
    "apiKeys": "API Keys",
    "serviceAccounts": "Service Accounts",
    "webhooks": "Webhooks",
    "workflows": "Workflows",
    "integrations": "Integrations",
    "pricingWidget": "Pricing Widget",
    "settings": "Settings"
  }
}
```

- [ ] **Step 2: Create empty skeleton files for all other namespaces**

Create each of these files with `{}` as content:
- `src/i18n/locales/en/billing.json` → `{}`
- `src/i18n/locales/en/catalog.json` → `{}`
- `src/i18n/locales/en/customers.json` → `{}`
- `src/i18n/locales/en/developers.json` → `{}`
- `src/i18n/locales/en/settings.json` → `{}`
- `src/i18n/locales/en/customer-portal.json` → `{}`

- [ ] **Step 3: Create ar/ mirrors**

`src/i18n/locales/ar/common.json`:
```json
{
  "actions": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "add": "إضافة",
    "edit": "تعديل",
    "archive": "أرشفة",
    "delete": "حذف",
    "confirm": "تأكيد",
    "close": "إغلاق",
    "search": "بحث",
    "export": "تصدير",
    "import": "استيراد",
    "viewAll": "عرض الكل",
    "back": "رجوع",
    "create": "إنشاء",
    "update": "تحديث",
    "done": "تم",
    "continue": "متابعة",
    "skip": "تخطي",
    "retry": "إعادة المحاولة",
    "refresh": "تحديث",
    "copy": "نسخ",
    "copied": "تم النسخ!",
    "generate": "توليد",
    "download": "تنزيل",
    "upload": "رفع",
    "submit": "إرسال",
    "apply": "تطبيق",
    "reset": "إعادة تعيين",
    "clear": "مسح"
  },
  "status": {
    "active": "نشط",
    "inactive": "غير نشط",
    "pending": "معلق",
    "draft": "مسودة",
    "cancelled": "ملغي",
    "loading": "جارٍ التحميل...",
    "processing": "جارٍ المعالجة...",
    "success": "نجاح",
    "failed": "فشل",
    "archived": "مؤرشف",
    "published": "منشور",
    "scheduled": "مجدول"
  },
  "validation": {
    "required": "هذا الحقل مطلوب",
    "email": "يرجى إدخال عنوان بريد إلكتروني صالح",
    "minLength": "يجب أن يكون {{min}} حرفاً على الأقل",
    "maxLength": "يجب أن لا يتجاوز {{max}} حرفاً",
    "invalidFormat": "تنسيق غير صالح"
  },
  "table": {
    "noResults": "لا توجد نتائج",
    "empty": "لا توجد بيانات بعد",
    "loading": "جارٍ التحميل...",
    "showing": "عرض {{count}} نتيجة"
  },
  "pagination": {
    "previous": "السابق",
    "next": "التالي",
    "page": "الصفحة {{current}} من {{total}}"
  },
  "toast": {
    "createSuccess": "تم إنشاء {{entity}} بنجاح",
    "updateSuccess": "تم تحديث {{entity}} بنجاح",
    "archiveSuccess": "تم أرشفة {{entity}} بنجاح",
    "deleteSuccess": "تم حذف {{entity}} بنجاح",
    "copySuccess": "تم النسخ إلى الحافظة",
    "genericError": "حدث خطأ ما. يرجى المحاولة مجدداً.",
    "networkError": "خطأ في الشبكة. يرجى التحقق من اتصالك."
  },
  "confirm": {
    "archiveTitle": "أرشفة {{entity}}؟",
    "archiveDescription": "يمكن التراجع عن هذا الإجراء من صفحة الإعدادات.",
    "deleteTitle": "حذف {{entity}}؟",
    "deleteDescription": "لا يمكن التراجع عن هذا الإجراء."
  },
  "empty": {
    "noData": "لا توجد بيانات",
    "noResults": "لا توجد نتائج تطابق بحثك",
    "getStarted": "ابدأ بإنشاء أول {{entity}} لك"
  },
  "nav": {
    "home": "الرئيسية",
    "billing": "الفواتير",
    "catalog": "كتالوج المنتجات",
    "customers": "العملاء",
    "subscriptions": "الاشتراكات",
    "invoices": "الفواتير",
    "payments": "المدفوعات",
    "creditNotes": "إشعارات الائتمان",
    "taxes": "الضرائب",
    "features": "الميزات",
    "plans": "الخطط",
    "coupons": "الكوبونات",
    "addons": "الإضافات",
    "costSheets": "جداول التكلفة",
    "priceUnits": "وحدات السعر",
    "groups": "المجموعات",
    "revenue": "الإيرادات",
    "tools": "الأدوات",
    "imports": "الاستيراد",
    "exports": "التصدير",
    "developers": "المطورون",
    "eventsDebugger": "مصحح الأحداث",
    "apiKeys": "مفاتيح API",
    "serviceAccounts": "حسابات الخدمة",
    "webhooks": "ويب هوك",
    "workflows": "سير العمل",
    "integrations": "التكاملات",
    "pricingWidget": "أداة التسعير",
    "settings": "الإعدادات"
  }
}
```

Create these `ar/` files with `{}` as content (translator fills in later):
- `src/i18n/locales/ar/billing.json` → `{}`
- `src/i18n/locales/ar/catalog.json` → `{}`
- `src/i18n/locales/ar/customers.json` → `{}`
- `src/i18n/locales/ar/developers.json` → `{}`
- `src/i18n/locales/ar/settings.json` → `{}`
- `src/i18n/locales/ar/customer-portal.json` → `{}`

- [ ] **Step 4: Verify TypeScript and dev server**

```bash
npx tsc --noEmit
npm run dev
```

Open login page — verify auth labels still render in both English and Arabic (switch locale in the locale selector).

- [ ] **Step 5: Commit**

```bash
git add src/i18n/locales/
git commit -m "feat(i18n): add locale skeleton files for all namespaces (en + ar)"
```

---

## Task 3: Write the extract-i18n.mjs script

**Files:**
- Create: `scripts/extract-i18n.mjs`

- [ ] **Step 1: Create scripts/extract-i18n.mjs**

```js
#!/usr/bin/env node
// scripts/extract-i18n.mjs
// Scans a namespace's file paths for i18next/no-literal-string ESLint violations,
// generates a draft en/<namespace>.json and a replacement map for apply-i18n.mjs.

import { ESLint } from 'eslint';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { relative } from 'path';
import { parseArgs } from 'util';

const { values: args } = parseArgs({
	options: { namespace: { type: 'string' } },
});

// Namespace → file glob mapping (mirrors the ESLint rule's intent)
const NAMESPACE_GLOBS = {
	common: [
		'src/components/atoms/**/*.tsx',
		'src/components/molecules/MetricCard.tsx',
		'src/components/molecules/BreadCrumbs/**/*.tsx',
		'src/components/molecules/DetailsCard/**/*.tsx',
	],
	billing: [
		'src/pages/customer/invoices/**/*.tsx',
		'src/pages/customer/payments/**/*.tsx',
		'src/pages/customer/creditnotes/**/*.tsx',
		'src/pages/customer/subscriptions/**/*.tsx',
		'src/pages/customer/taxes/**/*.tsx',
		'src/components/molecules/InvoiceTable/**/*.tsx',
		'src/components/molecules/InvoiceLine*/**/*.tsx',
		'src/components/molecules/InvoiceTax*/**/*.tsx',
		'src/components/molecules/InvoicePayments*/**/*.tsx',
		'src/components/molecules/InvoiceCredit*/**/*.tsx',
		'src/components/molecules/InvoiceDownload*/**/*.tsx',
		'src/components/molecules/CreditNoteTable/**/*.tsx',
		'src/components/molecules/SubscriptionTable/**/*.tsx',
		'src/components/molecules/Subscription/**/*.tsx',
		'src/components/molecules/SubscriptionAddon*/**/*.tsx',
		'src/components/molecules/SubscriptionCancel*/**/*.tsx',
		'src/components/molecules/SubscriptionCoupon/**/*.tsx',
		'src/components/molecules/SubscriptionDiscount*/**/*.tsx',
		'src/components/molecules/SubscriptionEntitlements*/**/*.tsx',
		'src/components/molecules/SubscriptionLineItem*/**/*.tsx',
		'src/components/molecules/SubscriptionTax*/**/*.tsx',
		'src/components/molecules/UpdateSubscriptionDrawer/**/*.tsx',
		'src/components/molecules/RecordPaymentTopup/**/*.tsx',
		'src/components/molecules/LineItemCoupon/**/*.tsx',
		'src/components/molecules/CouponAssociation/**/*.tsx',
	],
	catalog: [
		'src/pages/product-catalog/**/*.tsx',
		'src/components/molecules/FeatureDrawer/**/*.tsx',
		'src/components/molecules/FeatureTable/**/*.tsx',
		'src/components/molecules/FeatureAlertDialog/**/*.tsx',
		'src/components/molecules/PlanDrawer/**/*.tsx',
		'src/components/molecules/PlansTable/**/*.tsx',
		'src/components/molecules/Plan/**/*.tsx',
		'src/components/molecules/DuplicatePlanDialog/**/*.tsx',
		'src/components/molecules/CouponDrawer/**/*.tsx',
		'src/components/molecules/CouponModal/**/*.tsx',
		'src/components/molecules/CouponTable/**/*.tsx',
		'src/components/molecules/AddonDrawer/**/*.tsx',
		'src/components/molecules/AddonTable/**/*.tsx',
		'src/components/molecules/PriceUnitDrawer/**/*.tsx',
		'src/components/molecules/PriceUnitTable/**/*.tsx',
		'src/components/molecules/CurrencyPriceUnitSelector/**/*.tsx',
		'src/components/molecules/GroupDrawer/**/*.tsx',
		'src/components/molecules/GroupsTable/**/*.tsx',
		'src/components/molecules/CostSheetDrawer/**/*.tsx',
		'src/components/molecules/CostSheetTable/**/*.tsx',
		'src/components/molecules/CostDataTable.tsx',
		'src/components/molecules/UpdatePriceDetailsDrawer/**/*.tsx',
		'src/components/molecules/ChargeValueCell/**/*.tsx',
	],
	customers: [
		'src/pages/customer/customers/**/*.tsx',
		'src/pages/customer/index.ts',
		'src/components/molecules/Customer/**/*.tsx',
		'src/components/molecules/CustomerUsageTable/**/*.tsx',
		'src/components/customers/*.tsx',
	],
	developers: [
		'src/pages/developer/**/*.tsx',
		'src/components/molecules/Events/**/*.tsx',
		'src/components/molecules/EventFilter/**/*.tsx',
		'src/components/molecules/EventsMonitoringChart.tsx',
		'src/components/molecules/SecretKeyDrawer/**/*.tsx',
		'src/components/molecules/ServiceAccountDrawer/**/*.tsx',
		'src/pages/webhooks/**/*.tsx',
	],
	settings: [
		'src/pages/settings/**/*.tsx',
		'src/components/molecules/Tenant/**/*.tsx',
		'src/components/molecules/IntegrationDrawer/**/*.tsx',
		'src/components/molecules/ImportFileDrawer/**/*.tsx',
		'src/components/molecules/ExportDrawer/**/*.tsx',
		'src/components/molecules/ExportRunsList/**/*.tsx',
		'src/components/molecules/HubSpotConnectionDrawer/**/*.tsx',
		'src/components/molecules/ZohoBooksConnectionDrawer/**/*.tsx',
		'src/components/molecules/S3ConnectionDrawer/**/*.tsx',
		'src/components/molecules/QuickBooksConnectionDrawer/**/*.tsx',
		'src/components/molecules/NomodConnectionDrawer/**/*.tsx',
		'src/components/molecules/MoyasarConnectionDrawer/**/*.tsx',
		'src/components/molecules/RazorpayConnectionDrawer/**/*.tsx',
		'src/components/molecules/PaddleConnectionDrawer/**/*.tsx',
		'src/components/molecules/ChargebeeConnectionDrawer/**/*.tsx',
	],
	'customer-portal': ['src/components/customer-portal/**/*.tsx', 'src/pages/customer-portal/**/*.tsx'],
};

const namespace = args.namespace;
if (!namespace || !NAMESPACE_GLOBS[namespace]) {
	console.error(`Usage: node scripts/extract-i18n.mjs --namespace <name>`);
	console.error(`Available: ${Object.keys(NAMESPACE_GLOBS).join(', ')}`);
	process.exit(1);
}

// Convert a raw string to a camelCase key segment (max 5 words)
function toKeySegment(str) {
	const words = str
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.trim()
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 5);
	return words
		.map((w, i) => (i === 0 ? w : w[0].toUpperCase() + w.slice(1)))
		.join('');
}

// Infer a section name from a file path (e.g. InvoiceTable.tsx → invoices)
function inferSection(filePath) {
	const name = filePath.split('/').pop().replace(/\.(tsx|ts)$/, '');
	// Remove common suffixes
	const base = name.replace(/(Page|Table|Drawer|Modal|Form|Card|Widget|List|Section|Dialog|Chart).*$/, '');
	// Convert PascalCase to camelCase first segment
	return base.replace(/([A-Z])/g, (c, i) => (i === 0 ? c.toLowerCase() : `_${c.toLowerCase()}`)).split('_')[0];
}

const globs = NAMESPACE_GLOBS[namespace];

console.log(`\nExtracting strings for namespace: "${namespace}"`);
console.log(`Scanning ${globs.length} glob patterns...\n`);

const eslint = new ESLint({ overrideConfigFile: 'eslint.config.js' });

let allFiles = [];
for (const glob of globs) {
	try {
		const files = await eslint.lintFiles([glob]);
		allFiles = allFiles.concat(files);
	} catch {
		// glob matched no files — skip silently
	}
}

const keyMap = {}; // raw string → { key, namespace }
const draftJson = {};
const replacements = [];

for (const result of allFiles) {
	if (!result.messages.length) continue;
	const relPath = relative(process.cwd(), result.filePath);
	const section = inferSection(relPath);

	for (const msg of result.messages) {
		if (msg.ruleId !== 'i18next/no-literal-string') continue;

		// ESLint message format: "disallow literal string: <content>"
		const raw = msg.message.replace(/^disallow literal string:\s*/i, '').replace(/^['"]|['"]$/g, '').trim();

		// Skip if too short, whitespace-only, or a code identifier
		if (!raw || raw.length < 2 || /^[a-z][a-z0-9_-]*$/.test(raw)) continue;
		// Skip URLs, hex colours, single chars
		if (/^https?:\/\//.test(raw) || /^#[a-fA-F0-9]{3,8}$/.test(raw) || raw.length === 1) continue;

		if (!keyMap[raw]) {
			const keySegment = toKeySegment(raw);
			const fullKey = `${section}.${keySegment}`;
			keyMap[raw] = fullKey;

			if (!draftJson[section]) draftJson[section] = {};
			draftJson[section][keySegment] = raw;
		}

		replacements.push({
			file: relPath,
			line: msg.line,
			col: msg.column,
			originalString: raw,
			suggestedKey: keyMap[raw],
			namespace,
		});
	}
}

// Write draft en/<namespace>.json (merge with existing if present)
const jsonPath = `src/i18n/locales/en/${namespace}.json`;
const existing = existsSync(jsonPath) ? JSON.parse(readFileSync(jsonPath, 'utf8')) : {};
const merged = { ...existing, ...draftJson };
writeFileSync(jsonPath, JSON.stringify(merged, null, 2) + '\n');
console.log(`✓ Draft JSON → ${jsonPath}  (${Object.values(draftJson).reduce((n, s) => n + Object.keys(s).length, 0)} new keys)`);

// Write replacement map
mkdirSync('scripts/i18n-replacements', { recursive: true });
const mapPath = `scripts/i18n-replacements/${namespace}.json`;
writeFileSync(mapPath, JSON.stringify(replacements, null, 2) + '\n');
console.log(`✓ Replacement map → ${mapPath}  (${replacements.length} occurrences in ${new Set(replacements.map((r) => r.file)).size} files)`);

console.log(`
Next steps:
  1. Review and rename keys in ${jsonPath}
  2. Move any shared strings (Cancel, Save, etc.) to src/i18n/locales/en/common.json
  3. Create src/i18n/locales/ar/${namespace}.json with empty string values
  4. Update ${mapPath} with finalized key names
  5. node scripts/apply-i18n.mjs --namespace ${namespace}
`);
```

- [ ] **Step 2: Make the script executable**

```bash
chmod +x scripts/extract-i18n.mjs
```

- [ ] **Step 3: Do a dry run against the developers namespace to verify it works**

```bash
node scripts/extract-i18n.mjs --namespace developers
```

Expected output: prints found string counts, writes `src/i18n/locales/en/developers.json` draft and `scripts/i18n-replacements/developers.json`. No errors.

- [ ] **Step 4: Commit**

```bash
git add scripts/extract-i18n.mjs
git commit -m "feat(i18n): add extract-i18n script to scaffold namespace JSON from ESLint violations"
```

---

## Task 4: Write the apply-i18n.mjs script

**Files:**
- Create: `scripts/apply-i18n.mjs`

- [ ] **Step 1: Create scripts/apply-i18n.mjs**

```js
#!/usr/bin/env node
// scripts/apply-i18n.mjs
// Reads a replacement map generated by extract-i18n.mjs and patches source files
// to replace hardcoded strings with t() calls, adding useTranslation where needed.

import { readFileSync, writeFileSync } from 'fs';
import { parseArgs } from 'util';

const { values: args } = parseArgs({
	options: { namespace: { type: 'string' } },
});

const namespace = args.namespace;
if (!namespace) {
	console.error('Usage: node scripts/apply-i18n.mjs --namespace <name>');
	process.exit(1);
}

const mapPath = `scripts/i18n-replacements/${namespace}.json`;
let replacements;
try {
	replacements = JSON.parse(readFileSync(mapPath, 'utf8'));
} catch {
	console.error(`Replacement map not found: ${mapPath}\nRun extract-i18n.mjs first.`);
	process.exit(1);
}

// Group by file, sort by line descending so replacements don't shift offsets
const byFile = {};
for (const r of replacements) {
	(byFile[r.file] ??= []).push(r);
}
for (const arr of Object.values(byFile)) {
	arr.sort((a, b) => b.line - a.line || b.col - a.col);
}

let totalApplied = 0;
const manualItems = [];

for (const [file, fileReplacements] of Object.entries(byFile)) {
	let content;
	try {
		content = readFileSync(file, 'utf8');
	} catch {
		console.warn(`  ⚠ Cannot read ${file} — skipping`);
		continue;
	}

	const lines = content.split('\n');
	const appliedInFile = [];

	for (const r of fileReplacements) {
		const { originalString, suggestedKey } = r;
		// Build the t() call — use namespace: prefix if key belongs to a different namespace
		const keyArg = suggestedKey.startsWith(`${namespace}.`)
			? `'${suggestedKey.slice(namespace.length + 1)}'`
			: `'${suggestedKey}'`; // cross-namespace key (common:actions.save handled by caller)

		const tCall = `t(${keyArg})`;
		const lineIdx = r.line - 1;
		const line = lines[lineIdx] ?? '';

		let replaced = false;

		// Pattern 1: JSX text node  >string<  →  >{t(key)}<
		if (line.includes(`>${originalString}<`)) {
			lines[lineIdx] = line.replace(`>${originalString}<`, `>{${tCall}}<`);
			replaced = true;
		}
		// Pattern 2: JSX expression  {'string'}  →  {t(key)}
		else if (line.includes(`{'${originalString}'}`)) {
			lines[lineIdx] = line.replace(`{'${originalString}'}`, `{${tCall}}`);
			replaced = true;
		}
		// Pattern 3: JSX expression  {"string"}  →  {t(key)}
		else if (line.includes(`{"${originalString}"}`)) {
			lines[lineIdx] = line.replace(`{"${originalString}"}`, `{${tCall}}`);
			replaced = true;
		}
		// Pattern 4: Attribute string  attr="string"  →  attr={t(key)}
		else if (line.includes(`="${originalString}"`)) {
			lines[lineIdx] = line.replace(`="${originalString}"`, `={${tCall}}`);
			replaced = true;
		}

		if (replaced) {
			appliedInFile.push(r);
			totalApplied++;
		} else {
			manualItems.push({ file, line: r.line, originalString, suggestedKey });
		}
	}

	if (!appliedInFile.length) continue;

	content = lines.join('\n');

	// Add useTranslation import if not already present
	if (!content.includes('useTranslation')) {
		// Insert after last import line
		content = content.replace(/((?:import .+\n)+)(?!import)/, `$1import { useTranslation } from 'react-i18next';\n`);
	}

	// Add const { t } = useTranslation('namespace') hook if not present
	// Heuristic: insert after the opening brace of the first arrow function component
	if (!content.includes(`useTranslation('${namespace}')`) && !content.includes(`useTranslation(["${namespace}`)) {
		const hookLine = `\n\tconst { t } = useTranslation('${namespace}');\n`;
		// Match: const ComponentName: FC<...> = (...) => {  OR  const ComponentName = (...) => {
		content = content.replace(
			/(const \w+ ?(?::\s*FC[^=]*)? ?= ?(?:\([^)]*\)) ?=> ?\{)/,
			`$1${hookLine}`,
		);
	}

	writeFileSync(file, content, 'utf8');
	console.log(`  ✓ ${file} — ${appliedInFile.length} replaced`);
}

console.log(`\nSummary: ${totalApplied} replacements applied`);

if (manualItems.length) {
	console.log(`\n⚠  ${manualItems.length} items need manual replacement:`);
	for (const item of manualItems) {
		console.log(`   ${item.file}:${item.line}  "${item.originalString}"  →  {t('${item.suggestedKey.slice(namespace.length + 1)}')}`);
	}
}

console.log(`
Next steps:
  1. Review changes:         git diff
  2. Fix manual items above
  3. Lint + format:          npx eslint src/ --fix
  4. Type check:             npx tsc --noEmit
  5. Verify in browser (en + ar)
  6. Commit:                 git add -A && git commit -m "feat(i18n): migrate ${namespace} namespace"
`);
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/apply-i18n.mjs
```

- [ ] **Step 3: Commit**

```bash
git add scripts/apply-i18n.mjs
git commit -m "feat(i18n): add apply-i18n script to patch source files with t() calls"
```

---

## Task 5: Migrate common namespace

The `common` namespace is predefined (no extract script needed — it's the canonical shared string set created in Task 2). This task wires components that use only common strings to `useTranslation()`.

**Files:**
- Modify: `src/components/molecules/Sidebar/Sidebar.tsx`
- Modify: `src/components/atoms/ActionButton/ActionButton.tsx`
- Modify: components that use hardcoded "Cancel", "Save", "Add", "Edit" etc.

- [ ] **Step 1: Run extract on common globs to find all violations**

```bash
node scripts/extract-i18n.mjs --namespace common
```

Review `src/i18n/locales/en/common.json` — the extract script will find strings like "Cancel", "Save", "Loading..." that should map to existing keys. Rename any auto-generated keys to match the predefined structure (e.g. `common.cancel` → `actions.cancel`).

- [ ] **Step 2: Update the replacement map with finalized keys**

Open `scripts/i18n-replacements/common.json`. For each entry, set `suggestedKey` to the correct key from `en/common.json`. For example:
- `"Cancel"` → `"actions.cancel"`
- `"Save"` → `"actions.save"`
- `"Loading..."` → `"status.loading"`
- `"No results found"` → `"table.noResults"`

- [ ] **Step 3: Run apply**

```bash
node scripts/apply-i18n.mjs --namespace common
```

Review `git diff`. Fix any manual items listed in the output.

- [ ] **Step 4: Lint, type check, test**

```bash
npx eslint src/components/atoms src/components/molecules/MetricCard.tsx --fix
npx tsc --noEmit
npm run dev
```

Switch locale to Arabic. Verify common UI elements (action buttons, table empty states, status chips) render in Arabic.

- [ ] **Step 5: Commit**

```bash
git add src/components/ src/i18n/locales/
git commit -m "feat(i18n): migrate common namespace — buttons, status, validation, toast templates"
```

---

## Task 6: Migrate billing namespace

**Files:**
- Modify: `src/pages/customer/invoices/**/*.tsx`, `src/pages/customer/payments/**/*.tsx`, `src/pages/customer/creditnotes/**/*.tsx`, `src/pages/customer/subscriptions/**/*.tsx`, `src/pages/customer/taxes/**/*.tsx`
- Modify: all `src/components/molecules/Invoice*`, `*CreditNote*`, `*Subscription*`, `*Payment*` components
- Modify: `src/i18n/locales/en/billing.json`
- Modify: `src/i18n/locales/ar/billing.json`

- [ ] **Step 1: Run extract**

```bash
node scripts/extract-i18n.mjs --namespace billing
```

- [ ] **Step 2: Review and rename keys in en/billing.json**

Open `src/i18n/locales/en/billing.json`. Apply the 3-level key convention. Example target structure:

```json
{
  "invoices": {
    "title": "Invoices",
    "empty": "No invoices found",
    "columns": {
      "invoiceId": "Invoice ID",
      "amount": "Amount due",
      "status": "Status",
      "dueDate": "Due date",
      "customer": "Customer",
      "createdAt": "Created at"
    },
    "actions": {
      "download": "Download PDF",
      "void": "Void invoice",
      "recordPayment": "Record payment"
    },
    "toast": {
      "voidSuccess": "Invoice voided successfully",
      "downloadError": "Failed to download invoice"
    }
  },
  "subscriptions": {
    "title": "Subscriptions",
    "empty": "No subscriptions found",
    "addSuccess": "Subscription created successfully",
    "archiveConfirm": "Are you sure you want to archive this subscription?"
  },
  "payments": {
    "title": "Payments",
    "empty": "No payments found",
    "recordSuccess": "Payment recorded successfully"
  },
  "creditNotes": {
    "title": "Credit Notes",
    "empty": "No credit notes found"
  }
}
```

Move any string that also appears in common (e.g. "Cancel", "Save") out of `billing.json` and update those entries in `scripts/i18n-replacements/billing.json` to use `common:actions.cancel`.

- [ ] **Step 3: Create ar/billing.json**

Copy `en/billing.json` structure and set all values to `""` (translator will fill in):
```json
{
  "invoices": {
    "title": "",
    "empty": "",
    "columns": {
      "invoiceId": "",
      "amount": "",
      "status": "",
      "dueDate": "",
      "customer": "",
      "createdAt": ""
    }
  }
}
```
(Mirror the full structure with empty strings.)

- [ ] **Step 4: Run apply**

```bash
node scripts/apply-i18n.mjs --namespace billing
```

Review `git diff`. Manually fix any items listed as needing manual review (complex ternaries, multi-line JSX strings).

- [ ] **Step 5: Lint, type check, verify**

```bash
npx eslint src/pages/customer/invoices src/pages/customer/payments src/pages/customer/subscriptions src/pages/customer/creditnotes --fix
npx tsc --noEmit
npm run dev
```

Navigate to Invoices, Payments, Subscriptions, Credit Notes pages. Verify all labels render in English. Switch to Arabic — verify Arabic labels render (any `""` values fall back to English per `fallbackLng`).

- [ ] **Step 6: Commit**

```bash
git add src/pages/customer/ src/components/molecules/ src/i18n/locales/
git commit -m "feat(i18n): migrate billing namespace — invoices, payments, subscriptions, credit notes"
```

---

## Task 7: Migrate catalog namespace

**Files:**
- Modify: `src/pages/product-catalog/**/*.tsx` (features, plans, coupons, addons, price-units, groups, cost-sheets)
- Modify: all relevant molecule components (FeatureDrawer, PlanDrawer, CouponDrawer, AddonDrawer, PriceUnitDrawer, GroupDrawer, CostSheetDrawer, etc.)
- Modify: `src/i18n/locales/en/catalog.json`
- Modify: `src/i18n/locales/ar/catalog.json`

- [ ] **Step 1: Run extract**

```bash
node scripts/extract-i18n.mjs --namespace catalog
```

- [ ] **Step 2: Review and rename keys in en/catalog.json**

Apply the 3-level convention. Example target structure:

```json
{
  "features": {
    "title": "Features",
    "empty": "No features found",
    "columns": { "name": "Name", "type": "Type", "createdAt": "Created at" }
  },
  "plans": {
    "title": "Plans",
    "empty": "No plans found",
    "columns": { "name": "Name", "billingPeriod": "Billing period", "amount": "Amount" }
  },
  "coupons": {
    "title": "Coupons",
    "empty": "No coupons found"
  },
  "addons": {
    "title": "Addons",
    "empty": "No addons found"
  },
  "priceUnits": {
    "title": "Price Units",
    "empty": "No price units found"
  },
  "groups": {
    "title": "Groups",
    "empty": "No groups found"
  },
  "costSheets": {
    "title": "Cost Sheets",
    "empty": "No cost sheets found"
  }
}
```

Move shared strings to `common.json`. Update `scripts/i18n-replacements/catalog.json` with finalized keys.

- [ ] **Step 3: Create ar/catalog.json with empty values** (mirror structure of en/catalog.json with `""` values)

- [ ] **Step 4: Run apply**

```bash
node scripts/apply-i18n.mjs --namespace catalog
```

Fix manual items from script output.

- [ ] **Step 5: Lint, type check, verify**

```bash
npx eslint src/pages/product-catalog --fix
npx tsc --noEmit
npm run dev
```

Navigate to Features, Plans, Coupons, Addons, Price Units, Groups, Cost Sheets. Verify all labels in English. Switch to Arabic and verify fallback works (no blank labels).

- [ ] **Step 6: Commit**

```bash
git add src/pages/product-catalog/ src/components/molecules/ src/i18n/locales/
git commit -m "feat(i18n): migrate catalog namespace — features, plans, coupons, addons, price units"
```

---

## Task 8: Migrate customers namespace

**Files:**
- Modify: `src/pages/customer/customers/**/*.tsx`
- Modify: `src/components/molecules/Customer/**/*.tsx`, `src/components/molecules/CustomerUsageTable/**/*.tsx`
- Modify: `src/i18n/locales/en/customers.json`
- Modify: `src/i18n/locales/ar/customers.json`

- [ ] **Step 1: Run extract**

```bash
node scripts/extract-i18n.mjs --namespace customers
```

- [ ] **Step 2: Review and rename keys in en/customers.json**

Example target structure:

```json
{
  "list": {
    "title": "Customers",
    "empty": "No customers found",
    "columns": {
      "name": "Name",
      "email": "Email",
      "subscriptions": "Subscriptions",
      "createdAt": "Created at"
    }
  },
  "detail": {
    "usage": "Usage",
    "subscriptions": "Subscriptions",
    "invoices": "Invoices"
  },
  "addSubscription": "Add Subscription"
}
```

Move shared strings to `common.json`. Update replacement map with finalized keys.

- [ ] **Step 3: Create ar/customers.json with empty values**

- [ ] **Step 4: Run apply**

```bash
node scripts/apply-i18n.mjs --namespace customers
```

Fix manual items.

- [ ] **Step 5: Lint, type check, verify**

```bash
npx eslint src/pages/customer/customers src/components/molecules/Customer --fix
npx tsc --noEmit
npm run dev
```

Navigate to Customers list and a customer detail page. Verify all labels in English and Arabic (fallback).

- [ ] **Step 6: Commit**

```bash
git add src/pages/customer/customers/ src/components/molecules/Customer* src/i18n/locales/
git commit -m "feat(i18n): migrate customers namespace"
```

---

## Task 9: Migrate developers namespace

**Files:**
- Modify: `src/pages/developer/**/*.tsx`
- Modify: `src/pages/webhooks/**/*.tsx`
- Modify: `src/components/molecules/Events/**/*.tsx`, `src/components/molecules/SecretKeyDrawer/**/*.tsx`, `src/components/molecules/ServiceAccountDrawer/**/*.tsx`
- Modify: `src/i18n/locales/en/developers.json`
- Modify: `src/i18n/locales/ar/developers.json`

- [ ] **Step 1: Run extract**

```bash
node scripts/extract-i18n.mjs --namespace developers
```

- [ ] **Step 2: Review and rename keys in en/developers.json**

Example target structure:

```json
{
  "events": {
    "title": "Events Debugger",
    "empty": "No events found",
    "columns": { "eventId": "Event ID", "type": "Type", "timestamp": "Timestamp", "status": "Status" }
  },
  "apiKeys": {
    "title": "API Keys",
    "empty": "No API keys yet",
    "generate": "Generate a Secret Key",
    "generateDescription": "Generate a secret key to authenticate API requests to Flexprice.",
    "createSuccess": "Secret key created successfully",
    "toast": { "copySuccess": "API key copied to clipboard" }
  },
  "serviceAccounts": {
    "title": "Service Accounts",
    "empty": "No service accounts found",
    "createSuccess": "Service account created successfully"
  },
  "webhooks": {
    "title": "Webhooks",
    "empty": "No webhooks found"
  },
  "workflows": {
    "title": "Workflows",
    "empty": "No workflows found"
  }
}
```

Move shared strings to `common.json`. Update replacement map.

- [ ] **Step 3: Create ar/developers.json with empty values**

- [ ] **Step 4: Run apply**

```bash
node scripts/apply-i18n.mjs --namespace developers
```

Fix manual items.

- [ ] **Step 5: Lint, type check, verify**

```bash
npx eslint src/pages/developer src/pages/webhooks --fix
npx tsc --noEmit
npm run dev
```

Navigate to Events Debugger, API Keys, Service Accounts, Webhooks, Workflows. Verify labels in English.

- [ ] **Step 6: Commit**

```bash
git add src/pages/developer/ src/pages/webhooks/ src/components/molecules/ src/i18n/locales/
git commit -m "feat(i18n): migrate developers namespace — events, API keys, service accounts, webhooks"
```

---

## Task 10: Migrate settings namespace

**Files:**
- Modify: `src/pages/settings/**/*.tsx`
- Modify: `src/components/molecules/Tenant/**/*.tsx`
- Modify: All `*ConnectionDrawer` molecules (`HubSpot`, `ZohoBooks`, `S3`, `QuickBooks`, `Nomod`, `Moyasar`, `Razorpay`, `Paddle`, `Chargebee`)
- Modify: `src/components/molecules/ImportFileDrawer/**/*.tsx`, `src/components/molecules/ExportDrawer/**/*.tsx`, `src/components/molecules/ExportRunsList/**/*.tsx`
- Modify: `src/i18n/locales/en/settings.json`
- Modify: `src/i18n/locales/ar/settings.json`

- [ ] **Step 1: Run extract**

```bash
node scripts/extract-i18n.mjs --namespace settings
```

- [ ] **Step 2: Review and rename keys in en/settings.json**

Example target structure:

```json
{
  "org": {
    "title": "Organization Settings",
    "name": "Organization Name",
    "country": "Country",
    "updateSuccess": "Organization settings updated successfully"
  },
  "team": {
    "title": "Team Members",
    "invite": "Invite Member",
    "inviteSuccess": "Invitation sent successfully",
    "columns": { "email": "Email", "role": "Role", "createdAt": "Created at" }
  },
  "integrations": {
    "title": "Integrations",
    "connect": "Connect",
    "disconnect": "Disconnect",
    "connected": "Connected",
    "connectSuccess": "Integration connected successfully"
  },
  "imports": {
    "title": "Imports",
    "upload": "Upload File",
    "uploadSuccess": "File uploaded successfully"
  },
  "exports": {
    "title": "Exports",
    "generate": "Generate Export",
    "generateSuccess": "Export generated successfully"
  }
}
```

Move shared strings to `common.json`. Update replacement map.

- [ ] **Step 3: Create ar/settings.json with empty values**

- [ ] **Step 4: Run apply**

```bash
node scripts/apply-i18n.mjs --namespace settings
```

Fix manual items.

- [ ] **Step 5: Lint, type check, verify**

```bash
npx eslint src/pages/settings --fix
npx tsc --noEmit
npm run dev
```

Navigate to Settings → Org, Team Members, Integrations, Imports, Exports. Verify all labels in English.

- [ ] **Step 6: Commit**

```bash
git add src/pages/settings/ src/components/molecules/ src/i18n/locales/
git commit -m "feat(i18n): migrate settings namespace — org, team, integrations, imports, exports"
```

---

## Task 11: Migrate customer-portal namespace

**Files:**
- Modify: `src/components/customer-portal/**/*.tsx`
- Modify: `src/i18n/locales/en/customer-portal.json`
- Modify: `src/i18n/locales/ar/customer-portal.json`

- [ ] **Step 1: Run extract**

```bash
node scripts/extract-i18n.mjs --namespace customer-portal
```

- [ ] **Step 2: Review and rename keys in en/customer-portal.json**

Example target structure:

```json
{
  "invoices": {
    "title": "Invoices",
    "empty": "No invoices",
    "columns": { "invoiceId": "Invoice", "amount": "Amount", "status": "Status", "date": "Date" }
  },
  "usage": {
    "title": "Usage",
    "breakdown": "Usage Breakdown",
    "analytics": "Usage Analytics",
    "columns": { "feature": "Feature", "quantity": "Quantity", "cost": "Cost" }
  },
  "subscriptions": {
    "title": "Subscriptions",
    "currentPlan": "Current Plan",
    "nextBilling": "Next billing date"
  }
}
```

Move shared strings to `common.json`. Update replacement map.

- [ ] **Step 3: Create ar/customer-portal.json with empty values**

- [ ] **Step 4: Run apply**

```bash
node scripts/apply-i18n.mjs --namespace customer-portal
```

Fix manual items.

- [ ] **Step 5: Lint, type check, verify**

```bash
npx eslint src/components/customer-portal --fix
npx tsc --noEmit
npm run dev
```

Navigate to the customer portal surface. Verify all labels in English and that no labels are blank.

- [ ] **Step 6: Final ESLint sweep — verify zero remaining hardcoded strings**

```bash
npx eslint src/pages src/components --format compact 2>&1 | grep "i18next/no-literal-string" | wc -l
```

Expected: 0 (or only intentional `eslint-disable` suppressions).

- [ ] **Step 7: Commit**

```bash
git add src/components/customer-portal/ src/i18n/locales/
git commit -m "feat(i18n): migrate customer-portal namespace — complete full localization coverage"
```

---

## Task 12: Add scripts/i18n-replacements to .gitignore

The replacement maps are generated artifacts — they don't belong in the repo after they've been applied.

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add to .gitignore**

Append to `.gitignore`:
```
# i18n migration artifacts (generated by extract-i18n.mjs, not needed after apply)
scripts/i18n-replacements/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: gitignore i18n replacement maps (migration artifacts)"
```

---

## Self-Review Notes

- **TypeScript key safety** is explicitly deferred to a Phase 2 follow-up. Do not implement `CustomTypeOptions` declaration merging until all JSON keys are stable across all namespaces.
- **Arabic translations**: `ar/*.json` files ship with `""` empty values. `fallbackLng: 'en'` ensures no blank labels in production. A native Arabic speaker fills in values via PR.
- **Pluralization and date/number formatting** are out of scope for this plan — handled separately via `Intl` where needed.
- The apply script uses heuristic regex for adding `useTranslation` hook calls. For components using render props, HOCs, or class components (rare in this codebase), the hook injection will fail and be listed as a manual item.
