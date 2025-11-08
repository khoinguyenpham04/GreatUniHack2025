import { StateGraph, START, END } from "@langchain/langgraph";
import { PatientStateSchema } from "@/lib/types";
import { memoryAgent } from "./nodes/patient/memoryAgent";
import { taskAgent } from "./nodes/patient/taskAgent";
import { ChatOpenAI } from "@langchain/openai";

const routerModel = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

/**
 * Simple router for patient dashboard
 * Routes to either memory agent (default) or task agent (for activity management)
 */
async function routePatientInput(state: any) {
  const input = state.input.toLowerCase();
  
  // Simple keyword-based routing for patient interface
  const taskKeywords = ['task', 'to-do', 'todo', 'activity', 'activities', 'add', 'remove', 'delete', 'complete'];
  
  // Check if input is about managing tasks/activities
  const isTaskRelated = taskKeywords.some(keyword => input.includes(keyword));
  
  if (isTaskRelated) {
    return "taskAgent";
  }
  
  // Default: route to memory agent for conversation and memory recall
  return "memoryAgent";
}

/**
 * Patient Graph - Simplified workflow for dementia patients
 * 
 * Flow:
 * 1. Start with memory agent (for warm, personal responses with photo context)
 * 2. Check if task-related → route to task agent
 * 3. Otherwise → stay with memory agent for conversation
 */
const patientGraphBuilder = new StateGraph(PatientStateSchema)
  .addNode("memoryAgent", memoryAgent)
  .addNode("taskAgent", taskAgent)
  .addEdge(START, "memoryAgent")
  .addConditionalEdges("memoryAgent", async (state) => {
    const route = await routePatientInput(state);
    if (route === "taskAgent") {
      return "taskAgent";
    }
    return END;
  })
  .addEdge("taskAgent", END);

export const patientGraph = patientGraphBuilder.compile();

