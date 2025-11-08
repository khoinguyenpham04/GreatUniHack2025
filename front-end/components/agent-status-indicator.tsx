"use client";

import { useState, useEffect } from "react";
import { Brain, Heart, Calendar, Activity } from "lucide-react";

interface AgentStatusProps {
  agent?: "comfort" | "task" | "health" | "memory" | null;
  isProcessing?: boolean;
}

const agentConfig = {
  comfort: {
    icon: Heart,
    label: "Comfort Agent",
    emoji: "💝",
    color: "bg-pink-100 text-pink-700 border-pink-300",
    description: "Connecting you with loved ones",
  },
  task: {
    icon: Calendar,
    label: "Task Agent",
    emoji: "📋",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    description: "Managing your schedule",
  },
  health: {
    icon: Activity,
    label: "Health Agent",
    emoji: "🏥",
    color: "bg-green-100 text-green-700 border-green-300",
    description: "Tracking your wellbeing",
  },
  memory: {
    icon: Brain,
    label: "Memory Agent",
    emoji: "💭",
    color: "bg-purple-100 text-purple-700 border-purple-300",
    description: "Remembering our conversation",
  },
};

export function AgentStatusIndicator({ agent, isProcessing = false }: AgentStatusProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (agent || isProcessing) {
      setVisible(true);
    } else {
      const timer = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [agent, isProcessing]);

  if (!visible || !agent) return null;

  const config = agentConfig[agent];
  const Icon = config.icon;

  return (
    <div className="fixed bottom-24 right-4 z-50 animate-in slide-in-from-right">
      <div
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 shadow-lg ${config.color} backdrop-blur-sm`}
      >
        <div className="relative">
          <Icon className="w-5 h-5" />
          {isProcessing && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-current"></span>
            </span>
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            {config.emoji} {config.label}
          </span>
          <span className="text-xs opacity-80">{config.description}</span>
        </div>
      </div>
    </div>
  );
}
