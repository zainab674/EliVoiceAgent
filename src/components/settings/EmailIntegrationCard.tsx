import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmailAuthDialog } from "./EmailAuthDialog";
import { Mail, CheckCircle2, Trash2, RefreshCw } from "lucide-react";

interface EmailIntegrationCardProps {
    integrations: any[]; // Using any for simplicity for now
    onSuccess: (data: any) => void;
    onRemove: (email: string) => void;
    onRefresh: (email: string) => void;
}

export function EmailIntegrationCard({
    integrations,
    onSuccess,
    onRemove,
    onRefresh
}: EmailIntegrationCardProps) {

    if (integrations.length === 0) {
        return (
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Email Integrations</h3>
                    <p className="text-muted-foreground mb-4">
                        Connect your email to enable assistant email replies.
                    </p>
                    <EmailAuthDialog onSuccess={onSuccess}>
                        <Button>
                            <Mail className="mr-2 h-4 w-4" />
                            Connect Email
                        </Button>
                    </EmailAuthDialog>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {integrations.map((integration, idx) => (
                <Card key={idx} className="border-border/60 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Mail className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">{integration.email}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{integration.provider} - {integration.smtpHost}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {integration.isActive && (
                                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                        Active
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <div className="space-y-3">
                            <div className="flex gap-2 pt-2 justify-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onRemove(integration.email)}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
