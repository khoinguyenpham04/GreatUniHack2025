# Caretaker Workflow Documentation

## Overview

The caretaker workflow is designed for **healthcare professionals and family caretakers** using the `/dashboard/caretaker` interface. It provides a comprehensive multi-agent system for medical oversight and care management.

## Architecture

```
Caretaker Input
    ↓
Memory Agent (compassionate response)
    ↓
Supervisor Agent (intelligent routing)
    ↓
    ├─→ Task Agent (medication, caretaker tasks)
    ├─→ Health Agent (symptoms, severity tracking)
    └─→ END (general conversation)
```

## Agents

### 1. Memory Agent
**Purpose**: Provide initial compassionate response with patient context

**Features**:
- Accesses complete patient profile
- Reviews recent conversation history
- Provides contextual, fact-based responses
- Professional yet warm tone
- Grounded in medical data

**Data Sources**:
- Patient profile (name, age, diagnosis, medications)
- Conversation history (last 5 messages)
- Medical schedule

### 2. Supervisor Agent
**Purpose**: Intelligent routing to specialized agents

**Decisions**:
- **"task"**: Medication reminders, caretaker tasks
- **"health"**: Symptom reporting, health concerns
- **"memory"**: General conversation, no action needed

**Classification Method**:
- Uses GPT-4o-mini for intent classification
- Temperature: 0 (deterministic)
- Logs all routing decisions to `interactions` table

### 3. Task Agent
**Purpose**: Medication tracking and caretaker task management

**Features**:
- Creates medication reminders
- Tracks medication adherence
- Manages caretaker tasks
- Updates medication logs

**Data Sources**:
- `medications` table
- `tasks` table
- Patient medication schedule

**Example Operations**:
- "Create medication reminder" → Schedules from medication table
- "Patient took medicine" → Updates last_taken timestamp
- "Add task to check vitals" → Creates new task

### 4. Health Agent
**Purpose**: Symptom tracking with severity classification

**Features**:
- Extracts symptoms from natural language
- Classifies severity: low, medium, high
- Stores in `health_notes` table with timestamps
- Provides appropriate medical guidance

**Severity Classification**:
- **High**: Emergency symptoms (chest pain, severe bleeding, loss of consciousness)
- **Medium**: Concerning symptoms (persistent pain, high fever, breathing difficulty)
- **Low**: Minor symptoms (headache, mild nausea, fatigue)

**Example Interactions**:
```
Input: "Patient has severe chest pain"
→ Severity: HIGH
→ Response: "This requires immediate medical attention. Please call emergency services."

Input: "Patient has a mild headache"
→ Severity: LOW
→ Response: "I've noted the headache. Monitor and ensure adequate rest and hydration."
```

## Database Tables

### tasks
Caretaker tasks and medication reminders.

```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER,
  description TEXT,
  completed BOOLEAN,
  completed_at DATETIME,
  created_at DATETIME
);
```

### health_notes
Symptom tracking with severity.

```sql
CREATE TABLE health_notes (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER,
  note TEXT,
  severity TEXT,  -- 'low', 'medium', 'high'
  created_at DATETIME
);
```

### interactions
Agent routing analytics.

```sql
CREATE TABLE interactions (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER,
  input TEXT,
  route_decision TEXT,  -- 'task', 'health', 'memory'
  created_at DATETIME
);
```

## UI Components

### Patient Profile Card
- Name, age, diagnosis
- Medication schedule
- Last medication time

### Task List
- Active tasks with completion status
- Add/remove/complete tasks
- Medication reminders

### Memory Log Card
- Recent conversation history
- System interactions
- AI responses

### Health Notes Card
- Symptoms with severity indicators
- Color-coded by severity level
- Chronological ordering

### CopilotKit Chat Sidebar
- Full-featured AI chat
- Always visible sidebar
- Action buttons for quick tasks

## Workflow Behavior

### Compassionate Entry Point
All inputs are processed by Memory Agent first to ensure empathetic, context-aware initial response.

### Intelligent Routing
Supervisor Agent analyzes intent and routes to appropriate specialist:
- Medical terms, symptoms → Health Agent
- Medication, tasks, reminders → Task Agent
- Questions, conversation → END (Memory Agent response only)

### Data Persistence
- All conversations saved to `memory_logs`
- All routing decisions logged to `interactions`
- All health notes tracked with severity
- All tasks persisted with completion status

## Configuration

### LLM Settings
```typescript
Memory Agent:
  model: "gpt-4o-mini"
  temperature: 0.3  // Stable, factual responses

Supervisor Agent:
  model: "gpt-4o-mini"
  temperature: 0    // Deterministic routing

Task Agent:
  No LLM (direct database operations)

Health Agent:
  model: "gpt-4o-mini"
  temperature: 0.2  // Precise symptom classification
```

### Prompting Strategy
- Professional medical tone
- Fact-based responses
- Clear action recommendations
- Safety-first approach
- Detailed logging for audit trail

## Example User Flows

### Flow 1: Medication Reminder
```
1. Caretaker: "Create medication reminder"
2. Memory Agent: Compassionate acknowledgment
3. Supervisor: Routes to "task"
4. Task Agent: 
   - Loads medications from database
   - Creates tasks for each medication
   - Updates medication log
5. Response: "Created reminders for Donepezil (8am) and Memantine (8pm)"
```

### Flow 2: Symptom Reporting
```
1. Caretaker: "Patient has severe chest pain"
2. Memory Agent: Acknowledges concern
3. Supervisor: Routes to "health"
4. Health Agent:
   - Extracts symptom: "chest pain"
   - Classifies severity: HIGH
   - Stores in health_notes
5. Response: "⚠️ HIGH SEVERITY: This requires immediate medical attention. Please call emergency services."
```

### Flow 3: General Query
```
1. Caretaker: "What's the patient's medication schedule?"
2. Memory Agent: Provides schedule from database
3. Supervisor: Routes to END (no further action)
4. Response: "Mary takes Donepezil at 8am and Memantine at 8pm."
```

## Best Practices

### For Medical Safety
1. Always classify symptom severity
2. Provide clear action recommendations
3. Log all health-related interactions
4. Never override medical professional judgment
5. Escalate severe symptoms immediately

### For Medication Management
1. Track all medication times
2. Monitor adherence patterns
3. Alert on missed medications
4. Maintain complete audit trail

### For Task Management
1. Clear task descriptions
2. Priority indicators
3. Completion tracking
4. Regular review prompts

## Analytics & Monitoring

### Interaction Tracking
The `interactions` table provides insights into:
- Most common routing decisions
- Agent usage patterns
- User behavior analysis
- System performance metrics

### Health Tracking
The `health_notes` table enables:
- Symptom trend analysis
- Severity distribution
- Condition monitoring
- Report generation

## Future Enhancements

- [ ] Medication adherence analytics
- [ ] Health trend visualization
- [ ] Multi-patient support
- [ ] Family member notifications
- [ ] Export reports (PDF)
- [ ] Integration with EHR systems
- [ ] Voice notes transcription
- [ ] Automated scheduling

