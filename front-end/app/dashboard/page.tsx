"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { CopilotKit } from "@copilotkit/react-core";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { TaskProvider, useTasks } from "@/lib/task-context";
import { PatientStateProvider, usePatientState } from "@/lib/state-context";
import patientData from "@/lib/patient.json";
import { Send, Mic, X, Phone, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

function PatientDashboardContent() {
  const [inputMessage, setInputMessage] = useState("");
  const { tasks, addTask } = useTasks();
  const { memoryLog, healthNotes, addMemory, addHealthNote } = usePatientState();
  const [dailyActivities, setDailyActivities] = useState<Array<{ id: number; activity: string; icon: string }>>([]);
  const [healthTips, setHealthTips] = useState<Array<{ id: number; tip: string; icon: string }>>([]);
  const [memoryPhotos, setMemoryPhotos] = useState<Array<{ id: number; photo_path: string; memory_description: string }>>([]);
  const [carouselSpeed, setCarouselSpeed] = useState<"fast" | "normal" | "slow">("normal");
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string; alt: string } | null>(null);
  const [photoMemoryContext, setPhotoMemoryContext] = useState<string>("");
  const [isLoadingMemory, setIsLoadingMemory] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [displayedAssistantMessage, setDisplayedAssistantMessage] = useState<string | null>(null);
  const [isAssistantMessageVisible, setIsAssistantMessageVisible] = useState(false);
  const [displayedShowsTodayCard, setDisplayedShowsTodayCard] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [crossedOutTasks, setCrossedOutTasks] = useState<Set<number>>(new Set());
  const hideMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showMessageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch daily activities, health tips, and memory photos
  useEffect(() => {
    async function fetchPatientData() {
      try {
        const response = await fetch('/api/db/patient-data');
        const result = await response.json();
        if (result.success) {
          setDailyActivities(result.data.dailyActivities);
          setHealthTips(result.data.healthTips);
          setMemoryPhotos(result.data.memoryPhotos || []);
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    }
    fetchPatientData();
  }, []);

  // Adjust carousel speed based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCarouselSpeed("fast");
      } else {
        setCarouselSpeed("normal");
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Cleanup on unmount - abort any pending requests
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (hideMessageTimeoutRef.current) {
        clearTimeout(hideMessageTimeoutRef.current);
        hideMessageTimeoutRef.current = null;
      }
      if (showMessageTimeoutRef.current) {
        clearTimeout(showMessageTimeoutRef.current);
        showMessageTimeoutRef.current = null;
      }
    };
  }, []);

  async function speakTextWithTTS(text: string) {
  try {
    const res = await fetch("/api/text-to-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      console.error("TTS request failed:", await res.text());
      return;
    }

    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (err) {
    console.error("Error playing TTS:", err);
  }
}


  // Handle photo click - instant fade with loading
  const handlePhotoClick = async (photo: { src: string; alt: string }) => {
    console.log('Photo clicked:', photo.src);
    
    // Prevent multiple simultaneous requests
    if (isLoadingMemory) {
      console.log('Already loading a memory, please wait...');
      return;
    }

    // Cancel any previous request
    if (abortControllerRef.current) {
      console.log('Aborting previous request');
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    console.log('Setting selected photo and loading state');
    // Instantly show photo and loading state
    setSelectedPhoto(photo);
    setIsLoadingMemory(true);
    setPhotoMemoryContext("");

    // Call patient graph API to get memory context
    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: `Tell me about this memory: ${photo.alt}`,
          workflow: 'patient'
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // ✅ Define memoryText early
      let memoryText = photo.alt; // fallback if nothing returned

      if (data.success && data.state?.memoryLog?.length > 0) {
        memoryText = data.state.memoryLog[data.state.memoryLog.length - 1];
      }

      // ✅ Update UI and speak
      setPhotoMemoryContext(memoryText);
      await speakTextWithTTS(memoryText);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      console.error('Error loading memory:', error);
      // Fallback to photo description on error
      setPhotoMemoryContext(photo.alt);
    } finally {
      setIsLoadingMemory(false);
      abortControllerRef.current = null;
    }
  };

  // Close photo detail view
  const handleClosePhoto = () => {
    console.log('Closing photo view');
    
    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset all photo-related state
    setSelectedPhoto(null);
    setPhotoMemoryContext("");
    setIsLoadingMemory(false);
    
    console.log('State reset complete');
  };

  // Close assistant message
  const handleCloseMessage = () => {
    // Fade out and reset
    setIsAssistantMessageVisible(false);
    setTimeout(() => {
      setDisplayedAssistantMessage(null);
      setDisplayedShowsTodayCard(false);
      setIsEmergency(false); // Reset emergency state
      // Clear the chat history to prevent re-triggering
      setChatHistory([]);
    }, 300);
  };

  // Handle call 999
  const handleCall999 = () => {
    window.location.href = 'tel:999';
  };

  // Make patient data readable to CopilotKit
  useCopilotReadable({
    description: "Patient profile information",
    value: patientData,
  });

  // Action: Create Task
  useCopilotAction({
    name: "createTask",
    description: "Create a new task or reminder for the patient",
    parameters: [
      {
        name: "taskDescription",
        type: "string",
        description: "Description of the task to create",
        required: true,
      },
    ],
    handler: async ({ taskDescription }) => {
      await addTask(taskDescription);
      addMemory(`Created task: ${taskDescription}`);
      return `✓ Task created: "${taskDescription}"`;
    },
  });

  // Action: Report Health
  useCopilotAction({
    name: "checkHealth",
    description: "Report health symptoms or concerns",
    parameters: [
      {
        name: "symptom",
        type: "string",
        description: "Health symptom or concern to report",
        required: true,
      },
    ],
    handler: async ({ symptom }) => {
      addHealthNote(symptom);
      addMemory(`Reported health concern: ${symptom}`);
      return "I've recorded your health concern. Please consult your doctor if needed.";
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSendingMessage) return;

    const userMessage = inputMessage.trim();
    setInputMessage(""); // Clear input immediately
    setIsSendingMessage(true);
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    console.log("Sending message:", userMessage);

    try {
      // Call patient graph API
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: userMessage,
          workflow: 'patient'
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('API response:', data);
      
      if (data.success && data.state) {
        // Check for emergency flag
        if (data.state.isEmergency) {
          setIsEmergency(true);
        }

        // Update chat history with AI response
        if (data.state.memoryLog && data.state.memoryLog.length > 0) {
          const latestResponse = data.state.memoryLog[data.state.memoryLog.length - 1];
          setChatHistory(prev => [...prev, { role: 'assistant', content: latestResponse }]);
          addMemory(latestResponse);
          
          // Speak the assistant's response using TTS
          await speakTextWithTTS(latestResponse);
        }

        // Refresh activities if they were updated
        const activitiesResponse = await fetch('/api/db/patient-data');
        const activitiesData = await activitiesResponse.json();
        if (activitiesData.success) {
          setDailyActivities(activitiesData.data.dailyActivities);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg = "Sorry, I couldn't process that right now. Please try again.";
      setChatHistory(prev => [...prev, { role: 'assistant', content: errorMsg }]);
      addMemory(errorMsg);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const latestAssistantMessage = [...chatHistory]
    .reverse()
    .find((message) => message.role === 'assistant');

  const latestAssistantContent = latestAssistantMessage?.content ?? null;
  const latestUserMessage = [...chatHistory]
    .reverse()
    .find((message) => message.role === 'user');
  const isTaskQuery = latestUserMessage
    ? /\b(task|tasks|todo|remind|reminder|schedule|today|list|remove)\b/i.test(latestUserMessage.content)
    : false;
  const shouldShowTodayCard = isTaskQuery && dailyActivities.length > 0;

  useEffect(() => {
    if (!latestAssistantContent) {
      if (hideMessageTimeoutRef.current) {
        clearTimeout(hideMessageTimeoutRef.current);
        hideMessageTimeoutRef.current = null;
      }
      if (showMessageTimeoutRef.current) {
        clearTimeout(showMessageTimeoutRef.current);
        showMessageTimeoutRef.current = null;
      }
      if (displayedAssistantMessage !== null) {
        setDisplayedAssistantMessage(null);
        setDisplayedShowsTodayCard(false);
      }
      if (isAssistantMessageVisible) {
        setIsAssistantMessageVisible(false);
      }
      return;
    }

    if (latestAssistantContent === displayedAssistantMessage) {
      if (!isAssistantMessageVisible) {
        if (showMessageTimeoutRef.current) {
          clearTimeout(showMessageTimeoutRef.current);
          showMessageTimeoutRef.current = null;
        }
        showMessageTimeoutRef.current = setTimeout(() => {
          setIsAssistantMessageVisible(true);
          showMessageTimeoutRef.current = null;
        }, 20);
      }
      return;
    }

    if (hideMessageTimeoutRef.current) {
      clearTimeout(hideMessageTimeoutRef.current);
      hideMessageTimeoutRef.current = null;
    }
    if (showMessageTimeoutRef.current) {
      clearTimeout(showMessageTimeoutRef.current);
      showMessageTimeoutRef.current = null;
    }

    if (displayedAssistantMessage) {
      setIsAssistantMessageVisible(false);
      hideMessageTimeoutRef.current = setTimeout(() => {
        setDisplayedAssistantMessage(latestAssistantContent);
        setDisplayedShowsTodayCard(shouldShowTodayCard);
        hideMessageTimeoutRef.current = null;
      }, 300);
    } else {
      setIsAssistantMessageVisible(false);
      setDisplayedAssistantMessage(latestAssistantContent);
      setDisplayedShowsTodayCard(shouldShowTodayCard);
    }
  }, [
    latestAssistantContent,
    displayedAssistantMessage,
    isAssistantMessageVisible,
    displayedShowsTodayCard,
    shouldShowTodayCard,
  ]);

  // Handle activity checkbox click
  const handleActivityCheckbox = async (activityId: number) => {
    try {
      const response = await fetch('/api/db/daily-activities', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId }),
      });

      if (response.ok) {
        // Remove from local state immediately for smooth UI
        setDailyActivities(prev => prev.filter(a => a.id !== activityId));
        // Also remove from crossed-out set
        setCrossedOutTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(activityId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error removing activity:', error);
    }
  };

  // Handle task click to cross out (visual only)
  const handleTaskClick = (activityId: number) => {
    setCrossedOutTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const renderTodayCard = () => (
    <div className="rounded-lg border border-gray-200 bg-[#fbfbfb] overflow-hidden text-left">
      <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-1.5">
        <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        <h2 className="m-0 text-sm font-medium text-gray-900">Today</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {dailyActivities.map((activity) => {
          const isCrossedOut = crossedOutTasks.has(activity.id);
          return (
            <div
              key={activity.id}
              className="group flex items-center gap-3 px-3 py-1.5 hover:bg-[#f0f0f0] transition-colors"
            >
              {/* Bullet point */}
              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
              
              {/* Task text - clickable for cross-out */}
              <p 
                onClick={() => handleTaskClick(activity.id)}
                className={`m-0 flex-1 text-sm font-medium text-gray-900 cursor-pointer transition-all ${
                  isCrossedOut ? 'line-through opacity-50' : ''
                }`}
              >
                {activity.activity}
              </p>
              
              {/* Delete bin icon */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivityCheckbox(activity.id);
                }}
                className="shrink-0 p-1 hover:bg-red-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </div>
          );
        })}
        {dailyActivities.length === 0 && (
          <div className="px-3 py-1.5">
            <p className="m-0 text-sm text-gray-500">No tasks for today</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <SidebarProvider
      defaultOpen={false}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex-1 flex flex-col h-screen bg-white">
          {/* Main Content - Always Visible - Blur when response is shown */}
          <div className={`flex-1 overflow-y-auto transition-all duration-300 ${
            displayedAssistantMessage !== null && isAssistantMessageVisible ? 'blur-sm' : 'blur-0'
          }`}>
            <div className={`flex min-h-full w-full flex-col px-6 ${
              selectedPhoto ? "justify-start py-4" : "justify-center py-10"
            }`}>
              <div className="mx-auto w-full max-w-4xl space-y-4">
                  {/* Greeting Header - Only show when no photo is selected */}
                  {!selectedPhoto && (
                    <div className="py-2 text-center">
                      <h1 className="text-4xl font-light text-gray-900">
                        Hey, {patientData.name.split(' ')[0]}
                      </h1>
                    </div>
                  )}

                  {/* Photo Detail View */}
                  {selectedPhoto && (
                    <div className="max-w-3xl mx-auto">
                      {isLoadingMemory ? (
                        /* Loading State */
                        <div className="animate-in fade-in duration-200 flex flex-col items-center justify-center min-h-[400px] space-y-6">
                          <div className="relative">
                            <div className="animate-spin h-16 w-16 border-4 border-blue-200 border-t-blue-600 rounded-full" />
                          </div>
                          <div className="text-center space-y-2">
                            <p className="text-lg font-medium text-gray-900">Remembering...</p>
                            <p className="text-sm text-gray-500">Loading your memory</p>
                          </div>
                        </div>
                      ) : (
                        /* Memory Detail */
                        <div className="animate-in fade-in duration-500 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                          {/* Photo */}
                          <div className="relative aspect-video w-full bg-gray-100">
                            <img
                              src={selectedPhoto.src}
                              alt={selectedPhoto.alt}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Memory Context */}
                          <div className="p-8 space-y-6">
                            <div className="space-y-4">
                              <p className="text-lg text-gray-600 leading-relaxed text-center">
                                {photoMemoryContext}
                              </p>
                            </div>

                            <div className="flex justify-center">
                              <button
                                onClick={handleClosePhoto}
                                className="px-8 py-3 bg-gray-100 text-gray-900 rounded-full font-medium hover:bg-gray-200 transition-colors"
                              >
                                Back to Activities
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Main Grid - Hidden when photo is selected */}
                  {!selectedPhoto && (
                    <div className="animate-in fade-in duration-300 grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {/* Daily Tasks */}
                      {renderTodayCard()}

                      {/* Health Notes */}
                      <div className="rounded-lg border border-gray-200 bg-[#fbfbfb]">
                        <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-1.5">
                          <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                          <h2 className="m-0 text-sm font-medium text-gray-900">Health Notes</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {healthTips.map((tip) => (
                            <div
                              key={tip.id}
                              className="group flex items-center gap-3 px-3 py-1.5 hover:bg-[#f0f0f0] transition-colors"
                            >
                              <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
                              <p className="m-0 flex-1 text-sm text-gray-700">
                                {tip.tip}
                              </p>
                              {tip.icon && (
                                <span className="shrink-0 text-sm opacity-60">{tip.icon}</span>
                              )}
                            </div>
                          ))}
                          {healthTips.length === 0 && (
                            <div className="px-3 py-1.5">
                              <p className="m-0 text-sm text-gray-500">No health notes</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Photo Carousel - Hidden when photo is selected */}
                  {!selectedPhoto && memoryPhotos.length > 0 && (
                    <div className="animate-in fade-in duration-300">
                      <div className="mx-auto max-w-2xl">
                        <div className="relative h-[200px] md:h-[220px] overflow-hidden rounded-2xl bg-white mask-[linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
                          <InfiniteMovingCards
                            items={memoryPhotos.map(photo => ({
                              src: photo.photo_path,
                              alt: photo.memory_description
                            }))}
                            direction="right"
                            speed={carouselSpeed}
                            pauseOnHover={true}
                            disabled={isLoadingMemory}
                            className="mask-none"
                            onImageClick={handlePhotoClick}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Latest response & input */}
          {!selectedPhoto && (
            <div className="mt-auto bg-white sticky bottom-0">
              <div className="p-4">
                <div className="max-w-3xl mx-auto">
                  {/* Outer pill container */}
                  <div className="bg-gray-50 rounded-4xl border border-gray-200 shadow-lg overflow-hidden">
                    {/* Assistant response bubble - appears at top of pill */}
                    {displayedAssistantMessage !== null && (
                      <div
                        className={`relative px-6 py-4 transition-all duration-300 ease-in-out ${
                          isAssistantMessageVisible ? "opacity-100 max-h-96" : "opacity-0 max-h-0"
                        }`}
                      >
                        {/* Close button */}
                        <button
                          onClick={handleCloseMessage}
                          className="absolute top-3 right-3 p-1.5 hover:bg-gray-200 rounded-full transition-colors"
                          aria-label="Close message"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                        
                        <div className="space-y-3 pr-8">
                          {displayedShowsTodayCard && (
                            <div className="max-w-xl mx-auto">
                              {renderTodayCard()}
                            </div>
                          )}
                          <p className="text-sm text-gray-600 leading-relaxed text-center">
                            {displayedAssistantMessage}
                          </p>
                          
                          {/* Emergency Call 911 Button */}
                          {isEmergency && (
                            <div className="flex justify-center pt-2">
                              <button
                                onClick={handleCall999}
                                className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-lg transition-all duration-200 hover:shadow-xl animate-pulse"
                              >
                                <Phone className="w-5 h-5" />
                                Call 999
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Divider line when message is shown */}
                    {displayedAssistantMessage !== null && isAssistantMessageVisible && (
                      <div className="px-6">
                        <div className="border-t border-gray-200" />
                      </div>
                    )}

                    {/* Inner pill - chat input */}
                    <div className="p-3">
                      <form onSubmit={handleSubmit} className="relative">
                        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-3 shadow-sm border border-gray-300">
                          <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="What's on your mind?"
                            disabled={isSendingMessage}
                            className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400 disabled:opacity-50"
                          />
                          <button
                            type="button"
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                            aria-label="Voice input"
                            disabled={isSendingMessage}
                          >
                            <Mic className="w-5 h-5 text-gray-500" />
                          </button>
                          <button
                            type="submit"
                            disabled={!inputMessage.trim() || isSendingMessage}
                            className="p-2 bg-[#7777D7] hover:bg-[#6B6BD0] rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Send message"
                          >
                            {isSendingMessage ? (
                              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                              <Send className="w-5 h-5 text-white" />
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function PatientDashboardPage() {
  return (
    <PatientStateProvider>
      <TaskProvider>
        <CopilotKit runtimeUrl="/api/copilotkit">
          <PatientDashboardContent />
        </CopilotKit>
      </TaskProvider>
    </PatientStateProvider>
  );
}
