import type { TFunction } from 'i18next';
import { FilterOperator } from '@/types/common/QueryBuilder';

/** Localized label for a filter operator (common.queryBuilder.operators.*). */
export function getOperatorDisplayLabel(t: TFunction<'common'>, operator: FilterOperator): string {
	return t(`queryBuilder.operators.${operator}`, {
		defaultValue: String(operator)
			.replace(/_/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase()),
	});
}
