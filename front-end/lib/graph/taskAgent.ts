import { PatientState } from "../types";

export async function taskAgent(state: PatientState): Promise<PatientState> {
  // Simple mock logic — in a real system you could integrate a calendar API
  const newTask = `Added reminder based on input: "${state.input}"`;
  console.log("📅 Task created:", newTask);

  return {
    ...state,
    tasks: [...state.tasks, newTask],
  };
}
