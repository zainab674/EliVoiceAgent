import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Helper for auth headers
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

interface MongoDBAuthDialogProps {
    children?: React.ReactNode;
    onSuccess: (data: any) => void;
}

export function MongoDBAuthDialog({ children, onSuccess }: MongoDBAuthDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [assistants, setAssistants] = useState<any[]>([]);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        connectionString: "",
        collectionName: "",
        assistantId: "",
    });

    useEffect(() => {
        if (open) {
            fetchAssistants();
        }
    }, [open]);

    const fetchAssistants = async () => {
        try {
            const response = await fetch('/api/v1/assistants', {
                headers: {
                    ...getAuthHeader(),
                    'Content-Type': 'application/json'
                }
            });
            if (!response.ok) throw new Error('Failed to fetch assistants');
            const data = await response.json();
            setAssistants(data || []);
        } catch (error) {
            console.error("Error fetching assistants:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!formData.connectionString || !formData.collectionName || !formData.assistantId) {
                throw new Error("Please fill in all fields");
            }

            const data = new FormData();
            data.append("connectionString", formData.connectionString);
            data.append("collectionName", formData.collectionName);
            data.append("assistantId", formData.assistantId);

            await onSuccess(data);

            setOpen(false);
            setFormData({
                connectionString: "",
                collectionName: "",
                assistantId: "",
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save MongoDB settings",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button>Connect MongoDB</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] overflow-visible">
                <DialogHeader>
                    <DialogTitle>Connect MongoDB Collection</DialogTitle>
                    <DialogDescription>
                        Enter your MongoDB connection details to sync client intake forms.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="connectionString">Connection String</Label>
                            <Input
                                id="connectionString"
                                value={formData.connectionString}
                                onChange={(e) => setFormData({ ...formData, connectionString: e.target.value })}
                                placeholder="mongodb+srv://..."
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="collectionName">Collection Name</Label>
                            <Input
                                id="collectionName"
                                value={formData.collectionName}
                                onChange={(e) => setFormData({ ...formData, collectionName: e.target.value })}
                                placeholder="clientintakes"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="assistantId">Assign Assistant</Label>
                        <Select
                            onValueChange={(value) => setFormData({ ...formData, assistantId: value })}
                            value={formData.assistantId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select assistant" />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={5} className="z-[10001] bg-white text-black">
                                {assistants.length > 0 ? (
                                    assistants.map((assistant) => (
                                        <SelectItem key={assistant._id} value={assistant._id}>
                                            {assistant.name}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        No assistants found
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Integration"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
