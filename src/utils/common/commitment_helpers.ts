import { BUCKET_SIZE } from '@/models/Meter';
import { Price } from '@/models/Price';
import { CommitmentType, LineItemCommitmentConfig, LineItemCommitmentsMap } from '@/types/dto/LineItemCommitmentConfig';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import type { CreateSubscriptionLineItemRequest } from '@/types/dto/Subscription';
import type { ExtendedPriceOverride } from './price_override_helpers';

/**
 * Check if a price has commitment configured
 */
export const hasCommitment = (priceId: string, commitments: LineItemCommitmentsMap): boolean => {
	return commitments[priceId] !== undefined;
};

/**
 * Get commitment config for a specific price
 */
export const getCommitmentConfig = (priceId: string, commitments: LineItemCommitmentsMap): LineItemCommitmentConfig | undefined => {
	return commitments[priceId];
};

/**
 * Validate commitment configuration
 * Returns error message if invalid, null if valid
 * Matches backend validation logic: only validates if commitment is configured
 */
export const validateCommitment = (config: Partial<LineItemCommitmentConfig>): string | null => {
	const hasAmountCommitment = config.commitment_amount !== undefined && config.commitment_amount !== null && config.commitment_amount > 0;
	const hasQuantityCommitment =
		config.commitment_quantity !== undefined && config.commitment_quantity !== null && config.commitment_quantity > 0;
	const hasCommitment = hasAmountCommitment || hasQuantityCommitment;

	// No commitment configured, nothing to validate
	if (!hasCommitment) {
		return null;
	}

	// Rule 1: Cannot set both commitment_amount and commitment_quantity
	if (hasAmountCommitment && hasQuantityCommitment) {
		return 'Cannot set both commitment_amount and commitment_quantity';
	}

	// Rule 2: Validate commitment type matches the provided field
	if (config.commitment_type) {
		if (hasAmountCommitment && config.commitment_type !== CommitmentType.AMOUNT) {
			return 'When commitment_amount is set, commitment_type must be "amount"';
		}
		if (hasQuantityCommitment && config.commitment_type !== CommitmentType.QUANTITY) {
			return 'When commitment_quantity is set, commitment_type must be "quantity"';
		}
	}

	// Rule 3: Overage factor is required and must be at least 1.0 when commitment is set
	if (config.overage_factor === undefined || config.overage_factor === null) {
		return 'Overage factor is required when commitment is set';
	}

	if (config.overage_factor < 1) {
		return 'Overage factor must be at least 1.0';
	}

	// Rule 4: Validate commitment values are non-negative
	if (hasAmountCommitment && config.commitment_amount! < 0) {
		return 'Commitment amount must be non-negative';
	}

	if (hasQuantityCommitment && config.commitment_quantity! < 0) {
		return 'Commitment quantity must be non-negative';
	}

	return null;
};

/**
 * Format commitment configuration for display
 */
export const formatCommitmentSummary = (config: LineItemCommitmentConfig): string => {
	const parts: string[] = [];

	// Determine commitment type from the fields if not explicitly set
	const commitmentType =
		config.commitment_type ||
		(config.commitment_amount !== undefined && config.commitment_amount !== null
			? CommitmentType.AMOUNT
			: config.commitment_quantity !== undefined && config.commitment_quantity !== null
				? CommitmentType.QUANTITY
				: null);

	if (commitmentType === CommitmentType.AMOUNT) {
		parts.push(`$${config.commitment_amount?.toLocaleString() || '0'} commitment`);
	} else if (commitmentType === CommitmentType.QUANTITY) {
		parts.push(`${config.commitment_quantity?.toLocaleString() || '0'} units commitment`);
	}

	if (config.overage_factor && config.overage_factor !== 1) {
		parts.push(`${config.overage_factor}x overage`);
	}

	if (config.enable_true_up) {
		parts.push('true-up enabled');
	}

	if (config.is_window_commitment) {
		parts.push('windowed');
	}

	if (config.commitment_duration) {
		parts.push(`${config.commitment_duration.toLowerCase().replace('_', ' ')} period`);
	}

	return parts.join(' • ');
};

const HOUR_BUCKET_SIZES: BUCKET_SIZE[] = [
	BUCKET_SIZE.WindowSizeHour,
	BUCKET_SIZE.WindowSize3Hour,
	BUCKET_SIZE.WindowSize6Hour,
	BUCKET_SIZE.WindowSize12Hour,
];

const MINUTE_BUCKET_SIZES: BUCKET_SIZE[] = [BUCKET_SIZE.WindowSizeMinute, BUCKET_SIZE.WindowSize15Min, BUCKET_SIZE.WindowSize30Min];

/**
 * Check if a price/meter supports window commitment
 * Window commitment is only available for meters with bucket_size configured
 */
