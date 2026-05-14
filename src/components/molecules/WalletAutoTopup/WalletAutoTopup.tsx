import React, { useState, useEffect } from 'react';
import { Dialog, Button, Input, Toggle } from '@/components/atoms';
import { toast } from 'react-hot-toast';
import { PremiumFeatureIcon } from '../PremiumFeature/PremiumFeature';
import { useTranslation } from 'react-i18next';

export interface AutoTopupConfig {
	enabled: boolean;
	threshold: string;
	amount: string;
	invoicing: boolean;
}

interface WalletAutoTopupProps {
	open: boolean;
	autoTopupConfig: AutoTopupConfig | undefined;
	onSave: (config: AutoTopupConfig) => void;
	onClose: () => void;
}

const WalletAutoTopup: React.FC<WalletAutoTopupProps> = ({ open, autoTopupConfig, onSave, onClose }) => {
	const { t } = useTranslation('billing');
	const [localConfig, setLocalConfig] = useState<AutoTopupConfig>(
		autoTopupConfig || {
			enabled: false,
			threshold: '0.00',
			amount: '0.00',
			invoicing: false,
		},
	);

	// Sync local state with props
	useEffect(() => {
		setLocalConfig(
			autoTopupConfig || {
				enabled: false,
				threshold: '0.00',
				amount: '0.00',
				invoicing: false,
			},
		);
	}, [autoTopupConfig, open]);

	const handleSave = () => {
		if (localConfig.enabled) {
			if (!localConfig.threshold || isNaN(parseFloat(localConfig.threshold))) {
				toast.error('Please enter a valid threshold value');
				return;
			}
			if (!localConfig.amount || isNaN(parseFloat(localConfig.amount)) || parseFloat(localConfig.amount) <= 0) {
				toast.error('Please enter a valid amount value greater than 0');
				return;
			}
		}

		onSave(localConfig);
	};

	const handleClose = () => {
		// Reset to original values
		setLocalConfig(
			autoTopupConfig || {
				enabled: false,
				threshold: '0.00',
				amount: '0.00',
				invoicing: false,
			},
		);
		onClose();
	};

	return (
		<Dialog
			className='min-w-max'
			isOpen={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) handleClose();
			}}
			title={
				<div className='flex items-center gap-2'>
					<span className='text-lg font-medium'>{t('wallet.autoTopup.dialogTitle')}</span>
					<PremiumFeatureIcon />
				</div>
			}
			showCloseButton>
			<div className='flex flex-col gap-6 min-w-[500px]'>
				{/* Enable Auto Top-Up Toggle */}
				<Toggle
					title={t('wallet.autoTopup.enableTitle')}
					label={t('wallet.autoTopup.enableLabel')}
					description={t('wallet.autoTopup.enableDescription')}
					checked={localConfig.enabled}
					onChange={(enabled) => setLocalConfig({ ...localConfig, enabled })}
				/>

				{/* Auto Top-Up Configuration */}
				{localConfig.enabled && (
					<div className='space-y-4'>
						{/* Threshold Input */}
						<div className='space-y-2'>
							<Input
								label={t('wallet.autoTopup.thresholdLabel')}
								placeholder={t('wallet.autoTopup.thresholdPlaceholder')}
								value={localConfig.threshold}
								onChange={(value) => setLocalConfig({ ...localConfig, threshold: value })}
								type='number'
								step='0.01'
								description={t('wallet.autoTopup.thresholdDescription')}
							/>
						</div>

						{/* Amount Input */}
						<div className='space-y-2'>
							<Input
								label={t('wallet.autoTopup.amountLabel')}
								placeholder={t('wallet.autoTopup.amountPlaceholder')}
								value={localConfig.amount}
								onChange={(value) => setLocalConfig({ ...localConfig, amount: value })}
								type='number'
								step='0.01'
								min='0'
								description={t('wallet.autoTopup.amountDescription')}
							/>
						</div>

						{/* Invoicing Toggle */}
						<Toggle
							title={t('wallet.autoTopup.invoiceTitle')}
							label={t('wallet.autoTopup.invoiceLabel')}
							description={
								localConfig.invoicing
									? t('wallet.autoTopup.invoiceDescriptionWhenInvoiced')
									: t('wallet.autoTopup.invoiceDescriptionImmediate')
							}
							checked={localConfig.invoicing}
							onChange={(invoicing) => setLocalConfig({ ...localConfig, invoicing })}
						/>
					</div>
				)}

				{/* Action Buttons */}
				<div className='flex justify-end gap-2 mt-6'>
					<Button variant='outline' onClick={handleClose}>
						{t('wallet.autoTopup.cancel')}
					</Button>
					<Button onClick={handleSave}>{t('wallet.autoTopup.saveChanges')}</Button>
				</div>
			</div>
		</Dialog>
	);
};

export default WalletAutoTopup;
