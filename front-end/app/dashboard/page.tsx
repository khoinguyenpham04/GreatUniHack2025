"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { CopilotKit, useCopilotReadable } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { TaskProvider, useTasks } from "@/lib/task-context";
import { PatientStateProvider, usePatientState } from "@/lib/state-context";
import { AgentStatusProvider, useAgentStatus } from "@/hooks/use-agent-status";
import { TaskList } from "@/components/task-list";
import { PatientProfileCard } from "@/components/patient-profile-card";
import { HealthNotesCard } from "@/components/health-notes-card";
import { MemoryLogCard } from "@/components/memory-log-card";
import { AgentStatusIndicator } from "@/components/agent-status-indicator";
import patientData from "@/lib/patient.json";
import { Send, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

function PatientDashboardContent() {
  const [inputMessage, setInputMessage] = useState("");
  const { tasks, addTask } = useTasks();
  const { memoryLog, healthNotes, addMemory, addHealthNote } = usePatientState();
  const [dailyActivities, setDailyActivities] = useState<Array<{ id: number; activity: string; icon: string }>>([]);
  const [healthTips, setHealthTips] = useState<Array<{ id: number; tip: string; icon: string }>>([]);
  const [carouselSpeed, setCarouselSpeed] = useState<"fast" | "normal" | "slow">("normal");

  // Fetch daily activities and health tips
  useEffect(() => {
    async function fetchPatientData() {
      try {
        const response = await fetch('/api/db/patient-data');
        const result = await response.json();
        if (result.success) {
          setDailyActivities(result.data.dailyActivities);
          setHealthTips(result.data.healthTips);
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

  // Make patient data readable to CopilotKit
  useCopilotReadable({
    description: "Patient profile information",
    value: patientData,
  });
  const { currentAgent, isProcessing, setAgent, setProcessing, reset } = useAgentStatus();

  // Poll for active agent session state
  React.useEffect(() => {
    const pollSession = async () => {
      try {
        const response = await fetch('/api/session');
        const data = await response.json();
        
        if (data.success && data.activeAgent) {
          setAgent(data.activeAgent);
        } else if (data.success && !data.activeAgent) {
          reset(); // Clear UI if no active agent
        }
      } catch (error) {
        console.error("Error polling session:", error);
      }
    };

    // Poll every 2 seconds
    const interval = setInterval(pollSession, 2000);
    
    // Initial poll
    pollSession();

    return () => clearInterval(interval);
  }, [setAgent, reset]);

  // Remove client-side action handlers; rely on server-side actions via CopilotKit runtime

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      // Handle message submission
      console.log("Message:", inputMessage);
      setInputMessage("");
    }
  };

  return (
    <SidebarProvider
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
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-4 space-y-4">
              {/* Greeting Header */}
              <div className="py-2 text-center">
                <h1 className="text-2xl font-light text-gray-900">
                  Hey, {patientData.name.split(' ')[0]}
                </h1>
              </div>

              {/* Main Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 max-w-3xl mx-auto">
                {/* Daily Tasks */}
                <div className="rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-1.5">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    <h2 className="m-0 text-sm font-medium text-gray-900">Today</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {dailyActivities.map((activity) => (
                      <div 
                        key={activity.id} 
                        className="group flex items-center gap-3 px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <p className="m-0 flex-1 text-sm font-medium text-gray-900">
                          {activity.activity}
                        </p>
                        {activity.icon && (
                          <span className="shrink-0 text-sm opacity-60">{activity.icon}</span>
                        )}
                      </div>
                    ))}
                    {dailyActivities.length === 0 && (
                      <div className="px-3 py-1.5">
                        <p className="m-0 text-sm text-gray-500">No tasks for today</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Health Notes */}
                <div className="rounded-lg border border-gray-200 bg-white">
                  <div className="flex items-center gap-2 border-b border-gray-200 px-3 py-1.5">
                    <div className="h-2 w-2 shrink-0 rounded-full bg-green-500" />
                    <h2 className="m-0 text-sm font-medium text-gray-900">Health Notes</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {healthTips.map((tip) => (
                      <div 
                        key={tip.id} 
                        className="group flex items-center gap-3 px-3 py-1.5 hover:bg-gray-50 transition-colors"
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

              {/* Photo Carousel */}
              <div className="max-w-3xl mx-auto">
                <div className="h-[200px] md:h-[220px] rounded-lg flex flex-col antialiased bg-white items-center justify-center relative overflow-hidden mask-[linear-gradient(to_right,transparent,white_10%,white_90%,transparent)]">
                  <InfiniteMovingCards
                    items={memoryImages}
                    direction="right"
                    speed={carouselSpeed}
                    pauseOnHover={true}
                    className="mask-none"
                  />
                </div>
                
              
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="mt-2 flex flex-col w-full">
            {/* Messages list */}
            <div className="flex-1 overflow-y-auto px-6 pb-2" id="chat-scroll-container">
              <div className="max-w-4xl mx-auto space-y-3">
                {memoryLog.map((m, idx) => (
                  <div
                    key={idx}
                    className="w-fit max-w-[80%] rounded-xl px-4 py-2 text-sm leading-relaxed shadow-sm border border-gray-200 bg-slate-50"
                  >
                    {m.replace(/^\[COMFORT\]\s*/,'')}
                  </div>
                ))}
                {memoryLog.length === 0 && (
                  <p className="text-xs text-gray-400">No messages yet. Try saying "I miss Sarah".</p>
                )}
              </div>
            </div>
            {/* Input bar (sticky) */}
            <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0">
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-3xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Voice input"
                    >
                      <Mic className="w-5 h-5 text-gray-500" />
                    </button>
                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Send message"
                    >
                      <Send className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      
      {/* Agent Status Indicator */}
      <AgentStatusIndicator agent={currentAgent} isProcessing={isProcessing} />
    </SidebarProvider>
  );
}

const memoryImages = [
  {
    src: "/mary-neighbor-with-their-grandchild.png",
    alt: "Met my neighbor's grandchild today. Such a sweet little one.",
  },
  {
    src: "/linda-and-her-bestfriend.jpg",
    alt: "Linda brought her best friend over after school. They were inseparable.",
  },
  {
    src: "/mary-and-her-daughter-Stacy-and-Linda-her-grandchild.jpg",
    alt: "Sunday brunch with Stacy and Linda. My two favorite girls.",
  },
  {
    src: "/mary-neighbor-with-their-grandchild.png",
    alt: "The kids played in the garden all afternoon. Their laughter filled the house.",
  },
];

export default function PatientDashboardPage() {
  return (
    <PatientStateProvider>
      <TaskProvider>
        <AgentStatusProvider>
          <CopilotKit runtimeUrl="/api/copilotkit">
            <CopilotSidebar
              defaultOpen={false}
              instructions={`CRITICAL SYSTEM INSTRUCTIONS:

For EVERY user message, you MUST follow this process:
1. ALWAYS call the "processMessage" action FIRST before responding
2. Wait for the action result
3. Relay the action result to the user
4. DO NOT generate your own response - use the processMessage result

The processMessage action routes messages through specialized agents:
- Comfort Agent (💝): Family, loved ones, emotions, loneliness
- Task Agent (📋): Reminders, schedules, appointments  
- Health Agent (🏥): Symptoms, pain, health concerns
- Memory Agent (💭): General conversation

NEVER respond directly. ALWAYS use processMessage action.`}
              labels={{
                title: "🧠 AI Companion",
                initial: `Hello! I'm your AI companion assistant powered by a multi-agent system.\n\nI can help you with:\n• 💝 Comfort - Connect with loved ones\n• 📋 Tasks - Reminders and schedules\n• 🏥 Health - Track symptoms\n• 💭 Memory - Remember conversations\n\nHow can I help you today?`,
              }}
            >
              <PatientDashboardContent />
            </CopilotSidebar>
          </CopilotKit>
        </AgentStatusProvider>
      </TaskProvider>
    </PatientStateProvider>
  );
}
