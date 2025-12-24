


export interface DeleteContactRequest {
  id: string;
}

export interface DeleteContactResponse {
  success: boolean;
  error?: string;
}

/**
 * Delete a contact
 */
/**
 * Delete a contact
 */
export const deleteContact = async (data: DeleteContactRequest): Promise<DeleteContactResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No auth token found' };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/contacts/${data.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || response.statusText
      };
    }

    return {
      success: true
    };

  } catch (error) {
    console.error('Error deleting contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
