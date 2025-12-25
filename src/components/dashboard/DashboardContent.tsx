import { useEffect, useState, useMemo } from "react";
import { ThemeContainer, ThemeSection } from "@/components/theme";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone,
  Users,
  CheckCircle2,
  MessageSquare,
  Activity,
  ArrowRight,
  PhoneCall,
  Briefcase,
  Megaphone,
  Mail
} from "lucide-react";
import { Link } from "react-router-dom";
import { fetchContacts } from "@/lib/api/contacts/fetchContacts";
import { fetchContactLists } from "@/lib/api/contacts/fetchContactLists";
import { fetchCampaigns } from "@/lib/api/campaigns";
import { useAuth } from "@/contexts/SupportAccessAuthContext";

interface DashboardContentProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  callLogs: any[];
  unifiedActivity: any[];
  emailStats: {
    totalThreads: number;
    totalMessages: number;
  };
  isLoading: boolean;
  stats: {
    totalCalls: number;
    avgDuration: number;
    appointments: number;
    bookingRate: number;
    successfulTransfers: number;
  };
  callOutcomesData: Record<string, number>;
}


export default function DashboardContent({
  dateRange,
  callLogs,
  unifiedActivity,
  emailStats,
  isLoading,
  stats,
  callOutcomesData
}: DashboardContentProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactLists, setContactLists] = useState<any[]>([]);
  const [assistants, setAssistants] = useState<any[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load additional data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.id) return;

      try {
        setLoadingData(true);

        // Load contacts
        const contactsData = await fetchContacts();
        setContacts(contactsData.contacts || []);

        // Load contact lists
        const listsData = await fetchContactLists();
        setContactLists(listsData.contactLists || []);

        // Load campaigns
        try {
          const campaignsData = await fetchCampaigns();
          setCampaigns(campaignsData.campaigns || []);
        } catch (e) {
          console.error("Error loading campaigns:", e);
        }

        // Load assistants
        try {
          const { fetchAssistants } = await import("@/lib/api/assistants/fetchAssistants");
          const { assistants } = await fetchAssistants();
          setAssistants(assistants || []);
        } catch (e) {
          console.error("Error loading assistants:", e);
        }

        // Load phone numbers
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/twilio/user/phone-numbers`, {
            headers: {
              'x-user-id': user.id,
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await response.json();
          if (json.success && json.numbers) {
            setPhoneNumbers(json.numbers || []);
          }
        } catch (e) {
          console.error("Error loading phone numbers:", e);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    loadDashboardData();
  }, [user?.id]);

  // Calculate additional stats
  const activeContacts = contacts.filter(c => c.status === 'active').length;
  const activeAssistants = assistants.filter(a => a.status === 'active').length;
  const activePhoneNumbers = phoneNumbers.filter(p => p.status === 'active').length;
  const activeCampaigns = campaigns.filter(c => c.executionStatus === 'running').length;

  const recentActivity = useMemo(() => {
    return (unifiedActivity || []).slice(0, 7);
  }, [unifiedActivity]);

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  if (isLoading || loadingData) {
    return (
      <ThemeContainer variant="base" className="min-h-screen">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </ThemeContainer>
    );
  }

  // Case 2: No Assistant Found
  if (!loadingData && assistants.length === 0) {
    return (
      <ThemeContainer variant="base" className="min-h-screen">
        <div className="container mx-auto max-w-7xl px-6 py-8">
          <Card className="max-w-md mx-auto mt-20 text-center border-dashed border-2">
            <CardContent className="pt-10 pb-10 space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <Briefcase className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-bold">No assistant data found</h2>
                <p className="text-muted-foreground mt-2">
                  Your assistant will appear here once it is assigned to your account.
                </p>
              </div>
              <div className="pt-4">
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" /> Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ThemeContainer>
    );
  }

  // Case 1: Assistant Exists (Show Dashboard)
  return (
    <ThemeContainer variant="base" className="min-h-screen">
      <div className="container mx-auto max-w-7xl px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          {assistants.length > 0 && (
            <p className="text-muted-foreground mt-1">
              Overview for <span className="font-semibold text-primary">{assistants[0].name}</span>
            </p>
          )}
        </div>

        {/* Quick Stats and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Assistant Overview */}
          <Card className="border-2 border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">

              {/* Show detailed specific stats if available, otherwise generic counts */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-secondary/20 border border-border text-center">
                  <p className="text-2xl font-bold">{stats.totalCalls}</p>
                  <p className="text-xs text-muted-foreground">Total Calls</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border text-center">
                  <p className="text-2xl font-bold">{formatDuration(stats.avgDuration)}</p>
                  <p className="text-xs text-muted-foreground">Avg Duration</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border text-center">
                  <p className="text-2xl font-bold">{emailStats?.totalThreads || 0}</p>
                  <p className="text-xs text-muted-foreground">Active Email Threads</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/20 border border-border text-center">
                  <p className="text-2xl font-bold text-success">{stats.appointments}</p>
                  <p className="text-xs text-muted-foreground">Appointments</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border mt-4">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium text-foreground">Active Campaigns</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-semibold">
                  {activeCampaigns}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border mt-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-foreground">Total Emails</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg font-semibold">
                  {emailStats?.totalMessages || 0}
                </Badge>
              </div>

              {/* Only show "Manage All" if admin */}
              {user?.role === 'admin' && (
                <Link to="/assistants">
                  <Button className="w-full mt-4" variant="outline">
                    Manage Assistants <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 border-2 border-border">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <div className="flex gap-2">
                  <Link to="/calls">
                    <Button variant="ghost" size="sm">
                      Calls
                    </Button>
                  </Link>
                  <Link to="/emails">
                    <Button variant="ghost" size="sm">
                      Emails
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity: any) => (
                    <div
                      key={`${activity.type}-${activity.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border-2 border-border hover:bg-accent/20 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-full ${activity.type === 'call'
                            ? (activity.call_outcome?.toLowerCase().includes('appointment') ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground')
                            : activity.type === 'message'
                              ? 'bg-purple-500/10 text-purple-500'
                              : 'bg-blue-500/10 text-blue-500' // Email style
                          }`}>
                          {activity.type === 'call' ? (
                            activity.call_outcome?.toLowerCase().includes('appointment') ? <CheckCircle2 className="h-4 w-4" /> : <Phone className="h-4 w-4" />
                          ) : activity.type === 'message' ? (
                            <MessageSquare className="h-4 w-4" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">
                              {activity.name || activity.phoneNumber || 'Unknown'}
                            </p>
                            {activity.type === 'email' && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                Email
                              </Badge>
                            )}
                            {activity.type === 'message' && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1">
                                SMS
                              </Badge>
                            )}
                          </div>

                          {activity.type === 'call' ? (
                            <p className="text-sm text-muted-foreground">
                              {activity.date} • {activity.duration || formatDuration(activity.call_duration || 0)}
                            </p>
                          ) : activity.type === 'message' ? (
                            <p className="text-sm text-muted-foreground truncate">
                              {activity.snippet}
                              <span className="opacity-50 mx-1">•</span>
                              {activity.time}
                            </p>
                          ) : (
                            <p className="text-sm text-muted-foreground truncate">
                              {activity.subject}
                              <span className="opacity-50 mx-1">•</span>
                              {activity.time}
                            </p>
                          )}
                        </div>
                      </div>

                      {activity.type === 'call' && (
                        <Badge
                          variant={
                            activity.call_outcome?.toLowerCase().includes('appointment') ? 'default' :
                              activity.call_outcome?.toLowerCase().includes('spam') ? 'destructive' :
                                'secondary'
                          }
                          className="ml-2"
                        >
                          {activity.call_outcome || activity.resolution || 'Call'}
                        </Badge>
                      )}

                      {activity.type === 'message' && (
                        <Badge variant="secondary" className="ml-2 capitalize">
                          {activity.status || 'Sent'}
                        </Badge>
                      )}

                      {activity.type === 'email' && (
                        <Badge variant="secondary" className="ml-2">
                          {activity.messageCount} msgs
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No recent activity recorded.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions (Restricted for non-admins) */}
        {user?.role === 'admin' ? (
          <Card className="border-2 border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
              <CardDescription>Get things done faster</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link to="/assistants">
                  <Button className="w-full h-auto flex-col gap-2 py-6 border-2" variant="outline">
                    <Briefcase className="h-6 w-6" />
                    <span>Add Assistant</span>
                  </Button>
                </Link>
                <Link to="/contacts">
                  <Button className="w-full h-auto flex-col gap-2 py-6 border-2" variant="outline">
                    <Users className="h-6 w-6" />
                    <span>Add Contact</span>
                  </Button>
                </Link>
                <Link to="/assistants?tab=phone-numbers">
                  <Button className="w-full h-auto flex-col gap-2 py-6 border-2" variant="outline">
                    <Phone className="h-6 w-6" />
                    <span>Phone Numbers</span>
                  </Button>
                </Link>
                <Link to="/calls">
                  <Button className="w-full h-auto flex-col gap-2 py-6 border-2" variant="outline">
                    <MessageSquare className="h-6 w-6" />
                    <span>View Calls</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Read-Only Quick Access for Users */
          <Card className="border-2 border-border">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-lg font-semibold">Campaign Responses</CardTitle>
              <CardDescription>Recent campaign activity</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/calls?filter=appointment">
                  <Button className="w-full h-auto flex-col gap-2 py-6 border-2 bg-success/5 border-success/20 hover:bg-success/10" variant="outline">
                    <CheckCircle2 className="h-6 w-6 text-success" />
                    <span className="text-success font-semibold">View Appointments</span>
                  </Button>
                </Link>
                <Link to="/calls?filter=follow-up">
                  <Button className="w-full h-auto flex-col gap-2 py-6 border-2" variant="outline">
                    <MessageSquare className="h-6 w-6" />
                    <span>Follow-up Needed</span>
                  </Button>
                </Link>
                <Link to="/calls">
                  <Button className="w-full h-auto flex-col gap-2 py-6 border-2" variant="outline">
                    <Activity className="h-6 w-6" />
                    <span>All Activity</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </ThemeContainer>
  );
}
