// In-memory session store (in production, use Redis or database)
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AgentSession {
  activeAgent: 'comfort' | 'task' | 'health' | 'memory' | null;
  conversationHistory: ConversationMessage[];
  contextData?: any; // Store current loved one, task being created, etc.
  lastActivity: number;
}

const sessions = new Map<string, AgentSession>();

// Clean up old sessions after 30 minutes of inactivity
setInterval(() => {
  const now = Date.now();
  for (const [key, session] of sessions.entries()) {
    if (now - session.lastActivity > 30 * 60 * 1000) {
      sessions.delete(key);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

export class SessionManager {
  private static getSessionKey(patientId: number): string {
    return `patient_${patientId}`;
  }

  static getSession(patientId: number): AgentSession {
    const key = this.getSessionKey(patientId);
    if (!sessions.has(key)) {
      sessions.set(key, {
        activeAgent: null,
        conversationHistory: [],
        lastActivity: Date.now(),
      });
    }
    return sessions.get(key)!;
  }

  static updateSession(patientId: number, updates: Partial<AgentSession>) {
    const session = this.getSession(patientId);
    Object.assign(session, updates, { lastActivity: Date.now() });
  }

  static addMessage(patientId: number, role: 'user' | 'assistant', content: string) {
    const session = this.getSession(patientId);
    session.conversationHistory.push({ role, content, timestamp: Date.now() });
    // Keep only last 20 messages for deeper context (pronouns, multi-step)
    if (session.conversationHistory.length > 20) {
      session.conversationHistory = session.conversationHistory.slice(-20);
    }
    session.lastActivity = Date.now();
  }

  static setActiveAgent(patientId: number, agent: AgentSession['activeAgent']) {
    console.log(`🎯 Session: Setting active agent to ${agent?.toUpperCase() || 'NONE'}`);
    this.updateSession(patientId, { activeAgent: agent });
  }

  static setContextData(patientId: number, data: any) {
    this.updateSession(patientId, { contextData: data });
  }

  /**
   * Decide if we should keep current agent active based on user follow-up
   * This prevents premature switching when the user asks for related info.
   */
  static shouldStayActive(patientId: number, nextInput: string): boolean {
    const session = this.getSession(patientId);
    if (!session.activeAgent) return false;

    const text = nextInput.toLowerCase();
    const continuationMap: Record<string, string[]> = {
      comfort: ['more', 'another', 'again', 'see', 'show', 'picture', 'pic', 'photo', 'call', 'hear', 'voice', 'her', 'him', 'them'],
      task: ['another', 'also', 'add', 'remind', 'reminder', 'task', 'list', 'what else'],
      health: ['still', 'worse', 'more', 'also', 'pain', 'hurt'],
      memory: [],
    };

    const keywords = continuationMap[session.activeAgent] || [];
    const matches = keywords.some(k => text.includes(k));
    if (matches) {
      // refresh lastActivity only
      session.lastActivity = Date.now();
      return true;
    }
    return false;
  }

  static clearSession(patientId: number) {
    console.log(`🧹 Session: Cleared for patient ${patientId}`);
    sessions.delete(this.getSessionKey(patientId));
  }
}
