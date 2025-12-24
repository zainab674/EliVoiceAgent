


export interface PhoneNumberMapping {
  number: string;
  inbound_assistant_id: string | null;
}

export interface PhoneNumberMappingsResponse {
  mappings: PhoneNumberMapping[];
  total: number;
}

/**
 * Fetch phone number to assistant mappings
 */
export const fetchPhoneNumberMappings = async (): Promise<PhoneNumberMappingsResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return { mappings: [], total: 0 };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/phone-numbers`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch phone number mappings');
      return { mappings: [], total: 0 };
    }

    const result = await response.json();
    return {
      mappings: result.data || [],
      total: result.data?.length || 0
    };

  } catch (error) {
    console.error('Error fetching phone number mappings:', error);
    return { mappings: [], total: 0 };
  }
};
