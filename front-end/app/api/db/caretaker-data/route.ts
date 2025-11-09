import { NextResponse } from "next/server";
import { TaskDB, MemoryDB, HealthDB, PatientDB } from "@/lib/db";

export async function GET() {
  try {
    const patientId = 1; // Default patient

    // Fetch patient profile
    const profile = PatientDB.getProfile(patientId);
    
    // Fetch caretaker tasks (not completed)
    const tasks = TaskDB.getActive(patientId);
    
    // Fetch recent memory logs (conversation history)
    const memoryLogs = MemoryDB.getRecent(patientId, 10);
    
    // Fetch recent health notes
    const healthNotes = HealthDB.getRecent(patientId, 10);

    return NextResponse.json({
      success: true,
      data: {
        profile,
        tasks,
        memoryLogs,
        healthNotes,
      },
    });
  } catch (error) {
    console.error("Error fetching caretaker data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch caretaker data" },
      { status: 500 }
    );
  }
}

