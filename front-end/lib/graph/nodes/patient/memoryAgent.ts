import { PatientState } from "@/lib/types";
import { ChatOpenAI } from "@langchain/openai";
import { PatientDB, MemoryDB } from "@/lib/db";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.3, // stable and factual
});

export async function memoryAgent(state: PatientState): Promise<PatientState> {
  const { input } = state;
  const patientId = 1; // Default patient

  // Get fresh patient data from database
  const profile = PatientDB.getProfile(patientId);
  if (!profile) {
    throw new Error("Patient profile not found in database");
  }

  // Get recent conversation history from database
  const recentMemories = MemoryDB.getRecent(patientId, 5);
  const memoryContext = recentMemories
    .reverse()
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  // Construct a structured system prompt with database data
  const systemPrompt = `
You are a compassionate AI assistant for dementia patients.
You know this patient's background and always respond simply, clearly, and warmly.

PATIENT PROFILE (from database):
- Name: ${profile.name}
- Age: ${profile.age}
- Diagnosis: ${profile.diagnosis}
- Medications: ${profile.medications.join(", ")}

RECENT CONVERSATION HISTORY:
${memoryContext || "No previous conversation"}

Behavior Guidelines:
- Always ground your answers in the patient's profile.
- If the patient seems confused, reassure them gently.
- Do not hallucinate new medical facts.
- Use short, calm sentences.
- Reference past conversations when relevant.
`;

  const userPrompt = `
The patient said: "${input}"

Your task: Respond naturally, based on the profile and prior conversation history.
`;

  const reply = await model.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  // Save response to database
  const replyContent = typeof reply.content === 'string'
    ? reply.content
    : String(reply.content);

  MemoryDB.add(patientId, input, "user");
  MemoryDB.add(patientId, replyContent, "assistant");
    
  return {
    ...state,
    name: profile.name,
    age: profile.age,
    diagnosis: profile.diagnosis,
    med_schedule: profile.medications,
    memoryLog: [...state.memoryLog, replyContent],
  };
}
