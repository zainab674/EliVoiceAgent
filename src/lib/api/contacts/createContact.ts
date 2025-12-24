


export interface CreateContactRequest {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  list_id: string;
  status?: 'active' | 'inactive' | 'do-not-call';
  do_not_call?: boolean;
  user_id: string;
}

export interface CreateContactResponse {
  success: boolean;
  contact?: {
    id: string;
    first_name: string;
    last_name?: string;
    phone?: string;
    email?: string;
    list_id: string;
    status: 'active' | 'inactive' | 'do-not-call';
    do_not_call: boolean;
    created_at: string;
    updated_at: string;
    user_id: string;
  };
  error?: string;
}

/**
 * Create a new contact
 */
/**
 * Create a new contact
 */
export const createContact = async (data: CreateContactRequest): Promise<CreateContactResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No auth token found' };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/contacts`, {
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
    const contact = result.data;

    return {
      success: true,
      contact: {
        id: contact._id || contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        phone: contact.phone,
        email: contact.email,
        list_id: contact.list_id,
        status: contact.status,
        do_not_call: contact.do_not_call,
        created_at: contact.created_at,
        updated_at: contact.updated_at,
        user_id: contact.user_id
      }
    };

  } catch (error) {
    console.error('Error creating contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
