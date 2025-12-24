
import { Toaster } from "@/components/ui/toaster";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Sidebar from "@/components/navigation/Sidebar";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useEffect } from "react";
import { useAuth } from "@/contexts/SupportAccessAuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const { setUIStyle } = useTheme();
  const { user, isImpersonating, activeSupportSession, endSupportAccess, exitImpersonation } = useAuth();

  // Check if we're on a legal page (privacy, terms, refund) - hide sidebar and header
  const isLegalPage = ['/privacy', '/terms', '/refund'].includes(location.pathname);

  // Ensure glass theme is applied when on dashboard
  useEffect(() => {
    setUIStyle("glass");
  }, [setUIStyle]);



  // For legal pages, render without sidebar and header
  if (isLegalPage) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="w-full">
          {children}
        </div>
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Sidebar Navigation - Only for Admins */}
      {user?.role === 'admin' && <Sidebar />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {/* Background Gradients/Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px]" />
        </div>

        {/* Top Header */}
        <DashboardHeader />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{
                duration: 0.3,
                ease: "easeOut"
              }}
              className="w-full min-h-full"
            >
              <main className="w-full p-6 pb-20">
                {children}
              </main>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>


      <Toaster />
    </div >
  );
}
