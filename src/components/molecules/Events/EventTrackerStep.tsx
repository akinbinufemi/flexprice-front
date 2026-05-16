import { FC } from 'react';
import { CheckCircle2, XCircle, Circle } from 'lucide-react';
import { DebugTrackerStatus, EventDebugStatus } from '@/types/dto';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface EventTrackerStepProps {
	title: string;
	status?: DebugTrackerStatus | EventDebugStatus;
	value: unknown;
	stepKey: string;
	timestamp?: string;
	isIngested?: boolean;
	isAttributed?: boolean;
	overallStatus?: string;
}

const EventTrackerStep: FC<EventTrackerStepProps> = ({
	title,
	status,
	timestamp,
	isIngested = false,
	isAttributed = false,
	overallStatus,
}) => {
	const { t } = useTranslation(['developers', 'common']);

	const renderStepIcon = () => {
		if (isIngested) {
			return <CheckCircle2 className='h-5 w-5 text-emerald-500' />;
		}
		if (isAttributed) {
			return <XCircle className='h-5 w-5 text-slate-300' />;
		}

		switch (status) {
			case 'processing':
				return <Circle className='h-5 w-5 text-blue-500' />;
			case 'failed':
				return <XCircle className='h-5 w-5 text-red-500' />;
			case 'found':
				return <CheckCircle2 className='h-5 w-5 text-emerald-500' />;
			case 'not_found':
				return <XCircle className='h-5 w-5 text-amber-500' />;
			case 'error':
				return <XCircle className='h-5 w-5 text-red-500' />;
			default:
				return <XCircle className='h-5 w-5 text-slate-300' />;
		}
	};

	const renderStepStatusText = () => {
		const ps = t('events.tracker.stepStatus.processing');
		const failed = t('events.tracker.stepStatus.failed');
		const successful = t('events.tracker.stepStatus.successful');
		const skipped = t('events.tracker.stepStatus.skipped');

		if (isIngested) return null;
		if (isAttributed) {
			return overallStatus === 'processing' ? ps : failed;
		}

		switch (status) {
			case 'processing':
				return ps;
			case 'failed':
				return failed;
			case 'found':
				return successful;
			case 'not_found':
				return failed;
			case 'error':
				return failed;
			default:
				return skipped;
		}
	};

	const statusText = renderStepStatusText();
	const statusColorClass = isAttributed
		? 'text-slate-500'
		: status === 'found'
			? 'text-emerald-600'
			: status === 'not_found'
				? 'text-amber-600'
				: status === 'error'
					? 'text-red-600'
					: 'text-slate-500';

	const formatTimestamp = (ts?: string) => {
		if (!ts) return null;
		try {
			const date = new Date(ts);
			if (isNaN(date.getTime())) return ts;

			const options: Intl.DateTimeFormatOptions = {
				year: 'numeric',
				month: 'short',
				day: '2-digit',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				timeZoneName: 'short',
				hour12: true,
			};

			return date.toLocaleString(undefined, options);
		} catch {
			return ts;
		}
	};

	const formattedTimestamp = timestamp ? formatTimestamp(timestamp) : null;

	return (
		<div className='grid grid-cols-[24px_1fr] gap-x-4'>
			<div className='relative z-10 flex justify-center pt-0.5'>
				<div className='bg-white rounded-full p-0.5'>{renderStepIcon()}</div>
			</div>
			<div className='min-w-0'>
				<p className='text-sm font-medium text-foreground'>{title}</p>
				{formattedTimestamp && <p className='text-xs text-slate-500 mt-1'>{formattedTimestamp}</p>}
				{statusText && <p className={cn('text-xs mt-1', statusColorClass)}>{statusText}</p>}
			</div>
		</div>
	);
};

export default EventTrackerStep;
