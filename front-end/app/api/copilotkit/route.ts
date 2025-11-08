import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { patientGraph } from "@/lib/graph";
import { getPatientState, TaskDB, HealthDB, PatientDB } from "@/lib/db";
import { PatientState } from "@/lib/types";

const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4o",
});

const patientId = 1; // Default patient ID

const runtime = new CopilotRuntime({
  actions: [
    {
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
      handler: async ({ taskDescription }: { taskDescription: string }) => {
        // Get current state from database
        const currentState = getPatientState(patientId);
        currentState.input = `Create task: ${taskDescription}`;
        
        // Run through LangGraph agents
        const result = await patientGraph.invoke(currentState);
        
        // Tasks are automatically saved to DB by taskAgent
        const tasks = TaskDB.getActive(patientId);
        
        return {
          success: true,
          task: taskDescription,
          message: `✓ Task created: "${taskDescription}"`,
          state: {
            tasks: tasks.map(t => t.description),
            memoryLog: result.memoryLog,
            healthNotes: result.healthNotes,
          },
        };
      },
    },
    {
      name: "checkHealth",
      description: "Report health symptoms or concerns. The health agent will analyze and track them.",
      parameters: [
        {
          name: "symptom",
          type: "string",
          description: "Health symptom or concern to report",
          required: true,
        },
      ],
      handler: async ({ symptom }: { symptom: string }) => {
        // Get current state from database
        const currentState = getPatientState(patientId);
        currentState.input = symptom;
        currentState.routeDecision = "health";
        
        // Run through LangGraph agents
        const result = await patientGraph.invoke(currentState);
        
        // Health notes are automatically saved to DB by healthAgent
        const healthNotes = HealthDB.getRecent(patientId, 10);
        
        return {
          success: true,
          message: "I've recorded your health concern. Please consult your doctor if needed.",
          healthNotes: healthNotes.map(h => h.note),
          state: {
            tasks: result.tasks,
            memoryLog: result.memoryLog,
            healthNotes: healthNotes.map(h => h.note),
          },
        };
      },
    },
    {
      name: "getTasks",
      description: "Get all tasks from the task list. Use this when the user asks about their tasks, todo list, or what they need to do.",
      parameters: [],
      handler: async () => {
        // Get only tasks from database
        const tasks = TaskDB.getAll(patientId, true);
        
        const activeTasks = tasks.filter(t => !t.completed);
        const completedTasks = tasks.filter(t => t.completed);
        
        return {
          success: true,
          totalTasks: tasks.length,
          activeTasks: activeTasks.length,
          completedTasks: completedTasks.length,
          tasks: tasks.map(t => ({
            id: t.id,
            description: t.description,
            completed: t.completed,
            createdAt: t.created_at,
          })),
          message: activeTasks.length > 0 
            ? `You have ${activeTasks.length} active task${activeTasks.length !== 1 ? 's' : ''}: ${activeTasks.map(t => t.description).join(', ')}`
            : "You don't have any active tasks right now.",
        };
      },
    },
    {
      name: "getPatientInfo",
      description: "Get the patient's profile information (name, age, diagnosis, medications). Use this when asked about the patient's profile or medication schedule.",
      parameters: [],
      handler: async () => {
        // Get fresh data from database
        const profile = PatientDB.getProfile(patientId);
        
        return {
          success: true,
          profile: {
            name: profile?.name,
            age: profile?.age,
            diagnosis: profile?.diagnosis,
            medications: profile?.medications || [],
          },
          message: `Patient: ${profile?.name}, ${profile?.age} years old. Diagnosis: ${profile?.diagnosis}. Medications: ${profile?.medications.join(', ')}`,
        };
      },
    },
  ],
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};

