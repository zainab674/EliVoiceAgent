import { format } from "date-fns";
import { getCurrentUserIdAsync } from "@/lib/user-context";

export interface Conversation {
  id: string;
  phoneNumber: string;
  contactName: string;
  lastActivity: Date;
  totalCalls: number;
  totalSMS: number;
  recentCall: any;
  recentSMS: any;
}

export interface ConversationDetails {
  phoneNumber: string;
  calls: any[];
  smsMessages: any[];
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

/**
 * Fetch all conversations (aggregated calls and SMS)
 */
export const fetchConversations = async (): Promise<ConversationsResponse> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return { conversations: [], total: 0 };
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/conversations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error);
    }

    const conversations = result.data.conversations.map((c: any) => ({
      ...c,
      lastActivity: new Date(c.lastActivity)
    }));

    return {
      conversations,
      total: result.data.total || conversations.length
    };

  } catch (error) {
    console.error('Error fetching conversations:', error);
    return { conversations: [], total: 0 };
  }
};

/**
 * Fetch conversation details for a specific phone number
 */
export const fetchConversationDetails = async (phoneNumber: string): Promise<ConversationDetails | null> => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No auth token found');
      return null;
    }

    const encodedPhoneNumber = encodeURIComponent(phoneNumber);
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/conversations/${encodedPhoneNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('Error fetching conversation details:', response.statusText);
      return null;
    }

    const result = await response.json();
    if (!result.success) {
      console.error('Error fetching conversation details:', result.error);
      return null;
    }

    return result.data;

  } catch (error) {
    console.error('Error fetching conversation details:', error);
    return null;
  }
};

/**
 * @deprecated Use fetchConversations instead
 */
export const fetchContactList = async () => {
  return fetchConversations();
};

// Stub for loadConversationHistory if it was used
export const loadConversationHistory = async () => {
  console.warn('loadConversationHistory is not fully implemented in the new backend version yet.');
  return { calls: [], smsMessages: [], hasMoreHistory: false, nextOffset: 0 };
};

// Helper to keep compatibility if other files import it
export const getConversationsProgressive = async () => {
  return fetchConversations();
}
