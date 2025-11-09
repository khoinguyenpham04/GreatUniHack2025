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
      const daysStr = med.days_of_week.split(',').join(', ');
      const taskDescription = `Give ${med.medication_name} ${med.dosage} at ${med.schedule_time} (${daysStr})`;
      TaskDB.create(patientId, taskDescription);
    }

    // Update medication log
    MedicationDB.updateAllTaken(patientId);
  } else {
    // Create a general task based on the input
    TaskDB.create(patientId, state.input);
  }

  // Get all active tasks from database
  const activeTasks = TaskDB.getActive(patientId);
  const taskDescriptions = activeTasks.map((t) => t.description);

  return {
    ...state,
    tasks: taskDescriptions,
  };
}
