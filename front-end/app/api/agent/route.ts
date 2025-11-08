import { patientGraph } from "@/lib/graph";
import patientProfile from "@/lib/patient.json";
import { PatientState } from "@/lib/types";

export async function POST(req: Request) {
  const { text } = await req.json();

  const initialState: PatientState = {
    input: text,
    memoryLog: [],
    tasks: [],
    healthNotes: [],
    patientProfile,
  };

  const result = await patientGraph.invoke(initialState);

  return Response.json(result);
}
