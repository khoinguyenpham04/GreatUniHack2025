import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

export async function healthAgent(state: PatientState): Promise<PatientState> {
  const prompt = `
  Extract any symptoms or health concerns from this input:
  "${state.input}"
  Respond "None" if there are none.
  `;
  const result = await model.invoke(prompt);
  const note = result.content.trim();

  if (note.toLowerCase() === "none") return state;

  return {
    ...state,
    healthNotes: [...state.healthNotes, note],
  };
}
