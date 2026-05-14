import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import i18next from 'eslint-plugin-i18next';

/**
 * Default: `jsx-only` + narrow JSX attributes (staged/lint-friendly).
 * Set `ESLINT_I18N_LITERAL_MODE=audit` for `mode: 'all'` (string literals project-wide,
 * subject to callee/word excludes). Use `npm run lint:i18n-audit`.
 *
 * In audit mode only, `i18next/no-literal-string` is turned off for a small set of
 * technical modules (router paths, command-palette wiring, AI template schemas) so
 * the audit surfaces UI copy under `src/pages` and `src/components` first — see
 * docs/superpowers/i18n-multi-agent-coordination.md.
 */
const i18nLiteralAudit = process.env.ESLINT_I18N_LITERAL_MODE === 'audit';

const i18nNoLiteralStringRule = i18nLiteralAudit
	? [
			'error',
			{
				mode: 'all',
				'jsx-attributes': {
					exclude: [
						'className',
						'styleName',
						'style',
						'type',
						'key',
						'id',
						'width',
						'height',
						'src',
						'href',
						'name',
						'rel',
						'target',
						'htmlFor',
						'httpEquiv',
						'charSet',
						'crossOrigin',
						'referrerPolicy',
						'acceptCharset',
						'formAction',
						'formMethod',
						'autoComplete',
						'inputMode',
						'data-testid',
						'data-slot',
						'data-state',
						'data-side',
						'data-orientation',
						'data-radix',
					],
				},
				callees: {
					exclude: [
						'^t$',
						'^tc$',
						'^i18n\\.t$',
						'window\\..*',
						'console\\..*',
						'Object\\..*',
						'Array\\..*',
						'Math\\..*',
						'JSON\\..*',
						'toast\\..*',
						'cn',
						'clsx',
						'cva',
						'navigate',
						'setTimeout',
						'setInterval',
						'clearInterval',
						'clearTimeout',
						'addEventListener',
						'removeEventListener',
						'dispatchEvent',
						'new RegExp',
						'new Error',
						'new URL',
						'new Date',
						'require',
						'^describe$',
						'^it$',
						'^test$',
						'^expect',
						'^jest\\.',
						'^vi\\.',
						'^beforeEach$',
						'^afterEach$',
						'^beforeAll$',
						'^afterAll$',
					],
				},
				words: {
					exclude: ['^.$', '^\\s*$', '^https?://', '^#[a-fA-F0-9]{3,8}$', '^[A-Z][A-Z0-9_]*$', '^[0-9!-/:-@[-`{-~]+$'],
				},
				'jsx-components': {
					exclude: ['Trans', 'Route', 'Navigate'],
				},
			},
		]
	: [
			'error',
			{
				mode: 'jsx-only',
				'jsx-attributes': {
					include: [
						'placeholder',
						'title',
						'aria-label',
						'aria-placeholder',
						'aria-roledescription',
						'aria-valuetext',
						'alt',
						'label',
						'description',
					],
				},
				callees: {
					exclude: [
						'^t$',
						'^tc$',
						'^i18n\\.t$',
						'window\\..*',
						'console\\..*',
						'Object\\..*',
						'Array\\..*',
						'Math\\..*',
						'JSON\\..*',
						'toast\\..*',
						'cn',
						'clsx',
						'navigate',
						'setTimeout',
						'setInterval',
						'clearInterval',
						'clearTimeout',
						'addEventListener',
						'removeEventListener',
						'dispatchEvent',
						'new RegExp',
						'new Error',
						'new URL',
						'new Date',
						'require',
					],
				},
				words: {
					exclude: ['^.$', '^\\s*$', '^https?://', '^#[a-fA-F0-9]{3,8}$'],
				},
				'jsx-components': {
					exclude: ['Trans', 'Route', 'Navigate'],
				},
			},
		];

/** Audit-only: non–end-user-prose literals (paths, IDs, LLM template schema). */
const i18nAuditTechnicalSkips = i18nLiteralAudit
	? [
			{
				files: [
					'src/api/ai/templates.ts',
					'src/config/command-palette/**/*.ts',
					'src/core/routes/Routes.tsx',
					'src/constants/constants.ts',
				],
				rules: {
					'i18next/no-literal-string': 'off',
				},
			},
		]
	: [];

export default tseslint.config(
	{ ignores: ['dist'] },
	{
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		files: ['**/*.{ts,tsx}'],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
			i18next,
		},
		rules: {
			...reactHooks.configs.recommended.rules,
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

			// Prevent hardcoded user-visible strings — use t() from react-i18next instead.
			// To opt out of a specific line: // eslint-disable-next-line i18next/no-literal-string
			'i18next/no-literal-string': i18nNoLiteralStringRule,
		},
	},
	...i18nAuditTechnicalSkips,
);
