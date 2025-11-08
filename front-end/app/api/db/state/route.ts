import { NextRequest, NextResponse } from "next/server";
import { getPatientState, TaskDB, HealthDB, MemoryDB } from "@/lib/db";

/**
 * API endpoint to fetch patient state from database
 * GET /api/db/state
 */
export async function GET(req: NextRequest) {
  try {
    const patientId = 1; // Default patient

    // Get complete state from database
    const state = getPatientState(patientId);
    
    // Get additional details
    const tasks = TaskDB.getAll(patientId, false); // Only active tasks
    const healthNotes = HealthDB.getRecent(patientId, 10);
    const memoryLogs = MemoryDB.getRecent(patientId, 10);

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          name: state.name,
          age: state.age,
          diagnosis: state.diagnosis,
          medications: state.med_schedule,
        },
        tasks: tasks.map((t) => ({
          id: t.id,
          description: t.description,
          completed: Boolean(t.completed),
          createdAt: t.created_at,
        })),
        healthNotes: healthNotes.map((h) => ({
          id: h.id,
          note: h.note,
          severity: h.severity,
          createdAt: h.created_at,
        })),
        memoryLog: memoryLogs.reverse().map((m) => ({
          content: m.content,
          role: m.role,
          createdAt: m.created_at,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching patient state:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

