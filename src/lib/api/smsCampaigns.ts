import { getAccessToken } from "@/lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export interface SmsCampaign {
    _id: string;
    name: string;
    status: 'draft' | 'sending' | 'completed' | 'failed' | 'paused';
    body: string;
    stats: {
        sent: number;
        delivered: number;
        failed: number;
        replies: number;
    };
    totalRecipients: number;
    assistantId: { _id: string; name: string } | string;
    createdAt: string;
}

export async function fetchSmsCampaigns() {
    const token = getAccessToken();
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1/sms-campaigns`, { headers });
    const data = await res.json();
    return data;
}

export async function createSmsCampaign(payload: any) {
    const token = getAccessToken();
    const headers: any = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1/sms-campaigns`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to create campaign');
    }
    return data;
}

export async function startSmsCampaign(campaignId: string) {
    const token = getAccessToken();
    const headers: any = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1/sms-campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: headers
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to start campaign');
    }
    return data;
}
