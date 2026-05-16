import { Loader, Page } from '@/components/atoms';
import { ApiDocsContent } from '@/components/molecules/ApiDocs/ApiDocs';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AppPortal } from 'svix-react';
import 'svix-react/style.css';
import { EmptyPage } from '@/components/organisms';
import { useMemo } from 'react';
import useEnvironment from '@/hooks/useEnvironment';
import { PREFETCH_REGISTRY, PrefetchQueryKey } from '@/config/prefetch';
import { useTranslation } from 'react-i18next';

const WebhookDashboard = () => {
	const { t } = useTranslation(['developers', 'common']);
	const { activeEnvironment } = useEnvironment();
	const envId = activeEnvironment?.id;
	const prefetch = PREFETCH_REGISTRY[PrefetchQueryKey.WebhookDashboardUrl];

	const { data, isLoading, isError, error } = useQuery({
		queryKey: prefetch.queryKey(envId ?? ''),
		queryFn: prefetch.queryFn,
		staleTime: prefetch.staleTime,
		gcTime: prefetch.gcTime,
		enabled: !!envId,
	});

	const appPortalProps = useMemo(
		() => ({
			primaryColor: '#000000',
			style: {
				width: '100%',
				height: '100%',
				color: '#000000',
				border: 'none',
				backgroundColor: '#000000',
			},
			url: data?.url ?? '',
		}),
		[data?.url],
	);

	const webhooksHeading = t('common:nav.webhooks');

	if (isLoading) {
		return (
			<Page className='h-full w-full' heading={webhooksHeading}>
				<ApiDocsContent tags={API_DOCS_TAGS.Webhooks} />
				<div className='flex items-center justify-center h-96'>
					<Loader />
				</div>
			</Page>
		);
	}

	if (isError) {
		toast.error(
			t('developers:webhooks.toastFetchError', {
				message: error?.message || t('developers:webhooks.unknownError'),
			}),
		);
		return (
			<Page className='h-full w-full' heading={webhooksHeading}>
				<ApiDocsContent tags={API_DOCS_TAGS.Webhooks} />
				<EmptyPage
					heading={webhooksHeading}
					emptyStateCard={{
						heading: t('developers:webhooks.emptyLoadFailed.heading'),
						description: t('developers:webhooks.emptyLoadFailed.description'),
					}}
				/>
			</Page>
		);
	}

	if (!data?.svix_enabled) {
		return (
			<Page className='h-full w-full' heading={webhooksHeading}>
				<ApiDocsContent tags={API_DOCS_TAGS.Webhooks} />
				<EmptyPage
					heading={webhooksHeading}
					emptyStateCard={{
						heading: t('developers:webhooks.disabled.heading'),
						description: t('developers:webhooks.disabled.description'),
					}}
				/>
			</Page>
		);
	}

	return (
		<Page className='h-full w-full' heading={webhooksHeading}>
			<ApiDocsContent tags={API_DOCS_TAGS.Webhooks} />
			<AppPortal {...appPortalProps} />
		</Page>
	);
};

export default WebhookDashboard;
