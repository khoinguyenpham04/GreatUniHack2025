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

          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-3xl px-4 py-3 shadow-sm hover:shadow-md transition-shadow">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="How are you doing?"
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
      </SidebarInset>
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
        <CopilotKit runtimeUrl="/api/copilotkit">
          <PatientDashboardContent />
        </CopilotKit>
      </TaskProvider>
    </PatientStateProvider>
  );
}
