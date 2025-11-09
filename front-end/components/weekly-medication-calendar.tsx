"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "./ui/card";
import { Pill } from "lucide-react";
import { isSameDay, startOfWeek, addDays, format } from "date-fns";
import {
  CalendarProvider,
  CalendarHeader,
  CalendarBody,
  CalendarItem,
  CalendarDate,
  CalendarDatePicker,
  CalendarMonthPicker,
  CalendarYearPicker,
  CalendarDatePagination,
  type Feature,
  type Status,
  useCalendarMonth,
  useCalendarYear,
} from "@/components/ui/shadcn-io/calendar";

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

// Medication status for calendar
const medicationStatus: Status = {
  id: "medication",
  name: "Medication",
  color: "#10B981", // Green color for medications
};

// Custom Medication Tooltip Component
function MedicationTooltip({ feature, children }: { feature: Feature; children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}

      {/* Tooltip */}
      {isHovered && (
        <div
          className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg border border-gray-700 whitespace-nowrap transition-all duration-200 ease-in-out"
          style={{
            backdropFilter: 'blur(8px)',
            background: 'rgba(17, 24, 39, 0.95)',
          }}
        >
          {feature.name}
          {/* Tooltip arrow */}
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
            style={{ borderTopColor: 'rgba(17, 24, 39, 0.95)' }}
          />
        </div>
      )}
    </div>
  );
}

// Custom Weekly Calendar Body Component
function WeeklyCalendarBody({ features, children }: { features: Feature[], children: (props: { feature: Feature }) => React.ReactNode }) {
  const [month] = useCalendarMonth();
  const [year] = useCalendarYear();

  // Calculate the week to display (first week of the selected month)
  const firstDayOfMonth = new Date(year, month, 1);
  const weekStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }); // Start on Sunday

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Filter and sort features for the current week chronologically
  const weekFeatures = useMemo(() => {
    const result: { [day: number]: Feature[] } = {};
    weekDays.forEach((day, index) => {
      result[index] = features
        .filter((feature) => isSameDay(new Date(feature.startAt), day))
        .sort((a, b) => {
          // Sort by time (earlier times first)
          const timeA = new Date(a.startAt).getTime();
          const timeB = new Date(b.startAt).getTime();
          return timeA - timeB;
        });
    });
    return result;
  }, [features, weekDays]);

  return (
    <div className="grid grid-cols-7 gap-1 p-4 bg-gray-50">
      {weekDays.map((day, index) => {
        const dayFeatures = weekFeatures[index] || [];
        const isCurrentMonth = day.getMonth() === month;

        return (
          <div
            key={index}
            className={`min-h-[120px] p-2 rounded-lg border ${
              isCurrentMonth
                ? "bg-white border-gray-200"
                : "bg-gray-100 border-gray-300"
            }`}
          >
            <div className="text-center mb-2">
              <div className={`text-sm font-semibold ${
                isCurrentMonth ? "text-gray-900" : "text-gray-500"
              }`}>
                {format(day, "EEE")}
              </div>
              <div className={`text-lg ${
                isCurrentMonth ? "text-gray-900" : "text-gray-500"
              }`}>
                {format(day, "d")}
              </div>
            </div>
            <div className="space-y-1">
              {dayFeatures.map((feature) => (
                <MedicationTooltip key={feature.id} feature={feature}>
                  {children({ feature })}
                </MedicationTooltip>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MedicationCalendarContent() {
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth] = useCalendarMonth();
  const [selectedYear] = useCalendarYear();

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

  // Transform medication schedule into calendar features
  const medicationFeatures = useMemo(() => {
    const features: Feature[] = [];
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    schedule.forEach((daySchedule) => {
      const dayIndex = daysOfWeek.indexOf(daySchedule.day);
      if (dayIndex === -1) return;

      daySchedule.timeSlots.forEach((timeSlot) => {
        timeSlot.medications.forEach((medication) => {
          // Calculate the date for this day in the selected month
          const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1);
          const weekStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 }); // Start on Sunday
          const targetDate = addDays(weekStart, dayIndex);

          // Set the time
          const [hours, minutes] = timeSlot.time.split(':').map(Number);
          targetDate.setHours(hours, minutes, 0, 0);

          // Create feature for this medication
          features.push({
            id: `${medication.id}-${daySchedule.day}-${timeSlot.time}-${selectedMonth}-${selectedYear}`,
            name: `${medication.name} - ${medication.dosage} at ${timeSlot.time}`,
            startAt: targetDate,
            endAt: targetDate, // Same start and end for point-in-time events
            status: medicationStatus,
          });
        });
      });
    });

    return features;
  }, [schedule, selectedMonth, selectedYear]);

  // Calculate year range for the year picker
  const { earliestYear, latestYear } = useMemo(() => {
    if (medicationFeatures.length === 0) {
      const currentYear = new Date().getFullYear();
      return { earliestYear: currentYear, latestYear: currentYear };
    }

    const years = medicationFeatures
      .flatMap((feature) => [feature.startAt.getFullYear(), feature.endAt.getFullYear()])
      .sort((a, b) => a - b);

    return {
      earliestYear: years[0],
      latestYear: years[years.length - 1],
    };
  }, [medicationFeatures]);

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

  return (
    <Card className="p-6 bg-linear-to-br from-blue-50 to-indigo-50">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Weekly Medication Schedule</h2>
        </div>
        <p className="text-sm text-gray-600 ml-11">Patient: Mary Thompson - Weekly Calendar View</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <CalendarDate>
          <CalendarDatePicker>
            <CalendarMonthPicker />
            <CalendarYearPicker end={latestYear} start={earliestYear} />
          </CalendarDatePicker>
          <CalendarDatePagination />
        </CalendarDate>
        <WeeklyCalendarBody features={medicationFeatures}>
          {({ feature }) => (
            <CalendarItem
              key={feature.id}
              feature={feature}
              className="text-xs bg-green-50 border border-green-200 rounded px-1 py-0.5 mb-0.5"
            />
          )}
        </WeeklyCalendarBody>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-600 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <span className="font-medium">Medication Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <Pill className="w-4 h-4 text-green-600" />
          <span>Medication Details</span>
        </div>
      </div>
    </Card>
  );
}

export function WeeklyMedicationCalendar() {
  return (
    <CalendarProvider>
      <MedicationCalendarContent />
    </CalendarProvider>
  );
}
