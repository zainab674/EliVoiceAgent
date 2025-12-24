


export interface DeleteCsvFileRequest {
  csvFileId: string;
}

export interface DeleteCsvFileResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Delete a CSV file
 */
export const deleteCsvFile = async (data: DeleteCsvFileRequest): Promise<DeleteCsvFileResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'No auth token found' };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/csv/${data.csvFileId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.message || 'Failed to delete CSV file',
      };
    }

    return result;

  } catch (error) {
    console.error('Error deleting CSV file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
