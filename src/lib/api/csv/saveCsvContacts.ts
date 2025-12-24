


export interface CsvContactData {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'do-not-call';
  do_not_call?: boolean;
}

export interface SaveCsvContactsRequest {
  csvFileId: string;
  contacts: CsvContactData[];
  userId: string;
}

export interface SaveCsvContactsResponse {
  success: boolean;
  savedCount?: number;
  error?: string;
}

/**
 * Save CSV contacts to database
 */
export const saveCsvContacts = async (data: SaveCsvContactsRequest): Promise<SaveCsvContactsResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'No auth token found' };

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/csv/${data.csvFileId}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ contacts: data.contacts })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to save contacts' };
    }

    const result = await response.json();
    return {
      success: true,
      savedCount: result.savedCount
    };

  } catch (error) {
    console.error('Error saving CSV contacts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
