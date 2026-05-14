// src/store/useLocaleStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Locale, Direction } from '@/config/branding';
import { config } from '@/config/config';
import i18n from 'i18next';

const RTL_LOCALES = new Set<Locale>([Locale.Ar, Locale.He, Locale.Fa, Locale.Ur]);

function deriveDirection(locale: Locale): Direction {
	return RTL_LOCALES.has(locale) ? Direction.RTL : Direction.LTR;
}

interface LocaleState {
	locale: Locale;
	direction: Direction;
	allowedLocales: Locale[];
	setLocale: (locale: Locale) => void;
}

export const useLocaleStore = create<LocaleState>()(
	persist(
		(set) => ({
			locale: config.i18n.locale,
			direction: config.i18n.direction,
			allowedLocales: config.allowedLocales,
			setLocale: (locale: Locale) => {
				const direction = deriveDirection(locale);
				document.documentElement.lang = locale;
				document.documentElement.dir = direction;
				i18n.changeLanguage(locale);
				set({ locale, direction });
			},
		}),
		{
			name: 'flexprice_locale',
			partialize: (state) => ({ locale: state.locale }),
			onRehydrateStorage: () => (state) => {
				if (!state) return;
				state.direction = deriveDirection(state.locale);
			},
		},
	),
);
