import { NextResponse } from "next/server";
import { DailyActivityDB, HealthTipDB, MemoryPhotoDB } from "@/lib/db";

export async function GET() {
  try {
    const patientId = 1; // Default patient

    const dailyActivities = DailyActivityDB.getActive(patientId);
    const healthTips = HealthTipDB.getActive(patientId);
    const memoryPhotos = MemoryPhotoDB.getAll(patientId);

    return NextResponse.json({
      success: true,
      data: {
        dailyActivities,
        healthTips,
        memoryPhotos,
      },
    });
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient data" },
      { status: 500 }
    );
  }
}

