import { FC, ReactNode } from 'react';
import { Input } from '@/components/atoms';

interface Props {
	value: string;
	onChange: (value: string) => void;
	precision?: number;
	min?: number;
	max?: number;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	error?: string;
	description?: string;
	suffix?: string;
	id?: string;
	className?: string;
	/** Passed to the native input when `label` is omitted (accessibility). */
	ariaLabel?: string;
	/** Shown before the input (e.g. currency symbol). */
	inputPrefix?: ReactNode;
}

const DecimalUsageInput: FC<Props> = ({
	value,
	onChange,
	precision = 3,
	min = 0,
	max,
	label,
	placeholder = '0.000',
	disabled = false,
	error,
	description,
	suffix,
	id,
	className,
	ariaLabel,
	inputPrefix,
}) => {
	const validateDecimal = (value: string): boolean => {
		if (value.trim() === '') {
			return true;
		}

		// Allow decimal numbers with specified precision
		const decimalRegex = new RegExp(`^\\d*\\.?\\d{0,${precision}}$`);
		if (!decimalRegex.test(value)) {
			return false;
		}

		// Check for multiple decimal points
		const decimalCount = (value.match(/\./g) || []).length;
		if (decimalCount > 1) {
			return false;
		}

		// Validate range if value is not empty
		if (value.trim() !== '') {
			const numValue = parseFloat(value);
			if (isNaN(numValue)) {
				return false;
			}

			if (min !== undefined && numValue < min) {
				return false;
			}

			if (max !== undefined && numValue > max) {
				return false;
			}
		}

		return true;
	};

	const handleChange = (newValue: string) => {
		if (validateDecimal(newValue)) {
			onChange(newValue);
		}
	};

	return (
		<Input
			id={id}
			className={className}
			aria-label={ariaLabel}
			label={label}
			value={value}
			onChange={handleChange}
			placeholder={placeholder}
			disabled={disabled}
			error={error}
			description={description}
			suffix={suffix}
			inputPrefix={inputPrefix}
			variant='formatted-number'
		/>
	);
};

export default DecimalUsageInput;
