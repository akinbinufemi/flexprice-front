import { FC, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sheet, Button, Select, Spacer } from '@/components/atoms';
import { SelectOption } from '@/components/atoms/Select/Select';
import SubscriptionApi from '@/api/SubscriptionApi';
import { SUBSCRIPTION_STATUS } from '@/models/Subscription';
import { SubscriptionResponse, UpdateSubscriptionRequest } from '@/types/dto/Subscription';
import { isInheritedSubscription } from '@/utils/subscription/isInheritedSubscription';
import { useTranslation } from 'react-i18next';

function getPlanName(sub: SubscriptionResponse, fallbackPlanName: string): string {
	return sub.plan?.name ?? fallbackPlanName;
}

export interface UpdateSubscriptionDrawerProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	subscriptionId: string;
	subscription: SubscriptionResponse | null | undefined;
	onSave: (payload: UpdateSubscriptionRequest) => void;
	isSaving?: boolean;
	/** When true, parent field and save are disabled (e.g. inherited subscription). */
	readOnly?: boolean;
}

const UpdateSubscriptionDrawer: FC<UpdateSubscriptionDrawerProps> = ({
	open,
	onOpenChange,
	subscriptionId,
	subscription,
	onSave,
	isSaving = false,
	readOnly: readOnlyProp,
}) => {
	const { t } = useTranslation(['billing', 'common']);
	const [parentId, setParentId] = useState<string>('');
	const readOnly = readOnlyProp ?? (subscription ? isInheritedSubscription(subscription) : false);
	const fallbackPlanName = t('updateSubscription.fallbackPlanName');

	useEffect(() => {
		if (open && subscription) {
			setParentId(subscription.parent_subscription_id ?? '');
		}
	}, [open, subscription]);

	const { data: subscriptionsData } = useQuery({
		queryKey: ['updateSubscriptionDrawer', 'activeSubscriptions', open, subscriptionId],
		queryFn: async () => {
			return await SubscriptionApi.listSubscriptions({
				subscription_status: [SUBSCRIPTION_STATUS.ACTIVE],
				customer_id: subscription?.customer_id,
				limit: 100,
			});
		},
		enabled: open && !!subscriptionId,
	});

	const parentOptions: SelectOption[] = useMemo(() => {
		const rawItems = subscriptionsData?.items ?? [];
		const excludedCurrent = rawItems.filter((sub) => sub.id !== subscriptionId);
		const list = excludedCurrent.map((sub) => ({
			value: sub.id,
			label: getPlanName(sub, fallbackPlanName),
		}));
		if (parentId && !excludedCurrent.some((s) => s.id === parentId)) {
			return [{ value: parentId, label: parentId }, ...list];
		}
		return list;
	}, [subscriptionsData?.items, subscriptionId, parentId, fallbackPlanName]);

	const hasChanges = parentId !== (subscription?.parent_subscription_id ?? '');

	const handleSave = () => {
		if (readOnly || !hasChanges) return;
		const payload: UpdateSubscriptionRequest = {};
		if (parentId !== (subscription?.parent_subscription_id ?? '')) {
			payload.parent_subscription_id = parentId.trim() || null;
		}
		if (Object.keys(payload).length > 0) {
			onSave(payload);
		}
	};

	return (
		<Sheet
			isOpen={open}
			onOpenChange={onOpenChange}
			title={t('updateSubscription.title')}
			description={t('updateSubscription.setParent')}
			size='md'>
			<div className='space-y-6 mt-4'>
				<div>
					<Select
						label={t('updateSubscription.parentSubscription')}
						placeholder={t('updateSubscription.selectParent')}
						options={parentOptions}
						value={parentId}
						onChange={(value) => setParentId(value)}
						noOptionsText={t('updateSubscription.noSubscriptionsFound')}
						disabled={readOnly}
					/>
				</div>

				<Spacer className='!h-4' />
				<div className='flex justify-end gap-2'>
					<Button variant='outline' onClick={() => onOpenChange(false)}>
						{t('common:actions.cancel')}
					</Button>
					<Button onClick={handleSave} disabled={readOnly || !hasChanges || isSaving}>
						{isSaving ? t('updateSubscription.saving') : t('common:actions.save')}
					</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default UpdateSubscriptionDrawer;
