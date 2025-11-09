import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";
import { HealthDB } from "@/lib/db";

const model = new ChatOpenAI({ 
  model: "gpt-4o-mini",
  temperature: 0.2 
});

export async function healthAgent(state: PatientState): Promise<PatientState> {
  const patientId = 1; // Default patient

  const prompt = `
You are a caring health assistant helping a patient with Alzheimer's document their health concerns.

Extract any symptoms or health concerns from this input:
"${state.input}"

Also determine severity level:
- "high" for severe symptoms (chest pain, difficulty breathing, severe pain, confusion, falls)
- "medium" for moderate symptoms (persistent headache, dizziness, nausea, appetite changes)
- "low" for mild symptoms (slight discomfort, minor aches, feeling tired)

Respond in this format:
Symptom: [clear, simple description of the symptom]
Severity: [low|medium|high]

Or respond "None" if there are no health concerns.
`;
  
  const result = await model.invoke(prompt);
  const response = typeof result.content === 'string' 
    ? result.content.trim() 
    : String(result.content).trim();

  let confirmationMessage = "";

  if (response.toLowerCase() === "none") {
    // Get existing health notes from database
    const existingNotes = HealthDB.getRecent(patientId, 10);
    confirmationMessage = "I've noted that down. Your caretaker will be informed.";
    
    return {
      ...state,
      healthNotes: existingNotes.map((n) => n.note),
      memoryLog: [...state.memoryLog, confirmationMessage],
      isEmergency: false,
    };
  }

  // Parse response to extract symptom and severity
  const symptomMatch = response.match(/Symptom:\s*(.+?)(?:\n|$)/i);
  const severityMatch = response.match(/Severity:\s*(low|medium|high)/i);

  const symptom = symptomMatch ? symptomMatch[1].trim() : response;
  const severity = (severityMatch ? severityMatch[1].toLowerCase() : "low") as "low" | "medium" | "high";

  // Save to database
  HealthDB.add(patientId, symptom, severity);

  // Create patient-friendly confirmation message
  if (severity === "high") {
    confirmationMessage = "I've recorded your health concern. This is important - please let your caretaker or doctor know right away.";
  } else if (severity === "medium") {
    confirmationMessage = "I've noted your health concern. Your caretaker will be informed. If it gets worse, please tell someone.";
  } else {
    confirmationMessage = "I've recorded that for you. Your caretaker will see this note.";
  }

  // Get all recent health notes from database
  const healthNotes = HealthDB.getRecent(patientId, 10);

  return {
    ...state,
    healthNotes: healthNotes.map((n) => n.note),
    memoryLog: [...state.memoryLog, confirmationMessage],
    isEmergency: severity === "high", // Flag emergency for high-priority concerns
  };
}
