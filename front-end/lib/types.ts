export interface PatientState {
  input: string;
  memoryLog: string[];
  tasks: string[];
  healthNotes: string[];
  patientProfile: {
    name: string;
    age: number;
    diagnosis: string;
  };
  routeDecision?: string;
}
