import { patientGraph } from "@/lib/graph";
import patient from "@/lib/patient.json";
import { PatientState } from "@/lib/types";

export async function POST(req: Request) {
  const { text } = await req.json();

  const initialState: PatientState = {
    // profile fields (flattened per new schema)
    name: patient.name,
    age: patient.age,
    diagnosis: patient.diagnosis,
    med_schedule: patient.med_schedule ?? [],
    // dynamic state
    input: text,
    memoryLog: [],
    tasks: [],
    healthNotes: [],
  };

  const result = await patientGraph.invoke(initialState);

  return Response.json(result);
}
