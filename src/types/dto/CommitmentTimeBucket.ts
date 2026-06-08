export interface CommitmentTimePoint {
	hour: number;
	minute: number;
}

export interface CommitmentTimeBucket {
	start: CommitmentTimePoint;
	end: CommitmentTimePoint;
}
