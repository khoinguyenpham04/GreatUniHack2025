"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type AgentType = "comfort" | "task" | "health" | "memory" | null;

interface AgentStatusContextType {
  currentAgent: AgentType;
  isProcessing: boolean;
  setAgent: (agent: AgentType) => void;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
}

const AgentStatusContext = createContext<AgentStatusContextType | undefined>(undefined);

export function AgentStatusProvider({ children }: { children: ReactNode }) {
  const [currentAgent, setCurrentAgent] = useState<AgentType>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const setAgent = (agent: AgentType) => setCurrentAgent(agent);
  const setProcessing = (processing: boolean) => setIsProcessing(processing);
  const reset = () => {
    setCurrentAgent(null);
    setIsProcessing(false);
  };

  return (
    <AgentStatusContext.Provider
      value={{ currentAgent, isProcessing, setAgent, setProcessing, reset }}
    >
      {children}
    </AgentStatusContext.Provider>
  );
}

export function useAgentStatus() {
  const context = useContext(AgentStatusContext);
  if (!context) {
    throw new Error("useAgentStatus must be used within AgentStatusProvider");
  }
  return context;
}
