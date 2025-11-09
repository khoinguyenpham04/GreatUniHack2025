import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";
import { InteractionDB, DailyActivityDB } from "@/lib/db";

const model = new ChatOpenAI({ 
  model: "gpt-4o-mini",
  temperature: 0
});

export async function supervisorAgent(state: PatientState): Promise<PatientState> {
  const patientId = 1; // Default patient

  // Get current activities for context
  const currentActivities = DailyActivityDB.getActive(patientId);
  const activitiesList = currentActivities.map((a) => `- ${a.activity}`).join("\n");

  const prompt = `
Classify the patient's input as one of: "task", "health", or "memory".

CURRENT ACTIVITIES:
${activitiesList}

Guidelines:
- "task": If the input is about managing their to-do list:
  * Adding new activities (e.g., "remind me to call Sarah", "add water plants")
  * Removing activities (e.g., "remove the walk", "done with reading")
  * Completing activities (e.g., "I finished calling", "completed the walk")
  * Asking about their tasks (e.g., "what should I do today?")

- "health": If the input mentions health symptoms or concerns:
  * Physical symptoms (e.g., "my head hurts", "I feel dizzy", "my stomach aches")
  * Pain or discomfort (e.g., "I'm in pain", "something hurts")
  * Health changes (e.g., "I don't feel well", "I'm not feeling good")
  * Medical concerns (e.g., "I fell down", "I can't breathe well")
  
- "memory": For everything else:
  * General conversation
  * Questions about people or memories
  * Asking about photos
  * Unclear or confused inputs
  * Greetings or small talk

Input: "${state.input}"

Respond with only one word: task, health, or memory
`;
  
  const result = await model.invoke(prompt);
  const decision = typeof result.content === 'string'
    ? result.content.trim().toLowerCase()
    : String(result.content).trim().toLowerCase();

  // Ensure valid decision
  const validDecision = ['task', 'health', 'memory'].includes(decision) ? decision : 'memory';

  // Log interaction to database for analytics
  InteractionDB.log(patientId, state.input, validDecision);

  return { ...state, routeDecision: validDecision };
}

