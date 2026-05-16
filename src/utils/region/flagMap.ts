import * as Flags from 'country-flag-icons/react/3x2';
import React from 'react';

type FlagComponent = React.ComponentType<{ className?: string }>;

export function getFlagComponent(countryCode: string): FlagComponent | null {
	return (Flags as Record<string, FlagComponent>)[countryCode.toUpperCase()] ?? null;
}
