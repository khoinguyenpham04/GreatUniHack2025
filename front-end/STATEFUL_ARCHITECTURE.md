# Multi-Turn Stateful Agent Architecture

## Overview
The system has been upgraded from **one-shot** to **stateful multi-turn** conversations. Agents now maintain context across multiple messages until task completion.

## Architecture Changes

### Before (One-Shot)
```
User: "I miss Sarah"
→ memoryAgent → supervisorAgent → comfortAgent → END
User: "Show me a picture of her"
→ memoryAgent → supervisorAgent → ??? (no context about "her")
```

### After (Stateful Multi-Turn)
```
User: "I miss Sarah"
→ memoryAgent → supervisorAgent → comfortAgent (ACTIVE SESSION STARTS)
User: "Show me a picture of her"  
→ supervisorAgent (checks session, sees comfort agent active)
→ comfortAgent (receives conversation history, resolves "her" = Sarah)
User: "Thanks"
→ supervisorAgent (detects end keywords, clears session)
```

## Key Components

### 1. SessionManager (`/lib/session-manager.ts`)
**Purpose:** Track agent sessions across messages

**Data Structure:**
```typescript
AgentSession = {
  activeAgent: "comfort" | "task" | "health" | null,
  conversationHistory: Array<{role, content}>, // Last 10 messages
  contextData: any, // Agent-specific context (e.g., current loved one)
  lastActivity: Date
}
```

**Methods:**
- `getSession(patientId)` - Get or create session
- `setActiveAgent(patientId, agent)` - Mark agent as active
- `addMessage(patientId, role, content)` - Add to conversation history
- `clearSession(patientId)` - End session

**Auto-Cleanup:** Sessions expire after 30 minutes of inactivity

### 2. SupervisorAgent (`/lib/graph/nodes/supervisorAgent.ts`)
**New Logic:**

```typescript
// CHECK FOR ACTIVE SESSION
const session = SessionManager.getSession(patientId);
if (session.activeAgent) {
  // Check if user wants to end
  if (hasEndKeyword) {
    SessionManager.setActiveAgent(patientId, null);
    return { routeDecision: 'memory' };
  }
  
  // Check if user wants to switch agents
  if (hasDifferentAgentKeyword) {
    SessionManager.setActiveAgent(patientId, newAgent);
    return { routeDecision: newAgent };
  }
  
  // Continue with current agent
  return { routeDecision: session.activeAgent };
}

// NO ACTIVE SESSION - Use keyword/AI routing
// ... existing routing logic ...
// Set active agent for stateful routing
SessionManager.setActiveAgent(patientId, validDecision);
```

**Trigger Keywords:**
- **End session:** "thanks", "done", "stop", "nevermind", "that's all", "goodbye"
- **Switch to task:** "remind", "schedule", "appointment", "medication time"
- **Switch to health:** "pain", "hurt", "sick", "dizzy", "symptom"
- **Switch to comfort:** "miss", "lonely", "family", "photo", "picture", "call"

### 3. ComfortAgent (`/lib/graph/nodes/comfortAgent.ts`)
**Enhanced with Context:**

```typescript
// Build conversation context for pronoun resolution
let conversationContext = "";
if (state.conversationHistory && state.conversationHistory.length > 0) {
  conversationContext = "\n\nRecent conversation:\n" + 
    state.conversationHistory.slice(-4).map(msg => 
      `${msg.role === 'user' ? 'Patient' : 'You'}: ${msg.content}`
    ).join('\n');
}

const analysisPrompt = `
Patient's current message: "${state.input}"
${conversationContext}

Available loved ones: ...

IMPORTANT: Use the conversation history to resolve pronouns 
(e.g., "her" might refer to someone mentioned earlier).
`;
```

**Pronoun Resolution:** Can now correctly interpret:
- "I miss Sarah" → identifies Sarah Thompson
- "Show me a picture of her" → resolves "her" to Sarah from context

### 4. CopilotKit API (`/app/api/copilotkit/route.ts`)
**Session Integration:**

