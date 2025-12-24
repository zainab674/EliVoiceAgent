// Assuming user session handling still partly relies on it or we use custom auth header?
// Wait, we are moving AWAY from Supabase. The user context should provide the token.
// Let's check `src/lib/api/api-client.ts` or similar if it exists.
// I'll use standard fetch with localStorage token for now, mirroring other API calls.

export interface EmailIntegration {
    _id: string;
    provider: string;
    email: string;
    smtpHost: string;
    isActive: boolean;
}

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const IntegrationService = {
    async getIntegrations() {
        const response = await fetch('/api/v1/integrations', {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to fetch integrations');
        return response.json();
    },

    async connectEmail(data: any) {
        const response = await fetch('/api/v1/integrations/email', {
            method: 'POST',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to connect email');
        }
        return response.json();
    },

    async removeEmail(email: string) {
        const response = await fetch(`/api/v1/integrations/email/${email}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'application/json'
            }
        });
        if (!response.ok) throw new Error('Failed to remove email integration');
        return response.json();
    }
};
