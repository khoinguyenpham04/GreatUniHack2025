"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

interface HealthNote {
  id: number;
  note: string;
  severity: string;
  created_at: string;
}

interface MedicalHealthNotesCardProps {
  notes: HealthNote[];
}

const getSeverityConfig = (severity: string) => {
  switch (severity) {
    case 'high':
      return {
        color: 'red',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-900',
        badgeColor: 'bg-red-100 text-red-800',
        icon: AlertTriangle,
        label: 'High Priority'
      };
    case 'medium':
      return {
        color: 'orange',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        textColor: 'text-orange-900',
        badgeColor: 'bg-orange-100 text-orange-800',
        icon: AlertCircle,
        label: 'Medium Priority'
      };
    case 'low':
    default:
      return {
        color: 'blue',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        textColor: 'text-blue-900',
        badgeColor: 'bg-blue-100 text-blue-800',
        icon: CheckCircle,
        label: 'Low Priority'
      };
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export function MedicalHealthNotesCard({ notes }: MedicalHealthNotesCardProps) {
  if (notes.length === 0) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Activity className="h-5 w-5" />
            Medical Health Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-700">
            No medical observations recorded. Clinical notes will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by severity (high -> medium -> low) and then by date
  const sortedNotes = [...notes].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    const severityDiff = (severityOrder[a.severity as keyof typeof severityOrder] || 2) - 
                         (severityOrder[b.severity as keyof typeof severityOrder] || 2);
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Activity className="h-5 w-5" />
          Medical Health Notes ({notes.length})
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Scientific and clinical observations for healthcare professionals
        </p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {sortedNotes.map((note) => {
          const config = getSeverityConfig(note.severity);
          const Icon = config.icon;
          
          return (
            <div
              key={note.id}
              className={`p-4 bg-white rounded-lg border-l-4 ${config.borderColor} shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.textColor}`} />
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${config.badgeColor}`}>
                    {config.label}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(note.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                {note.note}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

