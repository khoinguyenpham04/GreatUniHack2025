import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";
import { InteractionDB } from "@/lib/db";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

export async function supervisorAgent(state: PatientState): Promise<PatientState> {
  const patientId = 1; // Default patient

  const prompt = `
  Classify the input as one of: "task", "health", "memory".
  
  Guidelines:
  - "task": If the input is about creating reminders, to-dos, medication schedules, appointments
  - "health": If the input mentions symptoms, pain, discomfort, feeling unwell
  - "memory": For general conversation, questions about profile, or unclear inputs
  
  Input: "${state.input}"
  
  Respond with only one word: task, health, or memory
  `;
  
  const result = await model.invoke(prompt);
  const decision = typeof result.content === 'string'
    ? result.content.trim().toLowerCase()
    : String(result.content).trim().toLowerCase();

  // Log interaction to database
  InteractionDB.log(patientId, state.input, decision);

  return { ...state, routeDecision: decision };
}
