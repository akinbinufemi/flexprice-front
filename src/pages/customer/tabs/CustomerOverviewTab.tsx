import { useNavigate, useParams, useOutletContext } from 'react-router';
import { AddButton, Card, CardHeader, Loader, Spacer, ShortPagination, Input, Button, Dialog } from '@/components/atoms';
import CustomerApi from '@/api/CustomerApi';
import IntegrationMappingApi, { IntegrationConfigItem, IntegrationMappingItem } from '@/api/IntegrationMappingApi';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { SubscriptionTable } from '@/components/organisms';
import { Subscription, SUBSCRIPTION_STATUS, PRICE_ENTITY_TYPE } from '@/models';
import toast from 'react-hot-toast';
import { RouteNames } from '@/core/routes/Routes';
import CustomerUsageTable from '@/components/molecules/CustomerUsageTable';
import { UpcomingCreditGrantApplicationsTable } from '@/components/molecules';
import SubscriptionApi from '@/api/SubscriptionApi';
import { PriceApi } from '@/api';
import { useCallback, useMemo, useState } from 'react';
import { QueryBuilder } from '@/components/molecules';
import FlexpriceTable, { ColumnData } from '@/components/molecules/Table';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import useFilterSortingWithPersistence from '@/hooks/useFilterSortingWithPersistence';
import { usePaginationReset } from '@/hooks/usePaginationReset';
import {
	FilterField,
	FilterFieldType,
	DataType,
	FilterOperator,
	SortOption,
	SortDirection,
	FilterCondition,
} from '@/types/common/QueryBuilder';
import type { TypedBackendFilter } from '@/types/formatters/QueryBuilder';
import { BILLING_CADENCE } from '@/models/Invoice';
import { BILLING_PERIOD } from '@/constants/constants';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { searchPlansForFilter } from '@/utils/filterSearchHelpers';
import { PlanApi } from '@/api';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import { integrationCatalogSpecs } from '@/pages/insights-tools/integrations/integrationsData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BsThreeDotsVertical } from 'react-icons/bs';
import formatDate from '@/utils/common/format_date';
import Label from '@/components/atoms/Label';

type ContextType = {
	isArchived: boolean;
};

// Filter options for customer subscriptions (no customer_id - scoped by route)
const subscriptionFilterOptions: FilterField[] = [
	{
		field: 'plan_id',
		label: 'Plan',
		fieldType: FilterFieldType.ASYNC_MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		asyncConfig: {
			searchFn: searchPlansForFilter,
		},
	},
	{
		field: 'subscription_status',
		label: 'Status',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN, FilterOperator.NOT_IN],
		dataType: DataType.ARRAY,
		options: [
			{ value: SUBSCRIPTION_STATUS.ACTIVE, label: 'Active' },
			{ value: SUBSCRIPTION_STATUS.CANCELLED, label: 'Cancelled' },
			{ value: SUBSCRIPTION_STATUS.INCOMPLETE, label: 'Incomplete' },
			{ value: SUBSCRIPTION_STATUS.TRIALING, label: 'Trialing' },
			{ value: SUBSCRIPTION_STATUS.DRAFT, label: 'Draft' },
		],
	},
	{
		field: 'billing_cadence',
		label: 'Billing Cadence',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN],
		dataType: DataType.ARRAY,
		options: Object.values(BILLING_CADENCE).map((cadence) => ({
			value: cadence,
			label: cadence.charAt(0).toUpperCase() + cadence.slice(1).toLowerCase(),
		})),
	},
	{
		field: 'billing_period',
		label: 'Billing Period',
		fieldType: FilterFieldType.MULTI_SELECT,
		operators: [FilterOperator.IN],
		dataType: DataType.ARRAY,
		options: Object.values(BILLING_PERIOD).map((period) => ({
			value: period,
			label: toSentenceCase(period.replace('_', ' ')),
		})),
	},
];

