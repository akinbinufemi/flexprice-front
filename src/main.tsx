import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import PosthogProvider from './core/services/posthog/PosthogProvider.tsx';
import SentryProvider from './core/services/sentry/SentryProvider.tsx';
import VercelSpeedInsights from './core/services/vercel/vercel.tsx';
import { config, initTypography } from './config/config.ts';
import { registerWebMCPTools } from './agent/webmcp.ts';
import { initBranding } from './config/branding.ts';
import { initI18n } from './i18n/index.ts';
import { DirectionProvider } from '@radix-ui/react-direction';
import { useLocaleStore } from './store/useLocaleStore.ts';
import React from 'react';

registerWebMCPTools();

// Reads direction from Zustand store — subscribes so Radix primitives re-render on locale change
function DirectionWrapper({ children }: { children: React.ReactNode }) {
	const direction = useLocaleStore((s) => s.direction);
	return <DirectionProvider dir={direction}>{children}</DirectionProvider>;
}

(async () => {
	initBranding();
	initTypography();

	// Use persisted locale (from localStorage via Zustand) rather than the config default
	const { locale, direction } = useLocaleStore.getState();

	try {
		await initI18n(locale, direction);
	} catch (err) {
		console.error('[main] i18n initialization failed, rendering without translations:', err);
	}

	ReactDOM.createRoot(document.getElementById('root')!).render(
		<div>
			{config.app.isProd ? (
				<SentryProvider>
					<PosthogProvider>
						<DirectionWrapper>
							<App />
						</DirectionWrapper>
						<VercelSpeedInsights />
					</PosthogProvider>
				</SentryProvider>
			) : (
				<DirectionWrapper>
					<App />
				</DirectionWrapper>
			)}
		</div>,
	);
})();
