import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Trash2, Edit3, Settings, Mic, MessageSquare, CheckCircle2, FileText, Files, Mail, Workflow as WorkflowIcon, ArrowRightLeft } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ThemeContainer, ThemeSection, ThemeCard } from "@/components/theme";
import DashboardLayout from "@/layout/DashboardLayout";
import { ModelTab } from "@/components/assistants/wizard/ModelTab";
import { VoiceTab } from "@/components/assistants/wizard/VoiceTab";
import { SMSTab } from "@/components/assistants/wizard/SMSTab";

import { N8nTab } from "@/components/assistants/wizard/N8nTab";
import { IntakeTab } from "@/components/assistants/wizard/IntakeTab";
import { DocumentsTab } from "@/components/assistants/wizard/DocumentsTab";
import { EmailTab } from "@/components/assistants/wizard/EmailTab";
import { AnalysisTab } from "@/components/assistants/wizard/AnalysisTab";
import { AssistantFormData } from "@/components/assistants/wizard/types";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { WorkflowTab } from "@/components/assistants/wizard/WorkflowTab";
import { AdvancedTab } from "@/components/assistants/wizard/AdvancedTab";

const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const CreateAssistant = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = !!id;
  const [activeTab, setActiveTab] = useState("model");
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Debug logging
  console.log('CreateAssistant rendered', { isEditing, id, isLoading, activeTab });

  // Debug tab switching
  const handleTabClick = (tabId: string) => {
    console.log('Tab clicked:', tabId);
    setActiveTab(tabId);
  };

  const tabs = [
    { id: "model", label: "Model", icon: Settings },
    { id: "voice", label: "Voice", icon: Mic },
    { id: "sms", label: "Messages", icon: MessageSquare },
    { id: "analysis", label: "Analysis", icon: Sparkles },
    { id: "intake", label: "Capabilities", icon: FileText },
    { id: "documents", label: "Documents", icon: Files },
    { id: "email", label: "Email", icon: Mail },
    { id: "flow", label: "Conversation Flow", icon: WorkflowIcon },
    { id: "advanced", label: "Advanced", icon: ArrowRightLeft },
  ];

  const searchParams = new URLSearchParams(location.search);
  const providedName = searchParams.get('name');

  const [formData, setFormData] = useState<AssistantFormData>({
    name: isEditing ? "Loading..." : (providedName && providedName.trim() ? providedName : "Untitled Assistant"),
    id: isEditing ? (id || "") : "new",
    model: {
      provider: "OpenAI",
      model: "GPT-4.1",
      calendar: "None",
      conversationStart: "assistant-first",
      voice: "rachel-elevenlabs",
      temperature: 0.3,
      maxTokens: 250,
      firstMessage: "",
      systemPrompt: "",
      emailReplyPrompt: "",
      language: "en",
      transcriber: {
        model: "nova-2",
        language: "en"
      },
      // Call Management Settings
      endCallMessage: "",
      maxCallDuration: 1800,
      idleMessages: [],
      idleMessageMaxSpokenCount: 3,
      silenceTimeoutSeconds: 10
    },
    voice: {
      provider: "Cartesia",
      voice: "41468051-3a85-4b68-92ad-64add250d369",
      model: "sonic-3",
      backgroundSound: "none",
      inputMinCharacters: 10,
      stability: 0.71,
      clarity: 0.75,
      speed: 1.0,
      style: 0.0,
      latency: 1,
      waitSeconds: 0.5,
      smartEndpointing: "enabled",
      advancedTimingEnabled: false,
      timingSlider1: 0.3,
      timingSlider2: 0.8,
      timingSlider3: 1.2,
      numWordsToInterrupt: 2,
      voiceSeconds: 0.2,
      backOffSeconds: 1,
      silenceTimeout: 30,
      maxDuration: 1800,
      similarityBoost: 0.5,
      useSpeakerBoost: true,
      optimizeStreaming: 2,
      pronunciationDictionary: false,
      chunk: 1
    },
    sms: {
      provider: "Twilio",
      calendar: "None",
      calendarBookingEnabled: false,
      systemPrompt: "",
      firstMessage: "",
      responseStyle: 0.5,
      characterLimit: 160,
      language: "en",
      autoReply: true,
      autoReplyDelay: 1,
      businessHours: {
        enabled: false,
        start: "09:00",
        end: "17:00",
        timezone: "America/New_York"
      },
      messageTemplates: [],
      complianceSettings: {
        tcpaCompliant: true,
        optInEnabled: true,
        optOutKeywords: ["STOP", "UNSUBSCRIBE", "QUIT"],
        helpKeywords: ["HELP", "INFO", "SUPPORT"]
      },
      escalationRules: {
        enabled: true,
        humanTransferKeywords: ["AGENT", "HUMAN", "REPRESENTATIVE"],
        maxAutoResponses: 5
      }
    },
    analysis: {
      structuredData: [],
      callSummary: "",
      successEvaluation: true,
      customSuccessPrompt: "",
      // Analysis timeout settings
      summaryTimeout: 30,
      evaluationTimeout: 15,
      structuredDataTimeout: 20,
      // Structured data configuration
      structuredDataPrompt: "",
      structuredDataProperties: {}
    },
    dataCollection: {
      collectName: false,
      collectEmail: false,
      collectPhone: false,
      linkedEmailId: "",
      linkedCalendarId: ""
    },
    assigned_documents: [],
    emailTemplate: {
      subject: "",
      body: "",
      fromEmail: "",
      emailReplyPrompt: "",
      link: ""
    },
    nodes: [],
    edges: [],
    advanced: {
      hipaaCompliant: false,
      pciCompliant: false,
      recordingEnabled: false,
      audioRecordingFormat: "wav",
      videoRecordingEnabled: false,
      endCallMessage: "",
      endCallPhrases: [],
      responseDelaySeconds: 0,
      llmRequestDelaySeconds: 0,
      numWordsToInterruptAssistant: 2,
      maxDurationSeconds: 1800,
      backgroundSound: "none",
      voicemailDetectionEnabled: false,
      transferEnabled: false,
      transferPhoneNumber: "",
      transferCountryCode: "+1",
      transferSentence: "",
      transferCondition: ""
    }
  });

  const handleFormDataChange = (section: keyof AssistantFormData, data: any) => {
    // If the section is an array (e.g., assigned_documents), replace it directly
    if (Array.isArray(data)) {
      setFormData(prev => ({
        ...prev,
        [section]: data,
      }));
      return;
    }
    // For object sections, merge the incoming data
    setFormData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...data },
    }));
  };

  // Load existing assistant data when editing
  useEffect(() => {
    const loadExistingAssistant = async () => {
      if (!isEditing || !id) return;

      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Not authenticated');

        const response = await fetch(`/api/v1/assistants/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load assistant');
        }

        const data = await response.json();

        if (data) {
          // Map backend nested data to form data
          setFormData({
            name: data.name || "Untitled Assistant",
            id: data._id, // Use _id from MongoDB
            model: {
              ...(data.modelSettings || {}),
              // Ensure defaults if missing in DB
              provider: data.modelSettings?.provider || "OpenAI",
              model: data.modelSettings?.model || "GPT-4.1",
              calendar: data.modelSettings?.calendar || "None",
              conversationStart: data.modelSettings?.conversationStart || "assistant-first",
              voice: data.modelSettings?.voice || "rachel-elevenlabs",
              temperature: data.modelSettings?.temperature || 0.3,
              maxTokens: data.modelSettings?.maxTokens || 250,
              language: data.modelSettings?.language || "en",
              firstMessage: data.firstMessage || data.modelSettings?.firstMessage || "",
              systemPrompt: data.systemPrompt || data.modelSettings?.systemPrompt || "",
              emailReplyPrompt: data.emailReplyPrompt || data.modelSettings?.emailReplyPrompt || "",
              transcriber: {
                model: data.modelSettings?.transcriber?.model || "nova-2",
                language: data.modelSettings?.transcriber?.language || "en"
              },
              // Backwards compatibility or direct mapping depending on how it was saved
              endCallMessage: data.modelSettings?.endCallMessage || "",
              maxCallDuration: data.modelSettings?.maxCallDuration || 1800,
              idleMessages: data.modelSettings?.idleMessages || [],
              idleMessageMaxSpokenCount: data.modelSettings?.idleMessageMaxSpokenCount || 3,
              silenceTimeoutSeconds: data.modelSettings?.silenceTimeoutSeconds || 10,
              // Calendar credentials
              calApiKey: data.modelSettings?.calApiKey || "",
              calEventTypeId: data.modelSettings?.calEventTypeId || "",
              calEventTypeSlug: data.modelSettings?.calEventTypeSlug || "",
              calTimezone: data.modelSettings?.calTimezone || "UTC"
            },
            voice: {
              ...(data.voiceSettings || {}),
              provider: data.voiceSettings?.provider || "Cartesia",
              voice: data.voiceSettings?.voice || "41468051-3a85-4b68-92ad-64add250d369",
              model: data.voiceSettings?.model || "sonic-3",
              backgroundSound: data.voiceSettings?.backgroundSound || "none",
              inputMinCharacters: data.voiceSettings?.inputMinCharacters || 10,
              stability: data.voiceSettings?.stability || 0.71,
              clarity: data.voiceSettings?.clarity || 0.75,
              speed: data.voiceSettings?.speed || 1.0,
              style: data.voiceSettings?.style || 0.0,
              latency: data.voiceSettings?.latency || 1,
              waitSeconds: data.voiceSettings?.waitSeconds || 0.5,
              smartEndpointing: data.voiceSettings?.smartEndpointing || "enabled",
              voiceSeconds: data.voiceSettings?.voiceSeconds || 0.2,
              backOffSeconds: data.voiceSettings?.backOffSeconds || 1,
              silenceTimeout: data.voiceSettings?.silenceTimeout || 30,
              maxDuration: data.voiceSettings?.maxDuration || 1800,
              similarityBoost: data.voiceSettings?.similarityBoost || 0.5,
              useSpeakerBoost: data.voiceSettings?.useSpeakerBoost ?? true,
              optimizeStreaming: data.voiceSettings?.optimizeStreaming || 2,
              chunk: data.voiceSettings?.chunk || 1
            },
            sms: {
              ...(data.smsSettings || {}),
              provider: data.smsSettings?.provider || "Twilio",
              firstMessage: data.firstMessage || data.smsSettings?.firstMessage || "", // Sync with top level if unified
              systemPrompt: data.systemPrompt || data.smsSettings?.systemPrompt || "",
              responseStyle: data.smsSettings?.responseStyle || 0.5,
              characterLimit: data.smsSettings?.characterLimit || 160,
              language: data.smsSettings?.language || "en",
              autoReply: data.smsSettings?.autoReply ?? true,
              complianceSettings: {
                tcpaCompliant: true,
                optInEnabled: true,
                optOutKeywords: ["STOP", "UNSUBSCRIBE", "QUIT"],
                helpKeywords: ["HELP", "INFO", "SUPPORT"],
                ...(data.smsSettings?.complianceSettings || {})
              },
              escalationRules: {
                enabled: true,
                humanTransferKeywords: ["AGENT", "HUMAN", "REPRESENTATIVE"],
                maxAutoResponses: 5,
                ...(data.smsSettings?.escalationRules || {})
              }
            },
            analysis: {
              ...(data.analysisSettings || {}),
              structuredData: data.analysisSettings?.structuredData || [],
              callSummary: data.analysisSettings?.callSummary || "",
              successEvaluation: data.analysisSettings?.successEvaluation ?? true,
              customSuccessPrompt: data.analysisSettings?.customSuccessPrompt || "",
              summaryTimeout: data.analysisSettings?.summaryTimeout || 30,
              evaluationTimeout: data.analysisSettings?.evaluationTimeout || 15,
              structuredDataTimeout: data.analysisSettings?.structuredDataTimeout || 20,
              structuredDataPrompt: data.analysisSettings?.structuredDataPrompt || "",
              structuredDataProperties: data.analysisSettings?.structuredDataProperties || {}
            },
            dataCollection: {
              collectName: data.dataCollectionSettings?.collectName || false,
              collectEmail: data.dataCollectionSettings?.collectEmail || false,
              collectPhone: data.dataCollectionSettings?.collectPhone || false,
              linkedEmailId: data.dataCollectionSettings?.linkedEmailId || "",
              linkedCalendarId: data.dataCollectionSettings?.linkedCalendarId || ""
            },
            assigned_documents: data.assigned_documents || [],
            emailTemplate: {
              subject: data.email_templates?.post_call?.subject || "Information from our call",
              body: data.email_templates?.post_call?.body || "Hi, thanks for speaking with us. Here are the documents you requested.",
              fromEmail: data.email_templates?.post_call?.sender || "",
              emailReplyPrompt: data.emailReplyPrompt || data.modelSettings?.emailReplyPrompt || "",
              link: data.email_templates?.post_call?.link || ""
            },
            nodes: Array.isArray(data.nodes) ? data.nodes : [],
            edges: Array.isArray(data.edges) ? data.edges : [],
            advanced: {
              hipaaCompliant: data.advancedSettings?.hipaaCompliant || false,
              pciCompliant: data.advancedSettings?.pciCompliant || false,
              recordingEnabled: data.advancedSettings?.recordingEnabled || false,
              audioRecordingFormat: data.advancedSettings?.audioRecordingFormat || "wav",
              videoRecordingEnabled: data.advancedSettings?.videoRecordingEnabled || false,
              endCallMessage: data.advancedSettings?.endCallMessage || "",
              endCallPhrases: data.advancedSettings?.endCallPhrases || [],
              responseDelaySeconds: data.advancedSettings?.responseDelaySeconds || 0,
              llmRequestDelaySeconds: data.advancedSettings?.llmRequestDelaySeconds || 0,
              numWordsToInterruptAssistant: data.advancedSettings?.numWordsToInterruptAssistant || 2,
              maxDurationSeconds: data.advancedSettings?.maxDurationSeconds || 1800,
              backgroundSound: data.advancedSettings?.backgroundSound || "none",
              voicemailDetectionEnabled: data.advancedSettings?.voicemailDetectionEnabled || false,
              voicemailMessage: data.advancedSettings?.voicemailMessage || "",
              transferEnabled: data.advancedSettings?.transferEnabled || false,
              transferPhoneNumber: data.advancedSettings?.transferPhoneNumber || "",
              transferCountryCode: data.advancedSettings?.transferCountryCode || "+1",
              transferSentence: data.advancedSettings?.transferSentence || "",
              transferCondition: data.advancedSettings?.transferCondition || ""
            }
          });
        }
      } catch (error: any) {
        console.error('Error loading assistant:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load assistant data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadExistingAssistant();
  }, [isEditing, id, toast]);


  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be signed in to save an assistant.');

      // Construct payload matching backend Assistant model structure
      const payload = {
        name: formData.name,
        systemPrompt: formData.model.systemPrompt,
        emailReplyPrompt: formData.emailTemplate.emailReplyPrompt,
        firstMessage: formData.model.firstMessage,

        modelSettings: {
          ...formData.model,
          // Explicitly ensuring these are saved if they are in the model tab
          systemPrompt: formData.model.systemPrompt,
          emailReplyPrompt: formData.emailTemplate.emailReplyPrompt,
          firstMessage: formData.model.firstMessage,
        },
        voiceSettings: formData.voice,
        smsSettings: formData.sms,
        analysisSettings: formData.analysis,
        dataCollectionSettings: formData.dataCollection,
        advancedSettings: formData.advanced,
        assigned_documents: formData.assigned_documents,
        email_templates: {
          post_call: {
            subject: formData.emailTemplate.subject,
            body: formData.emailTemplate.body,
            sender: formData.emailTemplate.fromEmail,
            link: formData.emailTemplate.link
          }
        },
        nodes: formData.nodes,
        edges: formData.edges
      };

      // Debug: Log the payload
      console.log("Saving assistant payload:", payload);

      const url = isEditing && id
        ? `/api/v1/assistants/${id}`
        : '/api/v1/assistants';

      const method = isEditing && id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to save assistant');
      }

      const savedData = await response.json();

      toast({
        title: isEditing ? 'Assistant updated' : 'Assistant created',
        description: 'Your assistant has been saved.'
      });

      navigate('/assistants');

    } catch (e: any) {
      console.error('Save failed:', e);
      toast({ title: 'Save failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!id) return;
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`/api/v1/assistants/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete assistant');
      }

      toast({
        title: "Assistant deleted",
        description: "The assistant has been permanently deleted.",
      });
      navigate("/assistants");

    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete assistant.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <ThemeContainer variant="base" className="min-h-screen no-hover-scaling">
        <div className="flex flex-col h-screen">
          {/* Top Header Bar */}
          <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-[1920px] mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/assistants")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <Edit3 className="h-5 w-5 text-primary/60" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-primary/60" />
                    )}
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="border-0 bg-transparent text-xl font-semibold px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Assistant Name"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Save Assistant
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-border/40 bg-background/50 backdrop-blur-sm overflow-y-auto">
              <div className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${activeTab === tab.id
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Assistant Info */}
              <div className="p-4 border-t border-border/40 mt-4">
                <p className="text-xs text-muted-foreground font-mono mb-2">Assistant ID</p>
                <p className="text-xs font-mono text-foreground/60 break-all">
                  {isLoading ? "..." : formData.id}
                </p>
              </div>

              {/* Delete Button - Only in Edit Mode */}
              {isEditing && (
                <div className="p-4 border-t border-border/40">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full gap-2"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Assistant
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="liquid-glass-heavy border border-destructive/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                          Delete Assistant
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Are you sure you want to delete this assistant? This action cannot be undone
                          and all associated data will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30"
                        >
                          Delete Assistant
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-muted/20">
              <div className="max-w-[1920px] mx-auto p-8">
                {isLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading assistant configuration...</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      variants={tabVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="pointer-events-auto"
                    >
                      {activeTab === "model" && (
                        <ModelTab
                          data={formData.model}
                          onChange={(data) => handleFormDataChange('model', data)}
                        />
                      )}
                      {activeTab === "voice" && (
                        <VoiceTab
                          data={formData.voice}
                          onChange={(data) => handleFormDataChange('voice', data)}
                        />
                      )}
                      {activeTab === "sms" && (
                        <SMSTab
                          data={formData.sms}
                          onChange={(data) => handleFormDataChange('sms', data)}
                        />
                      )}
                      {activeTab === "analysis" && (
                        <AnalysisTab
                          data={formData.analysis}
                          onChange={(data) => handleFormDataChange('analysis', data)}
                        />
                      )}
                      {activeTab === "intake" && (
                        <IntakeTab
                          data={formData.dataCollection}
                          onChange={(data) => handleFormDataChange('dataCollection', data)}
                        />
                      )}
                      {activeTab === "documents" && (
                        <DocumentsTab
                          files={formData.assigned_documents}
                          onChange={(files) => handleFormDataChange('assigned_documents', files)}
                        />
                      )}
                      {activeTab === "email" && (
                        <EmailTab
                          data={formData.emailTemplate}
                          assistantName={formData.name}
                          documents={formData.assigned_documents}
                          onChange={(data) => handleFormDataChange('emailTemplate', data)}
                        />
                      )}
                      {activeTab === "advanced" && (
                        <AdvancedTab
                          data={formData.advanced}
                          onChange={(data) => handleFormDataChange('advanced', data)}
                        />
                      )}
                      {activeTab === "flow" && (
                        <div className="space-y-6 sm:space-y-8 h-full">
                          <WorkflowTab
                            nodes={formData.nodes}
                            edges={formData.edges}
                            onChange={(data) => {
                              const startNode = data.nodes.find(n => n.type === 'start');
                              setFormData(prev => {
                                const updates: any = { nodes: data.nodes, edges: data.edges };
                                if (startNode) {
                                  // Extract data from start node
                                  const newFirstDialogue = startNode.data.first_dialogue;
                                  const newInputPrompt = startNode.data.input_prompt;

                                  // Check if we need to sync with model settings
                                  // Only update if values are defined and different to avoid unnecessary re-renders
                                  const currentFirstMessage = prev.model.firstMessage;
                                  const currentSystemPrompt = prev.model.systemPrompt;

                                  if ((newFirstDialogue !== undefined && newFirstDialogue !== currentFirstMessage) ||
                                    (newInputPrompt !== undefined && newInputPrompt !== currentSystemPrompt)) {

                                    updates.model = {
                                      ...prev.model,
                                      ...(newFirstDialogue !== undefined && { firstMessage: newFirstDialogue }),
                                      ...(newInputPrompt !== undefined && { systemPrompt: newInputPrompt })
                                    };

                                    // Also sync top-level fields if they exist there
                                    updates.firstMessage = newFirstDialogue !== undefined ? newFirstDialogue : prev.model.firstMessage;
                                    updates.systemPrompt = newInputPrompt !== undefined ? newInputPrompt : prev.model.systemPrompt;
                                  }
                                }
                                return { ...prev, ...updates };
                              });
                            }}
                          />
                        </div>
                      )}


                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      </ThemeContainer>
    </DashboardLayout>
  );
};

export default CreateAssistant;