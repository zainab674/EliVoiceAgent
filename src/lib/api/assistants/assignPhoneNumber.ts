


export interface AssignPhoneNumberRequest {
  assistantId: string;
  phoneNumber: string;
  label?: string;
}

export interface AssignPhoneNumberResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Assign a phone number to an assistant for outbound calls
 */
/**
 * Assign a phone number to an assistant for outbound calls
 */
export const assignPhoneNumber = async (data: AssignPhoneNumberRequest): Promise<AssignPhoneNumberResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No auth token found' };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/phone-numbers/assign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || response.statusText
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: 'Phone number assigned successfully'
    };

  } catch (error) {
    console.error('Error assigning phone number:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
