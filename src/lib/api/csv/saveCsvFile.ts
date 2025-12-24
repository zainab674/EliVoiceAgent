


export interface SaveCsvFileRequest {
  name: string;
  rowCount: number;
  fileSize?: number;
  userId: string;
}

export interface SaveCsvFileResponse {
  success: boolean;
  csvFileId?: string;
  error?: string;
}

/**
 * Save CSV file metadata to database
 */
export const saveCsvFile = async (data: SaveCsvFileRequest): Promise<SaveCsvFileResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { success: false, error: 'No auth token found' };

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to save CSV file' };
    }

    const result = await response.json();
    return {
      success: true,
      csvFileId: result.csvFileId
    };

  } catch (error) {
    console.error('Error saving CSV file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
