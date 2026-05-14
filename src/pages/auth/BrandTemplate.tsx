// src/pages/auth/BrandTemplate.tsx
import React from 'react';
import { config } from '@/config/config';
import { AUTH_TEMPLATE } from '@/config/authTemplates';
import { AuthTab } from './authTabs';
import Template1 from './templates/Template1/Template1';
import Template2 from './templates/Template2/Template2';

interface BrandTemplateProps {
	currentTab: AuthTab;
	switchTab: (tab: AuthTab) => void;
}

const BrandTemplate: React.FC<BrandTemplateProps> = ({ currentTab, switchTab }) => {
	const { authPage } = config;

	switch (authPage.template) {
		case AUTH_TEMPLATE.TEMPLATE_2:
			// TypeScript narrows authPage.config to Template2Config here
			return <Template2 config={authPage.config} currentTab={currentTab} switchTab={switchTab} />;
		case AUTH_TEMPLATE.TEMPLATE_1:
		default:
			// TypeScript narrows authPage.config to Template1Config here
			return <Template1 config={authPage.config} currentTab={currentTab} switchTab={switchTab} />;
	}
};

export default BrandTemplate;
