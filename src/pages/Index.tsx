
import { useState, useMemo, useEffect } from "react";
import { useBusinessUseCase } from "@/components/BusinessUseCaseProvider";
import DashboardLayout from "@/layout/DashboardLayout";
import FilterBar from "@/components/navigation/FilterBar";
import DashboardContent from "@/components/dashboard/DashboardContent";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useRouteChangeData } from "@/hooks/useRouteChange";
import { getCurrentUserIdAsync } from "@/lib/user-context";

interface CallHistory {
  id: string;
  call_id: string;
  assistant_id: string;
  phone_number: string;
  participant_identity: string;
  start_time: string;
  end_time: string;
  call_duration: number;
  call_status: string;
  transcription: Array<{ role: string; content: any }>;
  created_at: string;
  updated_at: string;
}



export default function Index() {
  const { config } = useBusinessUseCase();
  const { user, loading: isAuthLoading } = useAuth();

  // Set data-page attribute for dashboard page
  useEffect(() => {
    document.body.setAttribute('data-page', 'dashboard');
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date()
  });
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>('all');
  const [realCallHistory, setRealCallHistory] = useState<CallHistory[]>([]);
  const [isLoadingRealData, setIsLoadingRealData] = useState(true);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [emailThreads, setEmailThreads] = useState<any[]>([]);
  const [smsMessages, setSmsMessages] = useState<any[]>([]);

  // Helper function to determine call outcome from transcription
  const getCallOutcome = (transcription: Array<{ role: string; content: any }>) => {
    if (!transcription || transcription.length === 0) return 'No Outcome';

    const lastMessage = transcription[transcription.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      // Safely convert content to string and handle different data types
      const content = typeof lastMessage.content === 'string'
        ? lastMessage.content.toLowerCase()
        : String(lastMessage.content || '').toLowerCase();

      if (content.includes('appointment') || content.includes('booked')) return 'Booked Appointment';
      if (content.includes('spam')) return 'Spam';
      if (content.includes('not qualified')) return 'Not Qualified';
      if (content.includes('message')) return 'Message to Franchise';
    }

    return 'Call Dropped';
  };

  // Fetch real call history from backend API
  const fetchCallHistory = async () => {
    // Don't fetch data if auth is still loading or user is not authenticated
    if (isAuthLoading || !user?.id) {
      setIsLoadingRealData(false);
      return;
    }

    try {
      setIsLoadingRealData(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error("No token found");

      // Fetch calls directly from backend
      const assistantQuery = selectedAssistantId !== 'all' ? `&assistant_id=${selectedAssistantId}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/calls?limit=200${assistantQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error("Failed to fetch calls");
        return;
      }

      const result = await response.json();
      const calls = result.data?.calls || result.calls || [];

      // Map backend fields to frontend interface
      const mappedCalls = calls.map((c: any) => ({
        ...c,
        id: c._id || c.id,
        created_at: c.created_at || c.start_time || new Date().toISOString()
      }));

      setRealCallHistory(mappedCalls);
    } catch (error) {
      console.error('Error fetching call history:', error);
    } finally {
      setIsLoadingRealData(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, [isAuthLoading, user?.id, selectedAssistantId]);

  // Trigger API call on route changes
  useRouteChangeData(fetchCallHistory, [isAuthLoading, user?.id], {
    enabled: !isAuthLoading && !!user?.id,
    refetchOnRouteChange: true
  });

  // Convert real call history to the format expected by the dashboard
  const realCallLogs = useMemo(() => {
    return realCallHistory.map(call => {
      // Process transcription data to the expected format
      const processedTranscript = call.transcription?.map((entry: any) => {
        // Extract content from array format
        let content = '';
        if (Array.isArray(entry.content)) {
          content = entry.content.join(' ').trim();
        } else if (typeof entry.content === 'string') {
          content = entry.content;
        } else {
          content = String(entry.content || '');
        }

        return {
          speaker: entry.role === 'user' ? 'Customer' : entry.role === 'assistant' ? 'Agent' : entry.role,
          time: new Date(call.start_time || call.created_at).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          }),
          text: content
        };
      }) || [];

      // Calculate duration from available fields
      let duration = '0:00';
      if (call.call_duration) {
        const minutes = Math.floor(call.call_duration / 60);
        const seconds = call.call_duration % 60;
        duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      return {
        id: call.id,
        name: call.participant_identity || call.phone_number || 'Unknown',
        phoneNumber: call.phone_number || '',
        date: new Date(call.start_time).toLocaleDateString('en-US'),
        time: new Date(call.start_time).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        duration,
        direction: 'inbound',
        channel: 'voice',
        tags: [],
        status: call.call_status || 'completed',
        resolution: getCallOutcome(call.transcription),
        call_recording: '',
        summary: '',
        transcript: processedTranscript,
        analysis: null,
        address: '',
        messages: [],
        phone_number: call.phone_number || '',
        call_outcome: getCallOutcome(call.transcription),
        call_duration: call.call_duration || 0,
        created_at: call.start_time
      };
    });
  }, [realCallHistory]);

  // Use only real call data
  const callLogs = realCallLogs;

  // Calculate statistics from real call data
  const stats = useMemo(() => {
    if (!callLogs || callLogs.length === 0) {
      return {
        totalCalls: 0,
        avgDuration: 0,
        appointments: 0,
        bookingRate: 0,
        successfulTransfers: 0,
        formSubmissions: 0
      };
    }

    const totalCalls = callLogs.length;
    const totalDuration = callLogs.reduce((sum, call) => {
      // Handle different duration formats from real data
      let duration = 0;
      if (call.call_duration) {
        duration = typeof call.call_duration === 'string'
          ? parseInt(call.call_duration)
          : call.call_duration;
      } else if (call.duration) {
        if (typeof call.duration === 'string') {
          // Handle MM:SS format
          const [minutes, seconds] = call.duration.split(':').map(Number);
          duration = minutes * 60 + seconds;
        } else {
          duration = call.duration;
        }
      }
      return sum + duration;
    }, 0);
    const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

    const appointments = callLogs.filter(call =>
      call.call_outcome?.toLowerCase().includes('appointment') ||
      call.resolution?.toLowerCase().includes('appointment') ||
      call.call_outcome?.toLowerCase().includes('booked') ||
      call.resolution?.toLowerCase().includes('booked')
    ).length;

    const bookingRate = totalCalls > 0 ? Math.round((appointments / totalCalls) * 100) : 0;
    const successfulTransfers = Math.floor(appointments * 0.3);

    return {
      totalCalls,
      avgDuration,
      appointments,
      bookingRate,
      successfulTransfers,
      formSubmissions: submissions.length
    };
  }, [callLogs, submissions]);

  const handleRangeChange = (range) => {
    setDateRange(range);
  };

  // Process call outcomes from real data
  const callOutcomesData = useMemo(() => {
    if (!callLogs || callLogs.length === 0) {
      return {};
    }

    return callLogs.reduce((acc, call) => {
      const outcome = call.call_outcome || call.resolution || 'Unknown';
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [callLogs]);

  // Fetch email history
  const fetchEmailHistory = async () => {
    if (isAuthLoading || !user?.id) return;

    try {
      const token = localStorage.getItem('token');
      const assistantQuery = selectedAssistantId !== 'all' ? `?assistantId=${selectedAssistantId}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/emails/threads${assistantQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (json.success) {
        setEmailThreads(json.threads || []);
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
  };


  const fetchSmsHistory = async () => {
    if (isAuthLoading || !user?.id) return;

    try {
      const token = localStorage.getItem('token');
      const assistantQuery = selectedAssistantId !== 'all' ? `?assistant_id=${selectedAssistantId}` : '';
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/sms${assistantQuery}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await response.json();
      if (json.success) {
        setSmsMessages(json.data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching SMS:', error);
    }
  };

  const fetchSubmissions = async () => {
    if (isAuthLoading || !user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/integrations/mongodb/submissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setSubmissions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching submissions:', e);
    }
  };

  const fetchCampaigns = async () => {
    if (isAuthLoading || !user?.id) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/api/v1/email-campaigns`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setCampaignData(data.campaigns || []);
      }
    } catch (e) {
      console.error('Error fetching campaigns:', e);
    }
  };

  useEffect(() => {
    fetchEmailHistory();
    fetchSmsHistory();
    fetchSubmissions();
    fetchCampaigns();
  }, [isAuthLoading, user?.id, selectedAssistantId]);

  // Combine calls and emails for unified activity
  const unifiedActivity = useMemo(() => {
    const activities = [
      ...callLogs.map(call => ({
        ...call,
        type: 'call',
        timestamp: new Date(call.created_at || call.date).getTime()
      })),
      ...emailThreads.map(email => ({
        id: email.id,
        name: email.senderName || email.senderEmail,
        subject: email.subject,
        snippet: email.lastMessage,
        date: new Date(email.timestamp).toLocaleDateString('en-US'),
        time: new Date(email.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'email',
        messageCount: email.messageCount,
        recipientName: email.recipientName,
        recipientEmail: email.recipientEmail,
        campaignName: email.campaignName,
        campaignSubject: email.campaignSubject,
        timestamp: new Date(email.timestamp).getTime(),
        status: 'completed'
      })),
      ...smsMessages.map(sms => ({
        id: sms._id,
        name: sms.direction === 'inbound' ? sms.fromNumber : sms.toNumber,
        phoneNumber: sms.direction === 'inbound' ? sms.fromNumber : sms.toNumber,
        snippet: sms.body,
        date: new Date(sms.createdAt).toLocaleDateString('en-US'),
        time: new Date(sms.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'message',
        direction: sms.direction,
        timestamp: new Date(sms.createdAt).getTime(),
        status: sms.status
      })),
      ...submissions.map(sub => ({
        id: sub._id,
        name: sub.data?.firstName || sub.data?.Name || sub.data?.email || 'New Lead',
        snippet: `Form submitted via ${sub.source || 'MongoDB'} integration`,
        date: new Date(sub.syncedAt || sub.createdAt).toLocaleDateString('en-US'),
        time: new Date(sub.syncedAt || sub.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        type: 'form',
        category: sub.category,
        data: sub.data,
        timestamp: new Date(sub.syncedAt || sub.createdAt).getTime(),
        status: sub.status || 'synced'
      }))
    ];

    return activities.sort((a, b) => b.timestamp - a.timestamp);
  }, [callLogs, emailThreads, smsMessages]);

  // Calculate email stats
  const emailStats = useMemo(() => {
    const totalSent = campaignData.reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
    const totalReplies = campaignData.reduce((sum, c) => sum + (c.stats?.replies || 0), 0);
    const replyRate = totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0;

    return {
      totalThreads: emailThreads.length,
      totalMessages: emailThreads.reduce((sum, t) => sum + (t.messageCount || 1), 0),
      totalSent,
      totalReplies,
      replyRate
    };
  }, [emailThreads, campaignData]);


  // Show loading state if auth is still loading
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="relative">
        <FilterBar
          onRangeChange={handleRangeChange}
          onAssistantChange={setSelectedAssistantId}
          selectedAssistantId={selectedAssistantId}
        />
      </div>
      <DashboardContent
        dateRange={dateRange}
        callLogs={callLogs}
        unifiedActivity={unifiedActivity}
        emailStats={emailStats}
        isLoading={isAuthLoading || isLoadingRealData}
        stats={stats}
        callOutcomesData={callOutcomesData}
      />
    </DashboardLayout>
  );
}
