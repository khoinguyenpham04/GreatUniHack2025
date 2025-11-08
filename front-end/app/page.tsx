"use client";

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

function HomeContent() {
  const { addTask } = useTasks();
  const { memoryLog, healthNotes, addMemory, addHealthNote } = usePatientState();
  const { currentAgent, isProcessing } = useAgentStatus();

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
      addTask(taskDescription);
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

  // Action: Process general messages through multi-agent system
  useCopilotAction({
    name: "processMessage",
    description: `Use this for messages about family, emotions, or general conversation. Examples: "I miss Sarah", "I feel lonely", "where is my daughter"`,
    parameters: [
      {
        name: "userMessage",
        type: "string",
        description: "The user's message",
        required: true,
      },
    ],
    handler: async ({ userMessage }) => {
      // This will call the backend action
      return userMessage;
    },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-linear-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Brain className="h-10 w-10 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                Dementia Companion System
              </h1>
            </div>
            <p className="text-lg text-gray-600">
              Multi-Agent AI Assistant powered by LangGraph
            </p>
            <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>4 Active Agents</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>Real-time Processing</span>
              </div>
            </div>
          </div>

          {/* Agent Architecture Info */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">
              🤖 Multi-Agent System Architecture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-1">Memory Agent</h3>
                <p className="text-xs text-blue-700">
                  Compassionate responses using patient profile
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-1">Supervisor Agent</h3>
                <p className="text-xs text-purple-700">
                  Routes inputs: task, health, or memory
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-900 mb-1">Task Agent</h3>
                <p className="text-xs text-green-700">
                  Creates medication reminders via MCP
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-orange-900 mb-1">Health Agent</h3>
                <p className="text-xs text-orange-700">
                  Extracts and tracks health concerns
                </p>
              </div>
            </div>
          </div>

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
      
      {/* Agent Status Indicator */}
      <AgentStatusIndicator agent={currentAgent} isProcessing={isProcessing} />
    </div>
  );
}

export default function HomePage() {
  return (
    <PatientStateProvider>
      <TaskProvider>
        <AgentStatusProvider>
          <CopilotKit runtimeUrl="/api/copilotkit">
            <CopilotSidebar
              defaultOpen={true}
              labels={{
                title: "🧠 AI Companion",
                initial: `Hello! I'm your AI companion assistant powered by a multi-agent system.\n\nI can help you with:\n• 💝 Comfort - Connect with loved ones\n• 📋 Tasks - Reminders and schedules\n• 🏥 Health - Track symptoms\n• 💭 Memory - Remember conversations\n\nHow can I help you today?`,
              }}
            >
              <HomeContent />
            </CopilotSidebar>
          </CopilotKit>
        </AgentStatusProvider>
      </TaskProvider>
    </PatientStateProvider>
  );
}
