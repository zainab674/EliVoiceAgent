import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Loader2, Database, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Submission {
    _id: string;
    contactId: {
        first_name: string;
        email: string;
    };
    assistantId: {
        name: string;
    };
    category: string;
    data: Record<string, string>;
    interactionStatus: string;
    syncedAt: string;
}

export default function Submissions() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const fetchSubmissions = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/v1/integrations/mongodb/submissions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch submissions');
            const data = await response.json();
            setSubmissions(data);
        } catch (error) {
            console.error("Error fetching submissions:", error);
            toast({
                title: "Error",
                description: "Failed to load submissions.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            large: "bg-purple-500",
            growing: "bg-blue-500",
            medium: "bg-green-500",
            small: "bg-gray-500",
            none: "bg-slate-300"
        };
        return (
            <Badge className={colors[category] || colors.none}>
                {category.toUpperCase()}
            </Badge>
        );
    };

    const getInteractionBadge = (status: string) => {
        const displayStatus = status || "No interaction";
        const colors: Record<string, string> = {
            "Booking done": "bg-green-600",
            "Proper conversation": "bg-blue-600",
            "Email sent": "bg-yellow-600",
            "No interaction": "bg-slate-400"
        };
        return (
            <Badge className={colors[displayStatus] || colors["No interaction"]}>
                {displayStatus}
            </Badge>
        );
    };

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Lead Submissions</h1>
                        <p className="text-muted-foreground">
                            View all client intake forms synced from external MongoDB sources.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="w-5 h-5" />
                            Recent Submissions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : submissions.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Lead</TableHead>
                                            <TableHead>Assistant</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Revenue / Team</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {submissions.map((sub) => (
                                            <TableRow key={sub._id}>
                                                <TableCell className="text-sm">
                                                    {format(new Date(sub.syncedAt), "MMM dd, yyyy HH:mm")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{sub.contactId?.first_name || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">{sub.contactId?.email}</div>
                                                </TableCell>
                                                <TableCell>{sub.assistantId?.name || 'N/A'}</TableCell>
                                                <TableCell>{getCategoryBadge(sub.category)}</TableCell>
                                                <TableCell>
                                                    <div className="text-sm">{sub.data?.revenue || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">{sub.data?.teamSize || 'N/A'} employees</div>
                                                </TableCell>
                                                <TableCell>{getInteractionBadge(sub.interactionStatus)}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <a href={`/contacts?search=${sub.contactId?.email}`}>
                                                            <ExternalLink className="w-4 h-4 mr-2" />
                                                            View Contact
                                                        </a>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Database className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                                <h3 className="text-lg font-medium">No submissions yet</h3>
                                <p className="text-muted-foreground">
                                    Once leads are synced from QB Express, they will appear here.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
