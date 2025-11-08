# 🗄️ SQLite Database Integration

## Overview

The multi-agent system now uses **SQLite** as the persistent storage layer instead of in-memory state. All patient data, conversations, tasks, and health notes are stored in a relational database.

## Why SQLite?

✅ **Persistent Storage**: Data survives server restarts  
✅ **Relational Structure**: Proper data modeling with foreign keys  
✅ **Zero Configuration**: No external database server needed  
✅ **Production Ready**: Used by applications serving millions  
✅ **ACID Compliant**: Reliable transactions  
✅ **Fast**: Suitable for high-performance applications  

---

## Database Schema

### Tables

#### 1. **patients**
Stores patient profile information
```sql
CREATE TABLE patients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  diagnosis TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. **medications**
Patient medication schedule (one-to-many with patients)
```sql
CREATE TABLE medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  medication_name TEXT NOT NULL,
  schedule_time TEXT NOT NULL,  -- e.g., "8am", "8pm"
  last_taken DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 3. **memory_logs**
Conversation history between patient and AI
```sql
CREATE TABLE memory_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  role TEXT DEFAULT 'assistant',  -- 'user' or 'assistant'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 4. **tasks**
Patient tasks and reminders
```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 5. **health_notes**
Tracked symptoms and health concerns
```sql
CREATE TABLE health_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  severity TEXT DEFAULT 'low',  -- 'low', 'medium', 'high'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

#### 6. **interactions**
Logs all agent interactions for analytics
```sql
CREATE TABLE interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id INTEGER NOT NULL,
  input TEXT NOT NULL,
  route_decision TEXT,  -- 'task', 'health', 'memory'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
```

---

## File Structure

```
lib/
├── db/
│   ├── schema.ts        # Database schema definitions
│   ├── index.ts         # Database operations (CRUD)
│   └── init.ts          # Database initialization script
├── graph/
│   └── nodes/
│       ├── memoryAgent.ts      # Now pulls from MemoryDB
│       ├── supervisorAgent.ts  # Logs to InteractionDB
│       ├── taskAgent.ts        # Reads/writes TaskDB
│       └── healthAgent.ts      # Reads/writes HealthDB
└── types.ts             # TypeScript types
```

---

## Database Operations (API)

### PatientDB
```typescript
// Get patient profile
PatientDB.getProfile(patientId: number)

// Update patient profile
PatientDB.updateProfile(patientId, { name?, age?, diagnosis? })
```

### MemoryDB
```typescript
// Add conversation entry
MemoryDB.add(patientId, content, role: 'user' | 'assistant')

// Get recent memories
MemoryDB.getRecent(patientId, limit = 10)

// Get all memories
MemoryDB.getAll(patientId)

// Clear old memories (keep last N)
MemoryDB.clearOld(patientId, keepLast = 50)
```

### TaskDB
```typescript
// Create task
TaskDB.create(patientId, description)

// Get all tasks
TaskDB.getAll(patientId, includeCompleted = true)

// Get active tasks only
TaskDB.getActive(patientId)

// Complete task
TaskDB.complete(taskId)

// Toggle task completion
TaskDB.toggle(taskId)

// Delete task
TaskDB.delete(taskId)
```

### HealthDB
```typescript
// Add health note
HealthDB.add(patientId, note, severity: 'low' | 'medium' | 'high')

// Get all health notes
HealthDB.getAll(patientId)

// Get recent health notes
HealthDB.getRecent(patientId, limit = 5)

// Delete health note
HealthDB.delete(noteId)
```

### MedicationDB
```typescript
// Get all medications
MedicationDB.getAll(patientId)

// Update last taken time
MedicationDB.updateLastTaken(medicationId)

// Update all medications (daily log)
MedicationDB.updateAllTaken(patientId)
```

### InteractionDB
```typescript
// Log interaction
InteractionDB.log(patientId, input, routeDecision?)

