import React from 'react';
import AsyncMultiSearchableSelect, { AsyncMultiSearchableSelectProps } from '@/components/atoms/Select/AsyncMultiSearchableSelect';
import CustomerApi from '@/api/CustomerApi';
import { Customer } from '@/models';
import { useTranslation } from 'react-i18next';

export interface CustomerMultiSearchSelectProps extends Omit<AsyncMultiSearchableSelectProps<Customer>, 'search' | 'extractors'> {
	/** Maximum number of results per request (default: 50) */
	limit?: number;
	/** Search input placeholder */
	searchPlaceholder?: string;
	/** Customer ID(s) to exclude from results (e.g. the subscription subscriber) */
	excludeId?: string | string[];
	/** When false, search runs only after a non-empty query (default: true) */
	fetchOnEmptyQuery?: boolean;
}

/**
 * Multi-select customers via async search (name). Opens with a populated list when the query is empty.
 */
const CustomerMultiSearchSelect: React.FC<CustomerMultiSearchSelectProps> = ({
	limit = 50,
	searchPlaceholder,
	excludeId,
	fetchOnEmptyQuery = true,
	...props
}) => {
	const { t } = useTranslation('customers');
	const resolvedPlaceholder = searchPlaceholder ?? t('select.searchCustomers');

	const searchFn = async (query: string) => {
		const response = await CustomerApi.searchCustomers(query, limit);
		const excludeIds = excludeId ? (Array.isArray(excludeId) ? excludeId : [excludeId]) : [];
		const filtered = response.items.filter((customer) => !excludeIds.includes(customer.id));

		return filtered.map((customer) => ({
			value: customer.id,
			label: customer.name,
			data: customer,
		}));
	};

	return (
		<AsyncMultiSearchableSelect<Customer>
			{...props}
			search={{
				searchFn,
				placeholder: resolvedPlaceholder,
				fetchOnEmptyQuery,
			}}
			extractors={{
				valueExtractor: (c) => c.id,
				labelExtractor: (c) => c.name,
			}}
		/>
	);
};

export default CustomerMultiSearchSelect;
