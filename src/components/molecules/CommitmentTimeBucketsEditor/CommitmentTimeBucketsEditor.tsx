import { FC, useMemo } from 'react';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { Button } from '@/components/atoms';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CommitmentTimePoint } from '@/types/dto/CommitmentTimeBucket';
import { timePointToMinutes } from '@/utils/common/commitment_helpers';
import {
	createEmptyTimeBucketDraft,
	isTimeBucketDraftComplete,
	UNSET_TIME_VALUE,
	type CommitmentTimeBucketDraft,
} from '@/utils/common/commitment_time_bucket_draft';
import { useTranslation } from 'react-i18next';

interface Props {
	buckets: CommitmentTimeBucketDraft[];
	onChange: (buckets: CommitmentTimeBucketDraft[]) => void;
	minutesEnabled: boolean;
	disabled?: boolean;
}

function formatTwoDigits(value: number): string {
	return String(value).padStart(2, '0');
}

function buildTimeOptions(max: number) {
	return Array.from({ length: max + 1 }, (_, i) => formatTwoDigits(i));
}

const HOUR_OPTIONS = buildTimeOptions(23);
const MINUTE_OPTIONS = buildTimeOptions(59);

function hasSameStartAndEnd(row: CommitmentTimeBucketDraft, minutesEnabled: boolean): boolean {
	if (!isTimeBucketDraftComplete(row, minutesEnabled)) return false;

	const startMinutes = timePointToMinutes({
		hour: row.start.hour,
		minute: minutesEnabled ? row.start.minute : 0,
	});
	const endMinutes = timePointToMinutes({
		hour: row.end.hour,
		minute: minutesEnabled ? row.end.minute : 0,
	});

	return startMinutes === endMinutes;
}

interface TimeUnitSelectProps {
	value: number;
	options: string[];
	placeholder: string;
	onChange: (value: number) => void;
	disabled?: boolean;
	ariaLabel: string;
	hasError?: boolean;
}