// Get interaction history
InteractionDB.getHistory(patientId, limit = 50)
```

---

## Agent Integration

### How Agents Use the Database

#### 1. Memory Agent (`memoryAgent.ts`)
**Before**: Used in-memory state passed through LangGraph  
**After**: Queries database for patient profile and conversation history

```typescript
// Get fresh patient data
const profile = PatientDB.getProfile(patientId);

// Get recent conversation history
const recentMemories = MemoryDB.getRecent(patientId, 5);

// Save conversation to database
MemoryDB.add(patientId, input, "user");
MemoryDB.add(patientId, replyContent, "assistant");
```

#### 2. Supervisor Agent (`supervisorAgent.ts`)
**Before**: Only classified input  
**After**: Logs interactions for analytics

```typescript
// Log interaction to database
InteractionDB.log(patientId, state.input, decision);
```

#### 3. Task Agent (`taskAgent.ts`)
**Before**: Used MCP calls to patient.json  
**After**: Reads medications and creates tasks in database

```typescript
// Get medications from database
const medications = MedicationDB.getAll(patientId);

// Create task in database
TaskDB.create(patientId, taskDescription);

// Get all active tasks
const activeTasks = TaskDB.getActive(patientId);
```

#### 4. Health Agent (`healthAgent.ts`)
**Before**: Appended to in-memory array  
**After**: Saves to database with severity classification

```typescript
// Save to database with severity
HealthDB.add(patientId, symptom, severity);

// Get all recent health notes
const healthNotes = HealthDB.getRecent(patientId, 10);
```

---

## API Endpoints

### GET `/api/db/state`
Get complete patient state from database
```typescript
{
  success: true,
  data: {
    profile: { name, age, diagnosis, medications },
    tasks: [{ id, description, completed, createdAt }],
    healthNotes: [{ id, note, severity, createdAt }],
    memoryLog: [{ content, role, createdAt }]
  }
}
```

### GET `/api/db/tasks`
Get all tasks
```bash
GET /api/db/tasks?completed=true  # Include completed tasks
```

### POST `/api/db/tasks`
Create a new task
```typescript
{
  description: "Take medication at 2pm"
}
```

### PATCH `/api/db/tasks`
Toggle task completion
```typescript
{
  taskId: 123
}
```

### DELETE `/api/db/tasks?id=123`
Delete a task

---

## Setup & Usage

### 1. Database Initialization

The database is automatically initialized when you run:
```bash
npm run dev   # Initializes DB, then starts dev server
npm run build # Initializes DB, then builds
```

**Manual initialization:**
```bash
npm run db:init
```

### 2. Database Location

The database file is created at:
```
front-end/data/patients.db
```

This directory is in `.gitignore`, so database files won't be committed.

### 3. Reset Database

To reset the database and start fresh:
```bash
npm run db:reset
```

This will:
1. Delete the existing database file
2. Recreate it with the schema
3. Seed with default patient data (Mary Thompson)

---

## Seeded Data

The database is automatically seeded with:

**Patient:**
- Name: Mary Thompson
- Age: 76
- Diagnosis: Early-stage Alzheimer's

**Medications:**
- 8am Donepezil
- 8pm Memantine

---

## Migration from In-Memory to Database

### What Changed

#### Before (In-Memory)
```typescript
// State passed through LangGraph
let globalState: PatientState = {
  name: "Mary Thompson",
  tasks: [],
  memoryLog: [],
  // ... lost on server restart
};
```

#### After (Database)
```typescript
// State loaded from database
const state = getPatientState(patientId);
// Persists across server restarts
```

### Backward Compatibility

- ✅ Old `/api/agent` endpoint still works
- ✅ LangGraph state schema unchanged
- ✅ All existing components work without changes
- ✅ Agents enhanced with database context

---

## Benefits

### For Agents
1. **Rich Context**: Agents access full conversation history
2. **Accurate Data**: Always fresh from database
3. **Historical Analysis**: Can reference past interactions
4. **Better Responses**: More context = better AI decisions

### For Development
1. **Debug Friendly**: Inspect database directly with SQLite tools
2. **Testing**: Easy to seed test data
3. **Analytics**: Query interaction patterns
4. **Scalability**: Easy to add more tables/features

### For Production
1. **Persistence**: No data loss on restart
2. **Reliability**: ACID transactions
3. **Performance**: Fast local queries
4. **Backup**: Simple file-based backups

---

## Database Tools

### View Database Contents

**Using SQLite CLI:**
```bash
cd front-end/data
sqlite3 patients.db

