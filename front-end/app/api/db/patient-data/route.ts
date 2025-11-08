import { NextResponse } from "next/server";
import { DailyActivityDB, HealthTipDB } from "@/lib/db";

export async function GET() {
  try {
    const patientId = 1; // Default patient

    const dailyActivities = DailyActivityDB.getActive(patientId);
    const healthTips = HealthTipDB.getActive(patientId);

    return NextResponse.json({
      success: true,
      data: {
        dailyActivities,
        healthTips,
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

