import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { getAccessToken } from "@/lib/auth";

// APIs
import { fetchContactLists } from "@/lib/api/contacts/fetchContactLists";
import { fetchCsvFiles } from "@/lib/api/csv/fetchCsvFiles";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

interface SMSCampaignSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (payload: any) => Promise<void>;
}

export function SMSCampaignSettingsDialog({ open, onOpenChange, onSave }: SMSCampaignSettingsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [enhancing, setEnhancing] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [assistantId, setAssistantId] = useState('');
    const [contactSource, setContactSource] = useState<'contact_list' | 'csv_file'>('contact_list');
    const [sourceId, setSourceId] = useState(''); // Stores either listId or csvFileId
    const [body, setBody] = useState('');

    // Data State
    const [assistants, setAssistants] = useState<any[]>([]);
    const [contactLists, setContactLists] = useState<any[]>([]);
    const [csvFiles, setCsvFiles] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = getAccessToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // 1. Assistants
            const asstRes = await fetch(`${API_URL}/api/v1/assistants`, { headers });
            const asstData = await asstRes.json();
            const asstList = Array.isArray(asstData) ? asstData : (asstData.assistants || []);
            setAssistants(asstList);

            // 2. Contact Lists
            try {
                const lists = await fetchContactLists();
                setContactLists(lists.contactLists || []);
            } catch (e) {
                console.error("Failed to load contact lists", e);
            }

            // 3. CSV Files
            try {
                const csvs = await fetchCsvFiles();
                setCsvFiles(csvs.csvFiles || []);
            } catch (e) {
                console.error("Failed to load csv files", e);
            }

        } catch (error) {
            console.error("Error loading form data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name || !assistantId || !sourceId || !body) {
            alert("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                name,
                assistantId,
                contactSource,
                [contactSource === 'contact_list' ? 'contactListId' : 'csvFileId']: sourceId,
                body
            };

            await onSave(payload);
            onOpenChange(false);

            // Reset form
            setName('');
            setBody('');
            setAssistantId('');
            setSourceId('');

        } catch (error) {
            console.error(error);
            // Error handling is mainly done in parent via Toast, but we catch here to stop spinning
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New SMS Campaign</DialogTitle>
                    <DialogDescription>Setup your automated SMS outreach.</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin" /></div>
                ) : (
                    <div className="grid gap-6 py-4">
                        {/* Campaign Info */}
                        <div className="grid gap-2">
                            <Label>Campaign Name</Label>
                            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Weekly Update" />
                        </div>

                        <div className="grid gap-2">
                            <Label>Assistant (Sender)</Label>
                            <Select value={assistantId} onValueChange={setAssistantId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Assistant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {assistants.map((a: any) => (
                                        <SelectItem key={a.id || a._id} value={a.id || a._id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">The assistant must have a phone number configured.</p>
                        </div>

                        {/* Audience */}
                        <div className="grid sm:grid-cols-2 gap-4 p-4 border rounded-lg bg-accent/10">
                            <div className="grid gap-2">
                                <Label>Audience Source</Label>
                                <Select value={contactSource} onValueChange={(v: any) => { setContactSource(v); setSourceId(''); }}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="contact_list">Contact List</SelectItem>
                                        <SelectItem value="csv_file">CSV File</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>{contactSource === 'contact_list' ? 'Select Contact List' : 'Select CSV File'}</Label>
                                <Select value={sourceId} onValueChange={setSourceId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select source..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {contactSource === 'contact_list' ? (
                                            contactLists.map((l: any) => (
                                                <SelectItem key={l.id} value={l.id}>{l.name} ({l.count})</SelectItem>
                                            ))
                                        ) : (
                                            csvFiles.map((f: any) => (
                                                <SelectItem key={f.id} value={f.id}>{f.name} ({f.rowCount})</SelectItem>
                                            ))
                                        )}
                                        {(contactSource === 'contact_list' ? contactLists : csvFiles).length === 0 && (
                                            <div className="p-2 text-xs text-muted-foreground">No {contactSource === 'contact_list' ? 'lists' : 'files'} found</div>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="grid gap-2">
                            <div className="flex justify-between items-center">
                                <Label>Body</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs gap-1 text-muted-foreground hover:text-primary"
                                    disabled={!body || enhancing}
                                    onClick={async () => {
                                        if (!body) return;
                                        setEnhancing(true);
                                        try {
                                            const token = getAccessToken();
                                            const headers: any = { 'Content-Type': 'application/json' };
                                            if (token) headers['Authorization'] = `Bearer ${token}`;

                                            const res = await fetch(`${API_URL}/api/v1/ai/enhance-text`, {
                                                method: 'POST',
                                                headers,
                                                body: JSON.stringify({
                                                    text: body,
                                                    instruction: "Make this SMS message concise, engaging, and professional. Keep it short."
                                                })
                                            });
                                            const data = await res.json();
                                            if (data.content) {
                                                setBody(data.content);
                                            }
                                        } catch (e) {
                                            console.error("Enhancement failed", e);
                                        } finally {
                                            setEnhancing(false);
                                        }
                                    }}
                                >
                                    {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                    Enhance with AI
                                </Button>
                            </div>
                            <Textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="SMS content..."
                                className="min-h-[100px]"
                            />
                            <p className="text-xs text-muted-foreground text-right">{body.length} characters</p>
                        </div>

                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={submitting || loading}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitting ? 'Creating...' : 'Create & Start Campaign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
