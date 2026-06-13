import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PriceApi } from '@/api/PriceApi';
import type { Price } from '@/models/Price';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';
import {
	attachCommitmentBucketPrices,
	collectCommitmentBucketPriceIds,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';

async function fetchPricesByIds(priceIds: string[]): Promise<Record<string, Price>> {
	if (priceIds.length === 0) return {};

	const response = await PriceApi.ListPrices({ price_ids: priceIds });
	const pricesById: Record<string, Price> = {};
	for (const price of response.items ?? []) {
		pricesById[price.id] = price;
	}
	return pricesById;
}

/** Resolve commitment bucket `price_id` references to full price records for read-only display. */
export function useCommitmentTimeBucketPrices(buckets: CommitmentTimeBucket[] | undefined) {
	const priceIds = useMemo(() => collectCommitmentBucketPriceIds(buckets ?? []), [buckets]);

	const {
		data: pricesById,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ['commitment-bucket-prices', priceIds],
		queryFn: () => fetchPricesByIds(priceIds),
		enabled: priceIds.length > 0,
		staleTime: 60_000,
	});

	const bucketsWithPrices = useMemo(() => attachCommitmentBucketPrices(buckets ?? [], pricesById ?? {}), [buckets, pricesById]);

	return {
		bucketsWithPrices,
		pricesById: pricesById ?? {},
		isLoading: priceIds.length > 0 && isLoading,
		isError,
	};
}
