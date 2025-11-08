import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";
import { InteractionDB } from "@/lib/db";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

export async function supervisorAgent(state: PatientState): Promise<PatientState> {
  const patientId = 1; // Default patient
  const input = state.input.toLowerCase();

  // KEYWORD-BASED ROUTING (override AI if keywords match)
  const comfortKeywords = [
    'miss', 'missing', 'lonely', 'sad', 'family', 'relative', 'loved one',
    'daughter', 'son', 'grandchild', 'grandson', 'granddaughter', 'spouse',
    'wife', 'husband', 'mother', 'father', 'sister', 'brother',
    'photo', 'picture', 'voice', 'call', 'see them', 'hear them',
    'sarah', 'michael', 'emma' // Specific loved ones from database
  ];
  
  const hasComfortKeyword = comfortKeywords.some(keyword => input.includes(keyword));
  
  if (hasComfortKeyword) {
    console.log(`🎯 Supervisor KEYWORD MATCH → COMFORT (keyword found in: "${state.input}")`);
    InteractionDB.log(patientId, state.input, 'comfort');
    return { ...state, routeDecision: 'comfort' };
  }

  const prompt = `
You are routing patient inputs for a dementia patient to the correct specialized agent.

AGENTS AND THEIR TRIGGERS:

🎯 "comfort" - PRIORITIZE THESE (emotional/social needs):
- Missing family, friends, or loved ones ("I miss...", "I want to see...", "Where is...")
- Feeling lonely, sad, or emotionally distressed
- Asking about relatives, family members, or relationships
- Wanting to see photos, hear voices, or call someone
- Mentions of: daughter, son, grandchild, spouse, family, relatives, loved ones
- Examples: "I miss my daughter", "I feel lonely", "Who is this person?", "I want to see photos"

💊 "task" - Practical reminders and schedules:
- Medication reminders and schedules
- Appointments, calendar events
- Daily routines, to-do lists
- Examples: "remind me to take medicine", "what's my schedule?"

🏥 "health" - Physical health concerns:
- Physical symptoms, pain, discomfort
- Medical concerns, illness
- Mood tracking related to health
- Examples: "my head hurts", "I feel sick", "I'm in pain"

💭 "memory" - Everything else:
- General conversation
- Questions about self or surroundings
- Unclear inputs that don't fit above categories

CRITICAL: If input mentions family/loved ones OR loneliness/sadness → ALWAYS route to "comfort"

Input: "${state.input}"

Respond with ONLY ONE WORD: comfort, task, health, or memory
  `.trim();
  
  const result = await model.invoke(prompt);
  const content = typeof result.content === 'string'
    ? result.content
    : Array.isArray(result.content)
      ? result.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("")
      : String(result.content);

  const decision = content.trim().toLowerCase();
  
  // Validate decision - default to memory if invalid
  const validDecision = ["task", "health", "comfort", "memory"].includes(decision)
    ? decision
    : "memory";

  // Log interaction to database
  InteractionDB.log(patientId, state.input, validDecision);

  console.log(`🎯 Supervisor AI routing "${state.input}" → ${validDecision.toUpperCase()}`);

  return { ...state, routeDecision: validDecision };
}
