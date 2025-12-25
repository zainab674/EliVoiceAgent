


import { format } from 'date-fns';
import { Call, CallAnalysis } from "@/components/calls/types";
import { fetchRecordingUrlCached } from "../recordings/fetchRecordingUrl";

// Fetch calls from backend API
export const fetchCalls = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return { calls: [], total: 0 };
    }

    const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
    const response = await fetch(`${baseUrl}/api/v1/calls`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching calls:', response.statusText, errorData);
      throw new Error(errorData.error || response.statusText);
    }

    const data = await response.json();

    if (data.success && data.data) {
      const calls = data.data.calls;

      // Transform data for UI with proper type handling
      const transformedCalls = await Promise.all(calls.map(async (call: any) => {
        // Fetch recording info if call_sid exists
        const recordingInfo = call.call_sid ? await fetchRecordingUrlCached(call.call_sid) : null;

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
          tags: [], // Tags not yet implemented in backend model
          status: call.status || 'Completed',
          resolution: call.call_outcome,
          summary: call.summary,
          transcript: call.transcript,
          call_recording: recordingInfo?.recordingUrl || call.recording_url || '',
          call_sid: call.call_sid,
          recording_info: recordingInfo
        };
      }));

      return {
        calls: transformedCalls as Call[],
        total: data.data.total || transformedCalls.length,
      };
    }

    return { calls: [], total: 0 };

  } catch (error) {
    console.error('Error in fetchCalls:', error);
    return { calls: [], total: 0 };
  }
};

function formatDuration(seconds: number): string {
  if (!seconds) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}
