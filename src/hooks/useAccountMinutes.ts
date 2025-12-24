import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SupportAccessAuthContext";

interface AccountMinutes {
  remainingMinutes: number;
  planName: string;
  percentageUsed: number;
  isLoading: boolean;
  refetch?: () => void;
}

// Get backend URL from environment or use default
const getBackendUrl = () => {
  return import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

export function useAccountMinutes(): AccountMinutes {
  const { user } = useAuth();
  const [remainingMinutes, setRemainingMinutes] = useState(0);
  const [planName, setPlanName] = useState("Free Plan");
  const [percentageUsed, setPercentageUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAccountMinutes = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return; // No token, no data
      }

      // Fetch real minutes data from API
      const response = await fetch(`${getBackendUrl()}/api/v1/minutes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Invalid token
          return;
        }
        throw new Error(`Failed to fetch minutes: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setRemainingMinutes(result.data.remainingMinutes || 0);
        setPlanName(result.data.planName || (user as any)?.plan || "Free Plan");
        setPercentageUsed(result.data.percentageUsed || 0);
      } else {
        throw new Error(result.error || 'Failed to fetch minutes data');
      }
    } catch (error) {
      console.error('Error fetching account minutes:', error);
      // On error, set defaults but don't show mock data
      setRemainingMinutes(0);
      setPlanName((user as any)?.plan || "Free Plan");
      setPercentageUsed(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      // Reset to defaults when no user
      setRemainingMinutes(0);
      setPlanName("Free Plan");
      setPercentageUsed(0);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchAccountMinutes();
  }, [user]);

  return {
    remainingMinutes,
    planName,
    percentageUsed,
    isLoading,
    refetch: fetchAccountMinutes
  };
}
