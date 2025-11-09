"use client";

import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Pill } from "lucide-react";

interface Medication {
  id: number;
  name: string;
  dosage: string;
}

interface TimeSlot {
  time: string;
  medications: Medication[];
}

interface DaySchedule {
  day: string;
  timeSlots: TimeSlot[];
}

export function WeeklyMedicationCalendar() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSchedule() {
      try {
        const response = await fetch("/api/db/medication-schedule");
        const data = await response.json();
        if (data.success) {
          setSchedule(data.schedule);
        }
      } catch (error) {
        console.error("Error fetching medication schedule:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSchedule();
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-96 bg-gray-100 rounded" />
        </div>
      </Card>
    );
  }

  // Generate 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  // Helper to check if a medication exists at a specific time for a day
  const getMedicationsAtTime = (day: DaySchedule, time: string) => {
    const slot = day.timeSlots.find(s => s.time === time);
    return slot?.medications || [];
  };

  return (
    <Card className="p-6 bg-linear-to-br from-blue-50 to-indigo-50">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Medication Schedule</h2>
        </div>
        <p className="text-sm text-gray-600 ml-11">Patient: Mary Thompson - 24 Hour Timeline</p>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          {/* Header with Days */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            {/* Time column header */}
            <div className="text-center p-3 bg-gray-700 text-white rounded-lg shadow-sm font-semibold">
              Time
            </div>
            {/* Day headers */}
            {schedule.map((day) => (
              <div
                key={day.day}
                className="text-center p-3 bg-white rounded-lg shadow-sm border-2 border-blue-200"
              >
                <div className="font-bold text-gray-900 text-sm">
                  {day.day.substring(0, 3).toUpperCase()}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {day.day}
                </div>
              </div>
            ))}
          </div>

          {/* 24-Hour Timeline */}
          <div className="space-y-1">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-8 gap-2">
                {/* Time label */}
                <div className="flex items-center justify-center p-2 bg-gray-100 rounded border border-gray-300">
                  <span className="text-xs font-semibold text-gray-700">
                    {hour}
                  </span>
                </div>

                {/* Day columns */}
                {schedule.map((day) => {
                  const medications = getMedicationsAtTime(day, hour);
                  const hasMeds = medications.length > 0;

                  return (
                    <div
                      key={`${day.day}-${hour}`}
                      className={`relative min-h-[50px] p-2 rounded border transition-all ${
                        hasMeds
                          ? "bg-blue-500 border-blue-600 shadow-md"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {hasMeds && (
                        <div className="space-y-1">
                          {medications.map((med) => (
                            <div
                              key={med.id}
                              className="bg-white rounded px-2 py-1 shadow-sm"
                            >
                              <div className="flex items-start gap-1">
                                <Pill className="w-3 h-3 text-blue-600 mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-gray-900 truncate">
                                    {med.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {med.dosage}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600 bg-white p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-500 border border-blue-600 rounded shadow-sm" />
              <span className="font-medium">Medication Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white border border-gray-200 rounded" />
              <span>No Medication</span>
            </div>
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>Medication Details</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
