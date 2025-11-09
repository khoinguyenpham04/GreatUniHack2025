import { z } from "zod";

// Medication object schema
export const MedicationSchema = z.object({
  medication: z.string(),
  dosage: z.string(),
  days: z.array(z.string()),
  times: z.array(z.string()),
});

export type Medication = z.infer<typeof MedicationSchema>;

export const PatientStateSchema = z.object({
  // 🔹 Patient profile information (formerly PatientProfile)
  name: z.string(),
  age: z.number(),
  diagnosis: z.string(),
  med_schedule: z.array(z.string()), // Agents still use string format internally

  // 🔹 Dynamic / evolving state fields
  input: z.string(),
  memoryLog: z.array(z.string()),
  tasks: z.array(z.string()),
  healthNotes: z.array(z.string()),

  routeDecision: z.string().optional(),
  isEmergency: z.boolean().optional(), // Flag for high-priority health concerns
});

export type PatientState = z.infer<typeof PatientStateSchema>;
