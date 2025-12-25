import React, { useEffect, useMemo, useState } from "react";
import { Search, Edit2, Plus, Trash2, MoreHorizontal, Check, ChevronsUpDown, User as UserIcon, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateAssistantDialog } from "@/components/assistants/CreateAssistantDialog";
import { AssistantDetailsDialog } from "@/components/assistants/AssistantDetailsDialog";
import { useAuth } from "@/contexts/SupportAccessAuthContext";

import { useToast } from "@/hooks/use-toast";
import {
  ThemedDialog,
  ThemedDialogTrigger,
  ThemedDialogContent,
  ThemedDialogHeader,
} from "@/components/ui/themed-dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Assistant } from "@/lib/api/assistants/fetchAssistants";

interface User {
  id: string;
  email: string;
  name?: string;
}

function UserAssignmentCell({
  assistant,
  users,
  onAssign
}: {
  assistant: Assistant;
  users: User[];
  onAssign: (assistantId: string, email: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const assignedUser = users.find(u => u.email === assistant.assignedUserEmail);
  const displayLabel = assistant.assignedUserEmail
    ? (assignedUser?.name || assistant.assignedUserEmail)
    : "Unassigned";

  const handleAssign = async (email: string) => {
    try {
      setLoading(true);
      await onAssign(assistant.id, email);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between text-left font-normal"
        >
          <span className="truncate">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {!loading && <UserIcon className="mr-2 h-4 w-4 opacity-50" />}
            {displayLabel}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search user or email..." value={value} onValueChange={setValue} />
          <CommandList>
            <CommandEmpty>
              <div className="p-2">
                <p className="text-sm text-muted-foreground mb-2">No user found.</p>
                {value && value.includes('@') && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleAssign(value)}
                  >
                    Assign to "{value}"
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {assistant.assignedUserEmail && (
                <CommandItem
                  value="unassign"
                  onSelect={() => handleAssign("")}
                  className="text-red-500"
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  Unassign
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      "opacity-0"
                    )}
                  />
                </CommandItem>
              )}
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.email} // Use email as value for search
                  onSelect={(currentValue) => {
                    handleAssign(user.email);
                  }}
                >
                  <UserIcon className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{user.name || 'Unknown'}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      assistant.assignedUserEmail === user.email ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function AssistantTableRow({
  assistant,
  onDelete,
  onCardClick,
  isAdmin,
  users,
  onAssign
}: {
  assistant: Assistant;
  onDelete: (id: string) => void;
  onCardClick: (assistant: Assistant) => void;
  isAdmin: boolean;
  users: User[];
  onAssign: (id: string, email: string) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const statusConfig = {
    draft: {
      color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      dot: 'bg-yellow-500'
    },
    active: {
      color: 'bg-green-600/20 text-green-300 border-green-500/30',
      dot: 'bg-green-500'
    },
    inactive: {
      color: 'bg-zinc-700/50 text-zinc-300 border-zinc-600/50',
      dot: 'bg-zinc-500'
    }
  };

  const config = statusConfig[assistant.status] || statusConfig.active;

  const handleEdit = () => {
    navigate(`/assistants/edit/${assistant.id}`);
  };

  const handleView = () => {
    onCardClick(assistant);
  };

  return (
    <TableRow className="hover:bg-muted/50 transition-colors">
      <TableCell className="font-semibold text-base">
        <button
          onClick={handleView}
          className="text-foreground hover:text-primary transition-colors text-left"
        >
          {assistant.name}
        </button>
      </TableCell>

      {/* Assigned User Column (Admin Only) */}
      {isAdmin && (
        <TableCell>
          <UserAssignmentCell assistant={assistant} users={users} onAssign={onAssign} />
        </TableCell>
      )}

      <TableCell>
        <Badge variant="outline" className={`text-sm font-semibold px-2.5 py-1 border ${config.color}`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
            {assistant.status.charAt(0).toUpperCase() + assistant.status.slice(1)}
          </div>
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleView}
            className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Details
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDeleteOpen(true)}
            className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            Delete
          </Button>
        </div>
      </TableCell>

      {/* Delete Confirmation Dialog */}
      <ThemedDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <ThemedDialogContent>
          <ThemedDialogHeader
            title="Delete Assistant"
            description={`Are you sure you want to delete "${assistant.name}"? This action cannot be undone and will permanently remove the assistant and all its data.`}
          />
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => {
                onDelete(assistant.id);
                setIsDeleteOpen(false);
              }}
            >
              Delete Assistant
            </Button>
          </div>
        </ThemedDialogContent>
      </ThemedDialog>
    </TableRow>
  );
}

interface AssistantsTabProps {
  tabChangeTrigger?: number;
}

export function AssistantsTab({ tabChangeTrigger = 0 }: AssistantsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [selectedAssistant, setSelectedAssistant] = useState<Assistant | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  // Fetch users for admin
  useEffect(() => {
    if (isAdmin) {
      const fetchUsers = async () => {
        try {
          const token = localStorage.getItem('token');
          const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
          const response = await fetch(`${baseUrl}/api/v1/admin/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success && data.data) {
            setUsers(data.data);
          }
        } catch (error) {
          console.error("Failed to fetch users:", error);
        }
      };
      fetchUsers();
    }
  }, [isAdmin]);

  const loadAssistantsForUser = async () => {
    if (!user?.id) {
      setAssistants([]);
      return;
    }

    try {
      const { fetchAssistants } = await import("@/lib/api/assistants/fetchAssistants");
      const { assistants } = await fetchAssistants();
      setAssistants(assistants);
    } catch (error) {
      console.warn("Failed to load assistants:", error);
      setAssistants([]);
    }
  };

  const handleAssignUser = async (assistantId: string, email: string) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${baseUrl}/api/v1/assistants/${assistantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedUserEmail: email })
      });

      if (!response.ok) {
        throw new Error('Failed to update assistant');
      }

      toast({
        title: "Success",
        description: `Assistant assigned to ${email || 'unassigned'}`
      });

      // Refresh assistants
      loadAssistantsForUser();

    } catch (error) {
      console.error("Error assigning user:", error);
      toast({
        title: "Error",
        description: "Failed to assign user",
        variant: "destructive"
      });
    }
  };

  const deleteAssistant = async (assistantId: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to delete assistants.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '';
      const response = await fetch(`${baseUrl}/api/v1/assistants/${assistantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to delete assistant:", data);
        toast({
          title: "Error",
          description: `Failed to delete assistant: ${data.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return;
      }

      setAssistants(prev => prev.filter(assistant => assistant.id !== assistantId));

      if (selectedAssistant?.id === assistantId) {
        setIsDialogOpen(false);
        setSelectedAssistant(null);
      }

      toast({
        title: "Assistant deleted",
        description: "The assistant has been permanently deleted.",
      });
    } catch (error) {
      console.error("Error deleting assistant:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Load assistants when user exists or tab changes
  useEffect(() => {
    if (user?.id) {
      setLoading(true);
      loadAssistantsForUser().finally(() => setLoading(false));
    }
  }, [user, tabChangeTrigger]);

  const handleAssistantClick = (assistant: Assistant) => {
    setSelectedAssistant(assistant);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedAssistant(null);
  };

  const filteredAssistants = useMemo(
    () =>
      assistants.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.description?.toLowerCase() || "").includes(searchQuery.toLowerCase())
      ),
    [assistants, searchQuery]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Your Assistants
          </h2>
          <p className="text-base font-medium text-muted-foreground">
            Manage and configure your AI assistants for different use cases
          </p>
        </div>
        <Button
          variant="default"
          className="font-bold gap-2 text-base px-4 py-2 h-10"
          onClick={(e) => {
            console.log("Add Assistant button clicked", e);
            setCreateDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add Assistant
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search assistants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10 text-base font-medium"
        />
      </div>

      {/* Assistants Table */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8">
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted/50 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : filteredAssistants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-base">Name</TableHead>
                {isAdmin && <TableHead className="font-bold text-base">Assigned User</TableHead>}
                <TableHead className="font-bold text-base">Status</TableHead>
                <TableHead className="text-right font-bold text-base">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssistants.map((assistant) => (
                <AssistantTableRow
                  key={assistant.id}
                  assistant={assistant}
                  onDelete={deleteAssistant}
                  onCardClick={handleAssistantClick}
                  isAdmin={isAdmin}
                  users={users}
                  onAssign={handleAssignUser}
                />
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-2xl flex items-center justify-center border border-border">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No assistants found
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Get started by creating your first AI assistant"
              }
            </p>
            {!searchQuery && (
              <Button
                variant="default"
                onClick={() => setCreateDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Assistant
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Assistant Dialog */}
      {createDialogOpen && (
        <CreateAssistantDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onCreateAssistant={(name: string, description: string) => {
            // Reload assistants after creation
            loadAssistantsForUser();
          }}
        />
      )}

      {/* Assistant Details Dialog */}
      <AssistantDetailsDialog
        assistant={selectedAssistant}
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
      />
    </div>
  );
}
