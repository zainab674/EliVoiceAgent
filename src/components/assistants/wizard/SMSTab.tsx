import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MessageSquare, Clock, Shield, Calendar, Database, Loader2 } from "lucide-react";
import { SMSData } from "./types";
import { WizardSlider } from "./WizardSlider";
import { CalendarCredentialsService, type UserCalendarCredentials } from "@/lib/calendar-credentials";
import { useToast } from "@/hooks/use-toast";

interface SMSTabProps {
  data: SMSData;
  onChange: (data: Partial<SMSData>) => void;
}

export const SMSTab: React.FC<SMSTabProps> = ({ data, onChange }) => {
  const [isComplianceOpen, setIsComplianceOpen] = React.useState(false);



  // Calendar state
  const [calendarCredentials, setCalendarCredentials] = useState<UserCalendarCredentials[]>([]);
  const [loadingCalendarCredentials, setLoadingCalendarCredentials] = useState(false);

  const { toast } = useToast();



  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[540px]">
      {/* Left Column - Main Content */}
      <div className="lg:col-span-8 flex flex-col">
        <div className="flex-1 space-y-6">
          {/* Header Section */}
          <div className="mb-6">
            <h2 className="text-[28px] font-light tracking-[0.2px] mb-2">Messages</h2>
            <p className="text-base text-muted-foreground max-w-xl">
              Configure your messaging assistant for SMS, WhatsApp, and other platforms
            </p>
          </div>

          {/* First Message Section */}
          <div className="mb-6">
            <label className="block text-base font-medium tracking-[0.2px] mb-2">
              First Message
            </label>
            <Textarea
              placeholder="Hello! I'm your AI assistant. How can I help you today?"
              value={data.firstMessage}
              onChange={(e) => onChange({ firstMessage: e.target.value })}
              className="min-h-[80px] text-[15px] leading-relaxed resize-y"
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-2">
              This message will be sent automatically when an SMS conversation starts
            </p>
          </div>

          {/* Messaging Instructions Section */}
          <div className="flex-1">
            <label className="block text-base font-medium tracking-[0.2px] mb-2">
              Messaging Instructions
            </label>
            <Textarea
              placeholder="You are a messaging assistant for a dental clinic. Keep responses concise and helpful. Always ask for confirmation before booking appointments via text..."
              value={data.systemPrompt}
              onChange={(e) => onChange({ systemPrompt: e.target.value })}
              className="min-h-[420px] h-full text-[15px] leading-relaxed resize-y"
              rows={16}
            />
          </div>
        </div>
      </div>




    </div>
  );
};

