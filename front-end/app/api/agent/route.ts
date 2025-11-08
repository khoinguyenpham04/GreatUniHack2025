import { NextResponse } from "next/server";
import { patientGraph } from "@/lib/graph";
import { PatientState } from "@/lib/types";
import patientProfile from "@/lib/patient.json";

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
  return NextResponse.json(result);
}
