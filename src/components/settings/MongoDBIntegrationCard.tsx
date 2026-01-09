import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Database, CheckCircle2, Trash2, RefreshCw } from "lucide-react";
import { MongoDBAuthDialog } from "./MongoDBAuthDialog";

interface MongoDBIntegrationCardProps {
    integrations: any[];
    onSuccess: (data: any) => void;
    onRemove: (id: string) => void;
    onSync: (id: string) => void;
}

export function MongoDBIntegrationCard({
    integrations,
    onSuccess,
    onRemove,
    onSync
}: MongoDBIntegrationCardProps) {

    if (integrations.length === 0) {
        return (
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 text-center">
                    <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No MongoDB Integrations</h3>
                    <p className="text-muted-foreground mb-4">
                        Connect to your QB Express MongoDB to sync intake forms.
                    </p>
                    <MongoDBAuthDialog onSuccess={onSuccess}>
                        <Button>
                            <Database className="mr-2 h-4 w-4" />
                            Connect MongoDB
                        </Button>
                    </MongoDBAuthDialog>
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
                                    <Database className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base">{integration.collectionName}</CardTitle>
                                    <p className="text-xs text-muted-foreground truncate max-w-[200px]">{integration.connectionString}</p>
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
                        <div className="flex justify-between items-center text-sm text-muted-foreground mb-4">
                            <span>Last sync: {integration.lastSync ? new Date(integration.lastSync).toLocaleString() : 'Never'}</span>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onSync(integration._id)}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sync Now
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRemove(integration._id)}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
