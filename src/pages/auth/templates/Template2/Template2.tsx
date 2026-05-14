import React from 'react';
import { useTranslation } from 'react-i18next';
import { useBrand } from '@/config/branding';
import { Template2Config } from '@/config/authTemplates';
import { AuthTab } from '../../authTabs';
import RegionSelector from '@/components/molecules/RegionSelector/RegionSelector';
import LocaleSelector from '@/components/molecules/LocaleSelector/LocaleSelector';
import LoginForm from '../../LoginForm';
import SignupForm from '../../SignupForm';
import ForgotPasswordForm from '../../ForgotPasswordForm';
import ResetPasswordForm from '../../ResetPasswordForm';

interface Template2Props {
	config: Template2Config;
	currentTab: AuthTab;
	switchTab: (tab: AuthTab) => void;
}

const Template2: React.FC<Template2Props> = ({ config, currentTab, switchTab }) => {
	const { t } = useTranslation('auth');
	const { logo, name } = useBrand();

	const renderForm = () => {
		switch (currentTab) {
			case AuthTab.SIGNUP:
				return <SignupForm switchTab={switchTab} />;
			case AuthTab.FORGOT_PASSWORD:
				return <ForgotPasswordForm switchTab={switchTab} />;
			case AuthTab.RESET_PASSWORD:
				return <ResetPasswordForm switchTab={switchTab} />;
			default:
				return <LoginForm switchTab={switchTab} />;
		}
	};

	const rightPanelStyle: React.CSSProperties = config.loginBgImage
		? { backgroundImage: `url(${config.loginBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
		: { backgroundColor: '#0f0f0f' };

	return (
		<div className='flex w-full min-h-screen bg-white page !p-0 !flex-row'>
			{/* Left — login form */}
			<div className='w-[45%] flex flex-col'>
				<div className='flex-1 flex justify-center items-center'>
					<div className='flex flex-col justify-center max-w-xl w-[65%] mx-auto'>
						<div className='flex justify-center mb-4'>
							<img src={logo} alt={`${name} Logo`} className='h-12' />
						</div>
						{currentTab === AuthTab.SIGNUP && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>{t('createAccount.heading')}</h2>
								<p className='text-center text-gray-600 mb-10'>{t('createAccount.subheading', { brandName: name })}</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{currentTab === AuthTab.LOGIN && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-3'>{t('login.heading')}</h2>
								<p className='text-center text-gray-600 mb-10'>{t('login.subheading')}</p>
								<div className='mb-6'>
									<RegionSelector />
								</div>
							</>
						)}
						{currentTab === AuthTab.FORGOT_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>{t('forgotPassword.heading')}</h2>
								<p className='text-center text-gray-600 mb-8'>{t('forgotPassword.subheading')}</p>
							</>
						)}
						{currentTab === AuthTab.RESET_PASSWORD && (
							<>
								<h2 className='text-3xl font-medium text-center text-gray-800 mb-2'>{t('resetPassword.heading')}</h2>
								<p className='text-center text-gray-600 mb-8'>{t('resetPassword.subheading')}</p>
							</>
						)}
						{renderForm()}
						<div className='mt-6 flex justify-start'>
							<LocaleSelector />
						</div>
					</div>
				</div>
			</div>

			{/* Right — background image, logo top-left, tagline bottom-left (always LTR regardless of locale) */}
			<div className='w-[55%] min-h-screen relative' style={rightPanelStyle} dir='ltr'>
				<div className='absolute inset-0 flex flex-col justify-between items-start p-10'>
					<img src={config.landingLogo ?? logo} alt={name} className='max-h-12 object-contain object-left' />
					{config.tagline && (
						<p className='text-3xl font-bold text-white leading-tight text-left' style={{ maxWidth: '16rem' }}>
							{config.tagline}
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

export default Template2;
