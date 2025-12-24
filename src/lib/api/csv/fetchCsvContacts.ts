


export interface CsvContact {
  id: string;
  csv_file_id: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'do-not-call';
  do_not_call: boolean;
  user_id: string;
  created_at: string;
}

export interface CsvContactsResponse {
  contacts: CsvContact[];
  total: number;
}

/**
 * Fetch CSV contacts for a specific CSV file
 */
/**
 * Fetch CSV contacts for a specific CSV file
 */
export const fetchCsvContacts = async (csvFileId: string): Promise<CsvContactsResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return { contacts: [], total: 0 };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/csv/${csvFileId}/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch CSV contacts');
    }

    const contacts = data.contacts || [];

    return {
      contacts: contacts.map((c: any) => ({
        id: c.id,
        csv_file_id: csvFileId,
        first_name: c.name ? c.name.split(' ')[0] : 'Unknown', // Backend 'name' vs frontend 'first_name'/'last_name'
        last_name: c.name ? c.name.split(' ').slice(1).join(' ') : '',
        phone: c.phone || '',
        email: c.email || '',
        status: 'active', // Default as it's not in CsvContact schema
        do_not_call: false,
        user_id: '', // Not in CsvContact response directly/needed
        created_at: new Date().toISOString()
      })),
      total: data.total || contacts.length
    };

  } catch (error) {
    console.error('Error fetching CSV contacts:', error);
    throw error;
  }
};
