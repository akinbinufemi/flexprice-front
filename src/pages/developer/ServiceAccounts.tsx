import { Button, Page, ShortPagination, SectionHeader } from '@/components/atoms';
import { ColumnData, FlexpriceTable, ApiDocsContent } from '@/components/molecules';
import { UserApi } from '@/api/UserApi';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/models';
import usePagination from '@/hooks/usePagination';
import { formatDateShort } from '@/utils/common/helper_functions';
import { Plus, Loader, Bot } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { EmptyPage } from '@/components/organisms';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import ServiceAccountDrawer from '@/components/molecules/ServiceAccountDrawer/ServiceAccountDrawer';
import { useTranslation } from 'react-i18next';

const ServiceAccountsPage = () => {
	const { t } = useTranslation(['developers', 'common']);
	const { page } = usePagination();
	const [isServiceAccountDrawerOpen, setIsServiceAccountDrawerOpen] = useState(false);

	const {
		data: serviceAccountsResponse,
		isLoading: isLoadingServiceAccounts,
		isError: isServiceAccountsError,
	} = useQuery({
		queryKey: ['service-accounts', page],
		queryFn: async () => {
			return await UserApi.getServiceAccounts();
		},
	});

	const handleAddServiceAccount = () => {
		setIsServiceAccountDrawerOpen(true);
	};

	const serviceAccountColumns: ColumnData<User>[] = useMemo(
		() => [
			{
				title: t('labels.id'),
				render: (rowData: User) => {
					const displayId = rowData.id;
					const prefix = displayId.slice(0, 8);
					const suffix = displayId.slice(-4);
					const masked = `${prefix}••••${suffix}`;

					return (
						<div className='flex gap-2 items-center'>
							<code className='px-2 py-1 text-sm bg-gray-100 rounded font-mono'>{masked}</code>
						</div>
					);
				},
			},
			{
				title: t('labels.type'),
				render: () => (
					<div className='flex gap-2 items-center'>
						<div className='flex items-center gap-1.5 text-purple-600'>
							<Bot size={16} />
							<span className='text-sm font-medium'>{t('apiKeys.accountTypes.serviceAccount')}</span>
						</div>
					</div>
				),
			},
			{
				title: t('labels.roles'),
				render: (rowData: User) => {
					if (!rowData.roles || rowData.roles.length === 0) {
						return <span className='text-gray-500 text-sm'>{t('serviceAccounts.noRoles')}</span>;
					}

					return (
						<div className='flex flex-wrap gap-1'>
							{rowData.roles.map((role) => (
								<span key={role} className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'>
									{role}
								</span>
							))}
						</div>
					);
				},
			},
			{
				title: t('labels.createdAt'),
				width: 150,
				align: 'right',
				render: (rowData) => (
					<span className='text-gray-600'>{formatDateShort(rowData.tenant?.created_at || rowData.tenant?.updated_at || '')}</span>
				),
			},
		],
		[t],
	);

	if (isLoadingServiceAccounts) {
		return <Loader />;
	}

	if (isServiceAccountsError) {
		toast.error(t('serviceAccounts.toastFetchError'));
	}

	return (
		<div>
			<ApiDocsContent tags={API_DOCS_TAGS.Users} />
			<ServiceAccountDrawer isOpen={isServiceAccountDrawerOpen} onOpenChange={setIsServiceAccountDrawerOpen} />

			{serviceAccountsResponse?.items.length === 0 && (
				<EmptyPage
					heading={t('common:nav.serviceAccounts')}
					onAddClick={handleAddServiceAccount}
					emptyStateCard={{
						heading: t('serviceAccounts.emptyCard.heading'),
						description: t('serviceAccounts.emptyCard.description'),
						buttonLabel: t('serviceAccounts.emptyCard.button'),
						buttonAction: handleAddServiceAccount,
					}}
					tags={API_DOCS_TAGS.Users}
				/>
			)}
			{(serviceAccountsResponse?.items.length || 0) > 0 && (
				<Page>
					<SectionHeader title={t('common:nav.serviceAccounts')} titleClassName='text-3xl font-medium'>
						<Button prefixIcon={<Plus />} onClick={handleAddServiceAccount}>
							{t('common:actions.add')}
						</Button>
					</SectionHeader>
					<div className='pb-12 mt-2'>
						<FlexpriceTable showEmptyRow columns={serviceAccountColumns} data={serviceAccountsResponse?.items || []} />
						<ShortPagination unit={t('serviceAccounts.paginationUnit')} totalItems={serviceAccountsResponse?.pagination?.total || 0} />
					</div>
				</Page>
			)}
		</div>
	);
};

export default ServiceAccountsPage;
