import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

export async function memoryAgent(state: PatientState): Promise<PatientState> {
  const prompt = `
  You are a friendly dementia companion.
  Keep conversation simple, warm, and reassuring.
  Input: "${state.input}"
  `;
  const reply = await model.invoke(prompt);

  return {
    ...state,
    memoryLog: [...state.memoryLog, reply.content],
  };
}

