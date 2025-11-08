import { StateGraph, START, END } from "@langchain/langgraph";
import { PatientStateSchema } from "@/lib/types";
import { memoryAgent } from "./nodes/memoryAgent";
import { supervisorAgent } from "./nodes/supervisorAgent";
import { taskAgent } from "./nodes/taskAgent";
import { healthAgent } from "./nodes/healthAgent";

const graph = new StateGraph(PatientStateSchema);

graph.addNode("memoryAgent", memoryAgent);
graph.addNode("supervisorAgent", supervisorAgent);
graph.addNode("taskAgent", taskAgent);
graph.addNode("healthAgent", healthAgent);

graph.addEdge(START, "memoryAgent");
graph.addEdge("memoryAgent", "supervisorAgent");

graph.addConditionalEdges("supervisorAgent", (state) => {
  switch (state.routeDecision) {
    case "task":
      return "taskAgent";
    case "health":
      return "healthAgent";
    default:
      return END;
  }
});

graph.addEdge("taskAgent", END);
graph.addEdge("healthAgent", END);

export const patientGraph = graph.compile();
