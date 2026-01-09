import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { IntegrationService, EmailIntegration } from "@/lib/api/integrations";

interface EmailTabProps {
    data: {
        subject: string;
        body: string;
        fromEmail: string;
        emailReplyPrompt?: string;
        link?: string;
    };
    assistantName: string;
    documents: any[];
    onChange: (data: any) => void;
}

export function EmailTab({ data, assistantName, documents, onChange }: EmailTabProps) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [emails, setEmails] = useState<EmailIntegration[]>([]);
    const [loadingEmails, setLoadingEmails] = useState(true);

    useEffect(() => {
        const loadIntegrations = async () => {
            try {
                const integrationData = await IntegrationService.getIntegrations();
                setEmails(integrationData.email || []);
            } catch (error) {
                console.error("Error loading email integrations:", error);
            } finally {
                setLoadingEmails(false);
            }
        };
        loadIntegrations();
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/ai/generate-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    assistantName,
                    documents,
                    type: 'post_call'
                })
            });

            if (!response.ok) throw new Error('Generation failed');

            const result = await response.json();
            onChange({ ...data, body: result.content });
            toast({ title: "Email generated successfully" });

        } catch (error) {
            console.error(error);
            toast({ title: "Failed to generate email", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="p-6 bg-card/50 backdrop-blur-sm border-white/10">
                <h3 className="text-lg font-semibold mb-4">Post-Call Email Configuration</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Configure the email that will be sent to the caller after the conversation ends.
                    Any documents uploaded in the "Documents" tab will be attached.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>From Address</Label>
                        <Select
                            value={data.fromEmail}
                            onValueChange={(value) => onChange({ ...data, fromEmail: value })}
                            disabled={loadingEmails}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a connected email" />
                            </SelectTrigger>
                            <SelectContent>
                                {emails.map((email) => (
                                    <SelectItem key={email.email} value={email.email}>
                                        {email.email} ({email.provider})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {emails.length === 0 && !loadingEmails && (
                            <p className="text-xs text-destructive">
                                No connected email accounts found. Please connect one in Settings &rarr; Integrations.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Subject Line</Label>
                        <Input
                            value={data.subject}
                            onChange={(e) => onChange({ ...data, subject: e.target.value })}
                            placeholder="e.g. Information from our call"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tracking / Booking Link (Optional)</Label>
                        <Input
                            value={data.link || ""}
                            onChange={(e) => onChange({ ...data, link: e.target.value })}
                            placeholder="https://example.com/booking"
                        />
                        <p className="text-xs text-muted-foreground">
                            Use {"{{link}}"} in the body to insert this link.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Email Body</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="h-8 gap-2 text-primary border-primary/20 hover:bg-primary/10"
                            >
                                {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                                Generate with AI
                            </Button>
                        </div>
                        <Textarea
                            value={data.body}
                            onChange={(e) => onChange({ ...data, body: e.target.value })}
                            placeholder="Hi [Name], thanks for speaking with us..."
                            className="min-h-[200px]"
                        />
                        <p className="text-xs text-muted-foreground">
                            Tip: The assistant will automatically replace [Name] with the caller's name if collected.
                        </p>
                    </div>
                </div>
            </Card>

            <Card className="p-6 bg-card/50 backdrop-blur-sm border-white/10">
                <h3 className="text-lg font-semibold mb-4">AI Reply Automation</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Configure how the AI assistant should respond when a lead replies to an email.
                    If left blank, the assistant will use its main System Prompt.
                </p>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>AI Email Reply Prompt</Label>
                        <Textarea
                            value={data.emailReplyPrompt || ""}
                            onChange={(e) => onChange({ ...data, emailReplyPrompt: e.target.value })}
                            placeholder="e.g. You are an expert sales closer. Your goal is to get the lead to book a call using the provided link..."
                            className="min-h-[150px]"
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
}
