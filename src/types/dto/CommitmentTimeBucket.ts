import type { SubscriptionPriceCreateRequest } from './Subscription';

export interface CommitmentTimePoint {
	hour: number;
	minute: number;
}

/** Inline price on a commitment time bucket (currency is set from subscription when omitted). */
export type CommitmentTimeBucketPrice = SubscriptionPriceCreateRequest & {
	currency?: string;
};

export interface CommitmentTimeBucket {
	/** Present on persisted buckets; omit when creating a new bucket or replacing bucket price. */
	id?: string;
	start: CommitmentTimePoint;
	end: CommitmentTimePoint;
	/** Reference to subscription-scoped bucket price when inline `price` is omitted in list responses. */
	price_id?: string;
	/** Subscription-scoped price applied within this time window. */
	price?: CommitmentTimeBucketPrice;
	commitment_type?: string;
	commitment_value?: string;
	overage_factor?: string;
	true_up_enabled?: boolean;
}
