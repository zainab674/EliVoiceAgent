import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Phone, Users, TrendingUp, Settings, Play, Edit2, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { Assistant } from "@/lib/api/assistants/fetchAssistants";

import {
  ThemedDialog,
  ThemedDialogContent,
  ThemedDialogHeader,
} from "@/components/ui/themed-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Utility functions
const formatPhoneNumber = (number: string) => {
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return number;
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString()
  };
};

interface PhoneNumber {
  id: string;
  phone_sid: string;
  number: string;
  label?: string;
  status: string;
  webhook_status: string;
  created_at: string;
}

interface AssistantDetailsDialogProps {
  assistant: Assistant | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AssistantDetailsDialog({ assistant, isOpen, onClose }: AssistantDetailsDialogProps) {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleStartCall = () => {
    navigate(`/voiceagent?assistantId=${assistant.id}`);
    onClose(); // Close the dialog
  };

  useEffect(() => {
    if (assistant && isOpen) {
      loadPhoneNumbers();
    }
  }, [assistant, isOpen]);

  const loadPhoneNumbers = async () => {
    if (!assistant?.id || !user?.id) return;

    try {
      setLoading(true);
      // Fetch user's phone numbers from backend
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/v1/twilio/user/phone-numbers`, {
        headers: {
          'x-user-id': user.id, // The endpoint expects x-user-id header
          'Authorization': `Bearer ${token}`
        }
      });

      const json = await response.json();

      if (!json.success) {
        console.error("Error loading phone numbers:", json.message);
        return;
      }

      // Filter numbers relevant to this assistant (inbound)
      // Note: The backend endpoint returns Twilio numbers. We need to check if they are mapped to this assistant.
      // However, the `twilio/user/phone-numbers` endpoint returns `mapped` status but might not return the `inboundAssistantId`.
      // The `PhoneNumber` model has `inboundAssistantId`.
      // We might need to fetch mappings or filtered list.
      // We can use the `/api/v1/twilio/phone-numbers` (admin) which returns all numbers, but let's stick to user endpoint if possible.
      // Actually, checking `twilio-user.js`, it returns Twilio objects. It doesn't seem to enrich with `inboundAssistantId`.
      // But `twilio-admin.js` (mounted at `/api/v1/twilio`) has logic to check mappings?
      // Wait, `AssistantDetailsDialog` wants to show numbers connected to THIS assistant.

      // I should modify `loadPhoneNumbers` to fetch mappings/assigned numbers.
      // Since `PhoneNumbersTab` does `fetchPhoneNumberMappings`, I should use that or similar.
      // I'll assume we can filter the list if we get mappings.

      // Let's implement a quick fetch for mappings locally or use a new endpoint if needed.
      // Given the constraints and existing code, I'll fetch ALL numbers and filter by `inboundAssistant` name? No, I need assistant ID.

      // Better approach: Fetch phone numbers from `phone_number` collection via a new endpoint or filter?

      // I should add a query param to `twilio-user.js` or `twilio-admin.js` to filter by assistant?
      // OR just fetch all mappings and filter.

      // fetch all mappings: `GET /api/v1/twilio/phone-numbers` doesn't return mappings in detail.

      // I'll rely on fetching phone numbers from the DB directly via a new route or existing route.
      // `twilio-admin.js` has `PhoneNumber.find({})` inside.

      // I'll call a hypothetical `/api/v1/twilio/assigned-numbers/${assistant.id}`? No, that doesn't exist.

      // I'll filter on the client side by fetching ALL mappings if I can.
      // Since I can't easily add a route right now without more files, I'll try to use what I have.
      // `PhoneNumbersTab` fetches all numbers and mappings.

      // I will fetch all user phone numbers from backend and filter those where `inboundAssistantId` matches `assistant.id`.
      // But `twilio/user/phone-numbers` returns Twilio API objects, NOT database mappings.

      // I need to fetch the mappings from the database.
      // I will use `fetchPhoneNumberMappings` if it's available or replicate it.
      // `PhoneNumbersTab` imports `fetchPhoneNumberMappings`.

      const { fetchPhoneNumberMappings } = await import("@/lib/api/phoneNumbers/fetchPhoneNumberMappings");
      const { mappings } = await fetchPhoneNumberMappings();

      const assistantMappings = mappings.filter((m: any) => m.inbound_assistant_id === assistant.id);

      // Now map these to the format expected by the UI.
      // UI expects: { id, phone_sid, number, label, status, webhook_status, created_at }
      // Mapping has: { phoneSid, number, label, status, webhookStatus, createdAt }

      const formatted = assistantMappings.map((m: any) => ({
        id: m.phoneSid || m._id,
        phone_sid: m.phoneSid,
        number: m.number,
        label: m.label,
        status: m.status || 'active',
        webhook_status: m.webhookStatus || 'unknown',
        created_at: m.createdAt || new Date().toISOString()
      }));

      setPhoneNumbers(formatted);

    } catch (error) {
      console.error("Error loading phone numbers:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!assistant) return null;

  const statusColors = {
    draft: "hsl(45 93% 47%)",
    active: "hsl(142 76% 36%)",
    inactive: "hsl(215 28% 17%)"
  };

  const phoneStatusColors = {
    active: "hsl(142 76% 36%)",
    inactive: "hsl(215 28% 17%)",
    pending: "hsl(45 93% 47%)"
  };

  return (
    <ThemedDialog open={isOpen} onOpenChange={onClose}>
      <ThemedDialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-background via-background to-muted/20 border-2 border-primary/20 shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header with Gradient Accent */}
          <div className="relative px-6 py-5 border-b border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-50" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ backgroundColor: statusColors[assistant.status] }}
                  />
                  <div
                    className="absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: statusColors[assistant.status] }}
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {assistant.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {assistant.description ? (assistant.description.length > 70 ? `${assistant.description.substring(0, 70)}...` : assistant.description) : "No description provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate(`/assistants/edit/${assistant.id}`);
                    onClose();
                  }}
                  className="gap-2 border-primary/20 hover:bg-primary/10"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  onClick={handleStartCall}
                  size="sm"
                  className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25"
                >
                  <Play className="h-4 w-4" />
                  Start Call
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-background/50">
            {/* Stats Row with Enhanced Styling */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="group relative p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Users</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {assistant.userCount.toLocaleString()}
                </p>
              </div>
              <div className="group relative p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Interactions</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {assistant.interactionCount.toLocaleString()}
                </p>
              </div>
              <div className="group relative p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone Numbers</span>
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {phoneNumbers.length.toLocaleString()}
                </p>
              </div>
              <div className="group relative p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Created</span>
                </div>
                <p className="text-sm font-bold text-foreground">
                  {assistant.created_at ? formatDateTime(assistant.created_at).date : "N/A"}
                </p>
              </div>
            </div>

            {/* Phone Numbers Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="p-1.5 bg-primary/20 rounded-lg">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  Connected Phone Numbers
                </h3>
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                  {phoneNumbers.length} connected
                </Badge>
              </div>

              {loading ? (
                <div className="text-center py-12 bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl border-2 border-dashed border-primary/20">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3"></div>
                  <p className="text-sm text-muted-foreground font-medium">Loading phone numbers...</p>
                </div>
              ) : phoneNumbers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {phoneNumbers.map((phoneNumber) => (
                    <div
                      key={phoneNumber.id}
                      className="group relative p-4 bg-gradient-to-br from-card to-muted/10 rounded-xl border border-border/60 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                            <Phone className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-foreground mb-1">
                              {formatPhoneNumber(phoneNumber.number)}
                            </p>
                            {phoneNumber.label && (
                              <p className="text-xs text-muted-foreground">
                                {phoneNumber.label}
                              </p>
                            )}
                          </div>
                        </div>
                        <div
                          className="w-3 h-3 rounded-full shadow-lg"
                          style={{ backgroundColor: phoneStatusColors[phoneNumber.status as keyof typeof phoneStatusColors] || phoneStatusColors.inactive }}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={phoneNumber.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs bg-primary/10 text-primary border-primary/20"
                        >
                          {phoneNumber.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-medium">
                          {phoneNumber.webhook_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-muted/20 to-muted/10 rounded-xl border-2 border-dashed border-primary/20">
                  <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
                    <Phone className="h-10 w-10 text-primary opacity-60" />
                  </div>
                  <p className="text-sm font-bold text-foreground mb-1">
                    No phone numbers connected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Assign phone numbers in the Phone Numbers tab
                  </p>
                </div>
              )}
            </div>

            {/* Configuration Grid */}
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <Settings className="h-4 w-4 text-primary" />
                </div>
                Configuration
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-br from-card to-muted/10 rounded-xl border border-border/60 hover:border-primary/40 transition-all">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Model</p>
                  <p className="text-sm font-bold text-foreground">Not configured</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-card to-muted/10 rounded-xl border border-border/60 hover:border-primary/40 transition-all">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Voice</p>
                  <p className="text-sm font-bold text-foreground">Not configured</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-card to-muted/10 rounded-xl border border-border/60 hover:border-primary/40 transition-all">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Last Modified</p>
                  <p className="text-sm font-bold text-foreground">
                    {assistant.updated_at ? formatDateTime(assistant.updated_at).date : "Never"}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-card to-muted/10 rounded-xl border border-border/60 hover:border-primary/40 transition-all">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Status</p>
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 capitalize">
                    {assistant.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ThemedDialogContent>
    </ThemedDialog>
  );
}
