import { FC, useEffect, useState, useMemo } from 'react';
import { Sheet, Spacer, Button, Checkbox } from '@/components/atoms';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserApi } from '@/api/UserApi';
import RbacApi, { RbacRole } from '@/api/RbacApi';
import { toast } from 'react-hot-toast';
import { AlertTriangle, Info } from 'lucide-react';
import { refetchQueries } from '@/core/services/tanstack/ReactQueryProvider';
import { useTranslation } from 'react-i18next';

interface Props {
	isOpen: boolean;
	onOpenChange: (value: boolean) => void;
}

const ServiceAccountDrawer: FC<Props> = ({ isOpen, onOpenChange }) => {
	const { t } = useTranslation(['developers', 'common']);
	const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
	const queryClient = useQueryClient();

	const {
		data: roles,
		isLoading: isLoadingRoles,
		isError: isRolesError,
	} = useQuery<RbacRole[]>({
		queryKey: ['rbac-roles'],
		queryFn: () => RbacApi.getAllRoles(),
		enabled: isOpen,
		retry: false,
	});

	const roleOptions = useMemo(() => {
		if (!roles || !Array.isArray(roles)) {
			return [];
		}
		return roles.map((role) => ({
			label: role.name,
			value: role.id,
		}));
	}, [roles]);

	useEffect(() => {
		if (isOpen) {
			setSelectedRoles([]);
		}
	}, [isOpen]);

	const toggleRole = (roleValue: string) => {
		setSelectedRoles((prev) => {
			if (prev.includes(roleValue)) {
				return prev.filter((r) => r !== roleValue);
			}
			return [...prev, roleValue];
		});
	};

	const { mutate: createServiceAccount, isPending } = useMutation({
		mutationFn: async () => {
			const payload = {
				type: 'service_account' as const,
				roles: selectedRoles,
			};

			return UserApi.createServiceAccount(payload);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['service-accounts'] });
			refetchQueries(['secret-keys']);
			toast.success(t('developers:serviceAccountDrawer.createSuccess'));
			onOpenChange(false);
		},
		onError: (error: Error) => {
			toast.error(error.message || t('developers:serviceAccountDrawer.createFailed'));
		},
	});

	const isFormValid = useMemo(() => selectedRoles.length > 0, [selectedRoles]);

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={onOpenChange}
			title={t('developers:serviceAccountDrawer.title')}
			description={t('developers:serviceAccountDrawer.description')}>
			<div className='space-y-4'>
				<Spacer className='!h-4' />

				<div className='bg-blue-50 border border-blue-200 rounded-md p-3'>
					<div className='flex items-start gap-2'>
						<Info className='w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5' />
						<div className='text-sm text-blue-800'>
							<p className='font-medium mb-1'>{t('developers:serviceAccountDrawer.intro.title')}</p>
							<p>{t('developers:serviceAccountDrawer.intro.body')}</p>
						</div>
					</div>
				</div>

				{isRolesError ? (
					<div className='bg-amber-50 border border-amber-200 rounded-md p-3'>
						<div className='flex items-start gap-2'>
							<AlertTriangle className='w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5' />
							<div className='text-sm text-amber-800'>
								<p className='font-medium mb-1'>{t('developers:serviceAccountDrawer.rolesUnavailable.title')}</p>
								<p>{t('developers:serviceAccountDrawer.rolesUnavailable.body')}</p>
							</div>
						</div>
					</div>
				) : (
					<div className='space-y-2'>
						<label className='block text-sm font-medium text-gray-700'>
							{t('developers:labels.roleRequiredHint')} <span className='text-red-500'>*</span>
						</label>
						<p className='text-sm text-gray-500 mb-2'>{t('developers:serviceAccountDrawer.rolesHint')}</p>
						<div className='border rounded-md p-4 space-y-3 bg-white'>
							{isLoadingRoles ? (
								<p className='text-sm text-gray-500'>{t('developers:serviceAccountDrawer.loadingRoles')}</p>
							) : roleOptions.length === 0 ? (
								<p className='text-sm text-gray-500'>{t('developers:serviceAccountDrawer.noRolesAvailable')}</p>
							) : (
								roleOptions.map((role) => (
									<div key={role.value} className='flex items-center space-x-2'>
										<Checkbox
											id={`role-${role.value}`}
											checked={selectedRoles.includes(role.value)}
											onCheckedChange={() => toggleRole(role.value)}
										/>
										<label
											htmlFor={`role-${role.value}`}
											className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'>
											{role.label}
										</label>
									</div>
								))
							)}
						</div>
					</div>
				)}

				{selectedRoles.length > 0 && (
					<div className='space-y-2'>
						<label className='block text-sm font-medium text-gray-700'>{t('developers:labels.selectedRoles')}</label>
						<div className='flex flex-wrap gap-1'>
							{selectedRoles.map((role) => (
								<span key={role} className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800'>
									{roleOptions.find((r) => r.value === role)?.label || role}
								</span>
							))}
						</div>
					</div>
				)}

				<Spacer className='!h-0' />
				<Button isLoading={isPending} disabled={!isFormValid || isRolesError} onClick={() => createServiceAccount()}>
					{t('developers:serviceAccountDrawer.submit')}
				</Button>
			</div>
		</Sheet>
	);
};

export default ServiceAccountDrawer;
