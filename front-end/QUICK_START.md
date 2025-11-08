# 🚀 Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- OpenAI API key

## Setup (5 minutes)

### 1. Install Dependencies
```bash
cd front-end
npm install
```

### 2. Configure Environment
Create a `.env.local` file:
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 What You'll See

### Dashboard Layout

```
┌────────────────────────────────────────────────────────────┐
│              Dementia Companion System                     │
│         Multi-Agent AI Assistant (LangGraph)               │
├────────────────────────────────────────────────────────────┤
│  🤖 Multi-Agent System Architecture                        │
│  ┌─────────┬─────────────┬────────────┬─────────────┐    │
│  │ Memory  │ Supervisor  │   Task     │   Health    │    │
│  │ Agent   │   Agent     │   Agent    │   Agent     │    │
│  └─────────┴─────────────┴────────────┴─────────────┘    │
├────────────────────────────────────────────────────────────┤
│  Left Column            │  Right Column                    │
│  ┌───────────────┐     │  ┌────────────────────┐         │
│  │ Patient       │     │  │ Conversation       │         │
│  │ Profile       │     │  │ Memory Log         │         │
│  │               │     │  │                    │         │
│  │ • Name        │     │  │ Last 5 messages... │         │
│  │ • Age         │     │  └────────────────────┘         │
│  │ • Diagnosis   │     │  ┌────────────────────┐         │
│  │ • Medications │     │  │ Health Notes       │         │
│  └───────────────┘     │  │                    │         │
│  ┌───────────────┐     │  │ Tracked symptoms   │         │
│  │ Tasks         │     │  └────────────────────┘         │
│  │               │     │                                  │
│  │ ☐ Task 1      │     │                                  │
│  │ ☐ Task 2      │     │                                  │
│  └───────────────┘     │                                  │
└────────────────────────┴──────────────────────────────────┘
                                              [💬 Chat Button]
```

### Chat Interface (Right Sidebar)

The CopilotKit chat opens by default and allows natural conversations.

## 💬 Try These Commands

### Tasks
```
"Create a task to take my medication at 2pm"
"Remind me to call my daughter tomorrow"
"Add a task to water the plants"
```

### Health
```
"I have a headache"
"Feeling dizzy today"
"My knee hurts"
```

### General
```
"What's my medication schedule?"
"Tell me about my profile"
"What tasks do I have?"
```

## 🔍 Understanding the Response Flow

### Example: Creating a Task

1. **You say**: "Create a task to take medication at 2pm"

2. **What happens**:
   ```
   User Input
      ↓
   CopilotKit detects "createTask" intent
      ↓
   Action handler triggered
      ↓
   LangGraph multi-agent system:
      • Memory Agent: Processes compassionately
      • Supervisor Agent: Routes to "task"
      • Task Agent: Creates the task
      ↓
   UI updates instantly:
      • Task appears in Task List
      • Memory log updated
      • Chat confirms success
   ```

3. **You see**: 
   - ✓ Task created: "take medication at 2pm"
   - Task appears in the Task List with checkbox
   - Memory log shows the interaction

## 🎨 UI Components Explained

### Patient Profile Card (Blue)
- Shows patient name, age, diagnosis
- Medication schedule with times
- Last medication timestamp

### Task List (White/Green)
- Interactive checkboxes
- Click to mark complete (strikethrough)
- Delete button (🗑️) to remove

### Memory Log (Purple)
- Last 5 conversations
- Scrollable history
- Updates in real-time

### Health Notes (Orange)
- Tracked symptoms
- Automatically extracted from conversations
- Warning color for attention

## 🧪 Testing the Multi-Agent System

### Test 1: Task Creation
1. Say: "Create a task to take my evening medication"
2. ✓ Should appear in Task List
3. ✓ Should update Memory Log

### Test 2: Health Tracking
1. Say: "I have a headache and feel tired"
2. ✓ Should extract symptoms
3. ✓ Should appear in Health Notes

### Test 3: Profile Information
1. Say: "What medications do I need to take?"
2. ✓ Should respond with schedule
3. ✓ Based on patient profile

## 📊 Monitoring Agent Activity

Watch the logs in your terminal to see agent processing:

```bash
# You'll see output like:
[Memory Agent] Processing input...
[Supervisor Agent] Routing decision: task
[Task Agent] Creating task...
[LangGraph] State updated
```

## 🐛 Common Issues

### "Chat not responding"
- ✓ Check `.env.local` has OPENAI_API_KEY
- ✓ Restart dev server: `npm run dev`
- ✓ Check browser console for errors

### "Tasks not appearing"
- ✓ Use explicit language: "Create a task to..."
- ✓ Check Task Agent is processing correctly

### "Health notes empty"
- ✓ Health Agent only tracks actual symptoms
- ✓ Try: "I feel dizzy" or "I have pain"

### "Build errors"
- ✓ Delete node_modules: `rm -rf node_modules`
- ✓ Reinstall: `npm install`
- ✓ Check Node.js version: `node --version` (need 18+)

## 📁 Project Structure

```
front-end/
├── app/
│   ├── page.tsx                    ← Main UI
│   └── api/copilotkit/route.ts    ← CopilotKit integration
├── components/
│   ├── patient-profile-card.tsx   ← Patient info
│   ├── task-list.tsx              ← Task management
│   ├── memory-log-card.tsx        ← Conversation history
│   └── health-notes-card.tsx      ← Health tracking
└── lib/
    ├── graph/
    │   └── nodes/                  ← 4 AI agents
    ├── task-context.tsx           ← Task state
    └── state-context.tsx          ← Patient state
```

## 🎓 Next Steps

1. **Customize Patient Data**: Edit `lib/patient.json`
2. **Add More Agents**: Create new nodes in `lib/graph/nodes/`
3. **Enhance UI**: Modify components in `components/`
4. **Add Features**: See `ARCHITECTURE.md` for ideas

## 📚 Documentation

- **ARCHITECTURE.md** - Full system architecture
- **INTEGRATION.md** - CopilotKit integration details
- **README.md** - General project info

## 💡 Tips for Demo

1. Start with: "What's my name?"
2. Then: "Create a task to take medication at 8am"
3. Then: "I'm feeling a bit tired today"
4. Watch all components update in real-time!

## 🆘 Need Help?

Check the detailed documentation:
- System Architecture: `ARCHITECTURE.md`
- Integration Guide: `INTEGRATION.md`
- Browser Console: F12 for debug info

---

**Built for Alzheimer's & Dementia patients with ❤️**

