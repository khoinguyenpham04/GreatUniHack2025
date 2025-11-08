import { PatientState } from "@/lib/types";
import { PatientDB, TaskDB, MedicationDB } from "@/lib/db";

export async function taskAgent(state: PatientState): Promise<PatientState> {
  const patientId = 1; // Default patient

  // Get patient profile and medications from database
  const profile = PatientDB.getProfile(patientId);
  if (!profile) {
    throw new Error("Patient profile not found in database");
  }

  const medications = MedicationDB.getAll(patientId);
  
  // Create medication reminders if input suggests task creation
  if (state.input.toLowerCase().includes("medication") || 
      state.input.toLowerCase().includes("medicine") ||
      state.input.toLowerCase().includes("med")) {
    
    // Create reminder tasks for each medication
    for (const med of medications) {
      const taskDescription = `Take ${med.medication_name} at ${med.schedule_time}`;
      TaskDB.create(patientId, taskDescription);
    }

    // Update medication log
    MedicationDB.updateAllTaken(patientId);
  }

  // Get all active tasks from database
  const activeTasks = TaskDB.getActive(patientId);
  const taskDescriptions = activeTasks.map((t) => t.description);

  return {
    ...state,
    tasks: taskDescriptions,
  };
}
