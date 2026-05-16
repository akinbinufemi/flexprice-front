import React, { useState, useCallback, useRef } from 'react';
import { logger } from '@/utils/common/Logger';
import { useTranslation } from 'react-i18next';

interface InfiniteScrollProps<T> {
	fetchData: (pageKey: string | undefined) => Promise<{
		data: T[];
		hasMore: boolean;
		nextPageKey?: string;
	}>;
	children: (items: T[]) => React.ReactNode;
	pageSize?: number;
}

const InfiniteScroll = <T,>({ fetchData, children }: InfiniteScrollProps<T>): JSX.Element => {
	const { t } = useTranslation('common');
	const [items, setItems] = useState<T[]>([]);
	const [hasMore, setHasMore] = useState(true);
	const [loading, setLoading] = useState(false);
	const [pageKey, setPageKey] = useState<string | undefined>(undefined);
	const observer = useRef<IntersectionObserver | null>(null);

	const lastElementRef = useCallback(
		(node: HTMLDivElement | null) => {
			if (loading) return;
			if (observer.current) observer.current.disconnect();
			observer.current = new IntersectionObserver((entries) => {
				if (entries[0].isIntersecting && hasMore) {
					loadMoreData();
				}
			});
			if (node) observer.current.observe(node);
		},
		[loading, hasMore],
	);

	const loadMoreData = useCallback(async () => {
		if (!hasMore || loading) return;
		setLoading(true);

		try {
			const response = await fetchData(pageKey);
			setItems((prev) => [...prev, ...response.data]);
			setHasMore(response.hasMore);
			setPageKey(response.nextPageKey);
		} catch (error) {
			logger.error('Error fetching data:', error);
		} finally {
			setLoading(false);
		}
	}, [fetchData, hasMore, loading, pageKey]);

	return (
		<div>
			{children(items)}
			{hasMore && <div ref={lastElementRef}></div>}
			{loading && <p>{t('status.loading')}</p>}
			{!hasMore && <p>{t('empty.noData')}</p>}
		</div>
	);
};

export default InfiniteScroll;
