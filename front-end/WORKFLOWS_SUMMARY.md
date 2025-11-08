# Multi-Agent Workflow System Summary

## Overview

The Dementia Companion app features **two distinct multi-agent workflows** optimized for different user types:

1. **Patient Workflow** (`/dashboard`) - For dementia patients
2. **Caretaker Workflow** (`/dashboard/caretaker`) - For healthcare professionals

## Quick Comparison

| Feature | Patient Workflow | Caretaker Workflow |
|---------|-----------------|-------------------|
| **Target User** | Dementia patient | Healthcare professional |
| **Complexity** | Simple, streamlined | Comprehensive, multi-agent |
| **Agents** | 2 (Memory, Task) | 4 (Memory, Supervisor, Task, Health) |
| **Routing** | Keyword-based | AI-powered intelligent routing |
| **Focus** | Memory recall, daily activities | Medical oversight, care management |
| **Memory Photos** | ✅ Yes (for recall) | ❌ No (not needed) |
| **Health Tracking** | ❌ No (too complex) | ✅ Yes (with severity) |
| **Medication** | ❌ No (handled by caretaker) | ✅ Yes (full tracking) |
| **UI Style** | ChatGPT-like, photo carousel | Sidebar chat, data cards |
| **Tone** | Warm, simple, 2-3 sentences | Professional, detailed |

## Architecture Comparison

### Patient Workflow
```
User Input
    ↓
Memory Agent (with photo memories)
    ↓
Keyword Router
    ├─→ Task Agent (daily activities)
    └─→ END (conversation)
```

### Caretaker Workflow
```
User Input
    ↓
Memory Agent (compassionate response)
    ↓
Supervisor Agent (AI routing)
    ↓
    ├─→ Task Agent (medications)
    ├─→ Health Agent (symptoms)
    └─→ END (conversation)
```

## Database Schema Differences

### Patient-Specific Tables
- `daily_activities` - Simple to-do list for patients
- `memory_photos` - Photos with descriptions for memory recall
- `health_tips` - Friendly health reminders

### Caretaker-Specific Tables
- `tasks` - Medical tasks, medication reminders
- `health_notes` - Symptoms with severity classification
- `medications` - Full medication schedule with tracking
- `interactions` - Routing analytics

### Shared Tables
- `patients` - Patient profiles
- `memory_logs` - Conversation history

## Key Design Decisions

### Why Separate Workflows?

1. **Different Cognitive Abilities**
   - Patients need simple, clear interfaces
   - Caretakers handle complex medical data

2. **Different Information Needs**
   - Patients: emotional support, memory recall, daily routine
   - Caretakers: medical data, tracking, analytics

3. **Different Interaction Patterns**
   - Patients: conversational, photo-focused
   - Caretakers: task-focused, data-intensive

### Why Memory Photos Only for Patients?

- Helps trigger memory recall through visual cues
- Provides context for conversations
- Emotional connection through familiar faces
- Too distracting for caretaker medical workflow

### Why No Health Agent for Patients?

- Patients shouldn't self-diagnose
- Can cause anxiety and confusion
- Medical assessment should be done by caretakers
- Keeps patient experience simple and positive

## Usage Examples

### Patient Dashboard Example

```typescript
// Patient asks about photos
Input: "Tell me about this photo"

Memory Agent loads 3 random photos:
- Photo 1: Linda and her best friend after school
- Photo 2: Sunday brunch with Stacy and Linda
- Photo 3: Neighbor's grandchild visit

Response: "That's Linda with her best friend! They came 
over after school. You said they were inseparable that day."
```

### Caretaker Dashboard Example

```typescript
// Caretaker reports symptom
Input: "Patient has severe headache and fever"

Memory Agent: "I'll help you track this."
Supervisor: Routes to "health"
Health Agent:
  - Extracts: "headache", "fever"
  - Classifies: MEDIUM severity
  - Stores in health_notes table

Response: "I've recorded the headache and fever as medium 
severity. Monitor closely and consider consulting the doctor 
if symptoms worsen."
```

