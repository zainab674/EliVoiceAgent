
import { useState, useEffect } from 'react';
import DashboardLayout from "@/layout/DashboardLayout";
import { motion } from "framer-motion";
import { ThemeContainer, ThemeSection, ThemeCard } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Pause, Trash2, Plus, BarChart3, Eye } from "lucide-react";

import { fetchCampaigns, startCampaign, pauseCampaign, resumeCampaign, deleteCampaign, Campaign } from "@/lib/api/campaigns";
import { CampaignSettingsDialog } from "@/components/campaigns/CampaignSettingsDialog";
import { CampaignDetailsDialog } from "@/components/campaigns/CampaignDetailsDialog";

export default function Campaigns() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);

    // Dialog states
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState('');
    const [selectedCampaignName, setSelectedCampaignName] = useState('');

    // Load campaigns
    const loadCampaigns = async () => {
        try {
            setLoading(true);
            const res = await fetchCampaigns();
            setCampaigns(res.campaigns || []);
        } catch (error) {
            console.error('Error loading campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const handleCreate = async (data: any) => {
        // API call is handled inside Dialog usually or we pass a wrapper
        // But CampaignSettingsDialog currently calls onSave prop.
        // We should use the API wrapper here.
        const { saveCampaign } = await import('@/lib/api/campaigns');
        try {
            await saveCampaign(data);
            setSettingsOpen(false);
            loadCampaigns();
        } catch (e: any) {
            alert('Failed to save campaign: ' + e.message);
        }
    };

    const toggleStatus = async (campaign: Campaign) => {
        try {
            if (campaign.executionStatus === 'running') {
                await pauseCampaign(campaign._id);
            } else if (campaign.executionStatus === 'paused') {
                await resumeCampaign(campaign._id);
            } else if (campaign.executionStatus === 'idle' || campaign.executionStatus === 'error' || campaign.executionStatus === 'completed') {
                await startCampaign(campaign._id);
            }
            loadCampaigns(); // Refresh
        } catch (e: any) {
            alert('Failed to update status: ' + e.message);
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this campaign?')) return;
        try {
            await deleteCampaign(id);
            loadCampaigns();
        } catch (e: any) {
            alert('Failed to delete: ' + e.message);
        }
    }

    const openDetails = (campaign: Campaign) => {
        setSelectedCampaignId(campaign._id);
        setSelectedCampaignName(campaign.name);
        setDetailsOpen(true);
    }

    const getStatusBadge = (status: string) => {
        const variants: any = {
            idle: 'secondary',
            running: 'default',
            paused: 'warning',
            completed: 'outline',
            error: 'destructive'
        };
        return <Badge variant={variants[status] || 'secondary'}>{status.toUpperCase()}</Badge>;
    }

    if (loading && campaigns.length === 0) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[50vh]">
                    Loading campaigns...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <ThemeContainer variant="base" className="min-h-screen no-hover-scaling">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-light">Campaigns</h1>
                            <p className="text-muted-foreground">Manage your outbound calling campaigns</p>
                        </div>
                        <Button onClick={() => setSettingsOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" /> New Campaign
                        </Button>
                    </div>

                    {campaigns.length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-lg">
                            <BarChart3 className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h2 className="text-xl font-medium mb-2">No Campaigns Yet</h2>
                            <p className="text-muted-foreground mb-6">Create your first campaign to get started</p>
                            <Button onClick={() => setSettingsOpen(true)}>Create Campaign</Button>
                        </div>
                    ) : (
                        <ThemeCard variant="glass">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Assistant</TableHead>
                                        <TableHead>Stats (D/P/I)</TableHead>
                                        <TableHead>Daily Progress</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campaigns.map(campaign => (
                                        <TableRow key={campaign._id}>
                                            <TableCell>{getStatusBadge(campaign.executionStatus)}</TableCell>
                                            <TableCell className="font-medium cursor-pointer hover:underline" onClick={() => openDetails(campaign)}>
                                                {campaign.name}
                                            </TableCell>
                                            <TableCell>
                                                {typeof campaign.assistantId === 'object' ? campaign.assistantId?.name : 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                {campaign.dials} / {campaign.pickups} / {campaign.interested}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-muted-foreground">{campaign.currentDailyCalls} / {campaign.dailyCap}</span>
                                                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary"
                                                            style={{ width: `${Math.min(100, (campaign.currentDailyCalls / campaign.dailyCap) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openDetails(campaign)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => toggleStatus(campaign)}>
                                                        {campaign.executionStatus === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(campaign._id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ThemeCard>
                    )}
                </div>

                <CampaignSettingsDialog
                    open={settingsOpen}
                    onOpenChange={setSettingsOpen}
                    onSave={handleCreate}
                />

                <CampaignDetailsDialog
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                    campaignId={selectedCampaignId}
                    campaignName={selectedCampaignName}
                />

            </ThemeContainer>
        </DashboardLayout>
    );
}
