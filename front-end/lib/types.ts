import { z } from "zod";

export const PatientStateSchema = z.object({
  // 🔹 Patient profile information (formerly PatientProfile)
  name: z.string(),
  age: z.number(),
  diagnosis: z.string(),
  med_schedule: z.array(z.string()),

  // 🔹 Dynamic / evolving state fields
  input: z.string(),
  memoryLog: z.array(z.string()),
  tasks: z.array(z.string()),
  healthNotes: z.array(z.string()),

  routeDecision: z.string().optional(),
  
  // 🎯 Comfort agent data (optional)
  comfortData: z.any().optional(),
  
  // 🎯 Conversation history for stateful sessions
  conversationHistory: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
});

export type PatientState = z.infer<typeof PatientStateSchema>;
