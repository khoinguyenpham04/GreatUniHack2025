# Data Separation: Patient vs Caretaker

## Overview

The system uses **two separate database tables** for tasks to maintain clear separation between patient activities and caretaker medical responsibilities.

## Data Structure

### Patient Side (`/dashboard`)

#### Table: `daily_activities`
**Purpose**: Lightweight, self-directed activities for the patient

**Schema**:
```sql
CREATE TABLE daily_activities (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER,
  activity TEXT,           -- Patient-friendly description
  icon TEXT,              -- Optional icon
  is_active BOOLEAN,      -- Soft delete (toggle on/off)
  created_at DATETIME
);
```

**Example Data**:
- ✅ "Call Sarah about weekend plans"
- ✅ "Water the kitchen herbs"
- ✅ "Morning walk before 10am"
- ✅ "Finish reading chapter 3"

**Characteristics**:
- Simple, achievable tasks
- Things patient can do independently
- No medical procedures
- Family and social activities
- Personal hobbies and routines

### Caretaker Side (`/dashboard/caretaker`)

#### Table: `tasks`
**Purpose**: Medical and care-related tasks for healthcare professionals

**Schema**:
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER,
  description TEXT,           -- Detailed care instruction
  completed BOOLEAN,          -- Hard completion tracking
  completed_at DATETIME,      -- Timestamp of completion
  created_at DATETIME
);
```

**Example Data**:
- ✅ "Give patient morning medication (Donepezil 8am)"
- ✅ "Help patient change clothes after breakfast"
- ✅ "Check patient vital signs at noon"
- ✅ "Give patient evening medication (Memantine 8pm)"
- ✅ "Assist with evening routine and prepare for bed"

**Characteristics**:
- Medical procedures and medications
- Hands-on care tasks
- Professional responsibilities
- Health monitoring
- Assistance with activities of daily living (ADLs)

## Agent Access

### Patient Workflow

```
┌─────────────────────────────────────┐
│ Patient Agents                      │
├─────────────────────────────────────┤
│ Memory Agent                        │
│ ├─ PatientDB (profile)             │
│ ├─ MemoryDB (conversation)         │
│ └─ MemoryPhotoDB (photos)          │
│                                     │
│ Supervisor Agent                    │
│ └─ DailyActivityDB (context)       │
│                                     │
│ Task Agent                          │
│ └─ DailyActivityDB (read/write)    │
└─────────────────────────────────────┘

ACCESS: daily_activities, memory_photos, memory_logs
NO ACCESS: tasks, medications, health_notes
```

### Caretaker Workflow

```
┌─────────────────────────────────────┐
│ Caretaker Agents                    │
├─────────────────────────────────────┤
│ Memory Agent                        │
│ ├─ PatientDB (profile)             │
│ └─ MemoryDB (conversation)         │
│                                     │
│ Supervisor Agent                    │
│ └─ InteractionDB (logging)         │
│                                     │
│ Task Agent                          │
│ ├─ TaskDB (read/write)             │
│ └─ MedicationDB (read/write)       │
│                                     │
│ Health Agent                        │
│ └─ HealthDB (read/write)           │
└─────────────────────────────────────┘

