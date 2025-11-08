import { StateGraph, START, END } from "@langchain/langgraph";
import { PatientStateSchema } from "@/lib/types";
import { memoryAgent } from "./nodes/memoryAgent";
import { supervisorAgent } from "./nodes/supervisorAgent";
import { taskAgent } from "./nodes/taskAgent";
import { healthAgent } from "./nodes/healthAgent";
import { comfortAgent } from "./nodes/comfortAgent";

const graph = new StateGraph(PatientStateSchema)
  .addNode("memoryAgent", memoryAgent)
  .addNode("supervisorAgent", supervisorAgent)
  .addNode("taskAgent", taskAgent)
  .addNode("healthAgent", healthAgent)
  .addNode("comfortAgent", comfortAgent)
  .addEdge(START, "memoryAgent")
  .addEdge("memoryAgent", "supervisorAgent")
  .addConditionalEdges("supervisorAgent", (state) => {
    switch (state.routeDecision) {
      case "task":
        return "taskAgent";
      case "health":
        return "healthAgent";
      case "comfort":
        return "comfortAgent";
      default:
        return END;
    }
  })
  .addEdge("taskAgent", END)
  .addEdge("healthAgent", END)
  .addEdge("comfortAgent", END);

export const patientGraph = graph.compile();
