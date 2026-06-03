import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Page, AddButton, Card, CardHeader, Loader, Button, Input, ShortPagination, Dialog } from '@/components/atoms';
import { FlatTabs, FlexpriceTable } from '@/components/molecules';
import { UserApi } from '@/api/UserApi';
import { User } from '@/models';
import toast from 'react-hot-toast';
import { ColumnData } from '@/components/molecules/Table/Table';
import { AlertTriangle, Copy, Download, Eye, EyeOff, Info, Link2, Lock, Mail } from 'lucide-react';
import { RouteNames } from '@/core/routes/Routes';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import usePagination, { PAGINATION_PREFIX } from '@/hooks/usePagination';
import type { HttpRejectedError } from '@/core/axios/types';
import { toSentenceCase } from '@/utils/common/helper_functions';

const MEMBERS_QUERY_KEY = ['settings-team-members'];
const MEMBERS_PAGE_SIZE = 10;

function MembersSection() {
	const { t } = useTranslation(['settings', 'common']);

	/** API error shape when add user fails (e.g. user limit reached, duplicate email) */
	const getAddUserErrorMessage = (err: Error): string => {
		const c = (err as HttpRejectedError).cause;
		const raw = c != null ? c : err;
		const e = raw as { error?: { internal_error?: string; message?: string }; message?: string };
		const internal = e?.error?.internal_error ?? '';
		const msg = e?.error?.message ?? e?.message ?? '';
		if (typeof internal === 'string' && internal.toLowerCase().includes('user limit')) {
			return t('members.errors.userLimitReached');
		}
		if (typeof msg === 'string' && (msg.toLowerCase().includes('limit reached') || msg.toLowerCase().includes('maximum'))) {
			return t('members.errors.userLimitReached');
		}
		if (typeof msg === 'string' && msg.toLowerCase().includes('already exists')) {
			return t('members.errors.userAlreadyExists');
		}
		if (typeof msg === 'string' && msg.length) return msg;
		return err.message || t('members.errors.failedToAddUser');
	};

	const [addOpen, setAddOpen] = useState(false);
	const [email, setEmail] = useState('');
	const [addError, setAddError] = useState<string | null>(null);
	const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);
	const [addedUserEmail, setAddedUserEmail] = useState<string | null>(null);
	const [showPassword, setShowPassword] = useState(false);
	const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

	const { limit, offset, page } = usePagination({
		initialLimit: MEMBERS_PAGE_SIZE,
		prefix: PAGINATION_PREFIX.SETTINGS_MEMBERS,
	});

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: [...MEMBERS_QUERY_KEY, page, limit, offset],
		queryFn: () => UserApi.getTenantMembers({ limit, offset }),
	});

	useEffect(() => {
		if (isError) toast.error(t('members.errors.failedToLoadMembers'));
	}, [isError, t]);

	const isValidEmail = (value: string) => /^\S+@\S+\.\S+$/.test(value);

	const createUser = useMutation({
		mutationFn: (payload: { type: 'user'; email: string }) => UserApi.addUserToTenant(payload),
		onSuccess: (res, variables) => {
			setAddOpen(false);
			setAddError(null);
			setAddedUserEmail(variables.email);
			setEmail('');
			setOneTimePassword(res.password);
			setShowPassword(false);
			setPasswordDialogOpen(true);
			refetchQueries(MEMBERS_QUERY_KEY);
		},
		onError: (err: Error) => {
			const message = getAddUserErrorMessage(err);
			setAddError(message);
			toast.error(message);
		},
	});

	const handleAddUser = () => {
		if (createUser.isPending) return;
		const trimmed = email.trim();
		setAddError(null);
		if (!trimmed) {
			toast.error(t('members.errors.enterEmail'));
			return;
		}
		if (!isValidEmail(trimmed)) {
			toast.error(t('members.errors.emailInvalid'));
			setAddError(t('members.errors.emailInvalid'));
			return;
		}
		createUser.mutate({ type: 'user', email: trimmed });
	};

	const handleAddDialogOpenChange = (open: boolean) => {
		if (!open) setAddError(null);
		setAddOpen(open);
	};

	const handleCopyPassword = async () => {
		if (!oneTimePassword) return;
		try {
			await navigator.clipboard.writeText(oneTimePassword);
			toast.success(t('common:toast.copySuccess'));
		} catch {
			toast.error(t('members.errors.copyFailed'));
		}
	};

	const loginUrl =
		addedUserEmail && oneTimePassword
			? `${window.location.origin}${RouteNames.auth}?email=${encodeURIComponent(addedUserEmail)}&password=${encodeURIComponent(oneTimePassword)}`
			: '';

	const handleCopyLoginLink = async () => {
		if (!loginUrl) return;
		try {
			await navigator.clipboard.writeText(loginUrl);
			toast.success(t('members.errors.loginLinkCopied'));
		} catch {
			toast.error(t('members.errors.copyFailed'));
		}
	};

	const handleCopyAll = async () => {
		if (!addedUserEmail || !oneTimePassword) return;
		const lines = [
			t('members.credentials.copyBlockEmailLine', { email: addedUserEmail }),
			t('members.credentials.copyBlockPasswordLine', { password: oneTimePassword }),
		];
		if (loginUrl) lines.push(t('members.credentials.copyBlockLoginLine', { url: loginUrl }));
		const block = lines.join('\n');
		try {
			await navigator.clipboard.writeText(block);
			toast.success(t('members.errors.credentialsCopied'));
		} catch {
			toast.error(t('members.errors.copyFailed'));
		}
	};

	const escapeCsvCell = (value: string) => {
		if (/[",\r\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
		return value;
	};

	const handleDownloadCsv = () => {
		if (!addedUserEmail || !oneTimePassword) return;
		const header = t('members.credentials.csvHeader');
		const row = [escapeCsvCell(addedUserEmail), escapeCsvCell(oneTimePassword), escapeCsvCell(loginUrl)];
		const csv = `${header}\r\n${row.join(',')}`;
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `flexprice-credentials-${addedUserEmail.replace(/@.*/, '').replace(/[^a-zA-Z0-9_-]/g, '_') || 'user'}.csv`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success(t('members.errors.credentialsDownloaded'));
	};

	const handleClosePasswordDialog = () => {
		setOneTimePassword(null);
		setAddedUserEmail(null);
		setPasswordDialogOpen(false);
	};

	const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

	const getRoleDisplay = (row: User) => {
		const r = row.roles?.[0];
		if (!r) return t('members.roleAdmin');
		return toSentenceCase(r);
	};

	const members: User[] = data?.items ?? [];
	const totalMembers = data?.pagination?.total ?? 0;
	const columns: ColumnData<User>[] = [
		{ title: t('members.columns.email'), fieldName: 'email' },
		{
			title: t('members.columns.role'),
			render: (row) => {
				const role = getRoleDisplay(row);
				return <span className='inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600'>{role}</span>;
			},
		},
	];

	return (
		<>
			<Card variant='default' className='rounded-xl border-gray-200 shadow-sm bg-white'>
				<CardHeader
					title={t('members.cardTitle')}
					titleClassName='text-lg font-medium text-zinc-800'
					cta={<AddButton label={t('common:actions.add')} variant='outline' onClick={() => setAddOpen(true)} />}
				/>
				{isLoading && <Loader />}
				{!isLoading && isError && (
					<div className='flex flex-col items-center justify-center gap-3 py-8 text-center'>
						<p className='text-sm text-red-700'>{t('members.errors.loadError')}</p>
						<Button variant='outline' onClick={() => refetch()}>
							{t('common:actions.retry')}
						</Button>
					</div>
				)}
				{!isLoading && !isError && (
					<>
						<div className='border-t border-gray-100 pt-4 -mx-6 px-6'>
							<FlexpriceTable columns={columns} data={members} showEmptyRow />
							<div className='text-zinc-500'>
								<ShortPagination
									prefix={PAGINATION_PREFIX.SETTINGS_MEMBERS}
									unit={t('members.unitMembers')}
									totalItems={totalMembers}
									pageSize={MEMBERS_PAGE_SIZE}
								/>
							</div>
						</div>
					</>
				)}
			</Card>

			{/* Add member dialog – premium minimal */}
			<Dialog
				isOpen={addOpen}
				onOpenChange={handleAddDialogOpenChange}
				title={t('members.addMember.title')}
				description={t('members.addMember.description')}
				titleClassName='text-lg font-semibold text-zinc-900'
				descriptionClassName='text-sm text-zinc-500'
				className='sm:max-w-[425px] rounded-xl shadow-lg border border-gray-100'>
				<div className='space-y-3 mt-3'>
					{addError && (
						<div className='w-full flex items-center gap-2.5 rounded-md border border-red-200 bg-red-50 px-3 py-2' role='alert'>
							<AlertTriangle className='h-4 w-4 flex-shrink-0 text-red-600' />
							<span className='text-sm font-medium text-red-700 leading-relaxed'>{addError}</span>
						</div>
					)}
					<div>
						<label htmlFor='member-email' className='block text-xs font-medium text-zinc-500 uppercase tracking-wide mb-1'>
							{t('members.addMember.emailLabel')}
						</label>
						<div className='flex items-center gap-2 mb-4 rounded-md border border-gray-200 bg-white'>
							<Mail className='h-4 w-4 text-zinc-400 flex-shrink-0 ml-3' />
							<Input
								id='member-email'
								type='email'
								placeholder={t('members.addMember.emailPlaceholder')}
								value={email}
								onChange={(value) => setEmail(value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										handleAddUser();
									}
								}}
								autoFocus
								className='border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0'
							/>
						</div>
					</div>
					<div className='flex justify-end'>
						<Button onClick={handleAddUser} disabled={createUser.isPending} isLoading={createUser.isPending}>
							{t('members.addMember.addUser')}
						</Button>
					</div>
				</div>
			</Dialog>

			{/* Login credentials dialog – premium minimal */}
			<Dialog
				isOpen={passwordDialogOpen}
				onOpenChange={(open) => (open ? setPasswordDialogOpen(true) : handleClosePasswordDialog())}
				title={t('members.credentials.title')}
				description={t('members.credentials.description')}
				className='w-full max-w-[480px] rounded-xl shadow-lg border border-gray-100'>
				<div className='space-y-4 mt-3'>
					{/* Email row */}
					{addedUserEmail && (
						<div>
							<span className='text-xs font-medium text-zinc-500 uppercase tracking-wide'>{t('members.addMember.emailLabel')}</span>
							<div className='mt-1 flex items-center gap-2 rounded-md border border-gray-200 bg-zinc-50 px-3 py-2 min-h-[40px]'>
								<Mail className='h-4 w-4 text-zinc-400 flex-shrink-0' />
								<span className='flex-1 min-w-0 truncate text-sm text-zinc-900'>{addedUserEmail}</span>
								<button
									type='button'
									onClick={() => {
										navigator.clipboard.writeText(addedUserEmail);
										toast.success(t('members.credentials.emailCopied'));
									}}
									className='p-1.5 text-zinc-500 hover:text-zinc-700 rounded'
									title={t('members.credentials.copyEmail')}
									aria-label={t('members.credentials.copyEmail')}>
									<Copy className='h-4 w-4' />
								</button>
							</div>
						</div>
					)}

					{/* Password row */}
					<div>
						<span className='text-xs font-medium text-zinc-500 uppercase tracking-wide'>{t('members.credentials.password')}</span>
						<div className='mt-1 relative flex items-center rounded-md border border-gray-200 bg-zinc-50 px-3 py-2 min-h-[40px]'>
							<Lock className='h-4 w-4 text-zinc-400 flex-shrink-0' />
							<Input
								id='temp-password'
								readOnly
								type={showPassword ? 'text' : 'password'}
								value={oneTimePassword ?? ''}
								className='flex-1 border-0 bg-transparent font-mono text-sm text-zinc-900 py-0 pl-2 pr-24 focus-visible:ring-0 min-h-[24px]'
							/>
							<div className='absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5'>
								<button
									type='button'
									onClick={togglePasswordVisibility}
									className='p-1.5 text-zinc-500 hover:text-zinc-700 rounded'
									title={showPassword ? t('members.credentials.hidePassword') : t('members.credentials.showPassword')}
									aria-label={showPassword ? t('members.credentials.hidePassword') : t('members.credentials.showPassword')}>
									{showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
								</button>
								<button
									type='button'
									onClick={handleCopyPassword}
									className='p-1.5 text-zinc-500 hover:text-zinc-700 rounded'
									title={t('members.credentials.copyPassword')}
									aria-label={t('members.credentials.copyPassword')}>
									<Copy className='h-4 w-4' />
								</button>
							</div>
						</div>
					</div>

					{/* Login link (magic link) */}
					{loginUrl && (
						<div className='border-t border-gray-100 pt-4'>
							<p className='text-xs text-zinc-500 mb-2'>{t('members.credentials.oneClickHint')}</p>
							<div className='flex items-center gap-2 rounded-md border border-gray-200 bg-zinc-50 px-3 py-2'>
								<Link2 className='h-4 w-4 text-zinc-400 flex-shrink-0' />
								<span className='flex-1 min-w-0 truncate text-sm text-zinc-600' title={loginUrl}>
									{loginUrl.length > 44 ? `${loginUrl.slice(0, 44)}…` : loginUrl}
								</span>
							</div>
						</div>
					)}

					{/* Actions: Download CSV, Copy all, Done */}
					<div className='flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4'>
						<Button onClick={handleCopyLoginLink} className='shrink-0'>
							<Link2 className='h-3.5 w-3.5 mr-1.5' />
							{t('members.credentials.copyLoginLink')}
						</Button>
						<Button variant='outline' size='sm' onClick={handleDownloadCsv} className='shrink-0'>
							<Download className='h-3.5 w-3.5 mr-1.5' />
							{t('members.credentials.downloadCsv')}
						</Button>
						<Button variant='outline' size='sm' onClick={handleCopyAll} className='shrink-0'>
							<Copy className='h-3.5 w-3.5 mr-1.5' />
							{t('members.credentials.copyAll')}
						</Button>
					</div>

					{/* Compact info */}
					<div className='flex flex-col gap-1.5 text-xs text-zinc-500'>
						<div className='flex items-center gap-2'>
							<AlertTriangle className='h-3.5 w-3.5 flex-shrink-0 text-amber-500' />
							<span>{t('members.credentials.passwordResetNote')}</span>
						</div>
						<div className='flex items-center gap-2'>
							<Info className='h-3.5 w-3.5 flex-shrink-0 text-sky-500' />
							<span>{t('members.credentials.signInMethodsNote')}</span>
						</div>
					</div>
				</div>
			</Dialog>
		</>
	);
}

const SettingsDashboard = () => {
	const { t } = useTranslation(['settings', 'common']);
	return (
		<Page heading={t('page.settings')} documentTitle={t('page.settings')} headingClassName='font-semibold text-2xl text-zinc-900'>
			<FlatTabs
				className='[&_.border-b]:border-gray-200'
				tabs={[
					{
						value: 'team',
						label: t('members.tabs.team'),
						content: <MembersSection />,
					},
				]}
				defaultValue='team'
			/>
		</Page>
	);
};

export default SettingsDashboard;
