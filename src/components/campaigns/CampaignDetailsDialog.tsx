
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from '@tanstack/react-query';
import { getCampaign, getCampaignCalls, Campaign } from '@/lib/api/campaigns';

interface CampaignDetailsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    campaignId: string;
    campaignName: string;
}

export function CampaignDetailsDialog({ open, onOpenChange, campaignId, campaignName }: CampaignDetailsDialogProps) {
    // Only fetch if open and id exists
    const enabled = open && !!campaignId;

    const { data: campaignData, isLoading: isLoadingDetails } = useQuery({
        queryKey: ['campaign', campaignId],
        queryFn: () => getCampaign(campaignId),
        enabled
    });

    const { data: callsData, isLoading: isLoadingCalls } = useQuery({
        queryKey: ['campaignCalls', campaignId],
        queryFn: () => getCampaignCalls(campaignId),
        enabled
    });

    const campaign: Campaign | null = campaignData?.campaign || null;
    const calls: any[] = callsData?.calls || [];
    const queueStats = campaign?.queueStats;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{campaignName}</DialogTitle>
                    <DialogDescription>
                        Details and call history
                    </DialogDescription>
                </DialogHeader>

                {isLoadingDetails ? (
                    <div>Loading details...</div>
                ) : campaign ? (
                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-muted/20 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{campaign.dials || 0}</div>
                                <div className="text-sm text-muted-foreground">Total Dials</div>
                            </div>
                            <div className="bg-muted/20 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{campaign.pickups || 0}</div>
                                <div className="text-sm text-muted-foreground">Pickups</div>
                            </div>
                            <div className="bg-muted/20 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold">{campaign.interested || 0}</div>
                                <div className="text-sm text-muted-foreground">Interested</div>
                            </div>
                            <div className="bg-muted/20 p-4 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-500">{queueStats?.queued || 0}</div>
                                <div className="text-sm text-muted-foreground">Queued</div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="flex gap-4 items-center p-4 border rounded-lg bg-card">
                            <span className="font-semibold">Execution Status:</span>
                            <Badge variant={campaign.executionStatus === 'running' ? 'default' : 'secondary'}>
                                {campaign.executionStatus?.toUpperCase()}
                            </Badge>
                            <div className="ml-auto text-sm text-muted-foreground">
                                Current Daily: {campaign.currentDailyCalls} / {campaign.dailyCap}
                            </div>
                        </div>

                        {/* Recent Calls Table */}
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Recent Calls</h3>
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Time</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Notes</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoadingCalls ? (
                                            <TableRow><TableCell colSpan={5} className="text-center">Loading calls...</TableCell></TableRow>
                                        ) : calls.length === 0 ? (
                                            <TableRow><TableCell colSpan={5} className="text-center">No calls recorded yet.</TableCell></TableRow>
                                        ) : (
                                            calls.map((call: any) => (
                                                <TableRow key={call._id}>
                                                    <TableCell className="text-xs">
                                                        {new Date(call.createdAt).toLocaleString()}
                                                    </TableCell>
                                                    <TableCell>{call.contactName}</TableCell>
                                                    <TableCell>{call.phoneNumber}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={call.status === 'completed' ? 'outline' : call.status === 'failed' ? 'destructive' : 'secondary'}>
                                                            {call.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate" title={call.notes || ''}>
                                                        {call.notes}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div>Failed to load campaign data.</div>
                )}
            </DialogContent>
        </Dialog>
    );
}
