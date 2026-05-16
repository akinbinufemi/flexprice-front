import { Plus } from 'lucide-react';
import Button, { ButtonProps } from './Button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface AddButtonProps extends Omit<ButtonProps, 'prefixIcon'> {
	/**
	 * Custom label text. Defaults to t('actions.add')
	 */
	label?: string;
}

const AddButton = ({ label, className, children, ...props }: AddButtonProps) => {
	const { t } = useTranslation('common');
	const defaultLabel = t('actions.add');
	return (
		<Button prefixIcon={<Plus />} className={cn('gap-1', className)} {...props}>
			{children || label || defaultLabel}
		</Button>
	);
};

export default AddButton;
