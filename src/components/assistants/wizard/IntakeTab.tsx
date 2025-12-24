import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataCollectionData } from "./types";
import { CalendarCredentialsService, UserCalendarCredentials } from "@/lib/calendar-credentials";
import { IntegrationService, EmailIntegration } from "@/lib/api/integrations";
import { useToast } from "@/hooks/use-toast";

interface IntakeTabProps {
    data: DataCollectionData;
    onChange: (data: Partial<DataCollectionData>) => void;
}

export function IntakeTab({ data, onChange }: IntakeTabProps) {
    const { toast } = useToast();
    const [calendars, setCalendars] = useState<UserCalendarCredentials[]>([]);
    const [emails, setEmails] = useState<EmailIntegration[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCredentials = async () => {
            try {
                const [calendarCreds, integrationData] = await Promise.all([
                    CalendarCredentialsService.getAllCredentials(),
                    IntegrationService.getIntegrations()
                ]);

                setCalendars(calendarCreds);
                setEmails(integrationData.email || []);
            } catch (error) {
                console.error("Error loading credentials:", error);
                toast({
                    title: "Error",
                    description: "Failed to load credentials for selection.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        loadCredentials();
    }, [toast]);

    return (
        <div className="space-y-6">


            <Card className="p-6 bg-card/50 backdrop-blur-sm border-white/10">
                <h3 className="text-lg font-semibold mb-4">Credential Linking</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Select which connected accounts this assistant should use for actions.
                </p>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label>Email Account</Label>
                        <Select
                            value={data.linkedEmailId}
                            onValueChange={(value) => onChange({ linkedEmailId: value })}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an email account" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {emails.map((email) => (
                                    <SelectItem key={email._id} value={email._id}>
                                        {email.email} ({email.provider})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Used for sending emails and calendar invites.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Calendar Account</Label>
                        <Select
                            value={data.linkedCalendarId}
                            onValueChange={(value) => onChange({ linkedCalendarId: value })}
                            disabled={loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a calendar account" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {calendars.map((cal) => (
                                    <SelectItem key={cal.id} value={cal.id}>
                                        {cal.label} ({cal.provider})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Used for checking availability and booking appointments.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