```typescript
handler: async ({ userMessage }) => {
  // Add user message to session
  SessionManager.addMessage(patientId, 'user', userMessage);
  
  // Get conversation history
  const session = SessionManager.getSession(patientId);
  
  const initialState = {
    ...dbState,
    input: userMessage,
    conversationHistory: session.conversationHistory, // NEW
  };

  const result = await patientGraph.invoke(initialState);
  
  // Add assistant response to session
  SessionManager.addMessage(patientId, 'assistant', responseText);

  return {
    success: true,
    route: result.routeDecision,
    activeAgent: session.activeAgent, // NEW
    message: responseText,
  };
}
```

### 5. Session API (`/app/api/session/route.ts`)
**NEW Endpoint** for UI synchronization

**GET /api/session:**
```json
{
  "success": true,
  "activeAgent": "comfort",
  "conversationHistory": [...],
  "lastActivity": "2025-01-19T10:30:00Z"
}
```

**DELETE /api/session:**
```json
{
  "success": true,
  "message": "Session cleared"
}
```

### 6. Dashboard UI (`/app/dashboard/page.tsx`)
**Session Polling:**

```typescript
React.useEffect(() => {
  const pollSession = async () => {
    const response = await fetch('/api/session');
    const data = await response.json();
    
    if (data.activeAgent) {
      setAgent(data.activeAgent); // Show indicator
    } else {
      reset(); // Clear indicator
    }
  };

  const interval = setInterval(pollSession, 2000); // Poll every 2s
  return () => clearInterval(interval);
}, []);
```

**UI Indicator:** `<AgentStatusIndicator>` now persists as long as agent is active

### 7. Type Updates (`/lib/types.ts`)
**Added Conversation History:**

```typescript
export const PatientStateSchema = z.object({
  // ... existing fields ...
  conversationHistory: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
});
```

## User Experience Flow

### Example 1: Comfort Agent Multi-Turn
```
👤 User: "I miss Sarah"
🤖 System: 
   - SupervisorAgent: Routes to comfort (keyword match)
   - SessionManager: Sets activeAgent = "comfort"
   - ComfortAgent: Finds Sarah Thompson (daughter)
   - Response: "💝 I know you miss Sarah. She's your daughter..."

👤 User: "Can you show me a picture of her?"
🤖 System:
   - SupervisorAgent: Sees activeAgent = "comfort", continues there
   - ComfortAgent: Gets conversation history, resolves "her" = Sarah
   - Response: "💝 Of course! Here are some photos of Sarah..."
   - Response includes: [sarah-1.jpg, sarah-2.jpg]

👤 User: "Thanks, that helps"
🤖 System:
   - SupervisorAgent: Detects "thanks" (end keyword)
   - SessionManager: Clears activeAgent
   - MemoryAgent: Logs conversation
   - UI: Agent indicator fades
```

### Example 2: Agent Switching
```
👤 User: "I miss my daughter"
🤖 System: Comfort agent activates

👤 User: "Actually, I have a headache"
🤖 System:
   - SupervisorAgent: Detects "headache" (health keyword)
   - SessionManager: Switches to activeAgent = "health"
   - HealthAgent: Records symptom
   - UI: Indicator changes from 💝 Comfort to 🏥 Health

👤 User: "It's getting worse"
🤖 System:
   - SupervisorAgent: Continues with health agent
   - HealthAgent: Updates symptom with context
```

## Benefits

### 1. Contextual Understanding
- **Before:** "Show me a picture of her" → No context
- **After:** "her" resolved to "Sarah" from previous message

### 2. Natural Conversations
- Users can have back-and-forth dialogues
- No need to repeat context in every message
- More human-like interaction

### 3. Task Continuity
- Comfort agent can guide user through multi-step processes:
  1. "I miss Sarah" → Shows info about Sarah
  2. "Show me photos" → Displays photos
  3. "Can I call her?" → Provides phone number
  
### 4. UI Feedback
- Agent indicator persists during session
- Clear visual feedback of which agent is active
- Auto-clears when session ends

### 5. Dementia-Friendly
- Conversation history helps with memory issues
- Pronouns resolved automatically
- Context maintained even if user forgets earlier parts

## Session Lifecycle

