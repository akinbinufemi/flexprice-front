import { Button, Chip, Loader, Page, ShortPagination } from '@/components/atoms';
import { ApiDocsContent, ColumnData, FlexpriceTable, ImportFileDrawer } from '@/components/molecules';
import { EmptyPage } from '@/components/organisms';
import { buildGuides } from '@/constants/guides';
import { API_DOCS_TAGS } from '@/constants/apiDocsTags';
import usePagination from '@/hooks/usePagination';
import { ImportTask } from '@/models/ImportTask';
import TaskApi from '@/api/TaskApi';
import formatDate from '@/utils/common/format_date';
import { toSentenceCase } from '@/utils/common/helper_functions';
import { useQuery } from '@tanstack/react-query';
import { Import, RefreshCw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const mapStatusLabel = (status: string, tSuccessful: () => string, tFailed: () => string, tQueued: () => string): string => {
	if (status === 'COMPLETED') return tSuccessful();
	if (status === 'FAILED') return tFailed();
	if (status === 'PROCESSING' || status === 'PENDING') return tQueued();
	return '';
};

const ImportExport = () => {
	const { t } = useTranslation('settings');
	const { t: tGuide } = useTranslation('guides');
	const guides = useMemo(() => buildGuides(tGuide), [tGuide]);
	const [drawerOpen, setdrawerOpen] = useState(false);
	const { limit, offset, page } = usePagination();
	const [activeTask, setactiveTask] = useState();

	const columns: ColumnData<ImportTask>[] = useMemo(
		() => [
			{
				title: t('bulkImports.columns.fileName'),
				render(rowData) {
					return <div>{rowData.file_name || t('bulkImports.placeholders.noFileName')}</div>;
				},
			},
			{
				title: t('bulkImports.columns.entityType'),
				render(rowData) {
					return <div>{toSentenceCase(rowData.entity_type)}</div>;
				},
			},
			{
				title: t('bulkImports.columns.status'),

				render(rowData) {
					return (
						<Chip
							variant={rowData?.task_status === 'COMPLETED' ? 'success' : 'default'}
							label={mapStatusLabel(
								rowData?.task_status ?? '',
								() => t('import.taskStatus.successful'),
								() => t('import.taskStatus.failed'),
								() => t('import.taskStatus.queued'),
							)}
						/>
					);
				},
			},
			{
				title: t('bulkImports.columns.startedAt'),
				render: (rowData) => formatDate(rowData.started_at),
			},
			{
				title: t('bulkImports.columns.updatedAt'),
				render: (rowData) => formatDate(rowData.updated_at),
			},
		],
		[t],
	);

	useEffect(() => {
		if (!drawerOpen) {
			setactiveTask(undefined);
		}
	}, [drawerOpen]);

	const {
		data,
		isLoading,
		error,
		refetch: refetchTasks,
	} = useQuery({
		queryKey: ['importTasks', page],
		queryFn: async () => {
			return await TaskApi.getAllTasks({
				task_type: 'IMPORT',
				limit,
				offset,
			});
		},
	});

	if (isLoading) {
		return <Loader />;
	}

	if (error) {
		toast.error(t('bulkImports.errors.fetchFailed'));
	}

	if (data?.items.length === 0) {
		return (
			<EmptyPage
				heading={t('bulkImports.title')}
				onAddClick={() => setdrawerOpen(true)}
				emptyStateCard={{
					heading: t('bulkImports.empty.readyTitle'),
					description: t('bulkImports.empty.readyDescription'),
					buttonLabel: t('bulkImports.empty.createTaskButton'),
					buttonAction: () => {
						setdrawerOpen(true);
					},
				}}
				tutorials={guides.importExport.tutorials}
				tags={API_DOCS_TAGS.Tasks}>
				<ImportFileDrawer taskId={activeTask} isOpen={drawerOpen} onOpenChange={(value) => setdrawerOpen(value)} />
			</EmptyPage>
		);
	}

	return (
		<Page
			heading={t('bulkImports.title')}
			headingCTA={
				<>
					<Button
						variant='outline'
						onClick={() => {
							refetchTasks();
						}}>
						<RefreshCw />
					</Button>
					<Button onClick={() => setdrawerOpen(true)} className='flex gap-2 items-center '>
						<Import />
						<span>{t('bulkImports.importFile')}</span>
					</Button>
				</>
			}>
			<ApiDocsContent tags={API_DOCS_TAGS.Tasks} />
			{/* import export drawer */}
			<ImportFileDrawer taskId={activeTask} isOpen={drawerOpen} onOpenChange={(value) => setdrawerOpen(value)} />

			<div>
				<FlexpriceTable
					onRowClick={(row) => {
						setactiveTask(row.id);
						setdrawerOpen(true);
					}}
					data={data?.items ?? []}
					columns={columns}
					showEmptyRow
				/>

				<ShortPagination unit={t('bulkImports.paginationUnit')} totalItems={data?.pagination.total ?? 0} />
			</div>
		</Page>
	);
};

export default ImportExport;
