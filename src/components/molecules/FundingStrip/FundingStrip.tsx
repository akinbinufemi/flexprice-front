import React from 'react';

const FUNDING_URL =
	'https://entrepreneur.economictimes.indiatimes.com/news/funding/flexprice-secures-15-million-in-seed-funding-to-revolutionize-ai-billing-solutions/131320984';

const FundingStrip: React.FC = () => {
	return (
		<div
			className='w-full flex items-center justify-center px-4 py-2.5 shrink-0'
			style={{ background: '#103952' }}>
			<p className='text-[13px] font-normal text-white'>
				Flexprice Raises $1.5M SEED Round &nbsp;|&nbsp;{' '}
				<a
					href={FUNDING_URL}
					target='_blank'
					rel='noopener noreferrer'
					className='text-white font-normal hover:opacity-80'
					style={{ textDecoration: 'none' }}>
					KNOW MORE
				</a>
			</p>
		</div>
	);
};

export default FundingStrip;
