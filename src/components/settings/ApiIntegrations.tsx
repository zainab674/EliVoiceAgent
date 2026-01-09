import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Building2, Database, Users, Zap, Phone, MessageSquare, Calendar, CheckCircle2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TwilioIntegrationCard } from "./integrations/TwilioIntegrationCard";
import { SecurityCard } from "./integrations/SecurityCard";
import { TwilioAuthDialog } from "./TwilioAuthDialog";
import { CalendarIntegrationCard } from "./CalendarIntegrationCard";
import { CalendarAuthDialog } from "./CalendarAuthDialog";
import type { TwilioIntegration, TwilioCredentials } from "./integrations/types";
import { TwilioCredentialsService, type UserTwilioCredentials } from "@/lib/twilio-credentials";
import { CalendarCredentialsService, type UserCalendarCredentials, type CalendarCredentialsInput } from "@/lib/calendar-credentials";

import { EmailAuthDialog } from "./EmailAuthDialog";
import { EmailIntegrationCard } from "./EmailIntegrationCard";
import { MongoDBAuthDialog } from "./MongoDBAuthDialog";
import { MongoDBIntegrationCard } from "./MongoDBIntegrationCard";
import { IntegrationService, type EmailIntegration } from "@/lib/api/integrations";

const integrations = [
  {
    id: "twilio",
    name: "Twilio",
    description: "Cloud communications platform for voice, SMS, and video",
    icon: Phone,
    status: "connected",
    category: "Communication",
    brandColor: "#f22f46"
  },
  {
    id: "calcom",
    name: "Cal.com",
    description: "Open-source scheduling infrastructure for everyone",
    icon: Calendar,
    status: "available",
    category: "Calendar",
    brandColor: "#292929"
  },
  {
    id: "google_calendar",
    name: "Google Calendar",
    description: "Sync your events with Google Calendar",
    icon: Calendar,
    status: "available",
    category: "Calendar",
    brandColor: "#4285F4"
  },
  {
    id: "outlook_calendar",
    name: "Outlook Calendar",
    description: "Sync your events with Outlook Calendar",
    icon: Calendar,
    status: "available",
    category: "Calendar",
    brandColor: "#0078D4"
  },
  {
    id: "calendly",
    name: "Calendly",
    description: "Professional scheduling automation",
    icon: Calendar,
    status: "available",
    category: "Calendar",
    brandColor: "#006BFF"
  },
  {
    id: "email",
    name: "Email",
    description: "Connect SMTP/IMAP for assistant email capabilities",
    icon: MessageSquare,
    status: "available",
    category: "Communication",
    brandColor: "#EA4335" // Gmail red-ish
  },
  {
    id: "mongodb",
    name: "MongoDB",
    description: "Connect to external MongoDB for lead sync (QB Express)",
    icon: Database,
    status: "available",
    category: "Data",
    brandColor: "#47A248" // MongoDB Green
  }
];

