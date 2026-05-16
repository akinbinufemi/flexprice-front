const tag = (t: string[]): string[] => t;

export const API_DOCS_TAGS = {
	Addons: tag(['Addons']),
	Costs: tag(['Costs']),
	Coupons: tag(['Coupons']),
	CreditNotes: tag(['Credit Notes']),
	/** Credit note detail views that also surface feature-related operations */
	CreditNotesWithFeatures: tag(['Credit Notes', 'Features']),
	Customers: tag(['Customers']),
	Events: tag(['Events']),
	Features: tag(['Features']),
	Groups: tag(['Groups']),
	Integrations: tag(['Integrations', 'secrets']),
	Invoices: tag(['Invoices']),
	Payments: tag(['Payments']),
	Plans: tag(['Plans']),
	PlansAndPrices: tag(['Plans', 'Prices']),
	PriceUnits: tag(['Price Units']),
	Secrets: tag(['secrets']),
	Subscriptions: tag(['Subscriptions', 'Subscription']),
	/** Subset used where only the Subscriptions tag is needed for OpenAPI matching */
	SubscriptionsOnly: tag(['Subscriptions']),
	Tasks: tag(['Tasks', 'ScheduledTasks']),
	TaxAssociations: tag(['Tax Associations']),
	TaxRates: tag(['Taxes', 'Tax', 'Tax Rates']),
	Tenants: tag(['Tenants']),
	Users: tag(['Users']),
	Wallets: tag(['Wallets', 'Topup']),
	Webhooks: tag(['Webhooks']),
	Workflows: tag(['Workflows']),
};
