import { StateGraph, START, END } from "@langchain/langgraph";
import { PatientStateSchema } from "@/lib/types";
import { memoryAgent } from "./nodes/patient/memoryAgent";
import { supervisorAgent } from "./nodes/patient/supervisorAgent";
import { taskAgent } from "./nodes/patient/taskAgent";

/**
 * Patient Graph - Simplified workflow for dementia patients with supervisor
 * 
 * Flow:
 * 1. Memory Agent: Warm response with photo memory context
 * 2. Supervisor Agent: Intelligently routes based on intent (task vs memory)
 * 3. Task Agent: If task-related, updates daily activities
 * 4. End: Returns complete state with updates
 */
const patientGraphBuilder = new StateGraph(PatientStateSchema)
  .addNode("memoryAgent", memoryAgent)
  .addNode("supervisorAgent", supervisorAgent)
  .addNode("taskAgent", taskAgent)
  .addEdge(START, "memoryAgent")
  .addEdge("memoryAgent", "supervisorAgent")
  .addConditionalEdges("supervisorAgent", (state) => {
    // Route based on supervisor's decision
    if (state.routeDecision === "task") {
      return "taskAgent";
    }
    // Default: end for memory/conversation
    return END;
  })
  .addEdge("taskAgent", END);

export const patientGraph = patientGraphBuilder.compile();

