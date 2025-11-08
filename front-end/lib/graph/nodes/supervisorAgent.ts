import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

export async function supervisorAgent(state: PatientState): Promise<PatientState> {
  const prompt = `
You are a routing classifier. 
Your ONLY task is to decide which agent should handle the user's input.

There are three possible categories:
- "task" → when the input is about reminders, schedules, to-dos, or requests for actions.  
- "health" → when the input mentions symptoms, medication, wellbeing, or medical information.  
- "memory" → when the input involves recalling or storing past events, personal details, or general conversation.

Rules:
1. You MUST return exactly one of: task, health, or memory.
2. If the input could fit more than one, pick the one that fits best — do NOT say “both” or “unsure”.
3. Output ONLY the single label, in lowercase, with no explanation.

User input: "${state.input}"
`;

  const result = await model.invoke(prompt);
  const decision = result.content[0]?.text?.trim().toLowerCase() ?? "memory"; // fallback

  return { ...state, routeDecision: decision };
}
