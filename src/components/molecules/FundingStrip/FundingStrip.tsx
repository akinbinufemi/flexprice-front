import React from 'react';
import { config, AUTH_PROVIDER } from '@/config/config';

const FUNDING_URL =
	'https://entrepreneur.economictimes.indiatimes.com/news/funding/flexprice-secures-15-million-in-seed-funding-to-revolutionize-ai-billing-solutions/131320984';

const FundingStrip: React.FC = () => {
	// Only show in production with Supabase auth
	if (!config.app.isProd || config.auth.provider !== AUTH_PROVIDER.Supabase) {
		return null;
	}

	return (
		<div
			className='w-full flex items-center justify-center px-4 py-1.5 shrink-0'
			style={{ background: '#092A3D' }}>
			<p className='text-[13px] font-normal text-white'>
				Flexprice Raises $1.5M SEED Round &nbsp;|&nbsp;{' '}
				<a
					href={FUNDING_URL}
					target='_blank'
					rel='noopener noreferrer'
					className='text-white font-normal underline hover:opacity-80'
					style={{ textDecoration: 'underline' }}>
					KNOW MORE
				</a>
			</p>
		</div>
	);
};

export default FundingStrip;
