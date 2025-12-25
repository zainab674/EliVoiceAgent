import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import TimeRangeSelector from "@/components/dashboard/TimeRangeSelector";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/SupportAccessAuthContext";

interface FilterBarProps {
  onRangeChange: (range: { from: Date; to: Date }) => void;
  onAssistantChange?: (assistantId: string) => void;
  selectedAssistantId?: string;
  title?: string;
  subtitle?: string;
}

export default function FilterBar({
  onRangeChange,
  onAssistantChange,
  selectedAssistantId,
  title,
  subtitle
}: FilterBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { uiStyle } = useTheme();
  const { user } = useAuth();

  const { data: userProfile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!user?.id || !token) return null;

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/api/v1/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) return null;

        const json = await response.json();
        if (json.success && json.user) {
          return {
            firstName: json.user.name || 'User'
          };
        }
        return { firstName: 'User' };
      } catch (error) {
        console.error("Error fetching user profile:", error);
        return { firstName: 'User' };
      }
    },
    enabled: !!user?.id
  });

  const { data: assistants = [] } = useQuery({
    queryKey: ["assistants"],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      if (!token) return [];
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/assistant`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await response.json();
        return json.assistants || [];
      } catch (err) {
        console.error("Error fetching assistants:", err);
        return [];
      }
    },
    enabled: !!localStorage.getItem('token')
  });

  // Handle date range changes and share them with the Calls page
  const handleRangeChange = (range: { from: Date; to: Date }) => {
    onRangeChange(range);

    // Store the date range in session storage for persistence
    sessionStorage.setItem('dashboardDateRange', JSON.stringify({
      from: range.from.toISOString(),
      to: range.to.toISOString()
    }));

    // If we're on the dashboard, update the current state for the Calls page to use later
    if (location.pathname === '/') {
      sessionStorage.setItem('lastDashboardDateRange', JSON.stringify({
        from: range.from.toISOString(),
        to: range.to.toISOString()
      }));
    }
  };

  // Get theme-aware background classes
  const getBackgroundClass = () => {
    if (uiStyle === "glass") {
      return "backdrop-blur-sm";
    } else {
      return "surface-base";
    }
  };

  return (
    <motion.div
      className={`${getBackgroundClass()} px-6 py-6`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-extralight tracking-tight text-3xl text-foreground">
              Welcome back!
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Assistant Selector */}
            {onAssistantChange && (
              <div className="liquid-glass-medium liquid-rounded-lg border border-white/10 px-3 py-1 flex items-center">
                <span className="text-xs text-muted-foreground mr-2 font-medium">Assistant:</span>
                <select
                  value={selectedAssistantId || 'all'}
                  onChange={(e) => onAssistantChange(e.target.value)}
                  className="bg-transparent border-none text-sm text-foreground focus:ring-0 cursor-pointer outline-none min-w-[120px]"
                >
                  <option value="all" className="bg-background">All Assistants</option>
                  {assistants.map((assistant: any) => (
                    <option key={assistant._id} value={assistant._id} className="bg-background text-foreground">
                      {assistant.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="liquid-glass-medium liquid-rounded-lg border border-white/10">
              <TimeRangeSelector onRangeChange={handleRangeChange} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