# List tables
.tables

# View patients
SELECT * FROM patients;

# View recent conversations
SELECT * FROM memory_logs ORDER BY created_at DESC LIMIT 10;

# View active tasks
SELECT * FROM tasks WHERE completed = 0;
```

**Using DB Browser for SQLite (GUI):**
1. Download from https://sqlitebrowser.org/
2. Open `front-end/data/patients.db`
3. Browse data, run queries, export data

---

## Performance Considerations

### Indexes
All foreign keys have indexes for fast lookups:
```sql
CREATE INDEX idx_memory_logs_patient ON memory_logs(patient_id);
CREATE INDEX idx_tasks_patient ON tasks(patient_id);
CREATE INDEX idx_health_notes_patient ON health_notes(patient_id);
```

### Memory Management
- `MemoryDB.clearOld()` keeps only last 50 messages
- Prevents unbounded growth
- Call periodically or after each interaction

---

## Future Enhancements

### Potential Features
- [ ] Multi-patient support (already structured for it!)
- [ ] User authentication and patient sessions
- [ ] Caregiver notes and family access
- [ ] Medication adherence tracking
- [ ] Health trend analytics
- [ ] Export patient data (PDF reports)
- [ ] Backup/restore functionality
- [ ] Database migrations for schema changes

### Scaling Options
- **More Patients**: Already supports multiple patients
- **Cloud Sync**: Add sync to PostgreSQL or cloud DB
- **Analytics**: Add aggregation tables
- **Caching**: Add Redis for hot data

---

## Troubleshooting

### Database locked
**Issue**: `Error: database is locked`  
**Solution**: Close other connections, only one write at a time

### Missing data directory
**Issue**: `Error: ENOENT: no such file or directory`  
**Solution**: Run `npm run db:init`

### Build fails
**Issue**: Database not initialized  
**Solution**: Scripts auto-initialize, but you can manually run `npm run db:init`

### Reset not working
**Issue**: Database file permissions  
**Solution**: 
```bash
rm -rf data/
npm run db:init
```

---

## Example Queries

### Get patient summary
```typescript
const profile = PatientDB.getProfile(1);
const tasks = TaskDB.getActive(1);
const health = HealthDB.getRecent(1, 5);
const conversations = MemoryDB.getRecent(1, 10);
```

### Track medication adherence
```typescript
const meds = MedicationDB.getAll(1);
const adherence = meds.map(m => ({
  medication: m.medication_name,
  lastTaken: m.last_taken,
  onTime: /* calculate based on schedule_time */
}));
```

### Analyze interaction patterns
```typescript
const history = InteractionDB.getHistory(1, 100);
const routeCounts = history.reduce((acc, i) => {
  acc[i.route_decision] = (acc[i.route_decision] || 0) + 1;
  return acc;
}, {});
// { task: 45, health: 20, memory: 35 }
```

---

## Summary

✅ **SQLite database successfully integrated**  
✅ **6 tables with proper relationships**  
✅ **All 4 agents updated to use database**  
✅ **Persistent storage across restarts**  
✅ **Auto-initialization on build/dev**  
✅ **Production build passes**  
✅ **Backward compatible with existing code**  

The database provides a solid foundation for a production-ready dementia companion system with persistent, reliable data storage.

---

**Database Location**: `/data/patients.db`  
**Initialization**: Automatic via `npm run dev` or `npm run build`  
**Reset**: `npm run db:reset`  
**Status**: ✅ Fully Operational

