import { NextRequest, NextResponse } from "next/server";
import { TaskDB } from "@/lib/db";

const patientId = 1; // Default patient

/**
 * GET /api/db/tasks - Get all tasks
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCompleted = searchParams.get("completed") === "true";

    const tasks = TaskDB.getAll(patientId, includeCompleted);

    return NextResponse.json({
      success: true,
      tasks: tasks.map((t) => ({
        id: t.id,
        description: t.description,
        completed: Boolean(t.completed),
        completedAt: t.completed_at,
        createdAt: t.created_at,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/db/tasks - Create task
 */
export async function POST(req: NextRequest) {
  try {
    const { description } = await req.json();

    if (!description) {
      return NextResponse.json(
        { success: false, error: "Description is required" },
        { status: 400 }
      );
    }

    const taskId = TaskDB.create(patientId, description);

    return NextResponse.json({
      success: true,
      taskId,
      message: "Task created successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/db/tasks - Toggle task completion
 */
export async function PATCH(req: NextRequest) {
  try {
    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    TaskDB.toggle(taskId);

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/db/tasks - Delete task
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("id");

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
        { status: 400 }
      );
    }

    TaskDB.delete(Number(taskId));

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

