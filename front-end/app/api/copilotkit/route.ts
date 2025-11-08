import {
  CopilotRuntime,
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { patientGraph } from "@/lib/graph";
import { getPatientState, TaskDB, HealthDB, PatientDB } from "@/lib/db";
import { PatientState } from "@/lib/types";

const patientId = 1; // Default patient ID

const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4o",
})

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
    {
      name: "processMessage",
      description: `CRITICAL: Use this action for ANY message about:
- Family, loved ones, missing someone (e.g., "I miss Sarah", "where is my daughter")
- Emotions: lonely, sad, happy, confused
- General conversation that doesn't fit other specific actions
- Questions about people, relationships, or feelings
This routes through our multi-agent system (comfort/task/health/memory agents).`,
      parameters: [
        {
          name: "userMessage",
          type: "string",
          description: "The exact user message to process",
          required: true,
        },
      ],
  handler: async ({ userMessage }: { userMessage: string }) => {
        console.log(`\n💬 processMessage action called with: "${userMessage}"\n`);
        
        try {
          // Import SessionManager
          const { SessionManager } = await import("@/lib/session-manager");
          
          // Add user message to session
          SessionManager.addMessage(patientId, 'user', userMessage);
          
          // Get session and conversation history
          const session = SessionManager.getSession(patientId);
          const dbState = getPatientState(patientId);
          
          const initialState: PatientState = {
            ...dbState,
            input: userMessage,
            conversationHistory: session.conversationHistory,
          };

          const result = await patientGraph.invoke(initialState);
          console.log(`✅ Graph completed - Route: ${result.routeDecision}, Active agent: ${session.activeAgent}`);

          // Extract response from memoryLog
          const latestLog = result.memoryLog?.[result.memoryLog.length - 1] || "";
          const responseMatch = latestLog.match(/Response: (.+)$/);
          let responseText = responseMatch ? responseMatch[1] : "I'm here to help. How can I assist you?";
          
          // Add agent indicator
          const agentEmoji = {
            comfort: '💝',
            task: '📋',
            health: '🏥',
            memory: '💭'
          }[result.routeDecision || 'memory'] || '💭';
          
          responseText = `${agentEmoji} ${responseText}`;
          
          // Format comfort data if present (include URLs for media)
          if (result.comfortData) {
            const { lovedOne, photos, audio, callSuggestion } = result.comfortData as any;

            if (lovedOne) {
              responseText += `\n\n👤 ${lovedOne.name} (your ${lovedOne.relationship})`;
              if (lovedOne.phone_number) {
                responseText += `\n📞 ${lovedOne.phone_number}`;
              }
            }

            if (photos && photos.length > 0) {
              responseText += `\n\n📸 Photos:`;
              photos.forEach((p: any, idx: number) => {
                const url = p.path || p.photo_path;
                responseText += `\n${idx + 1}. ${p.description || 'Photo'} → ${url}`;
              });
            }

            if (audio && audio.length > 0) {
              responseText += `\n\n🎵 Audio messages:`;
              audio.forEach((a: any, idx: number) => {
                const url = a.path || a.audio_path;
                responseText += `\n${idx + 1}. ${a.description || 'Message'} (${a.duration || '?'}s) → ${url}`;
              });
            }

            if (callSuggestion) {
              responseText += `\n\n💡 Would you like to call ${lovedOne?.name || 'them'}?`;
            }
          }
          
          // Add assistant response to session
          SessionManager.addMessage(patientId, 'assistant', responseText);

          // Return plain string so CopilotKit displays the message directly
          return responseText;
        } catch (error) {
          console.error("❌ Error in processMessage:", error);
          return {
            success: false,
            message: "I'm having trouble processing that right now. Could you try again?",
          };
        }
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

