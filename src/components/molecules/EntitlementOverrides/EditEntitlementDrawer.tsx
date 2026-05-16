import { FC, useEffect, useState } from 'react';
import { Sheet, Label, Input, Button, Checkbox } from '@/components/atoms';
import { Switch } from '@/components/ui/switch';
import { FEATURE_TYPE } from '@/models';
import { EntitlementOverrideRequest } from '@/types/dto/Subscription';
import { useTranslation } from 'react-i18next';

interface EditEntitlementDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	entitlement: any | null;
	onSave: (override: EntitlementOverrideRequest) => void;
	onReset?: (entitlementId: string) => void;
}

const EditEntitlementDrawer: FC<EditEntitlementDrawerProps> = ({ isOpen, onOpenChange, entitlement, onSave, onReset }) => {
	const { t } = useTranslation('catalog');
	const [usageLimit, setUsageLimit] = useState<string>('');
	const [isInfinite, setIsInfinite] = useState<boolean>(false);
	const [staticValue, setStaticValue] = useState<string>('');
	const [isEnabled, setIsEnabled] = useState<boolean>(true);

	useEffect(() => {
		if (entitlement) {
			const currentLimit = 'displayUsageLimit' in entitlement ? entitlement.displayUsageLimit : entitlement.usage_limit;
			const isCurrentlyInfinite = currentLimit === null;

			setIsInfinite(isCurrentlyInfinite);
			setUsageLimit(isCurrentlyInfinite ? '' : currentLimit?.toString() || '');
			setStaticValue(entitlement.displayStaticValue || entitlement.static_value || '');
			setIsEnabled(entitlement.displayIsEnabled ?? entitlement.is_enabled ?? true);
		}
	}, [entitlement]);

	const handleSave = () => {
		if (!entitlement) return;

		const override: EntitlementOverrideRequest = {
			entitlement_id: entitlement.id,
		};

		if (entitlement.feature_type === FEATURE_TYPE.METERED) {
			if (isInfinite) {
				override.usage_limit = null;
			} else {
				const parsedLimit = parseInt(usageLimit, 10);
				if (!isNaN(parsedLimit)) {
					override.usage_limit = parsedLimit;
				}
			}
		} else if (entitlement.feature_type === FEATURE_TYPE.STATIC) {
			override.static_value = staticValue;
		} else if (entitlement.feature_type === FEATURE_TYPE.BOOLEAN) {
			override.is_enabled = isEnabled;
		}

		onSave(override);
	};

	const handleCancel = () => {
		onOpenChange(false);
	};

	const handleReset = () => {
		if (!entitlement || !onReset) return;

		const originalLimit = entitlement.usage_limit;
		const isOriginallyInfinite = originalLimit === null;

		setIsInfinite(isOriginallyInfinite);
		setUsageLimit(isOriginallyInfinite ? '' : originalLimit?.toString() || '');
		setStaticValue(entitlement.static_value || '');
		setIsEnabled(entitlement.is_enabled ?? true);

		onReset(entitlement.id);
		onOpenChange(false);
	};

	const handleOpenChange = (open: boolean) => {
		onOpenChange(open);
		if (!open) {
			const currentLimit = entitlement && 'displayUsageLimit' in entitlement ? entitlement.displayUsageLimit : entitlement?.usage_limit;
			const isCurrentlyInfinite = currentLimit === null;

			setIsInfinite(isCurrentlyInfinite);
			setUsageLimit(isCurrentlyInfinite ? '' : currentLimit?.toString() || '');
			setStaticValue(entitlement?.displayStaticValue || entitlement?.static_value || '');
			setIsEnabled(entitlement?.displayIsEnabled ?? entitlement?.is_enabled ?? true);
		}
	};

	if (!entitlement) return null;

	const featureName = entitlement.feature?.name || t('entitlements.editDrawer.unknownFeature');

	return (
		<Sheet
			isOpen={isOpen}
			onOpenChange={handleOpenChange}
			title={t('entitlements.editDrawer.title', { name: featureName })}
			description={t('entitlements.editDrawer.description')}
			size='md'>
			<div className='space-y-5 p-6'>
				<div className='space-y-2'>
					<Label label={t('entitlements.editDrawer.featureType')} />
					<div className='text-sm text-gray-600 capitalize'>{entitlement.feature_type?.toLowerCase()}</div>
				</div>

				{entitlement.feature_type === FEATURE_TYPE.METERED && (
					<div className='space-y-4'>
						<div className='space-y-3'>
							<Label label={t('entitlements.editDrawer.usageLimit')} />
							<Input
								type='number'
								value={isInfinite ? t('entitlements.addDrawer.unlimitedDisplay') : usageLimit}
								onChange={(value) => setUsageLimit(value)}
								placeholder={t('entitlements.editDrawer.enterUsageLimitPlaceholder')}
								disabled={isInfinite}
							/>
							<div className='text-xs text-gray-500'>
								{t('entitlements.editDrawer.originalPrefix')}{' '}
								{entitlement.usage_limit === null ? t('entitlements.addDrawer.unlimitedDisplay') : entitlement.usage_limit}
								{entitlement.usage_reset_period &&
									t('entitlements.editDrawer.resetsSuffix', { period: entitlement.usage_reset_period.toLowerCase() })}
							</div>
						</div>

						<Checkbox
							id='set-infinite'
							label={t('entitlements.editDrawer.setInfiniteLabel')}
							checked={isInfinite}
							onCheckedChange={(checked) => {
								setIsInfinite(checked);
								if (checked) {
									setUsageLimit('');
								}
							}}
						/>
					</div>
				)}

				{entitlement.feature_type === FEATURE_TYPE.STATIC && (
					<div className='space-y-2'>
						<Label label={t('entitlements.editDrawer.staticValue')} />
						<Input
							value={staticValue}
							onChange={(value) => setStaticValue(value)}
							placeholder={t('entitlements.editDrawer.enterStaticPlaceholder')}
						/>
						<div className='text-xs text-gray-500'>
							{t('entitlements.editDrawer.originalPrefix')} {entitlement.static_value || t('entitlements.editDrawer.notSet')}
						</div>
					</div>
				)}

				{entitlement.feature_type === FEATURE_TYPE.BOOLEAN && (
					<div className='space-y-2'>
						<Label label={t('entitlements.editDrawer.enabledLabel')} />
						<div className='flex items-center gap-2'>
							<Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
							<span className='text-sm'>{isEnabled ? t('entitlements.editDrawer.enabled') : t('entitlements.editDrawer.disabled')}</span>
						</div>
						<div className='text-xs text-gray-500'>
							{t('entitlements.editDrawer.originalBooleanPrefix')}{' '}
							{entitlement.is_enabled ? t('entitlements.editDrawer.enabled') : t('entitlements.editDrawer.disabled')}
						</div>
					</div>
				)}

				<div className='flex justify-end gap-3 mt-4'>
					<Button variant='outline' onClick={handleCancel}>
						{t('entitlements.editDrawer.cancel')}
					</Button>
					{entitlement.hasOverride && onReset && (
						<Button variant='outline' onClick={handleReset}>
							{t('entitlements.editDrawer.resetToDefault')}
						</Button>
					)}
					<Button onClick={handleSave}>{t('entitlements.editDrawer.saveOverride')}</Button>
				</div>
			</div>
		</Sheet>
	);
};

export default EditEntitlementDrawer;
