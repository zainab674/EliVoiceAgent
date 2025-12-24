


import { format } from 'date-fns';
import { Call, CallAnalysis } from "@/components/calls/types";


// Fetch a single call by ID
export const fetchCallById = async (id: string): Promise<Call | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return null;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/calls/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Call with ID ${id} not found.`);
        return null;
      }
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching call:', response.statusText, errorData);
      return null;
    }

    const result = await response.json();

    if (result.success && result.data) {
      const call = result.data;
      // Fetch recording info if call_sid exists
      // Note: fetchRecordingUrlCached might need to be imported if not already, but based on previous file content it wasn't there?
      // Wait, looking at Step 54, fetchRecordingUrlCached was NOT imported.
      // But fetchCalls.ts used it. 
      // I should probably simplify and just return the call data as mapped.
      // Actually, looking at the previous file content (Step 54), it DOES NOT import fetchRecordingUrlCached.
      // It just returns the call data.

      return {
        id: call._id || call.id,
        first_name: call.first_name,
        last_name: call.last_name,
        name:
          (call.first_name && call.first_name !== "NA") || (call.last_name && call.last_name !== "NA")
            ? [call.first_name, call.last_name].filter(Boolean).join(" ")
            : "Unknown",
        phoneNumber: call.phone_number || '',
        date: call.created_at ? format(new Date(call.created_at), 'yyyy-MM-dd') : '',
        time: call.created_at ? format(new Date(call.created_at), 'HH:mm') : '',
        duration: typeof call.duration === 'number' ? formatDuration(call.duration) : (call.duration || '00:00'),
        direction: call.type || 'Inbound',
        channel: 'Phone',
        address: call.address || null,
        analysis: call.analysis as CallAnalysis || null,
        tags: [],
        status: call.status || 'Completed',
        resolution: call.call_outcome,
        summary: call.summary,
        transcript: call.transcript,
        call_recording: call.recording_url || call.call_recording || '',
        call_sid: call.call_sid,
        recording_info: null
      };
    }

    return null;

  } catch (error) {
    console.error('Error in fetchCallById:', error);
    return null;
  }
};

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
