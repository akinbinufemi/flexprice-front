import { BILLING_PERIOD } from '@/constants/constants';
import { Price } from '@/models/Price';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import { LineItemCommitmentConfig, LineItemCommitmentsMap } from '@/types/dto/LineItemCommitmentConfig';
import { enrichCommitmentTimeBucketsForApi } from '@/utils/common/commitment_helpers';
import { isOneTimePlanPrice } from '@/utils/subscription/planPricesForSubscriptionUi';

/** Filter addon prices to match subscription billing period and currency. */
export function filterAddonPricesForSubscription(prices: Price[] = [], billingPeriod?: BILLING_PERIOD, currency?: string): Price[] {
	let filtered = prices;
	if (currency) {
		filtered = filtered.filter((p) => p.currency?.toLowerCase() === currency.toLowerCase());
	}
	if (billingPeriod) {
		const periodKey = billingPeriod.toUpperCase();
		filtered = filtered.filter((p) => isOneTimePlanPrice(p) || p.billing_period?.toUpperCase() === periodKey);
	}
	return filtered;
}

/** Merge commitment config + time buckets from CommitmentConfigDialog into stored addon state. */
export function buildCommitmentConfigOnSave(
	config: LineItemCommitmentConfig,
	timeBuckets?: CommitmentTimeBucket[],
): LineItemCommitmentConfig {
	const hasBuckets = (timeBuckets?.length ?? 0) > 0;

	if (config.is_window_commitment && hasBuckets) {
		return {
			is_window_commitment: true,
			...(config.commitment_duration ? { commitment_duration: config.commitment_duration } : {}),
			commitment_time_buckets: timeBuckets,
		};
	}

	return {
		...config,
		commitment_time_buckets: timeBuckets?.length ? timeBuckets : undefined,
	};
}

/** Enrich addon line_item_commitments for POST /subscriptions and POST /subscriptions/addon. */
export function sanitizeAddonLineItemCommitmentsForApi(
	commitments: LineItemCommitmentsMap | undefined,
	prices: Price[],
): LineItemCommitmentsMap | undefined {
	if (!commitments || Object.keys(commitments).length === 0) {
		return undefined;
	}

	const pricesById = new Map(prices.map((price) => [price.id, price]));
	const sanitized: LineItemCommitmentsMap = {};

	for (const [priceId, config] of Object.entries(commitments)) {
		const price = pricesById.get(priceId);
		const buckets = config.commitment_time_buckets;
		const hasBuckets = buckets && buckets.length > 0;

		if (config.is_window_commitment && hasBuckets && price) {
			sanitized[priceId] = {
				is_window_commitment: true,
				...(config.commitment_duration ? { commitment_duration: config.commitment_duration } : {}),
				commitment_time_buckets: enrichCommitmentTimeBucketsForApi(buckets, config, price),
			};
		} else {
			sanitized[priceId] = config;
		}
	}

	return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}
