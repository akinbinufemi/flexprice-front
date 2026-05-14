// src/config/branding.ts
import {
	AUTH_TEMPLATE,
	AuthPageConfig,
	LandingContentAlign,
	LandingTheme,
	RegionOption,
	RegionsConfig,
	Template1Config,
} from './authTemplates';

// Re-export for backward compat — all existing imports from branding.ts continue to work
export { AUTH_TEMPLATE, LandingTheme, LandingContentAlign };
export type { AuthPageConfig, Template1Config, RegionOption, RegionsConfig };

export enum Locale {
	En = 'en',
	Ar = 'ar',
	He = 'he',
	Fa = 'fa',
	Ur = 'ur',
}

export enum Direction {
	LTR = 'ltr',
	RTL = 'rtl',
}

export interface BrandConfig {
	name: string;
	logo: string;
	primaryColor: string;
	favicon: string;
}

export interface I18nConfig {
	locale: Locale;
	direction: Direction;
}

export const SUPPORTED_LOCALES: Locale[] = [Locale.En, Locale.Ar];

const RTL_LOCALES = new Set<Locale>([Locale.Ar, Locale.He, Locale.Fa, Locale.Ur]);

const DEFAULT_SLACK_URL = 'https://join.slack.com/t/flexpricecommunity/shared_invite/zt-39uat51l0-n8JmSikHZP~bHJNXladeaQ';

export function parseBrandConfig(): BrandConfig {
	try {
		const raw = JSON.parse(import.meta.env.VITE_BRAND_CONFIG ?? '{}');
		return {
			name: raw.name ?? 'Flexprice',
			logo: raw.logo ?? '/comicon.png',
			primaryColor: raw.primaryColor ?? '#7C3AED',
			favicon: raw.favicon ?? '/favicon.ico',
		};
	} catch {
		return { name: 'Flexprice', logo: '/comicon.png', primaryColor: '#7C3AED', favicon: '/favicon.ico' };
	}
}

export function parseAuthPageConfig(): AuthPageConfig {
	try {
		const raw = JSON.parse(import.meta.env.VITE_AUTH_CONFIG ?? '{}');
		const template = (Object.values(AUTH_TEMPLATE) as string[]).includes(raw.template)
			? (raw.template as AUTH_TEMPLATE)
			: AUTH_TEMPLATE.TEMPLATE_1;

		if (template === AUTH_TEMPLATE.TEMPLATE_2) {
			return {
				template: AUTH_TEMPLATE.TEMPLATE_2,
				config: {
					tagline: 'tagline' in raw ? raw.tagline : null,
					supportEmail: raw.supportEmail ?? 'support@flexprice.io',
					loginBgImage: 'loginBgImage' in raw ? raw.loginBgImage : null,
					landingBgColor: raw.landingBgColor ?? null,
					showLogoOnLanding: raw.showLogoOnLanding ?? false,
				},
			};
		}

		return {
			template: AUTH_TEMPLATE.TEMPLATE_1,
			config: {
				tagline: 'tagline' in raw ? raw.tagline : null,
				supportEmail: raw.supportEmail ?? 'support@flexprice.io',
				loginBgImage: 'loginBgImage' in raw ? raw.loginBgImage : null,
				slackCommunityUrl: 'slackCommunityUrl' in raw ? raw.slackCommunityUrl : DEFAULT_SLACK_URL,
				showTestimonials: raw.showTestimonials ?? true,
				landingTheme: (Object.values(LandingTheme) as string[]).includes(raw.landingTheme)
					? (raw.landingTheme as LandingTheme)
					: LandingTheme.Light,
				landingContentAlign: (Object.values(LandingContentAlign) as string[]).includes(raw.landingContentAlign)
					? (raw.landingContentAlign as LandingContentAlign)
					: LandingContentAlign.Center,
				showLogoOnLanding: raw.showLogoOnLanding ?? false,
			},
		};
	} catch {
		return {
			template: AUTH_TEMPLATE.TEMPLATE_1,
			config: {
				tagline: null,
				supportEmail: 'support@flexprice.io',
				loginBgImage: null,
				slackCommunityUrl: DEFAULT_SLACK_URL,
				showTestimonials: true,
				landingTheme: LandingTheme.Light,
				landingContentAlign: LandingContentAlign.Center,
				showLogoOnLanding: false,
			},
		};
	}
}

export function parseRegionsConfig(): RegionsConfig {
	try {
		const raw = JSON.parse(import.meta.env.VITE_AUTH_CONFIG ?? '{}');
		if (Array.isArray(raw.regions?.regions) && raw.regions.regions.length > 0) {
			return {
				enabled: raw.regions.enabled ?? true,
				regions: raw.regions.regions as RegionOption[],
			};
		}
	} catch {
		// fall through to legacy
	}

	// Backward-compat: build RegionOption[] from old env vars
	const regions: RegionOption[] = [];
	if (import.meta.env.VITE_DASHBOARD_URL_INDIA) {
		regions.push({ key: 'india', label: 'India', url: import.meta.env.VITE_DASHBOARD_URL_INDIA, countryCode: 'IN' });
	}
	if (import.meta.env.VITE_DASHBOARD_URL_US) {
		regions.push({ key: 'us', label: 'United States', url: import.meta.env.VITE_DASHBOARD_URL_US, countryCode: 'US' });
	}
	return {
		enabled: import.meta.env.VITE_DATA_REGION_SELECTION_ENABLED === 'true' && regions.length > 0,
		regions,
	};
}

export function parseAllowedLocales(): Locale[] {
	try {
		const raw = JSON.parse(import.meta.env.VITE_AUTH_CONFIG ?? '{}');
		if (Array.isArray(raw.allowedLocales) && raw.allowedLocales.length > 0) {
			return raw.allowedLocales.filter((l: string): l is Locale => (Object.values(Locale) as string[]).includes(l));
		}
	} catch {
		// fall through
	}
	return SUPPORTED_LOCALES;
}

export function parseI18nConfig(): I18nConfig {
	const rawLocale = import.meta.env.VITE_DEFAULT_LOCALE ?? Locale.En;
	const locale = (Object.values(Locale) as string[]).includes(rawLocale) ? (rawLocale as Locale) : Locale.En;
	return { locale, direction: RTL_LOCALES.has(locale) ? Direction.RTL : Direction.LTR };
}

export const brandConfig: BrandConfig = parseBrandConfig();
export const authPageConfig: AuthPageConfig = parseAuthPageConfig();
export const regionsConfig: RegionsConfig = parseRegionsConfig();
export const allowedLocalesConfig: Locale[] = parseAllowedLocales();
export const i18nConfig: I18nConfig = parseI18nConfig();

/** Returns the app's active brand config. Not a React hook — safe to call anywhere. */
export function useBrand(): BrandConfig {
	return brandConfig;
}

/** Injects --brand-primary CSS var and swaps the favicon. Call once before first render. */
export function initBranding(): void {
	document.documentElement.style.setProperty('--brand-primary', brandConfig.primaryColor);
	const faviconEl = document.getElementById('app-favicon') as HTMLLinkElement | null;
	if (faviconEl) {
		faviconEl.href = brandConfig.favicon;
	}
}
