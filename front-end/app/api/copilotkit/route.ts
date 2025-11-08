import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { patientGraph } from "@/lib/graph";
import patient from "@/lib/patient.json";
import { PatientState } from "@/lib/types";

const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4o",
});

// Global store for agent state (in production, use a database or Redis)
let globalState: PatientState = {
  name: patient.name,
  age: patient.age,
  diagnosis: patient.diagnosis,
  med_schedule: patient.med_schedule ?? [],
  input: "",
  memoryLog: [],
  tasks: [],
  healthNotes: [],
};

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
        globalState.input = `Create task: ${taskDescription}`;
        globalState.tasks.push(taskDescription);
        
        const result = await patientGraph.invoke(globalState);
        globalState = { ...result };
        
        return {
          success: true,
          task: taskDescription,
          message: `✓ Task created: "${taskDescription}"`,
          state: {
            tasks: globalState.tasks,
            memoryLog: globalState.memoryLog,
            healthNotes: globalState.healthNotes,
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
        globalState.input = symptom;
        globalState.routeDecision = "health";
        
        const result = await patientGraph.invoke(globalState);
        globalState = { ...result };
        
        return {
          success: true,
          message: "I've recorded your health concern. Please consult your doctor if needed.",
          healthNotes: globalState.healthNotes,
          state: {
            tasks: globalState.tasks,
            memoryLog: globalState.memoryLog,
            healthNotes: globalState.healthNotes,
          },
        };
      },
    },
    {
      name: "getPatientInfo",
      description: "Get the patient's profile information and current state",
      parameters: [],
      handler: async () => {
        return {
          profile: {
            name: globalState.name,
            age: globalState.age,
            diagnosis: globalState.diagnosis,
            medications: globalState.med_schedule,
          },
          state: {
            tasks: globalState.tasks,
            memoryLog: globalState.memoryLog,
            healthNotes: globalState.healthNotes,
          },
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

