import { FC, type ReactNode } from 'react';
import { Switch } from '@/components/ui';
import CommitmentTimeBucketsEditor from '@/components/molecules/CommitmentTimeBucketsEditor';
import { useMeterForCommitment } from '@/hooks/useMeterForCommitment';
import { Price } from '@/models/Price';
import { supportsCommitmentTimeBuckets, supportsWindowCommitment } from '@/utils/common/commitment_helpers';
import {
	DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE,
	type SubscriptionChargeCommitmentState,
} from '@/utils/subscription/subscription_line_item_commitment_helpers';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import type { CommitmentTimeBucketDefaults } from '@/utils/common/commitment_time_bucket_draft';
import { bucketDefaultsFromPrice, type BucketPriceSource } from '@/utils/common/commitment_time_bucket_draft';
import { useTranslation } from 'react-i18next';

export type { SubscriptionChargeCommitmentState };
export { DEFAULT_SUBSCRIPTION_CHARGE_COMMITMENT_STATE };

interface Props {
	meterId?: string;
	currency?: string;
	value: SubscriptionChargeCommitmentState;
	onChange: (value: SubscriptionChargeCommitmentState) => void;
	disabled?: boolean;
	/** Defaults for new bucket rows (billing model, amount, tiers, etc.). */
	bucketDefaults?: CommitmentTimeBucketDefaults;
	/** Source price for bucket defaults when `bucketDefaults` is omitted. */
	sourcePrice?: BucketPriceSource;
}

const Notice: FC<{ children: ReactNode }> = ({ children }) => (
	<div className='rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-3 text-sm text-gray-500'>{children}</div>
);

const SubscriptionChargeCommitmentSection: FC<Props> = ({ meterId, currency, value, onChange, disabled, bucketDefaults, sourcePrice }) => {
	const { t } = useTranslation('billing');
	const { meter, isLoading } = useMeterForCommitment(meterId);
	const priceLike = { meter_id: meterId ?? '', meter: meter ?? undefined } as Price;
	const showWindow = supportsWindowCommitment(priceLike);
	const showBuckets = showWindow && value.windowCommitment && supportsCommitmentTimeBuckets(priceLike);
	const currencySymbol = getCurrencySymbol(currency ?? 'usd');
	const resolvedBucketDefaults = bucketDefaults ?? (sourcePrice ? bucketDefaultsFromPrice(sourcePrice) : undefined);

	if (!meterId) {
		return (
			<Notice>
				{t('commitmentConfig.addCharge.selectMeterForBuckets', {
					defaultValue: 'Select a metered feature to configure window commitment time buckets.',
				})}
			</Notice>
		);
	}

	if (isLoading) {
		return <Notice>{t('commitmentConfig.addCharge.loadingMeter', { defaultValue: 'Loading meter details…' })}</Notice>;
	}

	if (!showWindow) {
		return (
			<Notice>
				{t('commitmentConfig.addCharge.meterNotSupported', {
					defaultValue: 'This meter does not support window commitment. Configure a bucket size on the meter first.',
				})}
			</Notice>
		);
	}

	return (
		<div className='space-y-4 border-t border-gray-200 pt-6 min-w-0 overflow-x-hidden'>
			<div className='flex items-center justify-between rounded-lg bg-gray-50 p-4'>
				<div className='flex-1 pr-4'>
					<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.windowCommitment')}</label>
					<p className='mt-0.5 text-xs text-gray-500'>
						{t('commitmentConfig.windowCommitmentHint', { bucketSize: meter?.aggregation?.bucket_size ?? '—' })}
					</p>
				</div>
				<Switch
					checked={value.windowCommitment}
					onCheckedChange={(checked) =>
						onChange({
							...value,
							windowCommitment: checked,
							timeBuckets: checked ? value.timeBuckets : [],
						})
					}
					disabled={disabled}
				/>
			</div>

			{showBuckets && (
				<CommitmentTimeBucketsEditor
					buckets={value.timeBuckets}
					onChange={(timeBuckets) => onChange({ ...value, timeBuckets })}
					bucketSize={meter?.aggregation?.bucket_size}
					disabled={disabled}
					defaultCommitmentType={value.commitmentType}
					currencySymbol={currencySymbol}
					currency={currency}
					bucketDefaults={{
						...resolvedBucketDefaults,
						commitment_type: resolvedBucketDefaults?.commitment_type ?? value.commitmentType,
						commitment_value: resolvedBucketDefaults?.commitment_value,
					}}
				/>
			)}
		</div>
	);
};

export default SubscriptionChargeCommitmentSection;
