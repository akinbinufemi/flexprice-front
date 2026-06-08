import { Toaster } from 'react-hot-toast';

/** Shared toast config — used in App and Storybook. */
export const appToastOptions = {
	duration: 4000,
	style: {
		maxWidth: 'min(calc(100vw - 32px), 520px)',
		overflowWrap: 'break-word' as const,
	},
	success: {
		iconTheme: {
			primary: '#5CA7A0',
			secondary: '#fff',
		},
		className: 'whitespace-nowrap',
	},
	error: {
		iconTheme: {
			primary: '#E76E50',
			secondary: '#fff',
		},
		className: 'break-words',
	},
};

const AppToaster = () => (
	<Toaster
		toastOptions={appToastOptions}
		position='bottom-center'
		containerStyle={{
			bottom: '80px',
		}}
	/>
);

export default AppToaster;
