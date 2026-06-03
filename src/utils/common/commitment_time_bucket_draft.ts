import type { CommitmentTimePoint } from '@/types/dto/CommitmentTimeBucket';

export const UNSET_TIME_VALUE = -1;

export type CommitmentTimeBucketDraft = {
	start: CommitmentTimePoint;
	end: CommitmentTimePoint;
};

export function createEmptyTimeBucketDraft(): CommitmentTimeBucketDraft {
	return {
		start: { hour: UNSET_TIME_VALUE, minute: UNSET_TIME_VALUE },
		end: { hour: UNSET_TIME_VALUE, minute: UNSET_TIME_VALUE },
	};
}

function isTimePointComplete(point: CommitmentTimePoint, minutesEnabled: boolean): boolean {
	if (point.hour === UNSET_TIME_VALUE) return false;
	if (minutesEnabled && point.minute === UNSET_TIME_VALUE) return false;
	return true;
}

export function isTimeBucketDraftComplete(draft: CommitmentTimeBucketDraft, minutesEnabled: boolean): boolean {
	return isTimePointComplete(draft.start, minutesEnabled) && isTimePointComplete(draft.end, minutesEnabled);
}
