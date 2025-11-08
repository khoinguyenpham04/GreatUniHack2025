import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "../types";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  apiKey: process.env.OPENAI_API_KEY,
});

export async function memoryAgent(state: PatientState): Promise<PatientState> {
  const prompt = `
  You are a friendly conversational agent for a dementia patient.
  Respond warmly, keeping conversation simple and reassuring.
  Input: "${state.input}"
  Return only the text you would say.
  `;

  const reply = await model.invoke(prompt);

  return {
    ...state,
    memoryLog: [...state.memoryLog, reply.content],
  };
}
