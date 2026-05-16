import { describe, it, expect } from 'vitest';
import { detectCurrentRegion } from './regionUtils';
import { RegionOption } from '@/config/authTemplates';

const regions: RegionOption[] = [
	{ key: 'india', label: 'India', url: 'https://in.flexprice.io', countryCode: 'IN' },
	{ key: 'us', label: 'United States', url: 'https://us.flexprice.io', countryCode: 'US' },
];

describe('detectCurrentRegion', () => {
	it('returns the matching region when origin matches', () => {
		Object.defineProperty(window, 'location', {
			value: { ...window.location, origin: 'https://in.flexprice.io' },
			writable: true,
		});
		const result = detectCurrentRegion(regions);
		expect(result?.key).toBe('india');
	});

	it('returns null when no region URL matches current origin', () => {
		Object.defineProperty(window, 'location', {
			value: { ...window.location, origin: 'http://localhost:3000' },
			writable: true,
		});
		const result = detectCurrentRegion(regions);
		expect(result).toBeNull();
	});

	it('returns null for empty regions array', () => {
		expect(detectCurrentRegion([])).toBeNull();
	});
});
