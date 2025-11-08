import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "../types";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

export async function healthAgent(state: PatientState): Promise<PatientState> {
  const prompt = `
  Extract any health-related symptoms or issues mentioned in:
  "${state.input}"
  Reply with a short summary only if relevant, else say "None".
  `;

  const result = await model.invoke(prompt);
  const content = result.content.trim();

  if (content.toLowerCase() === "none") return state;

  return {
    ...state,
    healthNotes: [...state.healthNotes, content],
  };
}