const TimeUnitSelect: FC<TimeUnitSelectProps> = ({ value, options, placeholder, onChange, disabled, ariaLabel, hasError }) => {
	const isUnset = value === UNSET_TIME_VALUE;

	return (
		<Select value={isUnset ? undefined : String(value)} onValueChange={(next) => onChange(parseInt(next, 10))} disabled={disabled}>
			<SelectTrigger
				aria-label={ariaLabel}
				className={cn(
					'h-10 w-[4.75rem] shrink-0 justify-center gap-1 px-2 text-center font-medium tabular-nums',
					disabled && 'cursor-not-allowed opacity-60',
					hasError && 'border-red-500 focus:ring-red-500',
					isUnset && 'text-muted-foreground',
				)}>
				<SelectValue placeholder={placeholder} />
			</SelectTrigger>
			<SelectContent className='max-h-52'>
				{options.map((option, index) => (
					<SelectItem key={option} value={String(index)} className='justify-center tabular-nums'>
						{option}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
};

interface TimePointInputProps {
	label: string;
	value: CommitmentTimePoint;
	onChange: (value: CommitmentTimePoint) => void;
	minutesEnabled: boolean;
	hourPlaceholder: string;
	minutePlaceholder: string;
	disabled?: boolean;
	hasError?: boolean;
}

const TimePointInput: FC<TimePointInputProps> = ({
	label,
	value,
	onChange,
	minutesEnabled,
	hourPlaceholder,
	minutePlaceholder,
	disabled,
	hasError,
}) => (
	<div className='flex min-w-0 flex-col gap-2'>
		<span className='text-sm font-medium text-gray-700'>{label}</span>
		<div className='flex items-center gap-2'>
			<TimeUnitSelect
				value={value.hour}
				options={HOUR_OPTIONS}
				placeholder={hourPlaceholder}
				onChange={(hour) => onChange({ ...value, hour })}
				disabled={disabled}
				ariaLabel={`${label} hour`}
				hasError={hasError}
			/>
			<span className='text-base font-medium text-gray-400'>:</span>
			<TimeUnitSelect
				value={minutesEnabled ? value.minute : value.hour === UNSET_TIME_VALUE ? UNSET_TIME_VALUE : 0}
				options={MINUTE_OPTIONS}
				placeholder={minutePlaceholder}
				onChange={(minute) => onChange({ ...value, minute })}
				disabled={disabled || !minutesEnabled}
				ariaLabel={`${label} minute`}
				hasError={hasError}
			/>
		</div>
	</div>
);

const CommitmentTimeBucketsEditor: FC<Props> = ({ buckets, onChange, minutesEnabled, disabled }) => {
	const { t } = useTranslation('billing', { keyPrefix: 'commitmentConfig.timeBuckets' });

	const hourPlaceholder = t('hourPlaceholder', { defaultValue: 'HH' });
	const minutePlaceholder = t('minutePlaceholder', { defaultValue: 'MM' });

	const emptyHint = useMemo(
		() =>
			minutesEnabled
				? t('empty', { defaultValue: 'No time buckets configured. Add a bucket to restrict commitment to specific UTC hours.' })
				: t('emptyHourOnly', {
						defaultValue: 'No time buckets configured. Add a bucket to restrict commitment to specific UTC hours (minutes fixed to :00).',
					}),
		[minutesEnabled, t],
	);

	const updateRow = (index: number, patch: Partial<CommitmentTimeBucketDraft>) => {
		onChange(buckets.map((row, i) => (i === index ? { ...row, ...patch } : row)));
	};

	return (
		<div className='space-y-4 rounded-lg border border-gray-200 bg-gray-50/50 p-5'>
			<div>
				<label className='text-sm font-medium text-gray-900'>{t('title', { defaultValue: 'Commitment Time Buckets' })}</label>
				<p className='mt-1 text-sm text-gray-500'>
					{t('description', {
						defaultValue: 'Limit window commitment to specific UTC time ranges. Start is inclusive; end is exclusive.',
					})}
				</p>
			</div>

			{buckets.length === 0 ? (
				<p className='text-sm text-gray-500'>{emptyHint}</p>
			) : (
				<div className='space-y-4'>
					{buckets.map((row, index) => {
						const sameTime = hasSameStartAndEnd(row, minutesEnabled);

						return (
							<div key={index} className='space-y-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm'>
								<div className='flex items-start gap-4'>
									<div className='grid flex-1 grid-cols-1 gap-6 sm:grid-cols-[1fr_1fr_auto] sm:items-end'>
										<TimePointInput
											label={t('startLabel', { defaultValue: 'Start (>=)' })}
											value={row.start}
											onChange={(start) => updateRow(index, { start })}
											minutesEnabled={minutesEnabled}
											hourPlaceholder={hourPlaceholder}
											minutePlaceholder={minutePlaceholder}
											disabled={disabled}
											hasError={sameTime}
										/>
										<TimePointInput
											label={t('endLabel', { defaultValue: 'End (<)' })}
											value={row.end}
											onChange={(end) => updateRow(index, { end })}
											minutesEnabled={minutesEnabled}
											hourPlaceholder={hourPlaceholder}
											minutePlaceholder={minutePlaceholder}
											disabled={disabled}
											hasError={sameTime}
										/>
										<span className='pb-2.5 text-sm font-semibold tracking-wide text-gray-500 sm:self-end'>
											{t('utc', { defaultValue: 'UTC' })}
										</span>
									</div>
									<button
										type='button'
										onClick={() => onChange(buckets.filter((_, i) => i !== index))}
										disabled={disabled}
										className='mt-7 shrink-0 rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50'
										aria-label={t('removeBucket', { defaultValue: 'Remove time bucket' })}>
										<RiDeleteBin6Line className='size-4' />
									</button>
								</div>
								{sameTime && (
									<p className='text-sm text-red-600'>{t('errors.sameTime', { defaultValue: 'Start and end time cannot be the same' })}</p>
								)}
							</div>
						);
					})}
				</div>
			)}

			<Button
				type='button'
				variant='outline'
				onClick={() => onChange([...buckets, createEmptyTimeBucketDraft()])}
				disabled={disabled}
				className='w-fit'>
				{t('addBucket', { defaultValue: '+ Add time bucket' })}
			</Button>
		</div>
	);
};

export default CommitmentTimeBucketsEditor;
