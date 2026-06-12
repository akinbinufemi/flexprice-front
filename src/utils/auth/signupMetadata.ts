import { config } from '@/config/config';
import { Metadata } from '@/models/base';
import { detectCurrentRegion } from '@/utils/region/regionUtils';

const SIGNUP_METADATA_KEY = 'flexprice_signup_metadata';

export type SignupMethod = 'email' | 'google';

export function buildSignupMetadata(overrides: { signup_method?: SignupMethod } = {}): Metadata {
	const region = detectCurrentRegion(config.regions.regions);

	return {
		source: window.location.origin,
		signup_url: window.location.href,
		region: region?.key ?? '',
		country_code: region?.countryCode ?? '',
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		locale: navigator.language,
		referrer: document.referrer,
		signup_method: overrides.signup_method ?? 'email',
	};
}

export function persistSignupMetadata(metadata: Metadata): void {
	sessionStorage.setItem(SIGNUP_METADATA_KEY, JSON.stringify(metadata));
}

export function getPersistedSignupMetadata(): Metadata | undefined {
	const raw = sessionStorage.getItem(SIGNUP_METADATA_KEY);
	if (!raw) {
		return undefined;
	}

	try {
		return JSON.parse(raw) as Metadata;
	} catch {
		return undefined;
	}
}
