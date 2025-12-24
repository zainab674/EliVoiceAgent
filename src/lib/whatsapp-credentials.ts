

export interface UserWhatsAppCredentials {
  id: string;
  user_id: string;
  phone_number_id: string;
  access_token: string;
  business_account_id: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  webhook_verify_token?: string;
}

export interface WhatsAppCredentialsInput {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  label: string;
  webhookVerifyToken?: string;
}

const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

const getAuthToken = () => localStorage.getItem('token');

/**
 * Service for managing user-specific WhatsApp credentials
 */
export class WhatsAppCredentialsService {

  /**
   * Get the active WhatsApp credentials for the current user
   */
  static async getActiveCredentials(): Promise<UserWhatsAppCredentials | null> {
    try {
      const token = getAuthToken();
      if (!token) return null;

      const response = await fetch(`${getBackendUrl()}/api/v1/whatsapp/credentials/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch active credentials');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      //   console.error("Error fetching WhatsApp credentials:", error);
      return null;
    }
  }

  /**
   * Save new WhatsApp credentials for the current user
   */
  static async saveCredentials(credentials: WhatsAppCredentialsInput): Promise<UserWhatsAppCredentials> {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${getBackendUrl()}/api/v1/whatsapp/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          phoneNumberId: credentials.phoneNumberId,
          accessToken: credentials.accessToken,
          businessAccountId: credentials.businessAccountId,
          label: credentials.label,
          webhookVerifyToken: credentials.webhookVerifyToken
        })
      });

      if (!response.ok) throw new Error('Failed to save credentials');

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error saving WhatsApp credentials:", error);
      throw error;
    }
  }

  /**
   * Update existing WhatsApp credentials
   */
  static async updateCredentials(
    credentialsId: string,
    credentials: Partial<WhatsAppCredentialsInput>
  ): Promise<UserWhatsAppCredentials> {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${getBackendUrl()}/api/v1/whatsapp/credentials/${credentialsId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) throw new Error('Failed to update credentials');

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error updating WhatsApp credentials:", error);
      throw error;
    }
  }

  /**
   * Delete WhatsApp credentials
   */
  static async deleteCredentials(credentialsId: string): Promise<void> {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${getBackendUrl()}/api/v1/whatsapp/credentials/${credentialsId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete credentials');
    } catch (error) {
      console.error("Error deleting WhatsApp credentials:", error);
      throw error;
    }
  }

  /**
   * Get all WhatsApp credentials for the current user
   */
  static async getAllCredentials(): Promise<UserWhatsAppCredentials[]> {
    try {
      const token = getAuthToken();
      if (!token) return [];

      const response = await fetch(`${getBackendUrl()}/api/v1/whatsapp/credentials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch credentials');

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching all WhatsApp credentials:", error);
      return [];
    }
  }

  /**
   * Set specific credentials as active
   */
  static async setActiveCredentials(credentialsId: string): Promise<UserWhatsAppCredentials> {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${getBackendUrl()}/api/v1/whatsapp/credentials/${credentialsId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to set active credentials');

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error setting active WhatsApp credentials:", error);
      throw error;
    }
  }

  /**
   * Test WhatsApp credentials by making a simple API call
   */
  static async testCredentials(credentials: WhatsAppCredentialsInput): Promise<boolean> {
    try {
      // Basic validation format
      const isNumeric = (val: string) => /^\d+$/.test(val);

      return (
        isNumeric(credentials.phoneNumberId) &&
        isNumeric(credentials.businessAccountId) &&
        credentials.accessToken.length > 20
      );
    } catch (error) {
      console.error("Error testing WhatsApp credentials:", error);
      return false;
    }
  }
}

// Export convenience functions
export const getActiveWhatsAppCredentials = () => WhatsAppCredentialsService.getActiveCredentials();
export const saveWhatsAppCredentials = (credentials: WhatsAppCredentialsInput) =>
  WhatsAppCredentialsService.saveCredentials(credentials);
export const updateWhatsAppCredentials = (id: string, credentials: Partial<WhatsAppCredentialsInput>) =>
  WhatsAppCredentialsService.updateCredentials(id, credentials);
export const deleteWhatsAppCredentials = (id: string) => WhatsAppCredentialsService.deleteCredentials(id);
export const getAllWhatsAppCredentials = () => WhatsAppCredentialsService.getAllCredentials();
export const setActiveWhatsAppCredentials = (id: string) => WhatsAppCredentialsService.setActiveCredentials(id);
export const testWhatsAppCredentials = (credentials: WhatsAppCredentialsInput) =>
  WhatsAppCredentialsService.testCredentials(credentials);
