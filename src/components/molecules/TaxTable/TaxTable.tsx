import { FC, useMemo } from 'react';
import FlexpriceTable, { ColumnData, TooltipCell } from '../Table';
import { TaxRateResponse } from '@/types/dto/tax';
import { Chip, ActionButton } from '@/components/atoms';
import { formatDateShort } from '@/utils/common/helper_functions';
import { TAX_RATE_TYPE, TAX_RATE_STATUS, TaxRate } from '@/models/Tax';
import TaxApi from '@/api/TaxApi';
import { RouteNames } from '@/core/routes/Routes';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';

interface Props {
	data: TaxRateResponse[];
	onEdit?: (tax: TaxRateResponse) => void;
}

const TaxTable: FC<Props> = ({ data, onEdit }) => {
	const navigate = useNavigate();
	const { t } = useTranslation('billing');
	const naLabel = t('taxes.table.na');

	const columns: ColumnData<TaxRate>[] = useMemo(() => {
		const getTaxTypeLabel = (type: TAX_RATE_TYPE) => {
			switch (type) {
				case TAX_RATE_TYPE.PERCENTAGE:
					return t('taxes.rateType.percentage');
				case TAX_RATE_TYPE.FIXED:
					return t('taxes.rateType.fixedAmount');
				default:
					return t('taxes.rateType.unknown');
			}
		};

		const formatTaxValue = (tax: TaxRateResponse) => {
			if (tax.tax_rate_type === TAX_RATE_TYPE.PERCENTAGE && tax.percentage_value !== undefined) {
				return t('taxes.table.percentageFormatted', { value: tax.percentage_value });
			}
			if (tax.tax_rate_type === TAX_RATE_TYPE.FIXED && tax.fixed_value !== undefined) {
				return `${tax.fixed_value}`;
			}
			return naLabel;
		};

		const statusLabel = (status: TAX_RATE_STATUS | undefined) => {
			switch (status) {
				case TAX_RATE_STATUS.ACTIVE:
					return t('taxes.table.chipStatus.active');
				case TAX_RATE_STATUS.INACTIVE:
					return t('taxes.table.chipStatus.inactive');
				case TAX_RATE_STATUS.DELETED:
					return t('taxes.table.chipStatus.archived');
				default:
					return t('taxes.table.chipStatus.inactive');
			}
		};

		return [
			{
				title: t('taxes.table.name'),
				fieldName: 'name',
			},
			{
				title: t('taxes.table.code'),
				render: (row) => <TooltipCell tooltipContent={row.code} tooltipText={row.code} />,
			},
			{
				title: t('taxes.table.type'),
				render: (row) => getTaxTypeLabel(row.tax_rate_type),
			},
			{
				title: t('taxes.table.value'),
				render: (row) => formatTaxValue(row),
			},
			{
				title: t('taxes.table.status'),
				render: (row) => {
					const label = statusLabel(row.tax_rate_status);
					return <Chip variant={row.tax_rate_status === TAX_RATE_STATUS.ACTIVE ? 'success' : 'default'} label={label} />;
				},
			},
			{
				title: t('taxes.table.created'),
				render: (row) => formatDateShort(row.created_at),
			},
			{
				fieldVariant: 'interactive',
				render(row) {
					return (
						<ActionButton
							id={row?.id}
							deleteMutationFn={async () => {
								return await TaxApi.deleteTaxRate(row?.id);
							}}
							refetchQueryKey='fetchTaxRates'
							entityName={row?.name}
							edit={{
								enabled: true,
								onClick: () => onEdit?.(row),
							}}
							archive={{
								enabled: row?.tax_rate_status !== TAX_RATE_STATUS.DELETED,
							}}
						/>
					);
				},
			},
		];
	}, [t, naLabel, onEdit]);

	return (
		<div>
			<FlexpriceTable onRowClick={(row) => navigate(`${RouteNames.taxes}/${row.id}`)} showEmptyRow={true} columns={columns} data={data} />
		</div>
	);
};

export default TaxTable;
