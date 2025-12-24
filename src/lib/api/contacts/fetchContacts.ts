


export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  list_id: string;
  list_name: string;
  status: 'active' | 'inactive' | 'do-not-call';
  do_not_call: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

/**
 * Fetch contacts from Supabase with optional list filtering
 */
export const fetchContacts = async (listId?: string): Promise<ContactsResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return { contacts: [], total: 0 };
    }

    let url = `${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/contacts`;
    if (listId) {
      url += `?listId=${listId}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Error fetching contacts:', response.statusText);
      throw new Error(response.statusText);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return {
        contacts: [],
        total: 0
      };
    }

    const contacts = data.data.contacts;
    const total = data.data.total;

    // Transform the data to include list name
    const transformedContacts = contacts.map((contact: any) => ({
      id: contact._id || contact.id,
      first_name: contact.first_name,
      last_name: contact.last_name,
      phone: contact.phone,
      email: contact.email,
      list_id: contact.list_id?._id || contact.list_id,
      list_name: contact.list_id?.name || 'Unknown List', // populated field
      status: contact.status as 'active' | 'inactive' | 'do-not-call',
      do_not_call: contact.do_not_call || false,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
      user_id: contact.user_id
    }));

    return {
      contacts: transformedContacts,
      total: total || transformedContacts.length
    };

  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};
