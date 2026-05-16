import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';

beforeEach(() => {
	vi.resetModules();
	localStorage.clear();
});

vi.mock('i18next', () => ({
	default: { changeLanguage: vi.fn() },
}));

vi.mock('@/config/config', () => ({
	config: {
		i18n: { locale: 'en', direction: 'ltr' },
		allowedLocales: ['en', 'ar'],
	},
}));

async function importStore() {
	const { useLocaleStore } = await import('./useLocaleStore');
	return useLocaleStore;
}

describe('useLocaleStore', () => {
	it('initialises with config default locale', async () => {
		const useLocaleStore = await importStore();
		const state = useLocaleStore.getState();
		expect(state.locale).toBe('en');
		expect(state.direction).toBe('ltr');
	});

	it('setLocale updates locale and direction', async () => {
		const useLocaleStore = await importStore();
		act(() => useLocaleStore.getState().setLocale('ar' as never));
		const state = useLocaleStore.getState();
		expect(state.locale).toBe('ar');
		expect(state.direction).toBe('rtl');
	});

	it('setLocale updates document direction', async () => {
		const useLocaleStore = await importStore();
		act(() => useLocaleStore.getState().setLocale('ar' as never));
		expect(document.documentElement.dir).toBe('rtl');
	});

	it('allowedLocales comes from config', async () => {
		const useLocaleStore = await importStore();
		expect(useLocaleStore.getState().allowedLocales).toEqual(['en', 'ar']);
	});
});