ACCESS: tasks, medications, health_notes, memory_logs
NO ACCESS: daily_activities (patient only)
```

## UI Components

### Patient Dashboard (`/dashboard`)

**Components**:
- ✅ Daily Tasks Card → displays `daily_activities`
- ✅ Health Notes Card → displays `health_tips` (static reminders)
- ✅ Photo Carousel → displays `memory_photos`
- ✅ Chat Input → modifies `daily_activities`

**Data Flow**:
```
User types: "Add call doctor"
↓
Patient Graph API (workflow: 'patient')
↓
Supervisor routes to Task Agent
↓
DailyActivityDB.add(patientId, "Call doctor")
↓
Frontend refreshes: GET /api/db/patient-data
↓
UI updates: New task appears in Daily Tasks card
```

### Caretaker Dashboard (`/dashboard/caretaker`)

**Components**:
- ✅ TaskList Component → displays `tasks`
- ✅ PatientProfileCard → displays medications
- ✅ HealthNotesCard → displays `health_notes`
- ✅ MemoryLogCard → displays `memory_logs`
- ✅ CopilotKit Sidebar → modifies `tasks`, `health_notes`

**Data Flow**:
```
Caretaker: "Create medication reminder"
↓
Caretaker Graph API (workflow: 'caretaker')
↓
Supervisor routes to Task Agent
↓
TaskDB.create(patientId, "Take Donepezil at 8am")
↓
TaskContext refreshes: GET /api/db/tasks
↓
<TaskList /> updates: New task appears
```

## Why This Separation?

### 1. **Cognitive Load**
- Patients: Simple activities they can understand and complete
- Caretakers: Complex medical tasks requiring training

### 2. **Responsibility**
- Patients: Self-directed activities
- Caretakers: Professional care duties

### 3. **Safety**
- Patients: No access to medication tasks
- Caretakers: Full medical oversight

### 4. **Clarity**
- Clear distinction prevents confusion
- Each user sees only what's relevant
- Reduces cognitive burden on patients

## Database Operations

### Patient Operations (DailyActivityDB)

```typescript
// Add activity
DailyActivityDB.add(patientId, "Call Sarah about weekend plans");

// Remove (soft delete)
DailyActivityDB.toggleActive(activityId);

// List active
const activities = DailyActivityDB.getActive(patientId);
// Returns: ["Call Sarah", "Water herbs", ...]
```

### Caretaker Operations (TaskDB)

```typescript
// Create task
TaskDB.create(patientId, "Give patient morning medication");

// Complete task
TaskDB.complete(taskId);

// Delete task
TaskDB.delete(taskId);

// Toggle completion
TaskDB.toggle(taskId);

// List active tasks
const tasks = TaskDB.getActive(patientId);
// Returns: [{id: 1, description: "Give patient medication", ...}]
```

## API Endpoints

### Patient Data Endpoint
```
GET /api/db/patient-data

Returns:
- dailyActivities (from daily_activities table)
- healthTips (from health_tips table)
- memoryPhotos (from memory_photos table)
```

### Caretaker Tasks Endpoint
```
GET /api/db/tasks?completed=true
POST /api/db/tasks (create)
PATCH /api/db/tasks (toggle)
DELETE /api/db/tasks?id=X (delete)

Uses: tasks table via TaskDB
```

## Example Scenarios

### Scenario 1: Patient Self-Care
```
Patient Interface:
"Add water my plants"
↓
daily_activities table
↓
Displays in: "Today" card (patient dashboard)

Caretaker Interface:
Cannot see or modify patient's personal activities
Only sees medical tasks in <TaskList />
```

### Scenario 2: Caretaker Medical Task
```
Caretaker Interface:
"Create medication reminder"
↓
tasks table
↓
Displays in: <TaskList /> (caretaker dashboard)

Patient Interface:
Cannot see caretaker's medical tasks
Only sees their own daily activities
```

## Summary

| Aspect | Patient | Caretaker |
|--------|---------|-----------|
| **Table** | `daily_activities` | `tasks` |
| **DB Module** | `DailyActivityDB` | `TaskDB` |
| **UI Component** | Daily Tasks Card | `<TaskList />` |
| **API Endpoint** | `/api/db/patient-data` | `/api/db/tasks` |
| **Task Type** | Self-care, social, hobbies | Medical, care, assistance |
| **Examples** | Call family, read, walk | Give meds, change clothes, vitals |
| **Completion** | Soft delete (toggle) | Hard complete (tracked) |
| **Context** | `TaskContext` (caretaker only) | Local state (patient) |

## Key Takeaways

1. ✅ **Patient side**: `daily_activities` table (lightweight, self-directed)
2. ✅ **Caretaker side**: `tasks` table (medical, care-related)
3. ✅ **Clear separation**: No overlap, no confusion
4. ✅ **Independent workflows**: Each optimized for its user
5. ✅ **Database isolation**: Different tables, different agents

This architecture ensures patients maintain autonomy with simple tasks while caretakers handle complex medical responsibilities with full oversight.

---

**Version**: 2.0  
**Last Updated**: November 8, 2025

