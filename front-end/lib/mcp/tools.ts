import fs from "fs/promises";

const patientPath = "lib/patient.json";

export async function getPatientMemory() {
  const data = await fs.readFile(patientPath, "utf-8");
  return JSON.parse(data);
}

export async function updateMedicationLog() {
  const data = await fs.readFile(patientPath, "utf-8");
  const patient = JSON.parse(data);
  patient.last_med_time = new Date().toISOString();
  await fs.writeFile(patientPath, JSON.stringify(patient, null, 2));
  return { success: true, time: patient.last_med_time };
}
