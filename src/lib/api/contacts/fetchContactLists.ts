


export interface ContactList {
  id: string;
  name: string;
  count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ContactListsResponse {
  contactLists: ContactList[];
  total: number;
}

/**
 * Fetch contact lists from Supabase
 */
/**
 * Fetch contact lists from backend API
 */
export const fetchContactLists = async (): Promise<ContactListsResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return { contactLists: [], total: 0 };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/contacts/lists`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Error fetching contact lists:', response.statusText);
      throw new Error(response.statusText);
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return {
        contactLists: [],
        total: 0
      };
    }

    const contactLists = data.data;

    // Transform the data to include contact count
    const transformedLists = contactLists.map((list: any) => ({
      id: list._id || list.id,
      name: list.name,
      count: list.count || 0, // Backend might need to aggregate count if not provided
      created_at: list.created_at,
      updated_at: list.updated_at,
      user_id: list.user_id
    }));

    return {
      contactLists: transformedLists,
      total: transformedLists.length
    };

  } catch (error) {
    console.error('Error fetching contact lists:', error);
    throw error;
  }
};
