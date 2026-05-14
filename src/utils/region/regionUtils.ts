// src/utils/region/regionUtils.ts
import { RegionOption } from '@/config/authTemplates';

// Keep legacy types/functions for backward compat — not used by RegionSelector anymore
import { config } from '@/config/config';
import { Region } from '@/types/enums/Region';

export interface DashboardUrls {
	india: string | undefined;
	us: string | undefined;
}

/** @deprecated Use detectCurrentRegion(regions) with config.regions.regions */
export const getDashboardUrls = (): DashboardUrls => ({
	india: config.region.indiaUrl || undefined,
	us: config.region.usUrl || undefined,
});

/** @deprecated Use switchRegion(region) */
export const getRegionDashboardUrl = (region: Region): string | null => {
	const urls = getDashboardUrls();
	if (region === Region.INDIA) return urls.india || null;
	if (region === Region.US) return urls.us || null;
	return null;
};

/**
 * Finds the region whose URL origin matches window.location.origin.
 * Returns null if no match.
 */
export const detectCurrentRegion = (regions: RegionOption[]): RegionOption | null => {
	const currentOrigin = window.location.origin;
	return (
		regions.find((r) => {
			try {
				return new URL(r.url).origin === currentOrigin;
			} catch {
				return false;
			}
		}) ?? null
	);
};

/**
 * Navigates to the region's dashboard URL, preserving current pathname + search.
 */
export const switchRegion = (region: RegionOption): void => {
	const currentPath = window.location.pathname;
	const currentSearch = window.location.search;
	window.location.replace(`${region.url}${currentPath}${currentSearch}`);
};
