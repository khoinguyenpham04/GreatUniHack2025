"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

interface MemoryLogCardProps {
  memories: string[];
}

export function MemoryLogCard({ memories }: MemoryLogCardProps) {
  if (memories.length === 0) {
    return (
      <Card className="border-purple-200 bg-purple-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <MessageSquare className="h-5 w-5" />
            Conversation Memory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-purple-700">
            Start a conversation with the AI companion. All interactions are remembered.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <MessageSquare className="h-5 w-5" />
          Conversation Memory
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-64 overflow-y-auto">
        {memories.slice(-5).map((memory, idx) => (
          <div
            key={idx}
            className="p-3 bg-white rounded-lg border border-purple-200 text-sm text-gray-800"
          >
            {typeof memory === 'string' ? memory : JSON.stringify(memory)}
          </div>
        ))}
        {memories.length > 5 && (
          <p className="text-xs text-purple-600 text-center pt-2">
            Showing last 5 of {memories.length} interactions
          </p>
        )}
      </CardContent>
    </Card>
  );
}

