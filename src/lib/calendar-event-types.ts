import { createCalComEventType, getCalComEventTypes } from "@/lib/api/calcom";
import { getCurrentUserIdAsync } from "@/lib/user-context";

export interface CalendarEventType {
  id: string;
  calendar_credential_id: string;
  event_type_id: string;
  event_type_slug: string;
  label: string;
  description?: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventTypeInput {
  calendarCredentialId: string;
  eventTypeSlug: string;
  label: string;
  description?: string;
  durationMinutes: number;
}

export interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string;
  locations?: any[];
  bookingFields?: any[];
  disableGuests?: boolean;
  slotInterval?: number;
  minimumBookingNotice?: number;
  beforeEventBuffer?: number;
  afterEventBuffer?: number;
  recurrence?: any;
  metadata?: any;
  price?: number;
  currency?: string;
  lockTimeZoneToggleOnBookingPage?: boolean;
  seatsPerTimeSlot?: any;
  forwardParamsSuccessRedirect?: any;
  successRedirectUrl?: any;
  isInstantEvent?: boolean;
  seatsShowAvailabilityCount?: boolean;
  scheduleId?: number;
  bookingLimitsCount?: any;
  onlyShowFirstAvailableSlot?: boolean;
  bookingLimitsDuration?: any;
  bookingWindow?: any[];
  bookerLayouts?: any;
  confirmationPolicy?: any;
  requiresBookerEmailVerification?: boolean;
  hideCalendarNotes?: boolean;
  color?: {
    lightThemeHex: string;
    darkThemeHex: string;
  };
  seats?: any;
  offsetStart?: number;
  customName?: string;
  destinationCalendar?: any;
  useDestinationCalendarEmail?: boolean;
  hideCalendarEventDetails?: boolean;
  hideOrganizerEmail?: boolean;
  calVideoSettings?: any;
  hidden?: boolean;
  bookingRequiresAuthentication?: boolean;
  ownerId?: number;
  users?: string[];
}

const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

const getAuthToken = () => localStorage.getItem('token');

/**
 * Service for managing calendar event types
 */
export class CalendarEventTypeService {
  /**
   * Get all event types for a specific calendar credential
   */
  static async getEventTypesByCredential(credentialId: string): Promise<CalendarEventType[]> {
    try {
      const token = getAuthToken();
      if (!token) return [];

      const response = await fetch(`${getBackendUrl()}/api/v1/calendar/event-types?credentialId=${credentialId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch event types');

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching calendar event types:", error);
      return [];
    }
  }

  /**
   * Get all event types for the current user
   */
  static async getAllEventTypes(): Promise<CalendarEventType[]> {
    try {
      const token = getAuthToken();
      if (!token) return [];

      const response = await fetch(`${getBackendUrl()}/api/v1/calendar/event-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch event types');

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching all calendar event types:", error);
      return [];
    }
  }

  /**
   * Create a new event type
   */
  static async createEventType(eventType: CalendarEventTypeInput): Promise<CalendarEventType> {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("User not authenticated");

      // Normally backend would handle this logic, including Cal.com API call
      // But preserving existing patterns where possible, if backend endpoints mimic this behavior

      const response = await fetch(`${getBackendUrl()}/api/v1/calendar/event-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(eventType)
      });

      if (!response.ok) throw new Error('Failed to create event type');

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error creating calendar event type:", error);
      throw error;
    }
  }

  /**
   * Update an existing event type
   */
  static async updateEventType(
    eventTypeId: string,
    updates: Partial<CalendarEventTypeInput>
  ): Promise<CalendarEventType> {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${getBackendUrl()}/api/v1/calendar/event-types/${eventTypeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update event type');

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Error updating calendar event type:", error);
      throw error;
    }
  }

  /**
   * Delete an event type
   */
  static async deleteEventType(eventTypeId: string): Promise<void> {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${getBackendUrl()}/api/v1/calendar/event-types/${eventTypeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete event type');
    } catch (error) {
      console.error("Error deleting calendar event type:", error);
      throw error;
    }
  }

  /**
   * Generate event type ID by calling Cal.com API
   */
  private static async generateEventTypeId(apiKey: string, eventTypeSlug: string, label: string, description?: string, durationMinutes: number = 30): Promise<string> {
    try {
      // Call Cal.com API to create the event type
      const calComResult = await createCalComEventType(
        apiKey,
        eventTypeSlug,
        label,
        description || '',
        durationMinutes
      );
      return calComResult.eventTypeId;
    } catch (error) {
      console.error("Error generating event type ID:", error);
      // Fallback: generate a mock ID
      return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  /**
   * Get event types grouped by calendar credential
   */
  static async getEventTypesGroupedByCredential(): Promise<Record<string, CalendarEventType[]>> {
    try {
      const eventTypes = await this.getAllEventTypes();

      return eventTypes.reduce((acc, eventType) => {
        const credentialId = eventType.calendar_credential_id;
        if (!acc[credentialId]) {
          acc[credentialId] = [];
        }
        acc[credentialId].push(eventType);
        return acc;
      }, {} as Record<string, CalendarEventType[]>);
    } catch (error) {
      console.error("Error grouping event types by credential:", error);
      return {};
    }
  }

  /**
   * Fetch event types directly from Cal.com for a specific calendar credential
   */
  static async fetchEventTypesFromCalCom(calendarCredentialId: string): Promise<CalComEventType[]> {
    try {
      const token = getAuthToken();
      if (!token) throw new Error("User not authenticated");

      // The specific 'fetch from third party' logic might be wrapped in backend or we fetch credential first
      // Assuming backend has this utility
      const response = await fetch(`${getBackendUrl()}/api/v1/calendar/credentials/${calendarCredentialId}/fetch-external-events`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch external events');
      const result = await response.json();
      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error("Error fetching event types from Cal.com:", error);
      throw error;
    }
  }
}

// Export convenience functions
export const getEventTypesByCredential = (credentialId: string) =>
  CalendarEventTypeService.getEventTypesByCredential(credentialId);
export const getAllEventTypes = () => CalendarEventTypeService.getAllEventTypes();
export const createEventType = (eventType: CalendarEventTypeInput) =>
  CalendarEventTypeService.createEventType(eventType);
export const updateEventType = (id: string, updates: Partial<CalendarEventTypeInput>) =>
  CalendarEventTypeService.updateEventType(id, updates);
export const deleteEventType = (id: string) => CalendarEventTypeService.deleteEventType(id);
export const getEventTypesGroupedByCredential = () =>
  CalendarEventTypeService.getEventTypesGroupedByCredential();
export const fetchEventTypesFromCalCom = (calendarCredentialId: string) =>
  CalendarEventTypeService.fetchEventTypesFromCalCom(calendarCredentialId);
