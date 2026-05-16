import { describe, it, expect } from 'vitest';
import {
	parseBrandConfig,
	parseAuthPageConfig,
	parseRegionsConfig,
	parseAllowedLocales,
	parseI18nConfig,
	SUPPORTED_LOCALES,
} from './branding';

const noLegacy = { indiaUrl: undefined, usUrl: undefined, selectionEnabled: false };

describe('parseBrandConfig', () => {
	it('returns Flexprice defaults with empty raw', () => {
		const result = parseBrandConfig({});
		expect(result.name).toBe('Flexprice');
		expect(result.logo).toBe('/comicon.png');
		expect(result.primaryColor).toBe('#7C3AED');
		expect(result.favicon).toBe('/favicon.ico');
		expect(result.supportEmail).toBe('support@flexprice.io');
	});

	it('applies overrides from raw data', () => {
		const result = parseBrandConfig({ name: 'Tirdad', primaryColor: '#0d1b2a', supportEmail: 'hi@tirdad.com' });
		expect(result.name).toBe('Tirdad');
		expect(result.primaryColor).toBe('#0d1b2a');
		expect(result.supportEmail).toBe('hi@tirdad.com');
		expect(result.logo).toBe('/comicon.png');
	});

	it('ignores non-string values and falls back to defaults', () => {
		const result = parseBrandConfig({ name: 42, logo: null });
		expect(result.name).toBe('Flexprice');
		expect(result.logo).toBe('/comicon.png');
	});
});

describe('parseAuthPageConfig', () => {
	it('defaults to flexprice_default when template is absent', () => {
		const result = parseAuthPageConfig({});
		expect(result.template).toBe('flexprice_default');
		expect('config' in result).toBe(false);
	});

	it('treats template_1 as flexprice_default for backward compat', () => {
		const result = parseAuthPageConfig({ template: 'template_1' });
		expect(result.template).toBe('flexprice_default');
	});

	it('treats unknown template as flexprice_default', () => {
		const result = parseAuthPageConfig({ template: 'template_99' });
		expect(result.template).toBe('flexprice_default');
	});

	it('returns template_2 shape with config', () => {
		const result = parseAuthPageConfig({ template: 'template_2', tagline: 'hello', landingLogo: 'https://example.com/logo.png' });
		expect(result.template).toBe('template_2');
		if (result.template === 'template_2') {
			expect(result.config.tagline).toBe('hello');
			expect(result.config.landingLogo).toBe('https://example.com/logo.png');
			expect(result.config.loginBgImage).toBeNull();
		}
	});

	it('template_2 fields default to null when absent', () => {
		const result = parseAuthPageConfig({ template: 'template_2' });
		if (result.template === 'template_2') {
			expect(result.config.tagline).toBeNull();
			expect(result.config.landingLogo).toBeNull();
			expect(result.config.loginBgImage).toBeNull();
		}
	});
});

describe('parseRegionsConfig', () => {
	it('returns disabled with empty data', () => {
		const result = parseRegionsConfig({}, noLegacy);
		expect(result.enabled).toBe(false);
		expect(result.regions).toHaveLength(0);
	});

	it('uses authRaw regions when configured', () => {
		const result = parseRegionsConfig(
			{
				regions: {
					enabled: true,
					regions: [{ key: 'sa', label: 'Saudi Arabia', url: 'https://sa.brand.com', countryCode: 'SA' }],
				},
			},
			noLegacy,
		);
		expect(result.enabled).toBe(true);
		expect(result.regions).toHaveLength(1);
		expect(result.regions[0].countryCode).toBe('SA');
	});

	it('filters out invalid region entries', () => {
		const result = parseRegionsConfig(
			{
				regions: {
					enabled: true,
					regions: [
						{ key: 'sa', label: 'Saudi Arabia', url: 'https://sa.brand.com', countryCode: 'SA' },
						{ key: 'bad' }, // missing required fields
					],
				},
			},
			noLegacy,
		);
		expect(result.regions).toHaveLength(1);
	});

	it('falls back to legacy envs when authRaw has no regions', () => {
		const result = parseRegionsConfig(
			{},
			{
				indiaUrl: 'https://in.flexprice.io',
				usUrl: 'https://us.flexprice.io',
				selectionEnabled: true,
			},
		);
		expect(result.enabled).toBe(true);
		expect(result.regions).toHaveLength(2);
		expect(result.regions.find((r) => r.key === 'india')?.countryCode).toBe('IN');
		expect(result.regions.find((r) => r.key === 'us')?.countryCode).toBe('US');
	});

	it('legacy is disabled when selectionEnabled is false', () => {
		const result = parseRegionsConfig(
			{},
			{
				indiaUrl: 'https://in.flexprice.io',
				selectionEnabled: false,
			},
		);
		expect(result.enabled).toBe(false);
		expect(result.regions).toHaveLength(0);
	});
});

describe('parseAllowedLocales', () => {
	it('returns SUPPORTED_LOCALES when allowedLocales absent', () => {
		expect(parseAllowedLocales({})).toEqual(SUPPORTED_LOCALES);
	});

	it('returns configured subset', () => {
		expect(parseAllowedLocales({ allowedLocales: ['en'] })).toEqual(['en']);
	});

	it('filters out invalid locale values', () => {
		expect(parseAllowedLocales({ allowedLocales: ['en', 'zz'] })).toEqual(['en']);
	});

	it('falls back to SUPPORTED_LOCALES when all values invalid', () => {
		expect(parseAllowedLocales({ allowedLocales: ['zz', 'xx'] })).toEqual(SUPPORTED_LOCALES);
	});
});

describe('parseI18nConfig', () => {
	it('defaults to en/ltr when locale absent', () => {
		const result = parseI18nConfig();
		expect(result.locale).toBe('en');
		expect(result.direction).toBe('ltr');
	});

	it('returns rtl for Arabic locale', () => {
		const result = parseI18nConfig('ar');
		expect(result.locale).toBe('ar');
		expect(result.direction).toBe('rtl');
	});

	it('falls back to en for unknown locale', () => {
		const result = parseI18nConfig('zz');
		expect(result.locale).toBe('en');
	});
});

describe('config object', () => {
	it('config module exports a config object with required fields', async () => {
		const { config } = await import('./config');
		expect(config.brand).toBeDefined();
		expect(config.brand.supportEmail).toBe('support@flexprice.io');
		expect(config.authPage).toBeDefined();
		expect(config.authPage.template).toBe('flexprice_default');
		expect(config.i18n).toBeDefined();
		expect(config.regions).toBeDefined();
		expect(Array.isArray(config.allowedLocales)).toBe(true);
	});
});
