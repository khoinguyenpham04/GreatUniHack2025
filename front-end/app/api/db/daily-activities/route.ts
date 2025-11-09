import { NextResponse } from "next/server";
import { DailyActivityDB } from "@/lib/db";

export async function DELETE(req: Request) {
  try {
    const { activityId } = await req.json();

    if (!activityId) {
      return NextResponse.json(
        { success: false, error: "Activity ID is required" },
        { status: 400 }
      );
    }

    // Toggle the activity to inactive (soft delete)
    DailyActivityDB.toggleActive(activityId);

    return NextResponse.json({
      success: true,
      message: "Activity removed successfully",
    });
  } catch (error) {
    console.error("Error removing activity:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove activity" },
      { status: 500 }
    );
  }
}
