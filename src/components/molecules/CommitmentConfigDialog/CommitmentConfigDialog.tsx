import { FC, useState, useEffect, useMemo } from 'react';
import { Dialog, Button, Input, Select } from '@/components/atoms';
import { Switch } from '@/components/ui';
import { Price } from '@/models/Price';
import { LineItemCommitmentConfig, CommitmentType } from '@/types/dto/LineItemCommitmentConfig';
import {
	validateCommitment,
	supportsWindowCommitment,
	supportsCommitmentTimeBuckets,
	isHourBucketSize,
	normalizeCommitmentTimeBuckets,
	validateCommitmentTimeBuckets,
} from '@/utils/common/commitment_helpers';
import { removeFormatting } from '@/components/atoms/Input/Input';
import { getCurrencySymbol } from '@/utils/common/helper_functions';
import { BILLING_PERIOD } from '@/constants/constants';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import CommitmentTimeBucketsEditor from '@/components/molecules/CommitmentTimeBucketsEditor';
import { isTimeBucketDraftComplete, type CommitmentTimeBucketDraft } from '@/utils/common/commitment_time_bucket_draft';
import type { CommitmentTimeBucket } from '@/types/dto/CommitmentTimeBucket';

interface CommitmentConfigDialogProps {
	isOpen: boolean;
	onOpenChange: (isOpen: boolean) => void;
	price: Price;
	onSave: (priceId: string, config: LineItemCommitmentConfig | null, timeBuckets?: CommitmentTimeBucket[]) => void;
	currentConfig: LineItemCommitmentConfig | undefined;
	currentTimeBuckets?: CommitmentTimeBucket[];
	billingPeriod?: BILLING_PERIOD;
}

function mapCommitmentValidationError(raw: string, t: TFunction<'billing'>): string {
	const table: Record<string, string> = {
		'Cannot set both commitment_amount and commitment_quantity': t('commitmentConfig.errors.bothAmountAndQuantity'),
		'When commitment_amount is set, commitment_type must be "amount"': t('commitmentConfig.errors.typeMismatchAmount'),
		'When commitment_quantity is set, commitment_type must be "quantity"': t('commitmentConfig.errors.typeMismatchQuantity'),
		'Overage factor is required when commitment is set': t('commitmentConfig.errors.overageRequired'),
		'Overage factor must be at least 1.0': t('commitmentConfig.errors.overageGtOne'),
		'Commitment amount must be non-negative': t('commitmentConfig.errors.amountNonNegative'),
		'Commitment quantity must be non-negative': t('commitmentConfig.errors.quantityNonNegative'),
		'Hour must be between 0 and 23': t('commitmentConfig.errors.hourRange'),
		'Minute must be between 0 and 59': t('commitmentConfig.errors.minuteRange'),
		'Start and end time cannot be the same': t('commitmentConfig.timeBuckets.errors.sameTime'),
		'Please select start and end times for all time buckets': t('commitmentConfig.timeBuckets.errors.incomplete'),
	};
	return table[raw] ?? raw;
}

type CommitmentValidationTarget = 'amountField' | 'quantityField' | 'overageField' | 'bothFields' | 'banner';

/** Maps raw `validateCommitment` messages (stable English) to which inputs should surface the error */
function classifyCommitmentValidation(raw: string): CommitmentValidationTarget {
	if (/^Overage factor/i.test(raw)) return 'overageField';
	if (/^Cannot set both/i.test(raw)) return 'bothFields';
	if (/When commitment_quantity is set/i.test(raw) || /^Commitment quantity/i.test(raw)) return 'quantityField';
	if (/When commitment_amount is set/i.test(raw) || /^Commitment amount/i.test(raw)) return 'amountField';
	return 'banner';
}

