
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchAssistants } from '@/lib/api/assistants/fetchAssistants'; // Assume this exists
import { SaveCampaignRequest } from '@/lib/api/campaigns';

// Hardcoded for now if api doesn't exist, but we should try to fetch contact lists
// Assuming we can fetch contact lists and csv files
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

// Fetch helpers
async function fetchWithAuth(url: string) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_URL}${url}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
    return res.json();
}

interface CampaignSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: SaveCampaignRequest) => void;
}

export function CampaignSettingsDialog({ open, onOpenChange, onSave }: CampaignSettingsDialogProps) {
    const [name, setName] = useState('');
    const [assistantId, setAssistantId] = useState('');
    const [contactSource, setContactSource] = useState<'contact_list' | 'csv_file'>('contact_list');
    const [contactListId, setContactListId] = useState('');
    const [csvFileId, setCsvFileId] = useState('');
    const [dailyCap, setDailyCap] = useState(100);
    const [startHour, setStartHour] = useState(9);
    const [endHour, setEndHour] = useState(17);
    const [callingDays, setCallingDays] = useState(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
    const [campaignPrompt, setCampaignPrompt] = useState('');

    // Load data
    const { data: assistantsData } = useQuery({
        queryKey: ['assistants'],
        queryFn: () => fetchAssistants()
    });

    // We need endpoints for contact lists and csv files. 
    // For now assuming: /api/v1/contacts/lists and /api/v1/csv/files
    const { data: contactListsData } = useQuery({
        queryKey: ['contactLists'],
        queryFn: () => fetchWithAuth('/api/v1/contacts/lists').then(res => res.data || [])
    });

    const { data: csvFilesData } = useQuery({
        queryKey: ['csvFiles'],
        queryFn: () => fetchWithAuth('/api/v1/csv').then(res => res.csvFiles || []) // adjust based on actual CSV API
    });

    const handleSubmit = () => {
        if (!name || !assistantId) {
            alert("Please fill in required Name and Assistant fields");
            return;
        }

        if (contactSource === 'contact_list' && !contactListId) {
            alert("Please select a Contact List");
            return;
        }

        if (contactSource === 'csv_file' && !csvFileId) {
            alert("Please select a CSV File");
            return;
        }

        onSave({
            name,
            assistantId,
            contactSource,
            contactListId: contactSource === 'contact_list' ? contactListId : undefined,
            csvFileId: contactSource === 'csv_file' ? csvFileId : undefined,
            dailyCap,
            startHour,
            endHour,
            callingDays,
            campaignPrompt
        });

        onOpenChange(false);
    };

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const toggleDay = (day: string) => {
        if (callingDays.includes(day)) {
            setCallingDays(callingDays.filter(d => d !== day));
        } else {
            setCallingDays([...callingDays, day]);
        }
    };

    const assistants = assistantsData?.assistants || [];
    const contactLists = Array.isArray(contactListsData) ? contactListsData : [];
    const csvFiles = Array.isArray(csvFilesData) ? csvFilesData : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Campaign</DialogTitle>
                    <DialogDescription>Configure your outbound calling campaign</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Campaign Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q4 Sales Outreach" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Select Assistant</Label>
                        <Select value={assistantId} onValueChange={setAssistantId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose an assistant" />
                            </SelectTrigger>
                            <SelectContent>
                                {assistants.map((wa: any) => (
                                    <SelectItem key={wa._id || wa.id} value={wa._id || wa.id}>{wa.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Contact Source</Label>
                            <Select value={contactSource} onValueChange={(v: any) => setContactSource(v)}>
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
                            <Label>{contactSource === 'contact_list' ? 'Select List' : 'Select CSV'}</Label>
                            <Select
                                value={contactSource === 'contact_list' ? contactListId : csvFileId}
                                onValueChange={contactSource === 'contact_list' ? setContactListId : setCsvFileId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contactSource === 'contact_list' ? (
                                        contactLists.map((cl: any) => (
                                            <SelectItem key={cl._id || cl.id} value={cl._id || cl.id}>{cl.name}</SelectItem>
                                        ))
                                    ) : (
                                        csvFiles.map((cf: any) => (
                                            <SelectItem key={cf._id || cf.id} value={cf._id || cf.id}>{cf.name}</SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Daily Call Cap</Label>
                        <Input type="number" value={dailyCap} onChange={e => setDailyCap(Number(e.target.value))} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Start Hour (0-23)</Label>
                            <Input type="number" min={0} max={23} value={startHour} onChange={e => setStartHour(Number(e.target.value))} />
                        </div>
                        <div className="grid gap-2">
                            <Label>End Hour (0-23)</Label>
                            <Input type="number" min={0} max={23} value={endHour} onChange={e => setEndHour(Number(e.target.value))} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Calling Days</Label>
                        <div className="flex flex-wrap gap-4">
                            {days.map(day => (
                                <div key={day} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`day-${day}`}
                                        checked={callingDays.includes(day)}
                                        onCheckedChange={() => toggleDay(day)}
                                    />
                                    <Label htmlFor={`day-${day}`} className="capitalize">{day}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Campaign Specific Prompt (Optional)</Label>
                        <Textarea
                            value={campaignPrompt}
                            onChange={e => setCampaignPrompt(e.target.value)}
                            placeholder="Override the assistant's prompt for this campaign..."
                            className="h-24"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Create Campaign</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
