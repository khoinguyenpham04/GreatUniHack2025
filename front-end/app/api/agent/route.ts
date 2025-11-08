import { patientGraph, caretakerGraph } from "@/lib/graph";
import patient from "@/lib/patient.json";
import { PatientState } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { text, input, workflow = "caretaker" } = await req.json();
    
    // Support both 'text' and 'input' for backward compatibility
    const userInput = input || text;

    if (!userInput) {
      return Response.json(
        { success: false, error: "No input provided" },
        { status: 400 }
      );
    }

    const initialState: PatientState = {
      // profile fields
      name: patient.name,
      age: patient.age,
      diagnosis: patient.diagnosis,
      med_schedule: patient.med_schedule ?? [],
      // dynamic state
      input: userInput,
      memoryLog: [],
      tasks: [],
      healthNotes: [],
    };

    // Select appropriate graph based on workflow
    const graph = workflow === "patient" ? patientGraph : caretakerGraph;
    const result = await graph.invoke(initialState);

    return Response.json({
      success: true,
      state: result,
      workflow,
    });
  } catch (error) {
    console.error("Agent API error:", error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}
