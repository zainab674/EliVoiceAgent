
export interface Campaign {
    _id: string; // Mongoose ID
    name: string;
    assistantId: {
        _id: string;
        name: string;
    } | string;
    contactListId?: {
        _id: string;
        name: string;
    } | string;
    csvFileId?: {
        _id: string;
        name: string;
    } | string;
    contactSource: 'contact_list' | 'csv_file';
    dailyCap: number;
    callingDays: string[];
    startHour: number;
    endHour: number;
    status: 'draft' | 'active' | 'paused' | 'completed';
    executionStatus: 'idle' | 'running' | 'paused' | 'completed' | 'error';
    campaignPrompt: string;

    // Stats
    dials: number;
    pickups: number;
    doNotCall: number;
    interested: number;
    notInterested: number;
    callback: number;
    totalUsage: number;

    currentDailyCalls: number;

    // From populate via manual backend route mod
    queueStats?: {
        queued: number;
        processing: number;
        completed: number;
        failed: number;
    }
}

export interface SaveCampaignRequest {
    name: string;
    assistantId: string;
    contactSource: 'contact_list' | 'csv_file';
    contactListId?: string; // required if source is contact_list
    csvFileId?: string; // required if source is csv_file
    dailyCap: number;
    callingDays: string[];
    startHour: number;
    endHour: number;
    campaignPrompt: string;
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${url}`, {
        ...options,
        headers,
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || data.error || 'API request failed');
    }
    return data;
}

export async function fetchCampaigns() {
    return fetchWithAuth('/api/v1/campaigns');
}

export async function getCampaign(id: string) {
    return fetchWithAuth(`/api/v1/campaigns/${id}`);
}

export async function saveCampaign(campaignData: SaveCampaignRequest) {
    return fetchWithAuth('/api/v1/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData),
    });
}

export async function deleteCampaign(id: string) {
    return fetchWithAuth(`/api/v1/campaigns/${id}`, {
        method: 'DELETE',
    });
}

export async function startCampaign(id: string) {
    return fetchWithAuth(`/api/v1/campaigns/${id}/start`, {
        method: 'POST',
    });
}

export async function pauseCampaign(id: string) {
    return fetchWithAuth(`/api/v1/campaigns/${id}/pause`, {
        method: 'POST',
    });
}

export async function resumeCampaign(id: string) {
    return fetchWithAuth(`/api/v1/campaigns/${id}/resume`, {
        method: 'POST',
    });
}

export async function getCampaignCalls(id: string, limit = 50, offset = 0) {
    // Note: The backend response structure for calls endpoint is { success: true, calls: [], total: num }
    return fetchWithAuth(`/api/v1/campaigns/${id}/calls?limit=${limit}&offset=${offset}`);
}
