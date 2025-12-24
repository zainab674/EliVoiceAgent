
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { BusinessUseCaseProvider } from "./components/BusinessUseCaseProvider";
import { AuthProvider, useAuth } from "./contexts/SupportAccessAuthContext";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import Assistants from "./pages/Assistants";
import CreateAssistant from "./pages/CreateAssistant";
import Campaigns from "./pages/Campaigns";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Integrations from "./pages/Integrations";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";
import Calls from "./pages/Calls";
import CallDetails from "./pages/CallDetails";
import Conversations from "./pages/Conversations";
import Contacts from "./pages/Contacts";
import Bookings from "./pages/Bookings";
import EmailAutomation from "./pages/EmailAutomation";
import SmsCampaignPage from "./pages/SmsCampaign";
import Emails from "./pages/Emails";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import VoiceAgent from "./pages/VoiceAgent";
import AdminPanel from "./pages/AdminPanel";
import AuthCallback from "./pages/AuthCallback";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOfService from "./pages/TermsOfService";
import Pricing from "./pages/Pricing";
import ScrollToTop from "./components/ScrollToTop";
import { getAccessToken } from "@/lib/auth";

// Create a client with better error handling and retry limits
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Only retry once
      retryDelay: 500, // Wait half a second before retry
      staleTime: 1000 * 60 * 5, // Data stays fresh for 5 minutes
      refetchOnWindowFocus: false, // Disable aggressive refetching on window focus
      refetchOnReconnect: true, // Refetch when reconnecting
      refetchOnMount: true, // Always refetch on component mount
    }
  }
});

function ProtectedAuthPage({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // If user is authenticated, redirect to dashboard
  if (user && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  // If still loading, show loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, show the auth page
  return <>{children}</>;
}



function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (user && !loading) {
      const syncEmails = async () => {
        try {
          const token = getAccessToken();
          if (!token) return;

          await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/emails/sync`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log("Background email sync completed");
        } catch (e) {
          console.error("Background email sync failed", e);
        }
      };

      // Run on mount
      syncEmails();

      // Run every 2 minutes
      const interval = setInterval(syncEmails, 2 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated and on landing page, redirect to dashboard
  if (user && location.pathname === "/") {
    return <Navigate to="/dashboard" replace />;
  }

  // Require authentication for protected routes
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function AnimatedRoutes() {
  return (
    <Routes>
      <Route path="/signup" element={<ProtectedAuthPage><SignUp /></ProtectedAuthPage>} />
      <Route path="/login" element={<ProtectedAuthPage><Login /></ProtectedAuthPage>} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<Index />} />
        <Route path="/assistants" element={<Assistants />} />
        <Route path="/assistants/create" element={<CreateAssistant />} />
        <Route path="/assistants/edit/:id" element={<CreateAssistant />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/calls" element={<Calls />} />
        <Route path="/calls/:id" element={<CallDetails />} />
        <Route path="/voiceagent" element={<VoiceAgent />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/conversations" element={<Conversations />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/emails" element={<Emails />} />
        <Route path="/email-automation" element={<EmailAutomation />} />
        <Route path="/sms-campaign" element={<SmsCampaignPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/billing" element={<Billing />} />
      </Route>
      {/* Landing page for unauthenticated users */}
      <Route path="/" element={<LandingPage />} />
      {/* Pricing page - accessible without authentication */}
      <Route path="/pricing" element={<Pricing />} />
      {/* Legal pages - accessible without authentication */}
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/refund" element={<RefundPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider defaultTheme="light">
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <ScrollToTop />
      <AuthProvider>
        <BusinessUseCaseProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AnimatedRoutes />
            </TooltipProvider>
          </QueryClientProvider>
        </BusinessUseCaseProvider>
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
