import type { TFunction } from 'i18next';
import {
	FilterField,
	FilterFieldType,
	DEFAULT_OPERATORS_PER_DATA_TYPE,
	DataType,
	SortOption,
	SortDirection,
	FilterCondition,
	FilterOperator,
} from '@/types/common/QueryBuilder';
import { GROUP_ENTITY_TYPE } from '@/models/Group';

export const groupsInitialFilters: FilterCondition[] = [];

export function getGroupsSortOptions(t: TFunction<'catalog'>): SortOption[] {
	return [
		{ field: 'name', label: t('groups.listPage.sortLabels.name'), direction: SortDirection.ASC },
		{ field: 'created_at', label: t('groups.listPage.sortLabels.createdAt'), direction: SortDirection.DESC },
		{ field: 'updated_at', label: t('groups.listPage.sortLabels.updatedAt'), direction: SortDirection.DESC },
	];
}

export function getGroupsFilterOptions(t: TFunction<'catalog'>): FilterField[] {
	return [
		{
			field: 'name',
			label: t('groups.listPage.filterLabels.name'),
			fieldType: FilterFieldType.INPUT,
			operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
			dataType: DataType.STRING,
		},
		{
			field: 'lookup_key',
			label: t('groups.listPage.filterLabels.lookupKey'),
			fieldType: FilterFieldType.INPUT,
			operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.STRING],
			dataType: DataType.STRING,
		},
		{
			field: 'created_at',
			label: t('groups.listPage.filterLabels.createdAt'),
			fieldType: FilterFieldType.DATEPICKER,
			operators: DEFAULT_OPERATORS_PER_DATA_TYPE[DataType.DATE],
			dataType: DataType.DATE,
		},
		{
			field: 'entity_type',
			label: t('groups.listPage.filterLabels.entityType'),
			fieldType: FilterFieldType.SELECT,
			operators: [FilterOperator.EQUAL],
			dataType: DataType.STRING,
			options: Object.values(GROUP_ENTITY_TYPE).map((value) => ({
				value,
				label:
					value === GROUP_ENTITY_TYPE.PRICE
						? t('groups.drawer.entityPrice')
						: value === GROUP_ENTITY_TYPE.FEATURE
							? t('groups.drawer.entityFeature')
							: value,
			})),
		},
	];
}

export function getGroupsInitialSorts(t: TFunction<'catalog'>): SortOption[] {
	return [{ field: 'updated_at', label: t('groups.listPage.sortLabels.updatedAt'), direction: SortDirection.DESC }];
}
