import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Search, Mail, ArrowRight, Loader2, RefreshCcw } from "lucide-react";
import { getAccessToken } from "@/lib/auth"; // Corrected path
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { formatDistanceToNow } from "date-fns";

// Data types matching API response
type EmailThread = {
    id: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    lastMessage: string;
    timestamp: string;
    assistantName: string;
    messageCount: number;
};

type EmailMessage = {
    id: string;
    from: "assistant" | "user";
    content: string;
    timestamp: string;
    senderEmail: string;
};

export default function Emails() {
    const { user } = useAuth();
    const [threads, setThreads] = useState<EmailThread[]>([]);
    const [messages, setMessages] = useState<EmailMessage[]>([]);
    const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Fetch Threads
    useEffect(() => {
        const fetchThreads = async () => {
            setLoadingThreads(true);
            try {
                const token = getAccessToken();
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/emails/threads?search=${searchQuery}`, {
                    headers
                });
                const data = await res.json();
                if (data.success) {
                    setThreads(data.threads);
                }
            } catch (error) {
                console.error("Failed to fetch threads", error);
            } finally {
                setLoadingThreads(false);
            }
        };

        // Debounce search
        const timer = setTimeout(() => {
            if (user) fetchThreads();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, user]);

    // Fetch Messages when thread selected
    useEffect(() => {
        if (!selectedThread) return;

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const token = getAccessToken();
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/emails/${selectedThread.id}`, { headers });
                const data = await res.json();
                if (data.success) {
                    setMessages(data.messages);
                }
            } catch (error) {
                console.error("Failed to fetch messages", error);
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [selectedThread]);

    // Helper to clean email body
    const cleanupEmailBody = (body: string) => {
        if (!body) return "";

        const lines = body.split('\n');
        const cleanLines: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();
            // Stop at common reply markers
            if (trimmed.startsWith('On ') && trimmed.endsWith('wrote:')) break;
            if (trimmed.startsWith('From: ')) break;
            if (trimmed.startsWith('>')) break; // Quoted text
            if (trimmed === '________________________________') break; // Outlook/other separators

            cleanLines.push(line);
        }

        return cleanLines.join('\n').trim();
    };

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-140px)] gap-6 font-sans">
                {/* Left Column: Email List */}
                <div className="w-1/3 flex flex-col gap-4 overflow-hidden h-full">
                    <Card className="h-full flex flex-col border-border/40 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-border/40 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search emails..."
                                    className="w-full bg-secondary/50 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={async () => {
                                    setLoadingThreads(true);
                                    try {
                                        const token = getAccessToken();
                                        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/emails/sync`, {
                                            method: 'POST',
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        // Wait a bit then refresh
                                        setTimeout(() => {
                                            setSearchQuery(prev => prev + " ");
                                            setTimeout(() => setSearchQuery(prev => prev.trim()), 100);
                                        }, 2000);
                                    } catch (e) { console.error(e); setLoadingThreads(false); }
                                }}
                                className="p-2 bg-secondary/50 rounded-lg hover:bg-secondary/80 transition-colors"
                                title="Sync Emails"
                            >
                                <RefreshCcw className={`h-4 w-4 ${loadingThreads ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {loadingThreads ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                            ) : threads.length === 0 ? (
                                <div className="text-center p-8 text-muted-foreground text-sm">No emails found</div>
                            ) : (
                                threads.map(thread => (
                                    <button
                                        key={thread.id}
                                        onClick={() => setSelectedThread(thread)}
                                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 border border-transparent 
                        ${selectedThread?.id === thread.id
                                                ? 'bg-primary/5 border-primary/10 shadow-sm'
                                                : 'hover:bg-secondary/50'
                                            } `}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-semibold text-sm ${selectedThread?.id === thread.id ? 'text-primary' : 'text-foreground'} `}>
                                                {thread.senderName}
                                            </h3>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                                {thread.timestamp ? formatDistanceToNow(new Date(thread.timestamp), { addSuffix: true }) : ''}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mb-1 font-medium truncate">
                                            {thread.subject}
                                        </p>
                                        <p className="text-xs text-muted-foreground/80 truncate">
                                            {cleanupEmailBody(thread.lastMessage)}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Conversation */}
                <div className="w-2/3 h-full overflow-hidden">
                    <Card className="h-full flex flex-col border-border/40 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                        {selectedThread ? (
                            <>
                                {/* Thread Header */}
                                <div className="p-4 border-b border-border/40 flex justify-between items-center bg-card/50">
                                    <div>
                                        <h2 className="font-semibold text-lg">{selectedThread.subject}</h2>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Mail className="h-3 w-3" />
                                            <span>{selectedThread.senderEmail}</span>
                                            <span>•</span>
                                            <span>{selectedThread.assistantName || 'Assistant'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {loadingMessages ? (
                                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                                    ) : (
                                        messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex flex-col ${message.from === 'assistant' ? 'items-end' : 'items-start'} `}
                                            >
                                                <div
                                                    className={`max-w-[80%] rounded-2xl p-4 shadow-sm border ${message.from === 'assistant'
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-card border-border/50 text-foreground'
                                                        } `}
                                                >
                                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanupEmailBody(message.content)}</p>
                                                </div>
                                                <div className="flex items-center gap-2 mt-2 px-1">
                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider opacity-70">
                                                        {message.from === 'assistant' ? 'AI Assistant' : message.senderEmail}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground opacity-50">•</span>
                                                    <span className="text-[10px] text-muted-foreground opacity-50">
                                                        {message.timestamp ? new Date(message.timestamp).toLocaleString() : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {/* Reply Area (Placeholder) */}
                                <div className="p-4 border-t border-border/40 bg-card/30">
                                    <div className="relative">
                                        <textarea
                                            placeholder="Type a reply... (AI will usually reply automatically)"
                                            className="w-full bg-background border border-border/50 rounded-xl p-3 text-sm focus:ring-1 focus:ring-primary outline-none resize-none min-h-[80px]"
                                        />
                                        <div className="absolute right-3 bottom-3 flex gap-2">
                                            <button className="bg-primary text-primary-foreground p-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                                <div className="h-16 w-16 bg-secondary/50 rounded-full flex items-center justify-center mb-4">
                                    <Mail className="h-8 w-8 opacity-50" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-1">No conversation selected</h3>
                                <p className="text-sm max-w-xs">Select an email thread from the left to view the conversation history.</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}

