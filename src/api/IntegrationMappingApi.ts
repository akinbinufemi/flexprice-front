import { AxiosClient } from '@/core/axios/verbs';
import { generateQueryParams } from '@/utils/common/api_helper';
import { Pagination } from '@/models';

export interface SyncConfig {
	inbound: boolean;
	outbound: boolean;
}

export interface IntegrationConfigItem {
	provider: string;
	base_config: Record<string, SyncConfig>;
	current_config: Record<string, SyncConfig>;
}

export interface IntegrationConfigResponse {
	integrations: IntegrationConfigItem[];
}

export interface IntegrationMappingItem {
	id: string;
	entity_id: string;
	entity_type: string;
	provider_type: string;
	provider_entity_id: string;
	provider_url: string;
	environment_id: string;
	tenant_id: string;
	status: string;
	created_at: string;
	updated_at: string;
	created_by: string;
	updated_by: string;
}

export interface IntegrationMappingsResponse {
	items: IntegrationMappingItem[];
	pagination: Pagination;
}

export interface IntegrationSyncRequest {
	entity_type: string;
	entity_id: string;
	method?: 'push' | 'pull';
}

export interface IntegrationLinkRequest {
	entity_type: string;
	entity_id: string;
	provider_type: string;
	provider_entity_id: string;
	metadata?: Record<string, string>;
}

export interface IntegrationLinkResponse {
	mapping: IntegrationMappingItem;
}

export interface IntegrationDelinkRequest {
	entity_type: string;
	entity_id: string;
	provider_type: string;
}

class IntegrationMappingApi {
	private static baseUrl = '/integrations';

	public static async getIntegrationConfig(): Promise<IntegrationConfigResponse> {
		return await AxiosClient.get<IntegrationConfigResponse>(`${this.baseUrl}/config`);
	}

	public static async getIntegrationMappings(entityType: string, entityId: string): Promise<IntegrationMappingsResponse> {
		const params = { entity_type: entityType, entity_id: entityId };
		const url = generateQueryParams(`${this.baseUrl}/mappings`, params);
		return await AxiosClient.get<IntegrationMappingsResponse>(url);
	}

	public static async syncIntegration(request: IntegrationSyncRequest): Promise<{ message: string }> {
		return await AxiosClient.post<{ message: string }>(`${this.baseUrl}/sync`, request);
	}

	public static async linkIntegration(request: IntegrationLinkRequest): Promise<IntegrationLinkResponse> {
		return await AxiosClient.post<IntegrationLinkResponse>(`${this.baseUrl}/link`, request);
	}

	public static async delinkIntegration(request: IntegrationDelinkRequest): Promise<{ message: string }> {
		return await AxiosClient.post<{ message: string }>(`${this.baseUrl}/delink`, request);
	}
}

export default IntegrationMappingApi;
