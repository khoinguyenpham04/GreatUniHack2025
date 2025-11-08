import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

export async function supervisorAgent(state: PatientState): Promise<PatientState> {
  const prompt = `
  Classify the input as one of: "task", "health", "memory".
  Input: "${state.input}"
  `;
  const result = await model.invoke(prompt);
  const decision = typeof result.content === 'string'
    ? result.content.trim().toLowerCase()
    : String(result.content).trim().toLowerCase();
  return { ...state, routeDecision: decision };
}
