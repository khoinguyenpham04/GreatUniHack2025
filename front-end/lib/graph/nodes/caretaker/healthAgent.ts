import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";
import { HealthDB } from "@/lib/db";

const model = new ChatOpenAI({ model: "gpt-4o-mini" });

export async function healthAgent(state: PatientState): Promise<PatientState> {
  const patientId = 1; // Default patient

  const prompt = `
  Extract any symptoms or health concerns from this input:
  "${state.input}"
  
  Also determine severity level:
  - "high" for severe symptoms (chest pain, difficulty breathing, severe pain, etc.)
  - "medium" for moderate symptoms (persistent headache, dizziness, nausea, etc.)
  - "low" for mild symptoms (slight discomfort, minor aches, etc.)
  
  Respond in this format:
  Symptom: [symptom description]
  Severity: [low|medium|high]
  
  Or respond "None" if there are no health concerns.
  `;
  
  const result = await model.invoke(prompt);
  const response = typeof result.content === 'string' 
    ? result.content.trim() 
    : String(result.content).trim();

  if (response.toLowerCase() === "none") {
    // Get existing health notes from database
    const existingNotes = HealthDB.getRecent(patientId, 10);
    return {
      ...state,
      healthNotes: existingNotes.map((n) => n.note),
    };
  }

  // Parse response to extract symptom and severity
  const symptomMatch = response.match(/Symptom:\s*(.+?)(?:\n|$)/i);
  const severityMatch = response.match(/Severity:\s*(low|medium|high)/i);

  const symptom = symptomMatch ? symptomMatch[1].trim() : response;
  const severity = (severityMatch ? severityMatch[1].toLowerCase() : "low") as "low" | "medium" | "high";

  // Save to database
  HealthDB.add(patientId, symptom, severity);

  // Get all recent health notes from database
  const healthNotes = HealthDB.getRecent(patientId, 10);

  return {
    ...state,
    healthNotes: healthNotes.map((n) => n.note),
  };
}
