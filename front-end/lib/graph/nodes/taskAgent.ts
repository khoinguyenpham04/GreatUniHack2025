import { callMCP } from "@/lib/mcp/client";
import { PatientState } from "@/lib/types";

export async function taskAgent(state: PatientState): Promise<PatientState> {
  const patient = await callMCP("getPatientMemory");
  const reminder = `Reminder: ${patient.med_schedule.join(", ")}.`;

  await callMCP("updateMedicationLog");

  return {
    ...state,
    tasks: [...state.tasks, reminder],
  };
}