const CommitmentConfigDialog: FC<CommitmentConfigDialogProps> = ({
	isOpen,
	onOpenChange,
	price,
	onSave,
	currentConfig,
	currentTimeBuckets,
	billingPeriod,
}) => {
	const { t } = useTranslation('billing');
	const [commitmentType, setCommitmentType] = useState<CommitmentType>(CommitmentType.AMOUNT);
	const [commitmentAmount, setCommitmentAmount] = useState<string>('');
	const [commitmentQuantity, setCommitmentQuantity] = useState<string>('');
	const [overageFactor, setOverageFactor] = useState<string>('1.0');
	const [enableTrueUp, setEnableTrueUp] = useState<boolean>(false);
	const [isWindowCommitment, setIsWindowCommitment] = useState<boolean>(() => supportsWindowCommitment(price));
	const [commitmentDuration, setCommitmentDuration] = useState<string>(billingPeriod?.toUpperCase() || '');
	const [timeBuckets, setTimeBuckets] = useState<CommitmentTimeBucketDraft[]>([]);
	const [validationError, setValidationError] = useState<string | null>(null);
	const [commitmentErrorTarget, setCommitmentErrorTarget] = useState<CommitmentValidationTarget | null>(null);

	const commitmentTypeOptions = useMemo(
		() => [
			{
				label: t('commitmentConfig.typeAmount'),
				value: CommitmentType.AMOUNT,
				description: t('commitmentConfig.typeAmountDescription'),
			},
			{
				label: t('commitmentConfig.typeQuantity'),
				value: CommitmentType.QUANTITY,
				description: t('commitmentConfig.typeQuantityDescription'),
			},
		],
		[t],
	);

	const commitmentDurationOptions = useMemo(
		() => [
			{ label: t('commitmentConfig.billingPeriodLabels.MONTHLY'), value: BILLING_PERIOD.MONTHLY },
			{ label: t('commitmentConfig.billingPeriodLabels.QUARTERLY'), value: BILLING_PERIOD.QUARTERLY },
			{ label: t('commitmentConfig.billingPeriodLabels.HALF_YEARLY'), value: BILLING_PERIOD.HALF_YEARLY },
			{ label: t('commitmentConfig.billingPeriodLabels.ANNUAL'), value: BILLING_PERIOD.ANNUAL },
		],
		[t],
	);

	const currencySymbol = getCurrencySymbol(price.currency);
	const meterDisplayName = price.meter?.name || price.display_name || t('commitmentConfig.thisChargeFallback');
	const showWindowCommitment = supportsWindowCommitment(price);
	const showTimeBuckets = showWindowCommitment && supportsCommitmentTimeBuckets(price);
	const minutesEnabled = !isHourBucketSize(price.meter?.aggregation?.bucket_size);

	useEffect(() => {
		if (currentConfig) {
			const type =
				currentConfig.commitment_type ||
				(currentConfig.commitment_amount !== undefined && currentConfig.commitment_amount !== null
					? CommitmentType.AMOUNT
					: currentConfig.commitment_quantity !== undefined && currentConfig.commitment_quantity !== null
						? CommitmentType.QUANTITY
						: CommitmentType.AMOUNT);
			setCommitmentType(type);
			setCommitmentAmount(currentConfig.commitment_amount?.toString() || '');
			setCommitmentQuantity(currentConfig.commitment_quantity?.toString() || '');
			setOverageFactor(currentConfig.overage_factor?.toString() || '1.0');
			setEnableTrueUp(currentConfig.enable_true_up ?? false);
			setIsWindowCommitment(currentConfig.is_window_commitment ?? showWindowCommitment);
			setCommitmentDuration(currentConfig.commitment_duration || billingPeriod?.toUpperCase() || '');
			setTimeBuckets(currentTimeBuckets ?? []);
		} else {
			setCommitmentType(CommitmentType.AMOUNT);
			setCommitmentAmount('');
			setCommitmentQuantity('');
			setOverageFactor('1.0');
			setEnableTrueUp(false);
			setIsWindowCommitment(showWindowCommitment);
			setCommitmentDuration(billingPeriod?.toUpperCase() || '');
			setTimeBuckets([]);
		}
		setValidationError(null);
		setCommitmentErrorTarget(null);
	}, [currentConfig, currentTimeBuckets, isOpen, showWindowCommitment, billingPeriod]);

	const handleSave = () => {
		const config: Partial<LineItemCommitmentConfig> = {
			commitment_type: commitmentType,
			overage_factor: parseFloat(overageFactor) || 1.0,
			enable_true_up: enableTrueUp,
			is_window_commitment: isWindowCommitment,
			commitment_duration: commitmentDuration ? (commitmentDuration as BILLING_PERIOD) : undefined,
		};

		if (commitmentType === CommitmentType.AMOUNT) {
			config.commitment_amount = commitmentAmount ? parseFloat(removeFormatting(commitmentAmount)) : undefined;
		} else {
			config.commitment_quantity = commitmentQuantity ? parseInt(commitmentQuantity, 10) : undefined;
		}

		const rawError = validateCommitment(config);
		if (rawError) {
			setCommitmentErrorTarget(classifyCommitmentValidation(rawError));
			setValidationError(mapCommitmentValidationError(rawError, t));
			return;
		}

		let normalizedTimeBuckets: CommitmentTimeBucket[] | undefined;
		if (showTimeBuckets && isWindowCommitment) {
			if (timeBuckets.length > 0) {
				const incompleteBucket = timeBuckets.some((bucket) => !isTimeBucketDraftComplete(bucket, minutesEnabled));
				if (incompleteBucket) {
					setCommitmentErrorTarget('banner');
					setValidationError(mapCommitmentValidationError('Please select start and end times for all time buckets', t));
					return;
				}

				normalizedTimeBuckets = normalizeCommitmentTimeBuckets(timeBuckets, minutesEnabled);
				const timeBucketError = validateCommitmentTimeBuckets(normalizedTimeBuckets);
				if (timeBucketError) {
					setCommitmentErrorTarget('banner');
					setValidationError(mapCommitmentValidationError(timeBucketError, t));
					return;
				}
			} else {
				normalizedTimeBuckets = [];
			}
		}

		setCommitmentErrorTarget(null);
		onSave(price.id, config as LineItemCommitmentConfig, normalizedTimeBuckets);
		onOpenChange(false);
	};

	const handleClear = () => {
		onSave(price.id, null);
		onOpenChange(false);
	};

	const handleCancel = () => {
		setValidationError(null);
		setCommitmentErrorTarget(null);
		onOpenChange(false);
	};

	const hasExistingConfig = currentConfig !== undefined;

	return (
		<Dialog
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('commitmentConfig.title')}
			description={t('commitmentConfig.description', { name: meterDisplayName })}
			className='w-auto min-w-[36rem] max-w-[42rem]'>
			<div className='space-y-6'>
				<div className='space-y-3'>
					<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.commitmentType')}</label>
					<div className='flex gap-2'>
						{commitmentTypeOptions.map((option) => (
							<button
								key={option.value}
								type='button'
								onClick={() => {
									setCommitmentType(option.value);
									setValidationError(null);
									setCommitmentErrorTarget(null);
								}}
								className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
									commitmentType === option.value
										? 'border-primary bg-primary/5 text-primary font-medium'
										: 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
								}`}>
								<div className='text-sm font-medium'>{option.label}</div>
								<div className='text-xs text-gray-500 mt-0.5'>{option.description}</div>
							</button>
						))}
					</div>
				</div>

				{commitmentType === CommitmentType.AMOUNT && (
					<div className='grid grid-cols-2 gap-4 items-start'>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-gray-700'>
								{t('commitmentConfig.commitmentAmount', { currency: price.currency })}
							</label>
							<Input
								type='formatted-number'
								value={commitmentAmount}
								onChange={(value) => {
									setCommitmentAmount(value);
									setValidationError(null);
									setCommitmentErrorTarget(null);
								}}
								placeholder={t('commitmentConfig.commitmentAmountPlaceholder')}
								suffix={currencySymbol}
								className='w-full'
								error={
									commitmentErrorTarget && (commitmentErrorTarget === 'amountField' || commitmentErrorTarget === 'bothFields')
										? (validationError ?? undefined)
										: undefined
								}
							/>
							<p className='text-xs text-gray-500'>{t('commitmentConfig.commitmentAmountHint')}</p>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.commitmentPeriod')}</label>
							<Select
								value={commitmentDuration}
								options={commitmentDurationOptions}
								onChange={(value) => {
									setCommitmentDuration(value);
									setValidationError(null);
									setCommitmentErrorTarget(null);
								}}
								placeholder={t('commitmentConfig.sameAsBillingPlaceholder')}
							/>
							<p className='text-xs text-gray-500'>{t('commitmentConfig.commitmentPeriodHint')}</p>
						</div>
					</div>
				)}

				{commitmentType === CommitmentType.QUANTITY && (
					<div className='grid grid-cols-2 gap-4 items-start'>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.commitmentQuantity')}</label>
							<Input
								type='number'
								value={commitmentQuantity}
								onChange={(value) => {
									setCommitmentQuantity(value);
									setValidationError(null);
									setCommitmentErrorTarget(null);
								}}
								placeholder={t('commitmentConfig.commitmentQuantityPlaceholder')}
								className='w-full'
								error={
									commitmentErrorTarget && (commitmentErrorTarget === 'quantityField' || commitmentErrorTarget === 'bothFields')
										? (validationError ?? undefined)
										: undefined
								}
							/>
							<p className='text-xs text-gray-500'>{t('commitmentConfig.commitmentQuantityHint')}</p>
						</div>
						<div className='space-y-1'>
							<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.commitmentPeriod')}</label>
							<Select
								value={commitmentDuration}
								options={commitmentDurationOptions}
								onChange={(value) => {
									setCommitmentDuration(value);
									setValidationError(null);
									setCommitmentErrorTarget(null);
								}}
								placeholder={t('commitmentConfig.sameAsBillingPlaceholder')}
							/>
							<p className='text-xs text-gray-500'>{t('commitmentConfig.commitmentPeriodHint')}</p>
						</div>
					</div>
				)}

				<div className='space-y-2'>
					<label className='text-sm font-medium text-gray-700'>{t('commitmentConfig.overageFactor')}</label>
					<Input
						type='number'
						value={overageFactor}
						onChange={(value) => {
							setOverageFactor(value);
							setValidationError(null);
							setCommitmentErrorTarget(null);
						}}
						placeholder={t('commitmentConfig.overageFactorPlaceholder')}
						className='w-full'
						error={commitmentErrorTarget === 'overageField' ? (validationError ?? undefined) : undefined}
					/>
					<p className='text-xs text-gray-500'>{t('commitmentConfig.overageFactorHint')}</p>
				</div>

				<div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
					<div className='flex-1'>
						<label className='text-sm font-medium text-gray-700 block mb-1'>{t('commitmentConfig.enableTrueUp')}</label>
						<p className='text-xs text-gray-500'>{t('commitmentConfig.enableTrueUpHint')}</p>
					</div>
					<Switch checked={enableTrueUp} onCheckedChange={setEnableTrueUp} />
				</div>

				{showWindowCommitment && (
					<div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
						<div className='flex-1'>
							<label className='text-sm font-medium text-gray-700 block mb-1'>{t('commitmentConfig.windowCommitment')}</label>
							<p className='text-xs text-gray-500'>
								{t('commitmentConfig.windowCommitmentHint', { bucketSize: price.meter?.aggregation?.bucket_size })}
							</p>
						</div>
						<Switch
							checked={isWindowCommitment}
							onCheckedChange={(checked) => {
								setIsWindowCommitment(checked);
								if (!checked) {
									setTimeBuckets([]);
								}
							}}
						/>
					</div>
				)}

				{showTimeBuckets && isWindowCommitment && (
					<CommitmentTimeBucketsEditor buckets={timeBuckets} onChange={setTimeBuckets} minutesEnabled={minutesEnabled} />
				)}

				{validationError && commitmentErrorTarget === 'banner' && (
					<div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
						<p className='text-sm text-red-700'>{validationError}</p>
					</div>
				)}

				{hasExistingConfig && (
					<div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
						<p className='text-sm text-blue-700'>{t('commitmentConfig.existingNotice')}</p>
					</div>
				)}

				<div className='flex gap-3 pt-4 border-t'>
					<Button variant='outline' onClick={handleCancel} className='flex-1'>
						{t('commitmentConfig.cancel')}
					</Button>
					{hasExistingConfig && (
						<Button variant='outline' onClick={handleClear} className='flex-1 text-red-600 hover:bg-red-50'>
							{t('commitmentConfig.clearCommitment')}
						</Button>
					)}
					<Button onClick={handleSave} className='flex-1'>
						{hasExistingConfig ? t('commitmentConfig.updateCommitment') : t('commitmentConfig.saveCommitment')}
					</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default CommitmentConfigDialog;
