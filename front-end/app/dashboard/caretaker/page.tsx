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
import { HealthNotesCard } from "@/components/health-notes-card";
import { MemoryLogCard } from "@/components/memory-log-card";
import { useCopilotAction } from "@copilotkit/react-core";
import patientData from "@/lib/patient.json";

function CaretakerDashboardContent() {
  const { addTask } = useTasks();
  const { memoryLog, healthNotes, addMemory, addHealthNote } = usePatientState();

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
              title: "🧠 AI Companion",
              initial: `Hello! I'm your AI companion assistant powered by a multi-agent system.\n\nI can help you with:\n• Creating tasks and reminders\n• Tracking health symptoms\n• Remembering conversations\n• Managing your medication schedule\n\nHow can I help you today?`,
            }}
          >
            <CaretakerDashboardContent />
          </CopilotSidebar>
        </CopilotKit>
      </TaskProvider>
    </PatientStateProvider>
  );
}

