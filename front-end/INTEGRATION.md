# CopilotKit + LangGraph Integration Guide

## Overview

This integration connects the dementia companion multi-agent system with CopilotKit to provide a conversational interface for patients. The system uses **LangGraph** for multi-agent orchestration and **CopilotKit** for the chat UI.

## Updated UI (Current Version)

The UI now displays a comprehensive dashboard with:
- **Patient Profile Card**: Shows patient info and medication schedule
- **Task List**: Interactive task management with checkboxes
- **Memory Log**: Last 5 conversation interactions
- **Health Notes**: Tracked symptoms and concerns
- **Agent Architecture Display**: Visual representation of all 4 agents

## Features

✅ **Task Creation via Chat**: Patients can create tasks by simply talking to the AI
✅ **Real-time Task List**: Tasks appear instantly in the UI
✅ **Multi-Agent Backend**: Powered by LangGraph with supervisor, memory, task, and health agents
✅ **Natural Language Processing**: Understands requests in natural language

## Setup

1. **Install dependencies** (already done):
```bash
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/runtime ai
```

2. **Add OpenAI API Key**:
Create a `.env.local` file:
```bash
cp .env.local.example .env.local
```
Then add your OpenAI API key to `.env.local`

3. **Run the development server**:
```bash
npm run dev
```

## How It Works

### Architecture

```
User Input (Chat)
    ↓
CopilotKit Interface (page.tsx)
    ↓
CopilotKit API Route (/api/copilotkit)
    ↓
LangGraph Multi-Agent System
    ├── Supervisor Agent
    ├── Memory Agent
    ├── Task Agent
    └── Health Agent
    ↓
Response + Task Creation
    ↓
UI Updates (TaskList Component)
```

### Key Files

- **`app/page.tsx`**: Main UI with CopilotKit chat sidebar
- **`app/api/copilotkit/route.ts`**: API endpoint that integrates CopilotKit with LangGraph
- **`lib/task-context.tsx`**: React context for task state management
- **`components/task-list.tsx`**: Task list display component

### Available Actions

The CopilotKit integration provides these actions:

1. **`createTask`**: Create a new task or reminder
   - Usage: "Create a task to take medication at 2pm"
   - Integrates with Task Agent via LangGraph
   
2. **`checkHealth`**: Report health symptoms
   - Usage: "I have a headache"
   - Routes through Health Agent for analysis
   
3. **`getPatientInfo`**: Get patient profile and current state
   - Usage: "What's my medication schedule?"
   - Returns profile and current agent state

## Usage Examples

Try these prompts:

- "Create a task to call my daughter at 3pm"
- "Add a reminder to take my medication"
- "I need to remember to water the plants"
- "Show me my tasks"

## Task Management

Tasks are displayed in real-time with:
- ✅ Checkbox to mark complete
- 🗑️ Delete button to remove tasks
- Strike-through for completed tasks

## Future Enhancements

- [ ] Task persistence (database integration)
- [ ] Recurring tasks
- [ ] Task notifications/reminders
- [ ] Voice input for easier interaction
- [ ] Integration with calendar apps
- [ ] Family member portal to add tasks
- [ ] Health tracking visualization
- [ ] Memory games and exercises

## Troubleshooting

**Chat not working?**
- Check that your OpenAI API key is set in `.env.local`
- Restart the dev server after adding the key

**Tasks not appearing?**
- Make sure to use phrases like "create a task" or "add a reminder"
- Check browser console for errors

**LangGraph errors?**
- Verify your LangGraph configuration in `lib/graph/`
- Check that patient.json exists with required fields

