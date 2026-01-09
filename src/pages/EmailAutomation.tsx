import { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { ThemeContainer, ThemeCard } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, BarChart3, Mail, RefreshCw, Play, Pause } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { EmailCampaignSettingsDialog } from "@/components/campaigns/EmailCampaignSettingsDialog";
import { fetchEmailCampaigns, createEmailCampaign, startEmailCampaign, pauseEmailCampaign, EmailCampaign } from "@/lib/api/emailCampaigns";

export default function EmailAutomation() {
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetchEmailCampaigns();
            if (res.success) {
                setCampaigns(res.campaigns);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns", error);
            toast({
                title: "Error",
                description: "Failed to load email campaigns",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const handleCreate = async (formData: FormData) => {
        try {
            await createEmailCampaign(formData);
            toast({
                title: "Success",
                description: "Campaign draft created!",
            });
            loadCampaigns();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create campaign",
                variant: "destructive"
            });
            throw error;
        }
    };

    const handleStart = async (campaignId: string) => {
        try {
            await startEmailCampaign(campaignId);
            toast({
                title: "Success",
                description: "Campaign started!",
            });
            loadCampaigns();
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to start campaign: " + error.message,
                variant: "destructive"
            });
        }
    };

    const handlePause = async (campaignId: string) => {
        try {
            await pauseEmailCampaign(campaignId);
            toast({
                title: "Success",
                description: "Campaign paused!",
            });
            loadCampaigns();
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to pause campaign: " + error.message,
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: any = {
            draft: 'secondary',
            sending: 'default',
            completed: 'success',
            failed: 'destructive',
            paused: 'warning'
        };
        const variant = variants[status] || 'secondary';

        let className = "";
        if (status === 'completed') className = "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-500/20";

        return <Badge variant={variant === 'success' ? 'outline' : variant} className={className}>{status.toUpperCase()}</Badge>;
    };

    return (
        <DashboardLayout>
            <ThemeContainer variant="base" className="min-h-screen no-hover-scaling">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-light">Email Campaigns</h1>
                            <p className="text-muted-foreground">Manage your automated email outreach campaigns.</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={loadCampaigns}>
                                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                            </Button>
                            <Button onClick={() => setDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" /> New Campaign
                            </Button>
                        </div>
                    </div>

                    {loading && campaigns.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[50vh]">
                            Loading campaigns...
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-lg border border-dashed border-border">
                            <Mail className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
                            <h2 className="text-xl font-medium mb-2">No Campaigns Yet</h2>
                            <p className="text-muted-foreground mb-6">Create your first email campaign to get started</p>
                            <Button onClick={() => setDialogOpen(true)}>Create Campaign</Button>
                        </div>
                    ) : (
                        <ThemeCard variant="glass">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Assistant</TableHead>
                                        <TableHead>Sender</TableHead>
                                        <TableHead>Stats (Sent/Replied)</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campaigns.map(campaign => (
                                        <TableRow key={campaign._id}>
                                            <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                                            <TableCell className="font-medium">
                                                {campaign.name}
                                                <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{campaign.subject}</div>
                                            </TableCell>
                                            <TableCell>
                                                {typeof campaign.assistantId === 'object' ? campaign.assistantId?.name : 'Unknown'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {campaign.senderEmail || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted-foreground">Sent</span>
                                                        <span className="font-medium">{campaign.stats?.sent || 0} / {campaign.totalRecipients || 0}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-muted-foreground">Replies</span>
                                                        <span className="font-medium text-green-600">{campaign.stats?.replies || 0}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(campaign.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {(campaign.status === 'draft' || campaign.status === 'paused' || campaign.status === 'failed') && (
                                                    <Button variant="ghost" size="icon" onClick={() => handleStart(campaign._id)} title="Start Campaign">
                                                        <Play className="h-4 w-4 text-green-600" />
                                                    </Button>
                                                )}
                                                {campaign.status === 'sending' && (
                                                    <Button variant="ghost" size="icon" onClick={() => handlePause(campaign._id)} title="Pause Campaign">
                                                        <Pause className="h-4 w-4 text-amber-600" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ThemeCard>
                    )}
                </div>

                <EmailCampaignSettingsDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onSave={handleCreate}
                />

            </ThemeContainer>
        </DashboardLayout>
    );
}
