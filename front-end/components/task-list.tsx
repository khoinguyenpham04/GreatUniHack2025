"use client";

import { useTasks } from "@/lib/task-context";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export function TaskList() {
  const { tasks, toggleTask, removeTask } = useTasks();

  if (tasks.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No tasks yet. Ask the assistant to create a task for you!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tasks ({tasks.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <Checkbox
              id={task.id}
              checked={task.completed}
              onCheckedChange={() => toggleTask(task.id)}
            />
            <label
              htmlFor={task.id}
              className={`flex-1 text-sm cursor-pointer ${
                task.completed
                  ? "line-through text-muted-foreground"
                  : "text-foreground"
              }`}
            >
              {task.description}
            </label>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeTask(task.id)}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

