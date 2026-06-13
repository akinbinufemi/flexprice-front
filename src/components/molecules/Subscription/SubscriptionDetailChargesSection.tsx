import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import SubscriptionApi from '@/api/SubscriptionApi';
import SubscriptionLineItemTable from '@/components/molecules/SubscriptionLineItemTable/SubscriptionLineItemTable';
import { EXPAND } from '@/models';
import type { SubscriptionCommitmentInfo } from '@/models/Subscription';
import { subscriptionLineItemListItemToLineItem } from '@/utils/subscription/subscriptionLineItemListItemToLineItem';

interface Props {
	subscriptionId: string;
	customerId: string;
	currentPeriodStart: string;
	commitmentInfo?: SubscriptionCommitmentInfo;
}

/** Read-only subscription charges for the customer subscription details page. */
const SubscriptionDetailChargesSection: FC<Props> = ({ subscriptionId, customerId, currentPeriodStart, commitmentInfo }) => {
	const { t } = useTranslation('common');

	const { data: lineItemsResponse, isLoading } = useQuery({
		queryKey: ['subscriptionDetailLineItems', subscriptionId, currentPeriodStart],
		queryFn: () =>
			SubscriptionApi.searchSubscriptionLineItems({
				subscription_ids: [subscriptionId],
				customer_ids: [customerId],
				current_period_start: currentPeriodStart,
				active_filter: true,
				limit: 100,
				offset: 0,
				expand: EXPAND.PRICES,
			}),
		enabled: !!subscriptionId && !!customerId && !!currentPeriodStart,
	});

	const lineItems = useMemo(() => (lineItemsResponse?.items ?? []).map(subscriptionLineItemListItemToLineItem), [lineItemsResponse?.items]);

	return (
		<SubscriptionLineItemTable
			data={lineItems}
			isLoading={isLoading}
			commitmentInfo={commitmentInfo}
			readOnly
			showCommitmentColumn
			hideCardWrapper
			noDataSubtitle={t('labels.noChargesFound')}
		/>
	);
};

export default SubscriptionDetailChargesSection;
