
import { getCurrentUserIdAsync } from "@/lib/user-context";

export interface Assistant {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  first_message?: string;
  first_sms?: string;
  sms_prompt?: string;
  whatsapp_credentials_id?: string;
  status: "draft" | "active" | "inactive";
  created_at: string;
  updated_at: string;
  interactionCount?: number;
  userCount?: number;
  assignedUserEmail?: string;
}

export interface AssistantsResponse {
  assistants: Assistant[];
  total: number;
}

/**
 * Fetch all assistants for the current user
 */
export const fetchAssistants = async (): Promise<AssistantsResponse> => {
  try {
    const userId = await getCurrentUserIdAsync();
    // console.log('Fetching assistants for user ID:', userId);

    const token = localStorage.getItem('token');

    if (!token) {
      // console.warn("No token found, cannot fetch assistants");
      // return { assistants: [], total: 0 };
    }

    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/v1/assistants`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch assistants: ${response.statusText}`);
    }

    const assistants = await response.json();

    if (!assistants || !Array.isArray(assistants)) {
      return {
        assistants: [],
        total: 0
      };
    }

    // Transform the data to match our interface
    const transformedAssistants: Assistant[] = assistants.map((assistant: any) => ({
      id: assistant._id || assistant.id, // Mongoose uses _id
      name: assistant.name || 'Unnamed Assistant',
      description: assistant.prompt ? assistant.prompt.substring(0, 100) + '...' : '',
      prompt: assistant.prompt,
      first_message: assistant.firstMessage || assistant.first_message, // Handle camelCase from Mongoose
      first_sms: assistant.firstSms || assistant.first_sms || assistant.smsSettings?.firstSms,
      sms_prompt: assistant.smsPrompt || assistant.sms_prompt || assistant.smsSettings?.prompt,
      whatsapp_credentials_id: assistant.whatsapp_credentials_id,
      status: 'active',
      created_at: assistant.createdAt || assistant.created_at,
      updated_at: assistant.updatedAt || assistant.updated_at,
      interactionCount: 0,
      userCount: 0,
      assignedUserEmail: assistant.assignedUserEmail
    }));

    return {
      assistants: transformedAssistants,
      total: transformedAssistants.length
    };

  } catch (error) {
    console.error('Error fetching assistants:', error);
    throw error;
  }
};
