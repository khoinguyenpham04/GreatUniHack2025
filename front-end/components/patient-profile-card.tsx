"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Pill, Clock, ChevronDown, ChevronUp } from "lucide-react";

interface PatientProfileCardProps {
  name: string;
  age: number;
  diagnosis: string;
  medSchedule: string[];
  lastMedTime?: string;
  onToggleCalendar?: () => void;
  isCalendarOpen?: boolean;
}

export function PatientProfileCard({
  name,
  age,
  diagnosis,
  medSchedule,
  lastMedTime,
  onToggleCalendar,
  isCalendarOpen = false,
}: PatientProfileCardProps) {
  return (
    <Card className="border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6 space-y-5">
        {/* Header Section */}
        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{name}</h3>
              <p className="text-sm text-gray-500 mt-0.5">Patient ID: #001</p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 font-medium px-3 py-1">
            {age} years
          </Badge>
        </div>

        {/* Diagnosis Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Diagnosis</span>
          <Badge className="bg-purple-600 hover:bg-purple-600 text-white border-0 font-medium px-3 py-1">
            {diagnosis}
          </Badge>
        </div>

        {/* Medication Schedule */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Pill className="h-4 w-4 text-emerald-700" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Medication Schedule</span>
          </div>
          <div className="space-y-2 pl-10">
            {medSchedule.map((med, idx) => {
              // Parse medication string to extract time and name
              const parts = med.split(' ');
              const time = parts[0]; // e.g., "8am"
              const medName = parts.slice(1).join(' '); // rest is medication name
              
              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 border border-gray-200"
                >
                  <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white border-0 font-semibold text-xs px-2.5 py-0.5 min-w-12 justify-center">
                    {time}
                  </Badge>
                  <span className="text-sm text-gray-700 font-medium">{medName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* View Calendar Button */}
        <button
          onClick={onToggleCalendar}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          <Pill className="w-4 h-4" />
          <span>View Weekly Medication Calendar</span>
          {isCalendarOpen ? (
            <ChevronUp className="w-4 h-4 ml-1" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-1" />
          )}
        </button>

        {/* Last Medication Time */}
        {lastMedTime && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Last taken:</span>
              <span className="font-semibold text-gray-700">
                {new Date(lastMedTime).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

