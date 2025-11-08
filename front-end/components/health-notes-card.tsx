"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Heart } from "lucide-react";

interface HealthNotesCardProps {
  notes: string[];
}

export function HealthNotesCard({ notes }: HealthNotesCardProps) {
  if (notes.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Heart className="h-5 w-5" />
            Health Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700">
            No health concerns recorded. The AI will automatically track any symptoms mentioned.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <AlertCircle className="h-5 w-5" />
          Health Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {notes.map((note, idx) => (
          <div
            key={idx}
            className="p-3 bg-white rounded-lg border border-orange-200 text-sm text-gray-800"
          >
            <span className="font-medium text-orange-700">Note {idx + 1}:</span> {note}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

