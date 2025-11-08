# 🧠 Dementia Companion - Multi-Agent AI System

A sophisticated Next.js application featuring a multi-agent AI system powered by **LangGraph** and **CopilotKit**, designed to assist Alzheimer's and dementia patients with daily tasks, health tracking, and compassionate conversation.

## ✨ Features

- 🤖 **Multi-Agent System** - 4 specialized AI agents (Memory, Supervisor, Task, Health)
- 💬 **Conversational Interface** - CopilotKit-powered chat sidebar
- 📋 **Task Management** - Create, track, and complete tasks
- 🏥 **Health Tracking** - Automatic symptom detection with severity classification
- 🗄️ **SQLite Database** - Persistent storage for all patient data
- 💾 **Conversation Memory** - Full conversation history across sessions
- 👤 **Patient Profiles** - Personalized interactions based on patient data
- 💊 **Medication Tracking** - Schedule and adherence monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenAI API key

### Installation

1. **Clone and install dependencies**
```bash
cd front-end
npm install
```

2. **Set up environment variables**
```bash
# Create .env.local
OPENAI_API_KEY=sk-your-openai-api-key-here
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

3. **Initialize database**
```bash
npm run db:init
```

4. **Run development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🏗️ Architecture

### Multi-Agent System

```
User Input
    ↓
Memory Agent (Compassionate AI)
    ↓
Supervisor Agent (Routes to: task | health | memory)
    ↓
Specialized Agents (Task Agent | Health Agent)
    ↓
Database Storage (SQLite)
    ↓
UI Updates (Real-time via React Context)
```

### Technology Stack

- **Framework**: Next.js 16
- **AI Orchestration**: LangGraph
- **Chat Interface**: CopilotKit
- **Language Model**: OpenAI GPT-4o / GPT-4o-mini
- **Database**: SQLite (better-sqlite3)
- **Styling**: TailwindCSS
- **Type Safety**: TypeScript + Zod
- **UI Components**: Radix UI

## 📚 Documentation

- **[QUICK_START.md](QUICK_START.md)** - 5-minute setup guide
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Complete system architecture
- **[DATABASE.md](DATABASE.md)** - Database schema and operations
- **[INTEGRATION.md](INTEGRATION.md)** - CopilotKit integration details
- **[CHANGES.md](CHANGES.md)** - Detailed changelog
- **[DATABASE_INTEGRATION_SUMMARY.md](DATABASE_INTEGRATION_SUMMARY.md)** - DB integration summary

## 🗄️ Database

The system uses SQLite for persistent storage:

### Tables
- **patients** - Patient profiles
- **medications** - Medication schedules
- **memory_logs** - Conversation history
- **tasks** - Patient tasks and reminders
- **health_notes** - Tracked symptoms with severity
- **interactions** - Agent routing analytics

### Commands
```bash
npm run db:init   # Initialize database
npm run db:reset  # Reset database (fresh start)
```

Database location: `data/patients.db` (gitignored)

## 🤖 AI Agents

### 1. Memory Agent
- Compassionate responses using patient profile
- Accesses conversation history from database
- Temperature: 0.3 (stable and factual)

### 2. Supervisor Agent
- Routes inputs: "task" | "health" | "memory"
- Logs all interactions for analytics
- Smart classification using GPT-4o-mini

### 3. Task Agent
- Creates tasks and medication reminders
- Integrates with medication database
- Tracks task completion

### 4. Health Agent
- Extracts symptoms from natural language
- Classifies severity (low/medium/high)
- Persistent health tracking

## 💻 Development

### Scripts

```bash
npm run dev         # Start dev server (auto-initializes DB)
npm run build       # Build for production (auto-initializes DB)
npm run start       # Start production server
npm run lint        # Run ESLint
npm run db:init     # Initialize database
npm run db:reset    # Reset database
```

### Project Structure

```
front-end/
├── app/
│   ├── api/
│   │   ├── agent/         # LangGraph endpoint
│   │   ├── copilotkit/    # CopilotKit runtime
│   │   └── db/            # Database API
│   ├── dashboard/         # Dashboard page
│   └── page.tsx           # Main UI
├── components/
│   ├── patient-profile-card.tsx
│   ├── task-list.tsx
│   ├── memory-log-card.tsx
│   └── health-notes-card.tsx
├── lib/
│   ├── db/                # Database layer
│   │   ├── schema.ts
│   │   ├── index.ts
│   │   └── init.ts
│   ├── graph/             # LangGraph agents
│   │   ├── index.ts
│   │   └── nodes/
│   │       ├── memoryAgent.ts
│   │       ├── supervisorAgent.ts
│   │       ├── taskAgent.ts
│   │       └── healthAgent.ts
│   ├── task-context.tsx   # Task state
│   └── state-context.tsx  # Patient state
└── data/
    └── patients.db        # SQLite database
```

## 🎯 Usage Examples

### Creating Tasks
```
"Create a task to take my medication at 2pm"
→ Task appears in UI, saved to database
```

### Health Tracking
```
"I have a severe headache"
→ Extracted as health note with high severity
```

### General Conversation
```
"What's my medication schedule?"
→ Memory Agent responds using patient profile
```

## 🔧 API Endpoints

### CopilotKit
- `POST /api/copilotkit` - Main chat endpoint with actions

### Database
- `GET /api/db/state` - Get complete patient state
- `GET /api/db/tasks` - Get all tasks
- `POST /api/db/tasks` - Create task
- `PATCH /api/db/tasks` - Toggle task
- `DELETE /api/db/tasks?id=X` - Delete task

### LangGraph
- `POST /api/agent` - Direct agent invocation

## 🧪 Testing

```bash
# Build test
npm run build

# Manual testing
npm run dev
# Open http://localhost:3000
# Try: "Create a task to call my daughter"
```

## 🐛 Troubleshooting

**Database Issues**
```bash
rm -rf data/
npm run db:init
```

**Build Errors**
```bash
rm -rf node_modules .next
npm install
npm run build
```

**Chat Not Working**
- Check OpenAI API key in `.env.local`
- Restart dev server
- Check browser console for errors

## 📊 Current Status

✅ Multi-agent system operational  
✅ SQLite database integrated  
✅ CopilotKit chat interface  
✅ Task management working  
✅ Health tracking active  
✅ Production build passing  
✅ Full documentation complete  

## 🚧 Future Enhancements

- [ ] Voice input/output
- [ ] Multi-patient support with auth
- [ ] Family member dashboard
- [ ] Medication adherence analytics
- [ ] Health trend visualization
- [ ] Export patient data (PDF)
- [ ] Memory games integration
- [ ] Photo recognition for family

## 📝 License

This project is part of GreatUniHack2025.

## 🤝 Contributing

Built with ❤️ for Alzheimer's and Dementia patients.

---

**Version**: 2.0.0  
**Status**: Production Ready  
**Last Updated**: November 8, 2025
