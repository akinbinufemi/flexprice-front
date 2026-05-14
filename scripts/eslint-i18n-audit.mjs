#!/usr/bin/env node
/**
 * Runs ESLint with ESLINT_I18N_LITERAL_MODE=audit (i18next/no-literal-string mode: all).
 * Summarizes i18next violations by file. Excludes *.test.* / *.spec.* by default.
 *
 * Usage:
 *   node scripts/eslint-i18n-audit.mjs
 *   node scripts/eslint-i18n-audit.mjs --ui
 *   node scripts/eslint-i18n-audit.mjs --with-tests
 *   node scripts/eslint-i18n-audit.mjs --ui --write-summary=docs/superpowers/reports/i18n-audit-ui-summary.json
 *
 * `--ui` limits the run to `src/pages` + `src/components` (baseline in
 * docs/superpowers/i18n-multi-agent-coordination.md). Default includes `src`,
 * Vite/Vitest/Storybook configs.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';

const withTests = process.argv.includes('--with-tests');
const uiOnly = process.argv.includes('--ui');
const writeSummaryArg = process.argv.find((a) => a.startsWith('--write-summary='));
const writeSummaryPath = writeSummaryArg ? writeSummaryArg.split('=')[1] : null;

const cwd = resolve('.');
const outPath = resolve(cwd, 'scripts/.eslint-i18n-audit-report.json');

const paths = uiOnly
	? ['src/pages', 'src/components']
	: ['src', 'vite.config.ts', 'vitest.config.ts', '.storybook'];

const args = [...paths, '-f', 'json', '-o', outPath];
if (!withTests) {
	args.push('--ignore-pattern', '**/*.test.{ts,tsx}');
	args.push('--ignore-pattern', '**/*.spec.{ts,tsx}');
}

const r = spawnSync('npx', ['eslint', ...args], {
	cwd,
	env: { ...process.env, ESLINT_I18N_LITERAL_MODE: 'audit' },
	encoding: 'utf8',
	stdio: ['inherit', 'pipe', 'pipe'],
});

const stderr = r.stderr || '';
if (stderr && !stderr.includes('npm warn')) {
	console.error(stderr);
}

if (!existsSync(outPath)) {
	console.error('ESLint did not write report file:', outPath);
	process.exit(r.status ?? 1);
}

const report = JSON.parse(readFileSync(outPath, 'utf8'));
let total = 0;
const byFile = {};
for (const file of report) {
	let n = 0;
	for (const m of file.messages) {
		if (m.ruleId === 'i18next/no-literal-string' && m.severity === 2) n++;
	}
	if (n) {
		const rel = relative(cwd, file.filePath).replace(/\\/g, '/');
		byFile[rel] = n;
		total += n;
	}
}

const top = Object.entries(byFile)
	.sort((a, b) => b[1] - a[1])
	.slice(0, 40);

const summary = {
	total,
	filesWithViolations: Object.keys(byFile).length,
	withTests,
	uiOnly,
	paths,
	topFiles: Object.fromEntries(top),
};

console.log(JSON.stringify({ total, filesWithViolations: Object.keys(byFile).length, withTests, uiOnly, paths }, null, 2));
console.log('\nTop files (first 40):\n' + top.map(([f, c]) => `${c}\t${f}`).join('\n'));

if (writeSummaryPath) {
	const abs = resolve(cwd, writeSummaryPath);
	mkdirSync(dirname(abs), { recursive: true });
	writeFileSync(abs, `${JSON.stringify(summary, null, '\t')}\n`, 'utf8');
	console.log('\nWrote summary:', writeSummaryPath);
}

unlinkSync(outPath);
process.exit(total > 0 ? 1 : 0);
