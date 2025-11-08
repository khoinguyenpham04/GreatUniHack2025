import { StateGraph, START, END } from "@langchain/langgraph";
import { memoryAgent } from "./memoryAgent";
import { supervisorAgent } from "./supervisorAgent";
import { taskAgent } from "./taskAgent";
import { healthAgent } from "./healthAgent";
import { PatientState } from "../types";

// 1. Define initial graph
const graph = new StateGraph<PatientState>();

// 2. Add nodes
graph.addNode("memoryAgent", memoryAgent);
graph.addNode("supervisorAgent", supervisorAgent);
graph.addNode("taskAgent", taskAgent);
graph.addNode("healthAgent", healthAgent);

// 3. Add edges
graph.addEdge(START, "memoryAgent");
graph.addEdge("memoryAgent", "supervisorAgent");

// Dynamic branching from supervisor decision
graph.addConditionalEdges("supervisorAgent", (state) => {
  switch (state.routeDecision) {
    case "task": return "taskAgent";
    case "health": return "healthAgent";
    default: return END;
  }
});

graph.addEdge("taskAgent", END);
graph.addEdge("healthAgent", END);

// 4. Compile runnable
export const patientGraph = graph.compile();
