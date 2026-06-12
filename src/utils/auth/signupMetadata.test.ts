import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildSignupMetadata, persistSignupMetadata, getPersistedSignupMetadata } from './signupMetadata';

vi.mock('@/config/config', () => ({
	config: {
		regions: {
			regions: [{ key: 'india', label: 'India', url: 'https://in.flexprice.io', countryCode: 'IN' }],
		},
	},
}));

describe('signupMetadata', () => {
	beforeEach(() => {
		sessionStorage.clear();
		Object.defineProperty(window, 'location', {
			value: {
				origin: 'https://in.flexprice.io',
				href: 'https://in.flexprice.io/auth?utm_source=test',
			},
			writable: true,
		});
		Object.defineProperty(document, 'referrer', {
			value: 'https://google.com',
			writable: true,
		});
		vi.stubGlobal('navigator', { language: 'en-IN' });
	});

	it('builds signup metadata with region and browser context', () => {
		const metadata = buildSignupMetadata({ signup_method: 'google' });

		expect(metadata).toEqual({
			source: 'https://in.flexprice.io',
			signup_url: 'https://in.flexprice.io/auth?utm_source=test',
			region: 'india',
			country_code: 'IN',
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			locale: 'en-IN',
			referrer: 'https://google.com',
			signup_method: 'google',
		});
	});

	it('persists and retrieves signup metadata from sessionStorage', () => {
		const metadata = buildSignupMetadata({ signup_method: 'email' });
		persistSignupMetadata(metadata);

		expect(getPersistedSignupMetadata()).toEqual(metadata);
	});
});
