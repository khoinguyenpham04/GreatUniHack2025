import { PatientState } from "@/lib/types";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.3, // stable and factual
});

export async function memoryAgent(state: PatientState): Promise<PatientState> {
  const { input, name, age, diagnosis, med_schedule } = state;

  // Construct a structured system prompt
  const systemPrompt = `
You are a compassionate AI assistant for dementia patients.
You know this patient's background and always respond simply, clearly, and warmly.

PATIENT PROFILE:
- Name: ${name}
- Age: ${age}
- Diagnosis: ${diagnosis}
- Medications: ${med_schedule.join(", ")}

Behavior Guidelines:
- Always ground your answers in the patient’s profile.
- If the patient seems confused, reassure them gently.
- Do not hallucinate new medical facts.
- Use short, calm sentences.
`;

  const userPrompt = `
The patient said: "${input}"

Your task: Respond naturally, based on the profile and prior memoryLog.
`;

  const reply = await model.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  // Append response to memory log
  return {
    ...state,
    memoryLog: [...state.memoryLog, reply.content],
  };
}
