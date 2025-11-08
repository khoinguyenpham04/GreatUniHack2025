# Patient Workflow Documentation

## Overview

The patient workflow is designed for **dementia patients** using the `/dashboard` interface. It provides a simplified, compassionate AI experience focused on memory recall and daily activity management.

## Architecture

```
Patient Input
    ↓
Memory Agent (with photo context)
    ↓
Simple Router
    ├─→ Task Agent (if activity-related)
    └─→ END (for memory/conversation)
```

## Agents

### 1. Memory Agent
**Purpose**: Help patients recall memories and maintain emotional connection

**Features**:
- Access to memory photos from database (`memory_photos` table)
- Loads 3 random memory photos with descriptions for context
- Uses warm, simple language (2-3 sentences max)
- Never mentions diagnosis or medical condition
- Focuses on positive memories and familiar people

**Data Sources**:
- Patient profile (name, age)
- Recent conversation history (last 5 messages)
- Memory photos with descriptions

**Example Interactions**:
```
Patient: "Who is Linda?"
Agent: "Linda is your granddaughter! You had Sunday brunch together. She's one of your favorite girls."

Patient: "Tell me about the photo"
Agent: "That's from when Linda brought her best friend over after school. They were inseparable that day."
```

### 2. Task Agent
**Purpose**: Manage daily activities (to-do list)

**Features**:
- Works with `daily_activities` table
- Simple CRUD operations (Add, Remove, Show)
- Uses natural language processing to understand intent
- Automatically updates UI when activities change

**Supported Operations**:
- **ADD**: "Add water the plants to my to-do"
- **REMOVE**: "Remove the walk task"
- **SHOW**: "What are my activities?"

## Database Tables

### memory_photos
Stores photos with memory descriptions for recall assistance.

```sql
CREATE TABLE memory_photos (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER,
  photo_path TEXT,          -- e.g., '/linda-and-her-bestfriend.jpg'
  memory_description TEXT,  -- e.g., 'Linda brought her best friend over...'
  created_at DATETIME
);
```

### daily_activities
Stores patient's daily to-do activities.

```sql
CREATE TABLE daily_activities (
  id INTEGER PRIMARY KEY,
  patient_id INTEGER,
  activity TEXT,           -- e.g., 'Call Sarah about weekend plans'
  icon TEXT,              -- Optional emoji/icon
  is_active BOOLEAN,      -- Toggle for soft delete
  created_at DATETIME
);
```

## UI Components

### Daily Tasks Card
- Clean, minimal todo-list style
- Checkboxes for activities
- Real-time updates from database
- Shadcn design aesthetic

### Memory Photo Carousel
- Infinite horizontal scroll
- Hover to pause
- Gradual edge fade effect
- Displays photos with memory descriptions

### Chat Input
- ChatGPT-style interface at bottom
- Rounded pill design
- Voice input button (future feature)
- Send button

## Workflow Behavior

### Memory-First Approach
All inputs go through the Memory Agent first to ensure warm, contextual responses.

### Intelligent Routing
Simple keyword detection routes to Task Agent:
- Keywords: task, todo, activity, add, remove, delete, complete
- All other inputs stay with Memory Agent

### Context Awareness
- Agents load fresh data from database on each interaction
- Memory photos provide visual context for recall
- Conversation history maintains continuity

## Configuration

### LLM Settings
```typescript
model: "gpt-4o-mini"
temperature: 0.3  // Stable and factual for memory
temperature: 0.2  // Precise for task operations
```

### Prompting Strategy
- Short, simple sentences
- Warm, reassuring tone
- Never hallucinate facts
- Ground responses in patient profile and photos
- Focus on familiar people and positive memories

## Example User Flows

### Flow 1: Memory Recall
```
1. Patient: "Tell me about my family"
2. Memory Agent loads random photos
3. Agent: "You have wonderful photos! Your granddaughter Linda and daughter Stacy came for brunch. It was a lovely Sunday together."
```

### Flow 2: Activity Management
```
1. Patient: "Add call the doctor to my list"
2. Router detects "add" keyword → Task Agent
3. Task Agent: Adds "Call the doctor" to daily_activities
4. UI updates automatically
5. Response: "I've added that to your activities for today."
```

### Flow 3: General Conversation
```
1. Patient: "How are you?"
2. Memory Agent responds warmly
3. Agent: "I'm here for you, Mary. How are you feeling today?"
```

## Best Practices

### For Memory Agent
1. Always use patient's first name
2. Reference specific photos and people
3. Keep responses under 3 sentences
4. Use present tense for better clarity
5. Avoid complex medical terminology

### For Task Agent
1. Confirm actions clearly
2. Use simple, direct language
3. Show updated list after changes
4. Avoid overwhelming with too many options

## Future Enhancements

- [ ] Voice input/output integration
- [ ] Photo upload by family members
- [ ] Video memories support
- [ ] Facial recognition for automatic tagging
- [ ] Location-based memory triggers
- [ ] Daily summary reports

