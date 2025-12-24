import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Download, Calendar, Zap, Phone, MessageSquare, Users, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { getPlanConfig, getPlanConfigs } from "@/lib/plan-config";
import { MinutesPurchaseDialog } from "@/components/settings/billing/MinutesPurchaseDialog";

interface UsageItem {
  name: string;
  used: number;
  limit: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
  type?: 'credit' | 'debit';
  minutes?: number;
  description?: string;
}

export default function Billing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [currentPlan, setCurrentPlan] = useState<{
    name: string;
    price: string;
    period: string;
    status: string;
    nextBilling: string | null;
  } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [planConfigs, setPlanConfigs] = useState<Record<string, any>>({});
  const [minutesBalance, setMinutesBalance] = useState(0);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  useEffect(() => {
    const fetchBillingData = async () => {


    };

    fetchBillingData();
  }, [user?.id, user?.plan]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentPlan) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Billing</h1>
            <p className="text-muted-foreground">Manage your subscription, usage, and billing information</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Please sign in to view your billing information.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription, usage, and billing information</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>Your subscription details and next billing date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{currentPlan.name}</h3>
                    <p className="text-muted-foreground">
                      {currentPlan.price}/{currentPlan.period}
                    </p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">
                    {currentPlan.status.charAt(0).toUpperCase() + currentPlan.status.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {currentPlan.nextBilling && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next billing date</span>
                      <span className="text-foreground font-medium">{currentPlan.nextBilling}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button variant="outline">Change Plan</Button>
                    <Button variant="outline">Cancel Subscription</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Minutes Balance Card */}
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Minutes Balance
              </CardTitle>
              <CardDescription>Your available call minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="text-2xl font-bold text-foreground">
                    {minutesBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Used this month</span>
                  <span className="text-foreground font-medium">
                    {minutesUsed.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                className="w-full"
                onClick={() => setIsPurchaseDialogOpen(true)}
              >
                Purchase Minutes
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Minutes are purchased separately from your subscription plan
              </p>
            </CardContent>
          </Card>

          {/* Usage Overview */}
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
              <CardDescription>Current usage across all services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {usage.length === 0 ? (
                <p className="text-sm text-muted-foreground">No usage data available</p>
              ) : (
                usage.map((item) => {
                  const IconComponent = item.icon;
                  const percentage = getUsagePercentage(item.used, item.limit === Infinity ? 0 : item.limit);
                  const limitDisplay = item.limit === Infinity ? 'Unlimited' : item.limit.toLocaleString();
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {item.used.toLocaleString()} / {limitDisplay}
                        </span>
                      </div>
                      {item.limit !== Infinity && (
                        <Progress
                          value={percentage}
                          className="h-2"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <div className="lg:col-span-3">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Billing History
                </CardTitle>
                <CardDescription>Download invoices and view payment history</CardDescription>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No invoices available</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => {
                      const isDebit = invoice.type === 'debit' || invoice.amount?.startsWith('-');
                      const isCredit = invoice.type === 'credit' || (!invoice.type && !isDebit);

                      return (
                        <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/30">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-foreground">{invoice.id}</p>
                                {isDebit && (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                    Debit
                                  </Badge>
                                )}
                                {isCredit && (
                                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                                    Credit
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{invoice.date}</p>
                              {invoice.description && (
                                <p className="text-xs text-muted-foreground mt-1">{invoice.description}</p>
                              )}
                              {invoice.minutes && (
                                <p className="text-xs text-muted-foreground">{invoice.minutes.toLocaleString()} minutes</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`font-medium ${isDebit ? 'text-destructive' : 'text-foreground'}`}>
                              {invoice.amount}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-success/10 text-success border-success/20"
                            >
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                            <Button variant="ghost" size="sm" className="gap-2">
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Minutes Purchase Dialog */}
        <MinutesPurchaseDialog
          open={isPurchaseDialogOpen}
          onOpenChange={setIsPurchaseDialogOpen}
          currentBalance={minutesBalance}
          minutesUsed={minutesUsed}
          onPurchaseComplete={async () => {


          }}
        />
      </div>
    </DashboardLayout>
  );
}