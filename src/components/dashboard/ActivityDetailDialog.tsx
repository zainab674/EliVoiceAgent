import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Phone,
    Mail,
    MessageSquare,
    Database,
    Clock,
    Calendar as CalendarIcon,
    User,
    ArrowRightLeft,
    CheckCircle2,
    Link as LinkIcon
} from "lucide-react";

interface ActivityDetailDialogProps {
    activity: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ActivityDetailDialog({ activity, open, onOpenChange }: ActivityDetailDialogProps) {
    if (!activity) return null;

    const renderCallDetails = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/20 border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Duration
                    </p>
                    <p className="font-semibold">{activity.duration || activity.call_duration || "0:00"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> Outcome
                    </p>
                    <Badge variant={activity.call_outcome?.toLowerCase().includes('appointment') ? 'default' : 'secondary'}>
                        {activity.call_outcome || "No Outcome"}
                    </Badge>
                </div>
            </div>
            {activity.transcript && (
                <div className="space-y-2">
                    <p className="text-sm font-semibold">Transcript Summary</p>
                    <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm leading-relaxed italic">
                        "{activity.transcript}"
                    </div>
                </div>
            )}
            {activity.recording_url && (
                <div className="flex justify-center pt-2">
                    <a
                        href={activity.recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        <LinkIcon className="h-4 w-4" /> Listen to Recording
                    </a>
                </div>
            )}
        </div>
    );

    const renderEmailDetails = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
                <div className="p-3 rounded-lg bg-secondary/20 border border-border">
                    <p className="text-xs text-muted-foreground uppercase mb-1">Recipient</p>
                    <p className="font-semibold">{activity.recipientName || "Lead"} ({activity.recipientEmail || activity.name})</p>
                </div>
                {activity.campaignName && (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-500/70 uppercase mb-1">Campaign</p>
                        <p className="font-semibold">{activity.campaignName}</p>
                        {activity.campaignSubject && (
                            <p className="text-xs text-muted-foreground mt-1">Subject: {activity.campaignSubject}</p>
                        )}
                    </div>
                )}
            </div>
            <div className="p-3 rounded-lg bg-secondary/20 border border-border">
                <p className="text-xs text-muted-foreground uppercase mb-1">Last Message Subject</p>
                <p className="font-semibold">{activity.subject || "No Subject"}</p>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Conversation History</p>
                    <Badge variant="outline">{activity.messageCount || 1} messages</Badge>
                </div>
                <ScrollArea className="h-[200px] w-full p-4 rounded-lg bg-muted/50 border border-border text-sm leading-relaxed">
                    {activity.snippet || "No content available."}
                </ScrollArea>
            </div>
        </div>
    );

    const renderSmsDetails = () => (
        <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/20 border border-border">
                <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                <div>
                    <p className="text-xs text-muted-foreground uppercase">{activity.direction} Message</p>
                    <p className="font-semibold">{activity.phoneNumber}</p>
                </div>
                <Badge className="ml-auto" variant="outline">{activity.status}</Badge>
            </div>
            <div className="p-4 rounded-lg bg-muted text-foreground leading-relaxed">
                {activity.snippet}
            </div>
        </div>
    );

    const renderFormDetails = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-xs text-indigo-500/70 mb-1">Lead Category</p>
                    <Badge className="capitalize">{activity.category || "None"}</Badge>
                </div>
                <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                    <p className="text-xs text-indigo-500/70 mb-1">Source</p>
                    <p className="font-semibold capitalize">{activity.source || "External"}</p>
                </div>
            </div>
            <div className="space-y-2">
                <p className="text-sm font-semibold">Submission Data</p>
                <div className="grid grid-cols-1 gap-2">
                    {activity.data ? Object.entries(activity.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between p-2 rounded bg-muted/30 border border-border/50 text-sm">
                            <span className="text-muted-foreground font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span className="font-semibold text-foreground">{String(value)}</span>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground italic">No detailed data available.</p>
                    )}
                </div>
            </div>
        </div>
    );

    const getIcon = () => {
        switch (activity.type) {
            case 'call': return <Phone className="h-5 w-5 text-primary" />;
            case 'email': return <Mail className="h-5 w-5 text-blue-500" />;
            case 'message': return <MessageSquare className="h-5 w-5 text-purple-500" />;
            case 'form': return <Database className="h-5 w-5 text-indigo-500" />;
            default: return <User className="h-5 w-5 text-muted-foreground" />;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] liquid-glass-heavy border border-white/10">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-full ${activity.type === 'call' ? 'bg-primary/10' :
                            activity.type === 'email' ? 'bg-blue-500/10' :
                                activity.type === 'message' ? 'bg-purple-500/10' :
                                    'bg-indigo-500/10'
                            }`}>
                            {getIcon()}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{activity.name || activity.phoneNumber || "Unknown activity"}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                <CalendarIcon className="h-3 w-3" /> {activity.date} <Clock className="h-3 w-3 ml-2" /> {activity.time}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="mt-2">
                    {activity.type === 'call' && renderCallDetails()}
                    {activity.type === 'email' && renderEmailDetails()}
                    {activity.type === 'message' && renderSmsDetails()}
                    {activity.type === 'form' && renderFormDetails()}
                </div>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={() => onOpenChange(false)}
                        className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors font-medium text-sm"
                    >
                        Close Details
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