const subscriptionSortOptions: SortOption[] = [
	{ field: 'created_at', label: 'Created At', direction: SortDirection.DESC },
	{ field: 'updated_at', label: 'Updated At', direction: SortDirection.DESC },
	{ field: 'start_date', label: 'Start Date', direction: SortDirection.DESC },
	{ field: 'end_date', label: 'End Date', direction: SortDirection.DESC },
];

const initialSubscriptionFilters: FilterCondition[] = [
	{
		field: 'subscription_status',
		operator: FilterOperator.IN,
		valueArray: [SUBSCRIPTION_STATUS.ACTIVE, SUBSCRIPTION_STATUS.TRIALING, SUBSCRIPTION_STATUS.DRAFT, SUBSCRIPTION_STATUS.INCOMPLETE],
		dataType: DataType.ARRAY,
		id: 'initial-status',
	},
];

const initialSubscriptionSorts: SortOption[] = [{ field: 'updated_at', label: 'Updated At', direction: SortDirection.DESC }];

const PROVIDER_ID_MAP: Record<string, string> = {
	zoho_books: 'zoho',
};

const providerLogoMap = new Map(integrationCatalogSpecs.map((spec) => [spec.id, spec.logo]));

const getProviderLogo = (providerType: string): string | undefined => {
	const mappedId = PROVIDER_ID_MAP[providerType] ?? providerType;
	return providerLogoMap.get(mappedId);
};

const formatProviderName = (providerType: string): string => {
	return providerType
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};

interface IntegrationRow {
	provider_type: string;
	mapping: IntegrationMappingItem | null;
	syncOutboundEnabled: boolean;
}

