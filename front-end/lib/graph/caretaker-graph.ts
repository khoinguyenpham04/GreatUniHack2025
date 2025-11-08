import { StateGraph, START, END } from "@langchain/langgraph";
import { PatientStateSchema } from "@/lib/types";
import { memoryAgent } from "./nodes/caretaker/memoryAgent";
import { supervisorAgent } from "./nodes/caretaker/supervisorAgent";
import { taskAgent } from "./nodes/caretaker/taskAgent";
import { healthAgent } from "./nodes/caretaker/healthAgent";

/**
 * Caretaker Graph - Full multi-agent workflow for healthcare professionals
 * 
 * Flow:
 * 1. Memory Agent: Initial compassionate response with patient context
 * 2. Supervisor Agent: Routes to appropriate specialized agent
 * 3. Specialized Agents:
 *    - Task Agent: Medication reminders, caretaker tasks
 *    - Health Agent: Symptom tracking, health notes with severity
 * 4. End: Returns complete state
 */
const caretakerGraphBuilder = new StateGraph(PatientStateSchema)
  .addNode("memoryAgent", memoryAgent)
  .addNode("supervisorAgent", supervisorAgent)
  .addNode("taskAgent", taskAgent)
  .addNode("healthAgent", healthAgent)
  .addEdge(START, "memoryAgent")
  .addEdge("memoryAgent", "supervisorAgent")
  .addConditionalEdges("supervisorAgent", (state) => {
    switch (state.routeDecision) {
      case "task":
        return "taskAgent";
      case "health":
        return "healthAgent";
      default:
        return END;
    }
  })
  .addEdge("taskAgent", END)
  .addEdge("healthAgent", END);

export const caretakerGraph = caretakerGraphBuilder.compile();

