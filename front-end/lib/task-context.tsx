"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Task {
  id: string;
  description: string;
  completed: boolean;
  createdAt: Date;
}

interface TaskContextType {
  tasks: Task[];
  addTask: (description: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  isLoading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load tasks from database on mount
  useEffect(() => {
    refreshTasks();
  }, []);

  const refreshTasks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/db/tasks?completed=true");
      const data = await response.json();
      
      if (data.success) {
        setTasks(
          data.tasks.map((t: any) => ({
            id: t.id.toString(),
            description: t.description,
            completed: t.completed,
            createdAt: new Date(t.createdAt),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async (description: string) => {
    try {
      const response = await fetch("/api/db/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh tasks from database to get the actual ID
        await refreshTasks();
      }
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const toggleTask = async (id: string) => {
    try {
      // Optimistically update UI
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, completed: !task.completed } : task
        )
      );

      const response = await fetch("/api/db/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: parseInt(id) }),
      });

      if (!response.ok) {
        // Revert on error
        await refreshTasks();
      }
    } catch (error) {
      console.error("Failed to toggle task:", error);
      // Revert on error
      await refreshTasks();
    }
  };

  const removeTask = async (id: string) => {
    try {
      // Optimistically update UI
      setTasks((prev) => prev.filter((task) => task.id !== id));

      const response = await fetch(`/api/db/tasks?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Revert on error
        await refreshTasks();
        console.error("Failed to delete task from database");
      }
    } catch (error) {
      console.error("Failed to remove task:", error);
      // Revert on error
      await refreshTasks();
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, toggleTask, removeTask, refreshTasks, isLoading }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}