## Implementation Details

### File Structure

```
lib/graph/
├── index.ts                      # Main exports
├── patient-graph.ts              # Patient workflow
├── caretaker-graph.ts            # Caretaker workflow
└── nodes/
    ├── patient/
    │   ├── memoryAgent.ts        # With photo context
    │   └── taskAgent.ts          # Daily activities
    └── caretaker/
        ├── memoryAgent.ts        # Medical context
        ├── supervisorAgent.ts    # AI router
        ├── taskAgent.ts          # Medications
        └── healthAgent.ts        # Symptoms
```

### API Routes

```typescript
// Patient workflow
POST /api/copilotkit
  - Uses: patientGraph
  - Context: Memory photos, daily activities
  - Response: Simple, warm, photo-referenced

// Caretaker workflow  
POST /api/copilotkit
  - Uses: caretakerGraph
  - Context: Full medical data, tasks, health notes
  - Response: Professional, detailed, action-oriented
```

## Data Flow

### Patient Data Flow
1. User types message in ChatGPT-style input
2. Message sent to patient graph API
3. Memory agent loads random memory photos
4. Agent responds using photo context
5. If task-related, updates daily_activities
6. UI updates in real-time (tasks, carousel)

### Caretaker Data Flow
1. User types message in CopilotKit sidebar
2. Message sent to caretaker graph API
3. Memory agent provides initial response
4. Supervisor classifies intent
5. Specialized agent handles (task/health)
6. Updates appropriate tables
7. UI cards update (tasks, health notes, memory log)

## Testing & Validation

### Patient Workflow Testing
```bash
# Test memory recall
"Tell me about Linda"
→ Should reference photo memories

# Test task management
"Add call doctor to my list"
→ Should add to daily_activities

# Test general conversation
"How are you today?"
→ Should respond warmly with context
```

### Caretaker Workflow Testing
```bash
# Test medication
"Create medication reminder"
→ Should load from medications table

# Test health tracking
"Patient has severe chest pain"
→ Should classify as HIGH severity

# Test analytics
Check interactions table for routing stats
```

## Performance Considerations

### Database Optimization
- Indexed tables for fast queries
- Connection pooling with better-sqlite3
- Prepared statements for repeated queries

### LLM Optimization
- Appropriate model selection (gpt-4o-mini)
- Temperature tuning per agent
- Context window management
- Streaming responses (future)

## Future Roadmap

### Patient Features
- [ ] Voice input/output
- [ ] Video memories
- [ ] Location-based memory triggers
- [ ] Family photo uploads
- [ ] Daily summary emails

### Caretaker Features
- [ ] Advanced analytics dashboard
- [ ] Multi-patient management
- [ ] EHR integration
- [ ] Automated reports
- [ ] Alert notifications
- [ ] Calendar integration

### Shared Features
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Multi-language support
- [ ] Data export/import
- [ ] HIPAA compliance audit

## Documentation

- **[PATIENT_WORKFLOW.md](./PATIENT_WORKFLOW.md)** - Detailed patient workflow documentation
- **[CARETAKER_WORKFLOW.md](./CARETAKER_WORKFLOW.md)** - Detailed caretaker workflow documentation
- **[DATABASE.md](./DATABASE.md)** - Database schema and operations
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture overview

## Getting Started

### Setup
```bash
# Initialize database with both workflows
npm run db:init

# Start development server
npm run dev
```

### Access Points
- Patient Dashboard: http://localhost:3000/dashboard
- Caretaker Dashboard: http://localhost:3000/dashboard/caretaker
- Landing Page: http://localhost:3000

## Support

For questions or issues:
1. Check workflow-specific documentation
2. Review database schema
3. Examine example interactions
4. Test with provided use cases

---

**Version**: 2.0.0  
**Last Updated**: November 8, 2025  
**Status**: Production Ready

