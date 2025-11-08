"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface PatientStateContextType {
  memoryLog: string[];
  healthNotes: string[];
  addMemory: (memory: string) => void;
  addHealthNote: (note: string) => void;
}

const PatientStateContext = createContext<PatientStateContextType | undefined>(
  undefined
);

export function PatientStateProvider({ children }: { children: ReactNode }) {
  const [memoryLog, setMemoryLog] = useState<string[]>([]);
  const [healthNotes, setHealthNotes] = useState<string[]>([]);

  const addMemory = (memory: string) => {
    setMemoryLog((prev) => [...prev, memory]);
  };

  const addHealthNote = (note: string) => {
    setHealthNotes((prev) => [...prev, note]);
  };

  return (
    <PatientStateContext.Provider
      value={{ memoryLog, healthNotes, addMemory, addHealthNote }}
    >
      {children}
    </PatientStateContext.Provider>
  );
}

export function usePatientState() {
  const context = useContext(PatientStateContext);
  if (context === undefined) {
    throw new Error(
      "usePatientState must be used within a PatientStateProvider"
    );
  }
  return context;
}

