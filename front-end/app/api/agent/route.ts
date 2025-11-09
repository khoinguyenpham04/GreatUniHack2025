import { patientGraph, caretakerGraph } from "@/lib/graph";
import patient from "@/lib/patient.json";
import { PatientState, MedicationSchema } from "@/lib/types";

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

    // Transform medication objects to strings for agent consumption
    const medScheduleStrings = (patient.med_schedule ?? []).map((med: any) => {
      // Validate the medication object
      const parsed = MedicationSchema.parse(med);
      // Format as "Medication Dosage at Time (Days)"
      const daysStr = parsed.days.length === 7 ? "Daily" : parsed.days.join(", ");
      return `${parsed.medication} ${parsed.dosage} at ${parsed.times.join(", ")} (${daysStr})`;
    });

    const initialState: PatientState = {
      // profile fields
      name: patient.name,
      age: patient.age,
      diagnosis: patient.diagnosis,
      med_schedule: medScheduleStrings,
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
