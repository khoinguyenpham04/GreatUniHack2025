import { PatientState } from "@/lib/types";
import { ChatOpenAI } from "@langchain/openai";
import { PatientDB, MemoryDB, MemoryPhotoDB } from "@/lib/db";

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

  // Get memory photos for context
  const memoryPhotos = MemoryPhotoDB.getRandom(patientId, 3);
  const photoContext = memoryPhotos.length > 0
    ? memoryPhotos.map((p) => `Photo: ${p.photo_path} - ${p.memory_description}`).join("\n")
    : "No photo memories available";

  // Construct a structured system prompt with database data
  const systemPrompt = `
You are a compassionate AI companion helping ${profile.name}, a dementia patient.
Your role is to help them remember their life, family, and happy moments.

PATIENT PROFILE:
- Name: ${profile.name}
- Age: ${profile.age}
- Diagnosis: ${profile.diagnosis}

MEMORY PHOTOS (use these to help recall):
${photoContext}

RECENT CONVERSATION:
${memoryContext || "No previous conversation"}

YOUR BEHAVIOR:
- Use simple, warm, and reassuring language
- When they ask about people or events, reference the photo memories above
- Help them feel safe and connected to their memories
- If they seem confused about a memory, gently help them recall using the photo descriptions
- Keep responses short (2-3 sentences maximum)
- Never mention their diagnosis or condition
- Focus on positive memories and familiar people
`;

  const userPrompt = `${profile.name} says: "${input}"

Respond warmly and naturally, helping them recall memories if needed.`;

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
