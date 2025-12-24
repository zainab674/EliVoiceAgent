


export interface CsvFile {
  id: string;
  name: string;
  user_id: string;
  row_count: number;
  file_size?: number;
  uploaded_at: string;
  created_at: string;
  updated_at: string;
}

export interface CsvFilesResponse {
  csvFiles: CsvFile[];
  total: number;
}

/**
 * Fetch CSV files for the current user
 */
/**
 * Fetch CSV files for the current user
 */
export const fetchCsvFiles = async (): Promise<CsvFilesResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return { csvFiles: [], total: 0 };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/csv`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch CSV files');
    }

    const csvFiles = data.csvFiles || [];

    return {
      csvFiles: csvFiles.map((f: any) => ({
        id: f.id,
        name: f.name,
        user_id: f.user_id,
        row_count: f.rowCount, // Note the camelCase mapping
        uploaded_at: f.createdAt,
        created_at: f.createdAt,
        updated_at: f.createdAt
      })),
      total: csvFiles.length
    };

  } catch (error) {
    console.error('Error fetching CSV files:', error);
    throw error;
  }
};
