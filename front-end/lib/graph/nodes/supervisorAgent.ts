import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";
import { InteractionDB } from "@/lib/db";
import { SessionManager } from "@/lib/session-manager";

// Low temperature for deterministic routing fallback
const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0 });

export async function supervisorAgent(state: PatientState): Promise<PatientState> {
  const patientId = 1;
  const rawInput = state.input;
  const input = rawInput.toLowerCase();

  const session = SessionManager.getSession(patientId);
  console.log(`\n🎯 Supervisor: input="${rawInput}" activeAgent=${session.activeAgent || 'none'}`);

  // End session keywords
  const endKeywords = ['thanks', 'done', 'stop', 'nevermind', 'never mind', 'that\'s all', 'goodbye'];
  if (session.activeAgent && endKeywords.some(k => input.includes(k))) {
    console.log(`🧹 Supervisor: Ending session for ${session.activeAgent}`);
    SessionManager.setActiveAgent(patientId, null);
    InteractionDB.log(patientId, rawInput, 'memory');
    return { ...state, routeDecision: 'memory' };
  }

  // Stay with current agent if follow-up matches continuation logic
  if (session.activeAgent && SessionManager.shouldStayActive(patientId, rawInput)) {
    console.log(`🔁 Supervisor: Staying with ${session.activeAgent}`);
    InteractionDB.log(patientId, rawInput, session.activeAgent);
    return { ...state, routeDecision: session.activeAgent };
  }

  // Keyword sets for initial or switching routing
  const comfortKeywords = [
    'miss','missing','lonely','sad','family','relative','loved','daughter','son','grandchild','grandson','granddaughter','spouse','wife','husband','mother','father','sister','brother','photo','picture','pic','image','voice','call','see','hear','sarah','michael','emma'
  ];
  const taskKeywords = ['remind','reminder','task','tasks','medication','pills','appointment','schedule','today','tomorrow','later'];
  const healthKeywords = ['pain','hurt','sick','ill','dizzy','nausea','nauseous','headache','feel bad','symptom','doctor'];

  const hasComfort = comfortKeywords.some(k => input.includes(k));
  const hasTask = taskKeywords.some(k => input.includes(k));
  const hasHealth = healthKeywords.some(k => input.includes(k));

  // Priority: comfort > health > task for overlapping emotional utterances
  let decision: 'comfort' | 'task' | 'health' | 'memory' = 'memory';
  if (hasComfort) decision = 'comfort';
  else if (hasHealth) decision = 'health';
  else if (hasTask) decision = 'task';

  if (decision !== 'memory') {
    console.log(`🎯 Supervisor keyword route → ${decision.toUpperCase()}`);
    SessionManager.setActiveAgent(patientId, decision);
    InteractionDB.log(patientId, rawInput, decision);
    return { ...state, routeDecision: decision };
  }

  // Fallback to LLM classification
  const prompt = `Classify the patient input into one category: comfort, task, health, or memory.
Input: "${rawInput}"
Rules:
- comfort: family, loneliness, wanting photos, calls, emotional support
- task: reminders, scheduling, medication times
- health: symptoms, pain, sickness
- memory: anything else
Respond with ONLY the category word.`;

  try {
    const llm = await model.invoke(prompt);
    const content = typeof llm.content === 'string' ? llm.content : String(llm.content);
    const rawDecision = content.trim().toLowerCase();
    const valid = ['comfort','task','health','memory'].includes(rawDecision) ? rawDecision as any : 'memory';
    console.log(`🤖 Supervisor LLM route → ${valid.toUpperCase()}`);
    if (valid !== 'memory') SessionManager.setActiveAgent(patientId, valid);
    InteractionDB.log(patientId, rawInput, valid);
    return { ...state, routeDecision: valid };
  } catch (e) {
    console.error('❌ Supervisor LLM classification failed, defaulting to memory', e);
    InteractionDB.log(patientId, rawInput, 'memory');
    return { ...state, routeDecision: 'memory' };
  }
}
