"use client";

import React from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { TaskProvider, useTasks } from "@/lib/task-context";
import { PatientStateProvider, usePatientState } from "@/lib/state-context";
import { AgentStatusProvider, useAgentStatus } from "@/hooks/use-agent-status";
import { TaskList } from "@/components/task-list";
import { PatientProfileCard } from "@/components/patient-profile-card";
import { HealthNotesCard } from "@/components/health-notes-card";
import { MemoryLogCard } from "@/components/memory-log-card";
import { AgentStatusIndicator } from "@/components/agent-status-indicator";
import { useCopilotAction } from "@copilotkit/react-core";
import patientData from "@/lib/patient.json";
import { Brain, Activity, MessageCircle } from "lucide-react";

function DashboardContent() {
  const { addTask } = useTasks();
  const { memoryLog, healthNotes, addMemory, addHealthNote } = usePatientState();
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
        <div className="flex-1 overflow-y-auto bg-linear-to-br from-slate-50 to-blue-50">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <PatientProfileCard
                  name={patientData.name}
                  age={patientData.age}
                  diagnosis={patientData.diagnosis}
                  medSchedule={patientData.med_schedule}
                  lastMedTime={patientData.last_med_time}
                />
                
                <TaskList />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <MemoryLogCard memories={memoryLog} />
                
                <HealthNotesCard notes={healthNotes} />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm p-6 border border-blue-200">
              <h2 className="text-lg font-semibold mb-4 text-gray-900">
                💡 Try These Commands:
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-4 rounded-lg border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">📋 Tasks</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>"Create a task to take medication at 2pm"</li>
                    <li>"Remind me to call my daughter"</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-100">
                  <p className="font-semibold text-orange-900 mb-2">🏥 Health</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>"I have a headache"</li>
                    <li>"Feeling dizzy today"</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-100">
                  <p className="font-semibold text-purple-900 mb-2">💬 General</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>"What's my medication schedule?"</li>
                    <li>"Tell me about my profile"</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg border border-pink-100">
                  <p className="font-semibold text-pink-900 mb-2">💝 Comfort</p>
                  <ul className="space-y-1 text-gray-700">
                    <li>"I miss Sarah"</li>
                    <li>"I want to see photos of my daughter"</li>
                  </ul>
                </div>
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

export default function Page() {
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
              <DashboardContent />
            </CopilotSidebar>
          </CopilotKit>
        </AgentStatusProvider>
      </TaskProvider>
    </PatientStateProvider>
  );
}
