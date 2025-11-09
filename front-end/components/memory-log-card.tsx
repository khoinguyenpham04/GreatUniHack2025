"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Brain } from "lucide-react";

interface MemoryLogCardProps {
  memories: string[];
}

export function MemoryLogCard({ memories }: MemoryLogCardProps) {
  if (memories.length === 0) {
    return (
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <MessageSquare className="h-5 w-5" />
            Conversation Memory ({memories.length})
          </CardTitle>
          <p className="text-xs text-gray-500 mt-1">
            Recent AI interactions and patient conversations
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
              <Brain className="h-6 w-6 text-indigo-600" />
            </div>
            <p className="text-sm text-gray-600">
              No conversation history yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Start a conversation with the AI companion
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show most recent conversations (reverse order, newest first)
  const recentMemories = [...memories].reverse().slice(0, 8);

  return (
    <Card className="border-gray-200 bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <MessageSquare className="h-5 w-5" />
          Conversation Memory ({memories.length})
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Recent AI interactions and patient conversations
        </p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {recentMemories.map((memory, idx) => {
          // Determine if this is a task creation, health report, or general conversation
          const isTaskCreation = typeof memory === 'string' && memory.toLowerCase().includes('created task');
          const isHealthReport = typeof memory === 'string' && memory.toLowerCase().includes('health concern');
          
          let iconColor = 'bg-indigo-100';
          let iconTextColor = 'text-indigo-600';
          let borderColor = 'border-indigo-200';
          
          if (isTaskCreation) {
            iconColor = 'bg-emerald-100';
            iconTextColor = 'text-emerald-600';
            borderColor = 'border-emerald-200';
          } else if (isHealthReport) {
            iconColor = 'bg-orange-100';
            iconTextColor = 'text-orange-600';
            borderColor = 'border-orange-200';
          }
          
          return (
            <div
              key={idx}
              className={`p-4 bg-white rounded-lg border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <div className={`h-8 w-8 rounded-full ${iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                  <MessageSquare className={`h-4 w-4 ${iconTextColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {typeof memory === 'string' ? memory : JSON.stringify(memory)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-400">
                      Entry #{memories.length - idx}
                    </span>
                    {isTaskCreation && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Task
                      </span>
                    )}
                    {isHealthReport && (
                      <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        Health
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {memories.length > 8 && (
          <div className="text-center pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {recentMemories.length} of {memories.length} total interactions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

