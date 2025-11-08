"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Pill, Calendar } from "lucide-react";

interface PatientProfileCardProps {
  name: string;
  age: number;
  diagnosis: string;
  medSchedule: string[];
  lastMedTime?: string;
}

export function PatientProfileCard({
  name,
  age,
  diagnosis,
  medSchedule,
  lastMedTime,
}: PatientProfileCardProps) {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <User className="h-5 w-5" />
          Patient Profile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">Name</p>
          <p className="text-lg font-semibold text-gray-900">{name}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Age</p>
            <p className="text-base font-medium text-gray-900">{age} years</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Diagnosis</p>
            <Badge variant="secondary" className="mt-1">
              {diagnosis}
            </Badge>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Pill className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-medium text-gray-700">Medication Schedule</p>
          </div>
          <div className="space-y-1">
            {medSchedule.map((med, idx) => (
              <div
                key={idx}
                className="text-sm text-gray-800 bg-white rounded px-3 py-1.5 border border-blue-100"
              >
                {med}
              </div>
            ))}
          </div>
        </div>

        {lastMedTime && (
          <div className="pt-2 border-t border-blue-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Last medication:</span>
              <span className="font-medium text-gray-900">
                {new Date(lastMedTime).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

