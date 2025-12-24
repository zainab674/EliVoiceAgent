


export interface CreateContactListRequest {
  name: string;
  user_id: string;
}

export interface CreateContactListResponse {
  success: boolean;
  contactList?: {
    id: string;
    name: string;
    count: number;
    created_at: string;
    updated_at: string;
    user_id: string;
  };
  error?: string;
}

/**
 * Create a new contact list
 */
/**
 * Create a new contact list
 */
export const createContactList = async (data: CreateContactListRequest): Promise<CreateContactListResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No auth token found' };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/contacts/lists`, {
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
        error: errorData.error || response.statusText
      };
    }

    const result = await response.json();
    const contactList = result.data;

    return {
      success: true,
      contactList: {
        id: contactList._id || contactList.id,
        name: contactList.name,
        count: 0,
        created_at: contactList.created_at,
        updated_at: contactList.updated_at,
        user_id: contactList.user_id
      }
    };

  } catch (error) {
    console.error('Error creating contact list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
