// src/config/authTemplates.ts

export enum AUTH_TEMPLATE {
	FLEXPRICE_DEFAULT = 'flexprice_default',
	TEMPLATE_2 = 'template_2',
}

export enum LandingTheme {
	Light = 'light',
	Dark = 'dark',
}

export enum LandingContentAlign {
	Left = 'left',
	Center = 'center',
}

// Template2 — white-label brands (no supportEmail — that lives in BrandConfig)
export interface Template2Config {
	tagline: string | null;
	loginBgImage: string | null;
	landingBgColor: string | null;
	landingLogo: string | null; // separate logo for the right panel (e.g. white logo on a dark bg image); falls back to brand.logo
	showLogoOnLanding: boolean;
}

// FLEXPRICE_DEFAULT has no config — layout is hardcoded in the component
export type AuthPageConfig =
	| { template: AUTH_TEMPLATE.FLEXPRICE_DEFAULT }
	| { template: AUTH_TEMPLATE.TEMPLATE_2; config: Template2Config };

export interface RegionOption {
	key: string;
	label: string;
	url: string;
	countryCode: string;
}

export interface RegionsConfig {
	enabled: boolean;
	regions: RegionOption[];
}
