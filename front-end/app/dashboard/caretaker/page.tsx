"use client";

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
import { TaskList } from "@/components/task-list";
import { PatientProfileCard } from "@/components/patient-profile-card";
import { MedicalHealthNotesCard } from "@/components/medical-health-notes-card";
import { MemoryLogCard } from "@/components/memory-log-card";
import { useCopilotAction } from "@copilotkit/react-core";
import { useEffect, useState } from "react";

interface CaretakerData {
  profile: {
    name: string;
    age: number;
    diagnosis: string;
    medications: string[];
  };
  tasks: Array<{
    id: number;
    description: string;
    completed: number;
    created_at: string;
  }>;
  memoryLogs: Array<{
    content: string;
    role: string;
    created_at: string;
  }>;
  healthNotes: Array<{
    id: number;
    note: string;
    severity: string;
    created_at: string;
  }>;
}

function CaretakerDashboardContent() {
  const { addTask } = useTasks();
  const { memoryLog, healthNotes, addMemory, addHealthNote } = usePatientState();
  const [caretakerData, setCaretakerData] = useState<CaretakerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch caretaker data from API
  useEffect(() => {
    async function fetchCaretakerData() {
      try {
        const response = await fetch("/api/db/caretaker-data");
        const result = await response.json();
        if (result.success) {
          setCaretakerData(result.data);
        }
      } catch (error) {
        console.error("Error fetching caretaker data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCaretakerData();
  }, []);

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

  if (isLoading) {
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
          <div className="flex-1 overflow-y-auto bg-linear-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto p-6 flex items-center justify-center min-h-screen">
              <div className="text-center">
                <div className="animate-spin h-12 w-12 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" />
                <p className="text-gray-600">Loading caretaker dashboard...</p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
        <div className="flex-1 overflow-y-auto bg-linear-to-br from-slate-50 to-blue-50">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Main Grid - 2x2 Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Row: Patient Profile and Tasks */}
              <PatientProfileCard
                name={caretakerData?.profile.name || "Loading..."}
                age={caretakerData?.profile.age || 0}
                diagnosis={caretakerData?.profile.diagnosis || "Loading..."}
                medSchedule={caretakerData?.profile.medications || []}
                lastMedTime="Not recorded"
              />
              
              <TaskList />
            </div>

            {/* Second Row: Conversation Memory and Medical Health Notes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MemoryLogCard 
                memories={caretakerData?.memoryLogs.map(log => log.content) || []} 
              />
              
              <MedicalHealthNotesCard 
                notes={caretakerData?.healthNotes || []} 
              />
            </div>

            {/* Instructions */}
            <div className="bg-linear-to-r from-blue-50 to-purple-50 rounded-lg shadow-sm p-6">
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
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function CaretakerPage() {
  return (
    <PatientStateProvider>
      <TaskProvider>
        <CopilotKit runtimeUrl="/api/copilotkit">
          <CopilotSidebar
            defaultOpen={false}
            labels={{
              title: "👩‍⚕️ Care Companion",
              initial: `Hello! I'm your AI care assistant, here to help you manage and understand your patient.\n\nI can assist you with:\n• Reviewing patient health updates and notes\n• Summarizing recent activities or behavior changes\n• Setting reminders for medication or appointments\n• Answering questions about the patient’s history and routines\n\nHow would you like to assist your patient today?`,
            }}
          >
            <CaretakerDashboardContent />
          </CopilotSidebar>
        </CopilotKit>
      </TaskProvider>
    </PatientStateProvider>
  );
}

