import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import i18next from 'eslint-plugin-i18next';

/** `jsx-only`: flags string literals on selected JSX props (placeholder, aria-*, alt, …), not every TS string. */
const noLiteralString = [
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
			'i18next/no-literal-string': noLiteralString,
		},
	},
	{
		files: ['**/*.{test,spec}.{ts,tsx}', 'src/tests/**/*.{ts,tsx}'],
		rules: { 'i18next/no-literal-string': 'off' },
	},
	{
		files: ['**/*Demo.{ts,tsx}'],
		rules: { 'i18next/no-literal-string': 'off' },
	},
);