export const supportsWindowCommitment = (price: Price): boolean => {
	return price.meter?.aggregation?.bucket_size !== undefined && price.meter?.aggregation?.bucket_size !== null;
};

export const isHourBucketSize = (bucketSize?: BUCKET_SIZE | string | null): boolean => {
	if (!bucketSize) return false;
	return HOUR_BUCKET_SIZES.includes(bucketSize as BUCKET_SIZE);
};

/**
 * Time buckets are only configurable when the meter window size is hours or minutes.
 */
export const supportsCommitmentTimeBuckets = (price: Price): boolean => {
	const bucketSize = price.meter?.aggregation?.bucket_size;
	if (!bucketSize) return false;
	return isHourBucketSize(bucketSize) || MINUTE_BUCKET_SIZES.includes(bucketSize as BUCKET_SIZE);
};

export const normalizeCommitmentTimeBuckets = (buckets: CommitmentTimeBucket[], minutesEnabled: boolean): CommitmentTimeBucket[] =>
	buckets.map((bucket) => ({
		start: {
			hour: bucket.start.hour,
			minute: minutesEnabled ? bucket.start.minute : 0,
		},
		end: {
			hour: bucket.end.hour,
			minute: minutesEnabled ? bucket.end.minute : 0,
		},
	}));

export const timePointToMinutes = (point: { hour: number; minute: number }): number => point.hour * 60 + point.minute;

export const validateCommitmentTimeBuckets = (buckets: CommitmentTimeBucket[]): string | null => {
	for (const { start, end } of buckets) {
		if (start.hour < 0 || start.hour > 23 || end.hour < 0 || end.hour > 23) {
			return 'Hour must be between 0 and 23';
		}
		if (start.minute < 0 || start.minute > 59 || end.minute < 0 || end.minute > 59) {
			return 'Minute must be between 0 and 59';
		}

		const startMinutes = timePointToMinutes(start);
		const endMinutes = timePointToMinutes(end);

		if (startMinutes === endMinutes) {
			return 'Start and end time cannot be the same';
		}
	}
	return null;
};

/**
 * Build inline line_items entries for commitment_time_buckets (not supported on line_item_commitments map).
 */
export const buildCommitmentTimeBucketLineItems = (
	priceOverrides: Record<string, ExtendedPriceOverride>,
): CreateSubscriptionLineItemRequest[] =>
	Object.entries(priceOverrides)
		.filter(([, override]) => override.commitment_time_buckets && override.commitment_time_buckets.length > 0)
		.map(([priceId, override]) => ({
			price_id: priceId,
			commitment_windowed: override.commitment?.is_window_commitment ?? true,
			commitment_time_buckets: override.commitment_time_buckets,
		}));

/** Merge manually added line items with time-bucket line items, keyed by price_id. */
export const mergeCreateSubscriptionLineItems = (
	addedItems: CreateSubscriptionLineItemRequest[],
	timeBucketItems: CreateSubscriptionLineItemRequest[],
): CreateSubscriptionLineItemRequest[] => {
	const merged = [...addedItems];
	for (const timeBucketItem of timeBucketItems) {
		if (!timeBucketItem.price_id) {
			merged.push(timeBucketItem);
			continue;
		}
		const existingIndex = merged.findIndex((item) => item.price_id === timeBucketItem.price_id);
		if (existingIndex >= 0) {
			merged[existingIndex] = { ...merged[existingIndex], ...timeBucketItem };
		} else {
			merged.push(timeBucketItem);
		}
	}
	return merged;
};

/**
 * Extract line item commitments from price overrides
 * Converts the frontend ExtendedPriceOverride format to backend LineItemCommitmentsMap
 */
export const extractLineItemCommitments = (
	priceOverrides: Record<string, { commitment?: LineItemCommitmentConfig }>,
): LineItemCommitmentsMap => {
	const commitments: LineItemCommitmentsMap = {};

	Object.entries(priceOverrides).forEach(([priceId, override]) => {
		if (override.commitment) {
			commitments[priceId] = override.commitment;
		}
	});

	return commitments;
};

/**
 * Merge line item commitments into price overrides
 * Used when loading existing subscription data
 */
export const mergeCommitmentsIntoOverrides = (
	priceOverrides: Record<string, any>,
	commitments: LineItemCommitmentsMap,
): Record<string, any> => {
	const merged = { ...priceOverrides };

	Object.entries(commitments).forEach(([priceId, commitment]) => {
		if (merged[priceId]) {
			merged[priceId] = {
				...merged[priceId],
				commitment,
			};
		} else {
			merged[priceId] = {
				price_id: priceId,
				commitment,
			};
		}
	});

	return merged;
};
