import { describe, it, expect } from 'vitest';
import { getFlagComponent } from './flagMap';

describe('getFlagComponent', () => {
	it('returns a component for a known country code', () => {
		const Component = getFlagComponent('IN');
		expect(Component).not.toBeNull();
	});

	it('is case-insensitive', () => {
		const upper = getFlagComponent('US');
		const lower = getFlagComponent('us');
		expect(upper).not.toBeNull();
		expect(upper).toBe(lower);
	});

	it('returns null for unknown country code', () => {
		expect(getFlagComponent('ZZ')).toBeNull();
	});
});
