export interface PatientProfile {
  name: string;
  age: number;
  diagnosis: string;
  med_schedule: string[];
}

export interface PatientState {
  input: string;
  memoryLog: string[];
  tasks: string[];
  healthNotes: string[];
  patientProfile: PatientProfile;
  routeDecision?: string;
}

import { z } from "zod";

export const PatientStateSchema = z.object({
  input: z.string(),
  memoryLog: z.array(z.string()),
  tasks: z.array(z.string()),
  healthNotes: z.array(z.string()),
  patientProfile: z.object({
    name: z.string(),
    age: z.number(),
    diagnosis: z.string(),
    med_schedule: z.array(z.string()),
  }),
  routeDecision: z.string().optional(),
});

export type PatientState = z.infer<typeof PatientStateSchema>;