const CustomerOverviewTab = () => {
	const { t } = useTranslation('customers');
	const navigate = useNavigate();
	const { id: customerId } = useParams();
	const { isArchived } = useOutletContext<ContextType>();
	const queryClient = useQueryClient();

	const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
	const [linkDialogOpen, setLinkDialogOpen] = useState(false);
	const [linkTarget, setLinkTarget] = useState<IntegrationRow | null>(null);
	const [providerEntityId, setProviderEntityId] = useState('');

	const handleAddSubscription = () => {
		navigate(`${RouteNames.customers}/${customerId}/add-subscription`);
	};

	const { mutate: syncIntegration, isPending: isSyncing } = useMutation({
		mutationFn: () =>
			IntegrationMappingApi.syncIntegration({
				entity_type: 'customer',
				entity_id: customerId!,
			}),
		onSuccess: () => {
			toast.success('Integration sync triggered successfully');
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to trigger sync');
		},
	});

	const { mutate: linkIntegration, isPending: isLinking } = useMutation({
		mutationFn: () =>
			IntegrationMappingApi.linkIntegration({
				entity_type: 'customer',
				entity_id: customerId!,
				provider_type: linkTarget!.provider_type,
				provider_entity_id: providerEntityId,
			}),
		onSuccess: () => {
			toast.success('Integration linked successfully');
			setLinkDialogOpen(false);
			setProviderEntityId('');
			setLinkTarget(null);
			queryClient.invalidateQueries({ queryKey: ['integrationMappings', 'customer', customerId] });
		},
		onError: (error: Error) => {
			toast.error(error.message || 'Failed to link integration');
		},
	});

	const handleLinkClick = (row: IntegrationRow) => {
		setLinkTarget(row);
		setProviderEntityId('');
		setLinkDialogOpen(true);
		setDropdownOpen(null);
	};

	const handleSyncClick = useCallback(() => {
		setDropdownOpen(null);
		syncIntegration();
	}, [syncIntegration]);

	const handleLinkSubmit = () => {
		if (!providerEntityId.trim()) {
			toast.error('Provider Entity ID is required');
			return;
		}
		linkIntegration();
	};

	const { filters, sorts, setFilters, setSorts, sanitizedFilters, sanitizedSorts } = useFilterSortingWithPersistence({
		initialFilters: initialSubscriptionFilters,
		initialSorts: initialSubscriptionSorts,
		debounceTime: 300,
		persistenceKey: 'customerSubscriptions',
	});

	const { limit, offset, reset } = usePagination({
		initialLimit: 10,
		prefix: PAGINATION_PREFIX.CUSTOMER_SUBSCRIPTIONS,
	});

	usePaginationReset(reset, sanitizedFilters, sanitizedSorts);

	const {
		data: subscriptionsData,
		isLoading: subscriptionsLoading,
		error: subscriptionsError,
	} = useQuery({
		queryKey: ['customerSubscriptions', customerId, limit, offset, sanitizedFilters, sanitizedSorts],
		queryFn: () =>
			SubscriptionApi.searchSubscriptions({
				customer_id: customerId!,
				limit,
				offset,
				filters: sanitizedFilters,
				sort: sanitizedSorts,
			}),
		enabled: !!customerId,
	});

	const currentPageItems = useMemo(() => subscriptionsData?.items ?? [], [subscriptionsData?.items]);

	const uniquePlanIds = useMemo(() => [...new Set(currentPageItems.map((s) => s.plan_id).filter(Boolean))] as string[], [currentPageItems]);

	const planSearchFilters = useMemo<TypedBackendFilter[]>(
		() =>
			uniquePlanIds.length > 0
				? [{ field: 'id', operator: FilterOperator.IN, data_type: DataType.ARRAY, value: { array: uniquePlanIds } }]
				: [],
		[uniquePlanIds],
	);

	const { data: plansResponse, isLoading: isPlansLoading } = useQuery({
		queryKey: ['plansByFilter', uniquePlanIds],
		queryFn: () =>
			PlanApi.getPlansByFilter({
				filters: planSearchFilters,
				limit: uniquePlanIds.length || 10,
				offset: 0,
				sort: [],
			}),
		enabled: uniquePlanIds.length > 0,
	});

	const planMap = useMemo(() => {
		const map = new Map<string, { id: string; name: string }>();
		plansResponse?.items?.forEach((plan) => {
			if (plan.id) {
				map.set(plan.id, { id: plan.id, name: plan.name ?? '' });
			}
		});
		return map;
	}, [plansResponse?.items]);

	const subscriptionsWithPlan = useMemo(
		() =>
			currentPageItems.map((s) => ({
				...s,
				plan: s.plan_id ? (planMap.get(s.plan_id) ?? undefined) : undefined,
			})),
		[currentPageItems, planMap],
	);

	const overrideQueries = useQueries({
		queries: currentPageItems.map((sub) => ({
			queryKey: ['subscriptionOverride', sub.id],
			queryFn: async () => {
				const result = await PriceApi.searchPrices({
					filters: [
						{
							field: 'entity_type',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: PRICE_ENTITY_TYPE.SUBSCRIPTION },
						},
						{
							field: 'entity_id',
							operator: FilterOperator.EQUAL,
							data_type: DataType.STRING,
							value: { string: sub.id },
						},
					],
					limit: 1,
					offset: 0,
				});
				return {
					subscriptionId: sub.id,
					hasOverride: (result.items?.length || 0) > 0,
				};
			},
			enabled: !!sub.id,
		})),
	});

	type OverrideQueryResult = { subscriptionId: string; hasOverride: boolean };
	const subscriptionOverrides = useMemo(() => {
		const overrideMap = new Map<string, boolean>();
		overrideQueries.forEach((query: { data?: OverrideQueryResult }) => {
			if (query.data) {
				overrideMap.set(query.data.subscriptionId, query.data.hasOverride);
			}
		});
		return overrideMap;
	}, [overrideQueries]);

	const isOverridesLoading = overrideQueries.some((query: { isLoading: boolean }) => query.isLoading);

	const {
		data: usageData,
		isLoading: usageLoading,
		error: usageError,
	} = useQuery({
		queryKey: ['usage', customerId],
		queryFn: () => CustomerApi.getUsageSummary({ customer_id: customerId! }),
	});

	const {
		data: upcomingCreditGrantApplications,
		isLoading: upcomingGrantsLoading,
		error: upcomingGrantsError,
	} = useQuery({
		queryKey: ['upcomingCreditGrantApplications', customerId],
		queryFn: () => CustomerApi.getUpcomingCreditGrantApplications(customerId!),
		enabled: !!customerId,
	});

	const {
		data: _customer,
		isLoading: customerLoading,
		error: customerError,
	} = useQuery({
		queryKey: ['fetchCustomerDetails', customerId],
		queryFn: () => CustomerApi.getCustomerById(customerId!),
		enabled: !!customerId,
	});
	void _customer; // used for cache; loading/error drive UI

	const { data: integrationConfigData } = useQuery({
		queryKey: ['integrationConfig'],
		queryFn: () => IntegrationMappingApi.getIntegrationConfig(),
	});

	const hasIntegrationConfig = (integrationConfigData?.integrations?.length ?? 0) > 0;

	const { data: integrationMappingsData } = useQuery({
		queryKey: ['integrationMappings', 'customer', customerId],
		queryFn: () => IntegrationMappingApi.getIntegrationMappings('customer', customerId!),
		enabled: !!customerId && hasIntegrationConfig,
	});

	const integrationRows = useMemo<IntegrationRow[]>(() => {
		const configs = integrationConfigData?.integrations ?? [];
		const mappings = integrationMappingsData?.items ?? [];
		const mappingByProvider = new Map(mappings.map((m) => [m.provider_type, m]));
		return configs.map((cfg: IntegrationConfigItem) => ({
			provider_type: cfg.provider,
			mapping: mappingByProvider.get(cfg.provider) ?? null,
			syncOutboundEnabled: !!cfg.current_config?.customer?.outbound,
		}));
	}, [integrationConfigData?.integrations, integrationMappingsData?.items]);

	const integrationColumns: ColumnData<IntegrationRow>[] = useMemo(
		() => [
			{
				title: 'Integration',
				render: (row: IntegrationRow) => {
					const logo = getProviderLogo(row.provider_type);
					return (
						<div className='flex items-center gap-2'>
							{logo && <img src={logo} alt={row.provider_type} className='size-5 object-contain' />}
							<span className='font-medium text-foreground'>{formatProviderName(row.provider_type)}</span>
						</div>
					);
				},
			},
			{
				title: 'Integration Customer ID',
				render: (row: IntegrationRow) => <span className='text-muted-foreground'>{row.mapping?.provider_entity_id || '—'}</span>,
			},
			{
				title: 'Created At',
				render: (row: IntegrationRow) => (
					<span className='text-muted-foreground'>{row.mapping?.created_at ? formatDate(row.mapping.created_at) : '—'}</span>
				),
			},
			{
				title: 'Updated At',
				render: (row: IntegrationRow) => (
					<span className='text-muted-foreground'>{row.mapping?.updated_at ? formatDate(row.mapping.updated_at) : '—'}</span>
				),
			},
			{
				title: '',
				width: 60,
				align: 'center' as const,
				fieldVariant: 'interactive' as const,
				render: (row: IntegrationRow) =>
					row.mapping?.provider_url ? (
						<a
							href={row.mapping.provider_url}
							target='_blank'
							rel='noopener noreferrer'
							data-interactive='true'
							className='inline-flex items-center text-primary hover:text-primary/80'>
							<ExternalLink className='size-4' />
						</a>
					) : null,
			},
			{
				title: '',
				width: 40,
				fieldVariant: 'interactive' as const,
				render: (row: IntegrationRow) => {
					const hasProviderEntity = !!row.mapping?.provider_entity_id;
					return (
						<div data-interactive='true'>
							<DropdownMenu
								open={dropdownOpen === row.provider_type}
								onOpenChange={(open) => setDropdownOpen(open ? row.provider_type : null)}>
								<DropdownMenuTrigger asChild>
									<button className='focus:outline-none'>
										<BsThreeDotsVertical className='text-base text-muted-foreground hover:text-foreground transition-colors' />
									</button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align='end'>
									<DropdownMenuItem
										disabled={hasProviderEntity}
										onSelect={(e) => {
											e.preventDefault();
											handleLinkClick(row);
										}}
										className='cursor-pointer'>
										{t('common:actions.link')}
									</DropdownMenuItem>
									<DropdownMenuItem
										disabled={isSyncing || !row.syncOutboundEnabled}
										onSelect={(e) => {
											e.preventDefault();
											handleSyncClick();
										}}
										className='cursor-pointer'>
										{t('common:actions.sync')}
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					);
				},
			},
		],
		[dropdownOpen, isSyncing, handleSyncClick, t],
	);

	if (subscriptionsLoading || usageLoading || upcomingGrantsLoading || customerLoading || isOverridesLoading || isPlansLoading) {
		return <Loader />;
	}

	if (subscriptionsError || usageError || upcomingGrantsError || customerError) {
		toast.error('Something went wrong');
	}

	const renderSubscriptionContent = () => (
		<Card variant='notched'>
			<CardHeader
				title={t('tabPanels.overview.subscriptionsCardTitle')}
				cta={!isArchived && <AddButton onClick={handleAddSubscription} />}
			/>
			<QueryBuilder
				filterOptions={subscriptionFilterOptions}
				filters={filters}
				onFilterChange={setFilters}
				sortOptions={subscriptionSortOptions}
				selectedSorts={sorts}
				onSortChange={setSorts}
				debounceTime={300}
			/>
			<SubscriptionTable
				onRowClick={(row) => {
					navigate(`${RouteNames.customers}/${customerId}/subscription/${row.id}`);
				}}
				data={subscriptionsWithPlan as Subscription[]}
				subscriptionOverrides={subscriptionOverrides}
			/>
			<Spacer className='!h-4' />
			<ShortPagination
				unit={t('tabPanels.overview.subscriptionsPaginationUnit')}
				totalItems={subscriptionsData?.pagination?.total ?? 0}
				prefix={PAGINATION_PREFIX.CUSTOMER_SUBSCRIPTIONS}
				pageSize={limit}
			/>
		</Card>
	);

	return (
		<div className='space-y-6'>
			{renderSubscriptionContent()}

			{(usageData?.features?.length || 0) > 0 && (
				<Card variant='notched'>
					<CardHeader title={t('tabPanels.overview.entitlementsCardTitle')} />
					<CustomerUsageTable data={usageData?.features ?? []} />
				</Card>
			)}

			<UpcomingCreditGrantApplicationsTable data={upcomingCreditGrantApplications?.items ?? []} customerId={customerId} />

			{hasIntegrationConfig && (
				<Card variant='notched'>
					<CardHeader title={t('common:integrations.title')} titleClassName='font-semibold' />
					<FlexpriceTable data={integrationRows} columns={integrationColumns} showEmptyRow variant='no-bordered' />
				</Card>
			)}

			<Dialog
				isOpen={linkDialogOpen}
				onOpenChange={(open) => {
					setLinkDialogOpen(open);
					if (!open) {
						setProviderEntityId('');
						setLinkTarget(null);
					}
				}}
				title={`${t('common:actions.link')} ${linkTarget ? formatProviderName(linkTarget.provider_type) : t('common:integrations.integration')}`}>
				<div className='space-y-4'>
					<div className='space-y-1'>
						<Label label={t('common:integrations.providerEntityId')} />
						<Input
							value={providerEntityId}
							onChange={(val) => setProviderEntityId(val)}
							placeholder={t('common:integrations.enterProviderEntityId')}
						/>
					</div>
					<div className='flex justify-end gap-2'>
						<Button
							variant='outline'
							onClick={() => {
								setLinkDialogOpen(false);
								setProviderEntityId('');
								setLinkTarget(null);
							}}>
							{t('common:actions.cancel')}
						</Button>
						<Button onClick={handleLinkSubmit} disabled={isLinking || !providerEntityId.trim()}>
							{isLinking ? t('common:actions.linking') : t('common:actions.link')}
						</Button>
					</div>
				</div>
			</Dialog>
		</div>
	);
};

export default CustomerOverviewTab;
