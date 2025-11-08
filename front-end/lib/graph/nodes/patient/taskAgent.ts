import { PatientState } from "@/lib/types";
import { PatientDB, DailyActivityDB } from "@/lib/db";
import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.2,
});

export async function taskAgent(state: PatientState): Promise<PatientState> {
  const patientId = 1; // Default patient

  // Get patient profile from database
  const profile = PatientDB.getProfile(patientId);
  if (!profile) {
    throw new Error("Patient profile not found in database");
  }

  // Get current daily activities
  const currentActivities = DailyActivityDB.getActive(patientId);
  const activitiesList = currentActivities.map((a) => `- ${a.activity}`).join("\n");

  // Determine what the patient wants to do with their tasks
  const systemPrompt = `You are helping ${profile.name} manage their daily activities.

CURRENT ACTIVITIES:
${activitiesList}

Analyze what the patient wants to do:
- If they want to ADD a new activity, respond with: ADD: [activity description]
- If they want to REMOVE an activity, respond with: REMOVE: [activity description]
- If they just want to SEE their activities, respond with: SHOW

Keep your response in this exact format.`;

  const reply = await model.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: state.input },
  ]);

  const replyContent = typeof reply.content === 'string' ? reply.content : String(reply.content);
  
  // Process the action
  if (replyContent.startsWith("ADD:")) {
    const newActivity = replyContent.replace("ADD:", "").trim();
    DailyActivityDB.add(patientId, newActivity);
  } else if (replyContent.startsWith("REMOVE:")) {
    const activityToRemove = replyContent.replace("REMOVE:", "").trim();
    // Find matching activity and toggle it inactive
    const matching = currentActivities.find((a) => 
      a.activity.toLowerCase().includes(activityToRemove.toLowerCase())
    );
    if (matching) {
      DailyActivityDB.toggleActive(matching.id);
    }
  }

  // Get updated activities
  const updatedActivities = DailyActivityDB.getActive(patientId);
  const taskDescriptions = updatedActivities.map((a) => a.activity);

  return {
    ...state,
    tasks: taskDescriptions,
  };
}