export function ApiIntegrations() {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState("all");
  const [twilioIntegrations, setTwilioIntegrations] = useState<TwilioIntegration[]>([]);
  const [calendarIntegrations, setCalendarIntegrations] = useState<UserCalendarCredentials[]>([]);

  const [emailIntegrations, setEmailIntegrations] = useState<EmailIntegration[]>([]);
  const [mongodbIntegrations, setMongodbIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<typeof integrations[0] | null>(null);

  // Load credentials on component mount
  useEffect(() => {
    loadTwilioCredentials();
    loadCalendarCredentials();
    loadEmailCredentials();
    loadMongoDBIntegrations();
  }, []);

  const loadMongoDBIntegrations = async () => {
    try {
      const data = await IntegrationService.getIntegrations();
      setMongodbIntegrations(data.mongodb || []);
    } catch (error) {
      console.error("Error loading MongoDB integrations:", error);
    }
  };

  const loadEmailCredentials = async () => {
    try {
      const data = await IntegrationService.getIntegrations();
      setEmailIntegrations(data.email || []);
    } catch (error) {
      console.error("Error loading email credentials:", error);
      toast({
        title: "Error",
        description: "Failed to load email credentials.",
        variant: "destructive"
      });
    }
  };

  const loadTwilioCredentials = async () => {
    try {
      setIsLoading(true);
      const credentials = await TwilioCredentialsService.getAllCredentials();
      console.log("Loaded Twilio credentials:", credentials);

      const twilioIntegrations: TwilioIntegration[] = credentials.map(cred => ({
        id: cred.id,
        name: "Twilio",
        description: `Voice and SMS communications${cred.trunk_sid ? ' with auto-generated trunk' : ''}`,
        status: "connected" as const,
        lastUsed: formatLastUsed(cred.updated_at),
        details: {
          account: maskAccountSid(cred.account_sid),
          label: cred.label,
          trunkSid: cred.trunk_sid,
        },
      }));

      console.log("Processed Twilio integrations:", twilioIntegrations);
      setTwilioIntegrations(twilioIntegrations);
    } catch (error) {
      console.error("Error loading Twilio credentials:", error);
      toast({
        title: "Error",
        description: "Failed to load Twilio credentials.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendarCredentials = async () => {
    try {
      const credentials = await CalendarCredentialsService.getAllCredentials();
      console.log("Loaded calendar credentials:", credentials);
      setCalendarIntegrations(credentials);
    } catch (error) {
      console.error("Error loading calendar credentials:", error);
      toast({
        title: "Error",
        description: "Failed to load calendar credentials.",
        variant: "destructive",
      });
    }
  };



  // Helper functions
  const maskAccountSid = (accountSid: string): string => {
    if (accountSid.length <= 8) return accountSid;
    return accountSid.substring(0, 2) + "*".repeat(accountSid.length - 6) + accountSid.substring(accountSid.length - 4);
  };

  const formatLastUsed = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };


  const handleEmailConnect = async (data: any) => {
    try {
      await IntegrationService.connectEmail(data);
      await loadEmailCredentials();
      toast({
        title: "Email Connected",
        description: "Your email account has been connected successfully."
      });
    } catch (error) {
      console.error("Error connecting email:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect email. Please check your credentials.",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMongoDB = async (id: string) => {
    try {
      await IntegrationService.removeMongoDB(id);
      await loadMongoDBIntegrations();
      toast({
        title: "Integration Removed",
        description: "MongoDB integration removed successfully."
      });
    } catch (error) {
      console.error("Error removing MongoDB:", error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove MongoDB integration.",
        variant: "destructive"
      });
    }
  };

  const handleMongoDBConnect = async (data: any) => {
    try {
      await IntegrationService.connectMongoDB(data);
      await loadMongoDBIntegrations();
      toast({
        title: "MongoDB Connected",
        description: "Your MongoDB collection has been connected successfully."
      });
    } catch (error) {
      console.error("Error connecting MongoDB:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect MongoDB",
        variant: "destructive"
      });
    }
  };

  const handleMongoDBSync = async (id: string) => {
    try {
      await IntegrationService.triggerMongoDBSync(id);
      await loadMongoDBIntegrations();
      toast({
        title: "Sync Completed",
        description: "Leads have been synchronized successfully."
      });
    } catch (error) {
      console.error("Error syncing MongoDB:", error);
      toast({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync leads",
        variant: "destructive"
      });
    }
  };

  const handleRemoveEmailIntegration = async (email: string) => {
    try {
      await IntegrationService.removeEmail(email);
      await loadEmailCredentials();
      toast({
        title: "Integration Removed",
        description: "Email integration removed successfully."
      });
    } catch (error) {
      console.error("Error removing email:", error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove email integration.",
        variant: "destructive"
      });
    }
  };

  const updatedIntegrations = integrations.map(integration => {
    if (integration.id === "twilio") {
      return {
        ...integration,
        status: twilioIntegrations.length > 0 ? "connected" : "available"
      };
    }
    if (integration.id === "calcom" || integration.id === "google_calendar" || integration.id === "outlook_calendar" || integration.id === "calendly") {
      const isConnected = calendarIntegrations.some(c => c.provider === integration.id && c.is_active);
      return {
        ...integration,
        status: isConnected ? "connected" : "available"
      };
    }

    if (integration.id === "email") {
      return {
        ...integration,
        status: emailIntegrations.length > 0 ? "connected" : "available"
      };
    }
    if (integration.id === "mongodb") {
      return {
        ...integration,
        status: mongodbIntegrations.length > 0 ? "connected" : "available"
      };
    }
    return integration;
  });

  const filteredIntegrations = activeCategory === "all"
    ? updatedIntegrations
    : updatedIntegrations.filter(integration => integration.category.toLowerCase() === activeCategory);

  const getCategoryCount = (category: string) => {
    return category === "all"
      ? updatedIntegrations.length
      : updatedIntegrations.filter(integration => integration.category.toLowerCase() === category).length;
  };

  const handleTwilioConnect = async (data: { accountSid: string; authToken: string; label: string }) => {
    console.log("handleTwilioConnect called with data:", data);
    try {
      // Test credentials before saving
      console.log("Testing credentials...");
      const isValid = await TwilioCredentialsService.testCredentials(data);
      console.log("Credentials valid:", isValid);
      if (!isValid) {
        toast({
          title: "Invalid credentials",
          description: "Please check your Twilio credentials and try again.",
          variant: "destructive",
        });
        throw new Error("Invalid credentials");
      }

      console.log("Saving credentials...");
      await TwilioCredentialsService.saveCredentials(data);
      console.log("Credentials saved successfully");

      console.log("Loading Twilio credentials...");
      await loadTwilioCredentials();
      console.log("Twilio credentials loaded");

      toast({
        title: "Twilio connected",
        description: "Your Twilio account has been connected successfully. A main trunk will be created automatically.",
      });
    } catch (error) {
      console.error("Error connecting Twilio:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect your Twilio account. Please try again.",
        variant: "destructive",
      });
      throw error; // Re-throw to prevent dialog from closing
    }
  };

  const handleRemoveIntegration = async (id: string) => {
    try {
      await TwilioCredentialsService.deleteCredentials(id);
      await loadTwilioCredentials();

      toast({
        title: "Integration removed",
        description: "The Twilio integration has been removed successfully.",
      });
    } catch (error) {
      console.error("Error removing integration:", error);
      toast({
        title: "Removal failed",
        description: "Failed to remove the integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log("twilioIntegrations updated:", twilioIntegrations);
  }, [twilioIntegrations]);


  const handleRefreshIntegration = async (id: string) => {
    try {
      await TwilioCredentialsService.setActiveCredentials(id);
      await loadTwilioCredentials();

      toast({
        title: "Integration refreshed",
        description: "The Twilio integration has been set as active.",
      });
    } catch (error) {
      console.error("Error refreshing integration:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh the integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCalendarConnect = async (data: CalendarCredentialsInput) => {
    console.log("handleCalendarConnect called with data:", data);
    try {
      await CalendarCredentialsService.saveCredentials(data);
      await loadCalendarCredentials();

      toast({
        title: "Calendar connected",
        description: "Your calendar integration has been connected successfully.",
      });
    } catch (error) {
      console.error("Error connecting calendar:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect your calendar. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleRemoveCalendarIntegration = async (id: string) => {
    try {
      await CalendarCredentialsService.deleteCredentials(id);
      await loadCalendarCredentials();

      toast({
        title: "Integration removed",
        description: "The calendar integration has been removed successfully.",
      });
    } catch (error) {
      console.error("Error removing calendar integration:", error);
      toast({
        title: "Removal failed",
        description: "Failed to remove the calendar integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRefreshCalendarIntegration = async (id: string) => {
    try {
      await CalendarCredentialsService.setActiveCredentials(id);
      await loadCalendarCredentials();

      toast({
        title: "Integration refreshed",
        description: "The calendar integration has been set as active.",
      });
    } catch (error) {
      console.error("Error refreshing calendar integration:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh the calendar integration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleIntegrationClick = (integration: typeof integrations[0]) => {
    if (["twilio", "calcom", "google_calendar", "outlook_calendar", "calendly", "email", "mongodb"].includes(integration.id)) {
      setSelectedIntegration(integration);
      return;
    }

    // For other integrations, show coming soon or redirect
    console.log(`Connecting to ${integration.name}`);
    toast({
      title: "Coming Soon",
      description: `${integration.name} integration is coming soon!`,
    });
  };

  const IntegrationCard = ({ integration }: { integration: typeof integrations[0] }) => {
    const IconComponent = integration.icon;

    // Check if integration is actually connected
    const isConnected = integration.status === "connected";


    // Debug logging for integrations
    if (integration.id === "twilio") {
      console.log("Twilio integration debug:", {
        twilioIntegrationsLength: twilioIntegrations.length,
        twilioIntegrations,
        isConnected,
        isLoading
      });
    }

    if (["calcom", "google_calendar", "outlook_calendar", "calendly"].includes(integration.id)) {
      console.log("Calendar integration debug:", {
        calendarIntegrationsLength: calendarIntegrations.length,
        calendarIntegrations,
        isConnected,
        isLoading
      });
    }

    return (
      <Card
        className="group relative border-border/60 bg-card/50 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 h-full cursor-pointer"
        onClick={() => handleIntegrationClick(integration)}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Header with Icon and Status */}
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: `${integration.brandColor}15` }}
            >
              <IconComponent
                className="w-4 h-4"
                style={{ color: integration.brandColor }}
              />
            </div>

            {isConnected && (
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs px-1.5 py-0.5">
                <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                Connected
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 mb-4">
            <h3
              className="font-semibold text-foreground text-sm mb-2 group-hover:text-primary transition-colors leading-tight"
              onClick={integration.id === "twilio" ? () => handleIntegrationClick(integration) : undefined}
            >
              {integration.name}
            </h3>

            <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
              {integration.description}
            </p>
          </div>

          {/* Action Button */}
          <div className="mt-auto">
            {integration.id === "twilio" ? (
              <TwilioAuthDialog onSuccess={handleTwilioConnect}>
                <Button
                  variant="outline"
                  className="w-full text-sm h-8 relative z-10 flex items-center justify-center gap-1.5"
                  size="sm"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Manage
                </Button>
              </TwilioAuthDialog>
            ) : ["calcom", "google_calendar", "outlook_calendar", "calendly"].includes(integration.id) ? (
              <CalendarAuthDialog onSuccess={handleCalendarConnect} defaultProvider={integration.id}>
                <Button
                  variant="outline"
                  className="w-full text-sm h-8 relative z-10 flex items-center justify-center gap-1.5"
                  size="sm"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  Manage
                </Button>
              </CalendarAuthDialog>
            ) : integration.id === "email" ? (
              <EmailAuthDialog onSuccess={handleEmailConnect}>
                <Button
                  variant={isConnected ? "outline" : "default"}
                  className="w-full text-sm h-8 relative z-10 flex items-center justify-center gap-1.5"
                  size="sm"
                >
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Manage
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      Connect
                    </>
                  )}
                </Button>
              </EmailAuthDialog>
            ) : integration.id === "mongodb" ? (
              <MongoDBAuthDialog onSuccess={handleMongoDBConnect}>
                <Button
                  variant={isConnected ? "outline" : "default"}
                  className="w-full text-sm h-8 relative z-10 flex items-center justify-center gap-1.5"
                  size="sm"
                >
                  {isConnected ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Manage
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" />
                      Connect
                    </>
                  )}
                </Button>
              </MongoDBAuthDialog>
            ) : (
              <Button
                variant={isConnected ? "outline" : "default"}
                className="w-full text-sm h-8 relative z-10 flex items-center justify-center gap-1.5"
                size="sm"
                onClick={() => handleIntegrationClick(integration)}
              >
                {isConnected ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Manage
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    Connect
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Integrations</h2>
        <p className="text-muted-foreground">
          Connect your favorite tools and services to streamline your workflow.
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8 h-12 glass-input">
          <TabsTrigger value="all" className="text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            All ({getCategoryCount("all")})
          </TabsTrigger>

          <TabsTrigger value="communication" className="text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Communication ({getCategoryCount("communication")})
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Calendar ({getCategoryCount("calendar")})
          </TabsTrigger>
          <TabsTrigger value="data" className="text-sm font-medium data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            Data ({getCategoryCount("data")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeCategory} className="mt-0">
          {filteredIntegrations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No integrations available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-w-6xl items-stretch">
              {filteredIntegrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Integration Details Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setSelectedIntegration(null)}>
          <div className="w-full max-w-3xl p-6 bg-card border rounded-lg shadow-lg relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selectedIntegration.brandColor}15` }}>
                  <selectedIntegration.icon className="w-5 h-5" style={{ color: selectedIntegration.brandColor }} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{selectedIntegration.name} Integration</h2>
                  <p className="text-sm text-muted-foreground">{selectedIntegration.description}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedIntegration(null)}>
                <Plus className="w-5 h-5 rotate-45" />
              </Button>
            </div>

            <div className="space-y-6">
              {selectedIntegration.id === "twilio" && (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Connected Accounts</h3>
                    <TwilioAuthDialog onSuccess={handleTwilioConnect}>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Account
                      </Button>
                    </TwilioAuthDialog>
                  </div>

                  {twilioIntegrations.length > 0 ? (
                    <TwilioIntegrationCard
                      integrations={twilioIntegrations}
                      onSuccess={handleTwilioConnect}
                      onRemove={handleRemoveIntegration}
                      onRefresh={handleRefreshIntegration}
                    />
                  ) : (
                    <div className="text-center py-8 bg-secondary/20 rounded-lg border border-dashed">
                      <p className="text-muted-foreground mb-4">No Twilio accounts connected yet.</p>
                      <TwilioAuthDialog onSuccess={handleTwilioConnect}>
                        <Button variant="outline">Connect Now</Button>
                      </TwilioAuthDialog>
                    </div>
                  )}
                </>
              )}

              {["calcom", "google_calendar", "outlook_calendar", "calendly"].includes(selectedIntegration.id) && (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Connected Calendars</h3>
                    <CalendarAuthDialog onSuccess={handleCalendarConnect} defaultProvider={selectedIntegration.id}>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Calendar
                      </Button>
                    </CalendarAuthDialog>
                  </div>

                  {calendarIntegrations.filter(c => c.provider === selectedIntegration.id).length > 0 ? (
                    <CalendarIntegrationCard
                      integrations={calendarIntegrations.filter(c => c.provider === selectedIntegration.id)}
                      onSuccess={handleCalendarConnect}
                      onRemove={handleRemoveCalendarIntegration}
                      onRefresh={handleRefreshCalendarIntegration}
                      defaultProvider={selectedIntegration.id}
                    />
                  ) : (
                    <div className="text-center py-8 bg-secondary/20 rounded-lg border border-dashed">
                      <p className="text-muted-foreground mb-4">No calendars connected yet.</p>
                      <CalendarAuthDialog onSuccess={handleCalendarConnect} defaultProvider={selectedIntegration.id}>
                        <Button variant="outline">Connect Now</Button>
                      </CalendarAuthDialog>
                    </div>
                  )}
                </>
              )}

              {selectedIntegration.id === "email" && (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">Connected Emails</h3>
                    <EmailAuthDialog onSuccess={handleEmailConnect}>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Email
                      </Button>
                    </EmailAuthDialog>
                  </div>

                  {emailIntegrations.length > 0 ? (
                    <EmailIntegrationCard
                      integrations={emailIntegrations}
                      onSuccess={handleEmailConnect}
                      onRemove={handleRemoveEmailIntegration}
                      onRefresh={loadEmailCredentials}
                    />
                  ) : (
                    <div className="text-center py-8 bg-secondary/20 rounded-lg border border-dashed">
                      <p className="text-muted-foreground mb-4">No email accounts connected yet.</p>
                      <EmailAuthDialog onSuccess={handleEmailConnect}>
                        <Button variant="outline">Connect Now</Button>
                      </EmailAuthDialog>
                    </div>
                  )}
                </>
              )}

              {selectedIntegration.id === "mongodb" && (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">MongoDB Configurations</h3>
                    <MongoDBAuthDialog onSuccess={handleMongoDBConnect}>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Config
                      </Button>
                    </MongoDBAuthDialog>
                  </div>

                  {mongodbIntegrations.length > 0 ? (
                    <MongoDBIntegrationCard
                      integrations={mongodbIntegrations}
                      onSuccess={handleMongoDBConnect}
                      onRemove={handleRemoveMongoDB}
                      onSync={handleMongoDBSync}
                    />
                  ) : (
                    <div className="text-center py-8 bg-secondary/20 rounded-lg border border-dashed">
                      <p className="text-muted-foreground mb-4">No MongoDB connections yet.</p>
                      <MongoDBAuthDialog onSuccess={handleMongoDBConnect}>
                        <Button variant="outline">Connect Now</Button>
                      </MongoDBAuthDialog>
                    </div>
                  )}
                </>
              )}


            </div>
          </div>
        </div>
      )}

      <SecurityCard />

      <div className="mb-20"></div>
    </div>
  );
}