```
┌─────────────────────────────────────────────────┐
│ 1. USER MESSAGE                                 │
│    "I miss Sarah"                               │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 2. SESSION CHECK                                │
│    SessionManager.getSession()                  │
│    → No active agent                            │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 3. SUPERVISOR ROUTES                            │
│    Keyword match: "miss" → comfort              │
│    SessionManager.setActiveAgent("comfort")     │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 4. COMFORT AGENT PROCESSES                      │
│    Finds Sarah, generates response              │
│    SessionManager.addMessage(user + assistant)  │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 5. NEXT USER MESSAGE                            │
│    "Show me her photos"                         │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 6. SESSION CHECK                                │
│    SessionManager.getSession()                  │
│    → activeAgent = "comfort"                    │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 7. SUPERVISOR CONTINUES                         │
│    Session active, route to comfort             │
│    (no re-analysis needed)                      │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 8. COMFORT AGENT WITH CONTEXT                   │
│    Receives conversation history                │
│    Resolves "her" = Sarah                       │
│    Shows photos                                 │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 9. USER ENDS SESSION                            │
│    "Thanks"                                     │
└────────────┬────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────┐
│ 10. SESSION CLEARED                             │
│     SessionManager.setActiveAgent(null)         │
│     UI indicator fades                          │
└─────────────────────────────────────────────────┘
```

## Configuration

### Session Timeout
Change in `/lib/session-manager.ts`:
```typescript
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes (adjust as needed)
```

### UI Polling Interval
Change in `/app/dashboard/page.tsx`:
```typescript
const interval = setInterval(pollSession, 2000); // 2 seconds (adjust as needed)
```

### Conversation History Length
Change in `/lib/session-manager.ts`:
```typescript
static addMessage(patientId: number, role: string, content: string) {
  // Keep last 10 messages (adjust as needed)
  if (session.conversationHistory.length > 10) {
    session.conversationHistory.shift();
  }
}
```

## Testing

### Test Scenario 1: Basic Multi-Turn
1. Say "I miss Sarah"
   - ✅ Comfort agent activates
   - ✅ UI indicator shows 💝 Comfort Agent
2. Say "Show me a picture of her"
   - ✅ Comfort agent continues (no re-routing)
   - ✅ Photos displayed
   - ✅ UI indicator still shows 💝
3. Say "Thanks"
   - ✅ Session clears
   - ✅ UI indicator fades

### Test Scenario 2: Agent Switching
1. Say "I miss my daughter"
   - ✅ Comfort agent activates
2. Say "I have a headache"
   - ✅ Switches to health agent
   - ✅ UI indicator changes to 🏥
3. Say "It's really painful"
   - ✅ Health agent continues
   - ✅ UI indicator still 🏥

### Test Scenario 3: Session Timeout
1. Say "I miss Sarah"
   - ✅ Session starts
2. Wait 31 minutes
   - ✅ Session auto-clears
3. Say "Show me her photos"
   - ✅ No context (new session)

## Troubleshooting

### Issue: Agent not staying active
- Check: `/api/session` returns `activeAgent`
- Check: Dashboard polling is running
- Check: SessionManager not being cleared prematurely

### Issue: Pronouns not resolved
- Check: `conversationHistory` passed to agent
- Check: Agent prompt includes conversation context
- Check: Conversation history length sufficient

### Issue: Session never clears
- Check: End keywords detected in supervisor
- Check: Auto-cleanup interval running
- Check: Session timeout configured

### Issue: UI indicator not showing
- Check: `/api/session` endpoint accessible
- Check: Polling interval running
- Check: AgentStatusProvider wrapping component

## Future Enhancements

1. **Persistent Storage:** Save sessions to database for recovery after server restart
2. **Multi-Patient:** Support concurrent sessions for multiple patients
3. **Explicit Completion:** Add agent-specific completion signals (beyond keywords)
4. **Context Data:** Store agent-specific context (e.g., current loved one, task being created)
5. **Session History:** Log session transcripts for caregiver review
6. **Proactive Ending:** Agent suggests ending when task complete ("Is there anything else?")

## Summary

The stateful architecture transforms the system from one-shot Q&A to continuous conversations. Agents maintain context, resolve pronouns, and stay active until tasks complete. This is especially valuable for dementia patients who benefit from:
- Contextual understanding of incomplete references
- Natural back-and-forth conversations
- Visual feedback of which agent is helping
- Continuous support without re-explaining context
