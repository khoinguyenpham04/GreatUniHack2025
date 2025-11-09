import { NextResponse } from "next/server";
import { MedicationDB } from "@/lib/db";

export async function GET() {
  try {
    const patientId = 1; // Default patient

    const medications = MedicationDB.getAll(patientId);

    // Transform medications into a weekly schedule
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const weeklySchedule = daysOfWeek.map(day => {
      const dayMeds = medications.filter(med => 
        med.days_of_week.split(',').includes(day)
      );
      
      // Group by time
      const timeSlots: { [key: string]: typeof medications } = {};
      dayMeds.forEach(med => {
        if (!timeSlots[med.schedule_time]) {
          timeSlots[med.schedule_time] = [];
        }
        timeSlots[med.schedule_time].push(med);
      });

      return {
        day,
        timeSlots: Object.entries(timeSlots).map(([time, meds]) => ({
          time,
          medications: meds.map(m => ({
            id: m.id,
            name: m.medication_name,
            dosage: m.dosage,
          }))
        })).sort((a, b) => a.time.localeCompare(b.time))
      };
    });

    return NextResponse.json({
      success: true,
      schedule: weeklySchedule,
    });
  } catch (error) {
    console.error("Error fetching medication schedule:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch medication schedule" },
      { status: 500 }
    );
  }
}
