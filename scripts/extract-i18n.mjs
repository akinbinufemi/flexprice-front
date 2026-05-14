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
		'src/components/customers/*.tsx',
		'src/components/molecules/Customer/**/*.tsx',
		'src/components/molecules/CustomerUsageTable/**/*.tsx',
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
	return (base.charAt(0).toLowerCase() + base.slice(1).replace(/[A-Z]/g, c => `_${c.toLowerCase()}`)).split('_')[0];
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
