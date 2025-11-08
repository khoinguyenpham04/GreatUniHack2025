import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "../types";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

export async function supervisorAgent(state: PatientState): Promise<PatientState> {
  const prompt = `
  You are a routing supervisor.
  Decide if the input relates to "tasks", "health", or just "conversation".
  Input: "${state.input}"
  Respond with exactly one word: "task", "health", or "memory".
  `;

  const result = await model.invoke(prompt);
  const routeDecision = result.content.trim().toLowerCase();

  return { ...state, routeDecision };
}
