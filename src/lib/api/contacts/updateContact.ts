


export interface UpdateContactRequest {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  list_id?: string;
  status?: 'active' | 'inactive' | 'do-not-call';
  do_not_call?: boolean;
}

export interface UpdateContactResponse {
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
 * Update an existing contact
 */
/**
 * Update an existing contact
 */
export const updateContact = async (data: UpdateContactRequest): Promise<UpdateContactResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No auth token found' };
    }

    const updateData = { ...data };
    delete (updateData as any).id; // Remove ID from body

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/contacts/${data.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
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
    console.error('Error updating contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
