import { useQuery } from '@tanstack/react-query';
import { MeterApi } from '@/api';
import { Meter } from '@/models/Meter';

/**
 * Resolves a meter with aggregation metadata for window-commitment UI.
 * Features from SelectFeature often only include meter_id; this fetches the full meter when needed.
 */
export function useMeterForCommitment(meterId?: string, meter?: Meter | null) {
	const hasBucketSize = meter?.aggregation?.bucket_size != null;

	const { data: fetchedMeter, isLoading } = useQuery({
		queryKey: ['meter-for-commitment', meterId],
		queryFn: () => MeterApi.getMeterById(meterId!),
		enabled: !!meterId && !hasBucketSize,
		staleTime: 60_000,
	});

	const resolvedMeter = hasBucketSize ? meter : (fetchedMeter ?? meter ?? null);

	return {
		meter: resolvedMeter,
		isLoading: !!meterId && !resolvedMeter && isLoading,
	};
}
