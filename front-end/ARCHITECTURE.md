# Multi-Agent Dementia Companion System Architecture

## 🧠 System Overview

This application is a sophisticated multi-agent AI system designed to assist Alzheimer's and dementia patients. It combines **LangGraph** for agent orchestration with **CopilotKit** for the conversational interface.

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      User Interface (React)                  │
│  ┌────────────┬──────────────┬───────────────┬────────────┐ │
│  │  Profile   │  Task List   │  Memory Log   │  Health    │ │
│  │   Card     │   Component  │   Component   │   Notes    │ │
│  └────────────┴──────────────┴───────────────┴────────────┘ │
│                                                               │
│                   CopilotKit Chat Interface                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CopilotKit Runtime API                          │
│  Actions: createTask | checkHealth | getPatientInfo         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   LangGraph Multi-Agent System               │
│                                                               │
│   ┌──────────────┐        ┌──────────────┐                  │
│   │    START     │───────▶│Memory Agent  │                  │
│   └──────────────┘        └──────┬───────┘                  │
│                                   │                           │
│                                   ▼                           │
│                          ┌─────────────────┐                 │
│                          │Supervisor Agent │                 │
│                          └────────┬─────────┘                │
│                                   │                           │
│                    ┌──────────────┼──────────────┐           │
│                    │              │              │           │
│                    ▼              ▼              ▼           │
│             ┌────────────┐ ┌───────────┐ ┌──────────┐      │
│             │Task Agent  │ │Health     │ │Memory    │      │
│             │            │ │Agent      │ │Response  │      │
│             └─────┬──────┘ └─────┬─────┘ └─────┬────┘      │
│                   │              │             │            │
│                   └──────────────┼─────────────┘            │
│                                  ▼                           │
│                            ┌──────────┐                      │
│                            │   END    │                      │
│                            └──────────┘                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MCP Tools Layer                         │
│  getPatientMemory() | updateMedicationLog()                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Patient Data (patient.json)                │
│  Profile, Medications, Last Med Time                         │
└─────────────────────────────────────────────────────────────┘
```

## 🤖 Agent Descriptions

### 1. Memory Agent (`memoryAgent.ts`)
**Purpose**: First point of contact for all patient interactions

**Behavior**:
- Uses GPT-4o-mini with low temperature (0.3) for stable responses
- Always responds compassionately using patient profile
- Maintains conversation context in `memoryLog`
- Uses structured prompts with patient profile data

**Key Features**:
- Personalized responses based on name, age, diagnosis
- Short, calm sentences suitable for dementia patients
- Never hallucinates medical facts
- Reassures confused patients gently

### 2. Supervisor Agent (`supervisorAgent.ts`)
**Purpose**: Routes patient input to appropriate specialized agent

**Routing Logic**:
- `"task"` → Task Agent (for reminders, to-dos)
- `"health"` → Health Agent (for symptoms, concerns)
- `"memory"` → Returns to conversation (default)

**Implementation**:
- Uses GPT-4o-mini for classification
- Returns routing decision in state

### 3. Task Agent (`taskAgent.ts`)
**Purpose**: Creates and manages tasks and medication reminders

**Features**:
- Calls MCP tools for patient data
- Creates medication reminders from schedule
- Updates medication log with timestamps
- Adds tasks to state array

**Integration**:
- Uses `callMCP()` to fetch patient memory
- Updates `patient.json` with medication times

### 4. Health Agent (`healthAgent.ts`)
**Purpose**: Extracts and tracks health symptoms and concerns

**Features**:
- Analyzes patient input for health-related information
- Extracts symptoms from natural language
- Stores concerns in `healthNotes` array
- Returns "None" if no health concerns detected

**Use Cases**:
- "I have a headache" → Tracked
- "Feeling dizzy" → Tracked
- General conversation → Ignored

## 📊 State Management

### PatientState Schema
```typescript
{
  // Profile (Static)
  name: string
  age: number
  diagnosis: string
  med_schedule: string[]
  
  // Dynamic State
  input: string           // Current user input
  memoryLog: string[]     // Conversation history
  tasks: string[]         // Active tasks/reminders
  healthNotes: string[]   // Tracked symptoms
  routeDecision?: string  // Routing decision from supervisor
}
```

### State Flow
1. User input enters through CopilotKit
2. Memory Agent processes and adds to memoryLog
3. Supervisor classifies and routes
4. Specialized agent (Task/Health) processes
5. State updates propagate to UI components
6. React Context updates UI in real-time

## 🎨 UI Components

### 1. Patient Profile Card (`patient-profile-card.tsx`)
- Displays patient information
- Shows medication schedule
- Tracks last medication time
- Color-coded: Blue theme

### 2. Task List (`task-list.tsx`)
- Interactive task management
- Checkbox to complete tasks
- Delete button for removal
- Strike-through for completed items

### 3. Memory Log Card (`memory-log-card.tsx`)
- Shows last 5 conversation interactions
- Scrollable for history
- Purple theme
- Auto-updates on new messages

### 4. Health Notes Card (`health-notes-card.tsx`)
- Displays tracked health concerns
- Numbered notes
- Orange/warning theme
- Empty state when no concerns

## 🔧 Context Providers

### TaskProvider (`task-context.tsx`)
```typescript
{
  tasks: Task[]
  addTask: (description: string) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
}
```

### PatientStateProvider (`state-context.tsx`)
```typescript
{
  memoryLog: string[]
  healthNotes: string[]
  addMemory: (memory: string) => void
  addHealthNote: (note: string) => void
}
```

## 🔌 CopilotKit Integration

### Available Actions

#### `createTask`
```typescript
Parameters: { taskDescription: string }
Handler: Adds task to state and invokes LangGraph
Returns: Success message with task confirmation
```

#### `checkHealth`
```typescript
Parameters: { symptom: string }
Handler: Routes to health agent, tracks symptom
Returns: Confirmation and health notes
```

#### `getPatientInfo`
```typescript
Parameters: none
Handler: Returns current patient profile and state
Returns: Profile data and current state
```

## 📁 File Structure

```
front-end/
├── app/
│   ├── api/
│   │   ├── agent/route.ts          # Original LangGraph endpoint
│   │   ├── copilotkit/route.ts     # CopilotKit runtime with actions
│   │   └── mcp/route.ts            # MCP tools endpoint
│   ├── page.tsx                    # Main UI with all components
│   └── layout.tsx                  # Root layout
├── components/
│   ├── patient-profile-card.tsx    # Patient info display
│   ├── task-list.tsx              # Task management
│   ├── memory-log-card.tsx        # Conversation history
│   └── health-notes-card.tsx      # Health tracking
├── lib/
│   ├── graph/
│   │   ├── index.ts               # LangGraph compilation
│   │   └── nodes/
│   │       ├── memoryAgent.ts     # Compassionate AI agent
│   │       ├── supervisorAgent.ts # Router agent
│   │       ├── taskAgent.ts       # Task creation agent
│   │       └── healthAgent.ts     # Health tracking agent
│   ├── mcp/
│   │   ├── client.ts              # MCP tool caller
│   │   └── tools.ts               # MCP tool implementations
│   ├── task-context.tsx           # Task state management
│   ├── state-context.tsx          # Patient state management
│   ├── types.ts                   # TypeScript definitions
│   └── patient.json               # Patient data store
```

## 🚀 Usage Examples

### Creating Tasks
**User**: "Create a task to take medication at 2pm"
**Flow**: 
1. CopilotKit captures intent
2. `createTask` action triggered
3. LangGraph processes through Memory → Supervisor → Task Agent
4. Task added to UI instantly
5. Memory log updated

### Health Tracking
**User**: "I have a headache and feel dizzy"
**Flow**:
1. `checkHealth` action triggered
2. Supervisor routes to Health Agent
3. Health Agent extracts: "headache and dizzy"
4. Added to health notes
5. UI updates with orange alert card

### General Conversation
**User**: "What's my medication schedule?"
**Flow**:
1. Memory Agent responds using profile
2. Supervisor routes to memory (default)
3. Compassionate response generated
4. Memory log updated
5. No other actions triggered

## 🔐 Environment Variables

```bash
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # For MCP calls
```

## 🎯 Key Features

✅ **Real-time State Sync**: UI updates instantly via React Context  
✅ **Multi-Agent Processing**: Specialized agents for different tasks  
✅ **Compassionate AI**: Memory agent tailored for dementia patients  
✅ **Health Monitoring**: Automatic symptom extraction and tracking  
✅ **Task Management**: Interactive task creation and completion  
✅ **Conversation Memory**: Full history maintained in memory log  
✅ **MCP Integration**: Persistent data storage and retrieval  
✅ **Type Safety**: Full TypeScript with Zod schemas  

## 🚧 Future Enhancements

- [ ] Database integration (replace in-memory state)
- [ ] Voice input/output for accessibility
- [ ] Family member dashboard
- [ ] Medication reminders with notifications
- [ ] Health trend visualization
- [ ] Multi-patient support
- [ ] Integration with calendar apps
- [ ] Emergency contact alerts
- [ ] Memory games and cognitive exercises
- [ ] Photo recognition for family members

## 🐛 Troubleshooting

**Issue**: Tasks not appearing  
**Solution**: Check CopilotKit API route is running, verify OPENAI_API_KEY

**Issue**: Health notes empty  
**Solution**: Health Agent only extracts actual symptoms, try explicit health language

**Issue**: Memory log not updating  
**Solution**: Ensure PatientStateProvider wraps the app, check context usage

**Issue**: Build errors  
**Solution**: Run `npm install` to ensure all dependencies installed

## 📝 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📚 Technologies Used

- **Next.js 16** - React framework
- **LangGraph** - Multi-agent orchestration
- **LangChain** - LLM integration
- **CopilotKit** - Conversational UI
- **OpenAI GPT-4o** - Language model
- **TailwindCSS** - Styling
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **Radix UI** - Component primitives

---

Built with ❤️ for Alzheimer's and Dementia patients

