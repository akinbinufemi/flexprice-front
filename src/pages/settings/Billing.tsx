import { Card, CardHeader, FormHeader, Loader, Page, Button } from '@/components/atoms';
import { Detail, DetailsCard, FlatTabs, ApiDocsContent } from '@/components/molecules';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import CustomerUsageTable from '@/components/molecules/CustomerUsageTable/CustomerUsageTable';
import SubscriptionTable from '@/components/organisms/Subscription/SubscriptionTable';
import useUser from '@/hooks/useUser';
import TenantApi from '@/api/TenantApi';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { UpdateTenantDrawer } from '@/components/molecules';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';

const BillingPage = () => {
	const { t } = useTranslation(['settings', 'common']);
	const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
	const { data, isLoading, isError } = useQuery({
		queryKey: ['billing'],
		queryFn: () => {
			return TenantApi.getTenantBillingDetails();
		},
	});

	const { user } = useUser();

	if (isLoading) {
		return <Loader />;
	}

	if (isError) {
		toast.error(t('billingPage.errorFetchBilling'));
	}

	const billingDetails: Detail[] = [
		{
			label: t('billingPage.labels.name'),
			value: user?.tenant?.name || '--',
			labelStyle: 'normal',
		},
		{
			label: t('billingPage.labels.billingEmail'),
			value: user?.email || '	--',
			labelStyle: 'normal',
		},
		{
			variant: 'divider',
		},
		{
			label: t('billingPage.labels.billingAddress'),
			value: user?.tenant?.billing_details?.address?.address_line1 + ' ' + user?.tenant?.billing_details?.address?.address_line2 || '--',
			labelStyle: 'normal',
		},
		{
			label: t('billingPage.labels.billingCity'),
			value: user?.tenant?.billing_details?.address?.address_city || '--',
			labelStyle: 'normal',
		},
		{
			label: t('billingPage.labels.billingState'),
			value: user?.tenant?.billing_details?.address?.address_state || '--',
			labelStyle: 'normal',
		},
		{
			label: t('billingPage.labels.billingCountry'),
			value: user?.tenant?.billing_details?.address?.address_country || '--',
			labelStyle: 'normal',
		},
		{
			label: t('billingPage.labels.billingPostalCode'),
			value: user?.tenant?.billing_details?.address?.address_postal_code || '--',
			labelStyle: 'normal',
		},
	];

	return (
		<Page heading={t('page.billing')}>
			<ApiDocsContent tags={API_DOCS_TAGS.Tenants} />

			<FlatTabs
				tabs={[
					{
						value: 'usage',
						label: t('billingPage.tabs.usage'),
						content: (
							<div className='space-y-6'>
								{/* customer entitlements table */}
								<Card variant='notched'>
									<CardHeader title={t('billingPage.cards.usage')} />
									<CustomerUsageTable data={data?.usage.features ?? []} allowRedirect={false} />
								</Card>
							</div>
						),
					},
					{
						value: 'subscriptions',
						label: t('billingPage.tabs.subscriptions'),
						content: (
							<div className='space-y-6'>
								{/* customer subscriptions table */}
								<Card variant='notched'>
									<CardHeader title={t('billingPage.cards.subscriptions')} />
									<SubscriptionTable data={data?.subscriptions ?? []} allowRedirect={false} />
								</Card>
							</div>
						),
					},
					{
						value: 'information',
						label: t('billingPage.tabs.general'),
						content: (
							<div className='space-y-6'>
								{/* billing email */}
								<div className='flex items-center justify-between'>
									<FormHeader title={t('billingPage.cards.billingDetails')} variant='form-component-title' />
									<Button variant='outline' size='sm' onClick={() => setIsEditDrawerOpen(true)}>
										<Pencil className='size-4' />
									</Button>
								</div>
								<DetailsCard variant='stacked' data={billingDetails} childrenAtTop cardStyle='borderless'></DetailsCard>
							</div>
						),
					},
				]}
			/>
			<div className='space-y-6'>
				{/* <Card variant='notched'>
					<CardHeader title='Invoices' />
					<div className='flex items-center gap-2 mt-6'>
						<Input value={user?.email} disabled />
					</div>
				</Card> */}
			</div>

			<UpdateTenantDrawer data={user} open={isEditDrawerOpen} onOpenChange={setIsEditDrawerOpen} />
		</Page>
	);
};

export default BillingPage;
