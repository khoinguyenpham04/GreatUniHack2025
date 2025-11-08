import { ChatOpenAI } from "@langchain/openai";
import { PatientState } from "@/lib/types";
import { ComfortDB, MemoryDB } from "@/lib/db";

const model = new ChatOpenAI({ model: "gpt-4o-mini", temperature: 0.8 });

export async function comfortAgent(state: PatientState): Promise<PatientState> {
  const patientId = 1;
  const lovedOnes = ComfortDB.getLovedOnes(patientId);

  console.log(`💝 Comfort agent activated for: "${state.input}"`);
  console.log(`💝 Found ${lovedOnes.length} loved ones in database`);

  if (lovedOnes.length === 0) {
    console.warn("⚠️  No loved ones in database!");
    const fallbackMsg = `I understand you're thinking about your loved ones. While I don't have specific information right now, I'm here to support you. Would you like to talk about your family?`;
    MemoryDB.add(patientId, `[COMFORT] ${state.input} | ${fallbackMsg}`);
    return {
      ...state,
      memoryLog: [...state.memoryLog, fallbackMsg],
      comfortData: { message: fallbackMsg, error: "no_loved_ones" },
      routeDecision: "comfort"
    };
  }

  const analysisPrompt = `You are a warm, empathetic AI companion for ${state.name}, who has ${state.diagnosis}.

Patient said: "${state.input}"

Available loved ones:
${lovedOnes.map(lo => `- ${lo.name} (${lo.relationship})`).join('\n')}

Analyze their emotional state and needs:
1. Which specific person are they asking about? (match names or relationships)
2. What emotion are they feeling? (lonely, sad, confused, anxious, curious, happy)
3. What would help most? (see photos, hear voice, make a call, remember who someone is)
4. Generate a warm, empathetic response (2-3 sentences, as if speaking to a beloved family member)

Respond ONLY with valid JSON (no markdown):
{
  "lovedOneName": "exact name or null",
  "emotionalNeed": "lonely|confused|sad|anxious|curious|happy",
  "suggestedAction": "show_photos|play_audio|suggest_call|explain_relationship",
  "comfortMessage": "Your warm, personal message here"
}`;

  let result;
  try {
    const analysis = await model.invoke(analysisPrompt);
    const content = String(analysis.content).trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    result = JSON.parse(jsonMatch[0]);
    console.log(`💝 Analysis:`, result);
  } catch (error) {
    console.error("❌ Failed to parse analysis:", error);
    result = {
      lovedOneName: null,
      emotionalNeed: "lonely",
      suggestedAction: "show_photos",
      comfortMessage: `I can see you're thinking about your family. Let me help you feel connected to them.`
    };
  }

  let target = null;
  if (result.lovedOneName) {
    target = ComfortDB.findLovedOne(patientId, result.lovedOneName);
    console.log(`💝 Searching for "${result.lovedOneName}":`, target ? "Found" : "Not found");
  }

  if (!target && lovedOnes.length > 0) {
    const mentioned = ComfortDB.getMostMentioned(patientId, 1);
    target = mentioned.length > 0 ? mentioned[0] : lovedOnes[0];
    console.log(`💝 Using fallback loved one: ${target.name}`);
  }

  let responseMsg = result.comfortMessage;
  const comfortData: any = { 
    message: responseMsg,
    emotionalNeed: result.emotionalNeed 
  };

  if (target) {
    comfortData.lovedOne = {
      name: target.name,
      relationship: target.relationship,
      phoneNumber: target.phone_number,
      profilePicture: target.profile_picture_path
    };

    switch (result.suggestedAction) {
      case "show_photos": {
        const photos = ComfortDB.getPhotos(target.id);
        console.log(`💝 Found ${photos.length} photos for ${target.name}`);
        
        if (photos.length > 0) {
          comfortData.photos = photos.map(p => ({
            path: p.photo_path,
            description: p.description
          }));
          
          const photoDescriptions = photos.map(p => p.description).filter(Boolean).join(". ");
          responseMsg += `\n\n📸 Here ${photos.length === 1 ? 'is a photo' : 'are some photos'} of ${target.name}, your ${target.relationship}. ${photoDescriptions}`;
          
          ComfortDB.logInteraction(patientId, target.id, "photo_view", JSON.stringify({ count: photos.length }));
        } else {
          responseMsg += `\n\nI wish I had photos of ${target.name} to show you right now. ${target.name} is your ${target.relationship} and loves you very much.`;
        }
        break;
      }

      case "play_audio": {
        const audioMessages = ComfortDB.getAudio(target.id);
        console.log(`💝 Found ${audioMessages.length} audio messages for ${target.name}`);
        
        if (audioMessages.length > 0) {
          const audio = audioMessages[0];
          comfortData.audio = {
            path: audio.audio_path,
            description: audio.description,
            duration: audio.duration
          };
          responseMsg += `\n\n🎵 I have a special message from ${target.name}. Would you like to hear it? ${audio.description || ''}`;
          ComfortDB.logInteraction(patientId, target.id, "audio_play", JSON.stringify({ audioId: audio.id }));
        } else {
          responseMsg += `\n\nI don't have a recorded message from ${target.name} right now, but they think about you often. Would you like to give them a call?`;
          if (target.phone_number) {
            comfortData.callSuggestion = {
              name: target.name,
              relationship: target.relationship,
              phoneNumber: target.phone_number
            };
          }
        }
        break;
      }

      case "suggest_call": {
        if (target.phone_number) {
          comfortData.callSuggestion = {
            name: target.name,
            relationship: target.relationship,
            phoneNumber: target.phone_number
          };
          responseMsg += `\n\n📞 ${target.name} would love to hear from you! Their number is ${target.phone_number}. Would you like me to help you call them?`;
          ComfortDB.logInteraction(patientId, target.id, "call_suggestion");
        } else {
          responseMsg += `\n\nI know you'd love to talk to ${target.name}. Let me see if I can find their contact information for you.`;
        }
        break;
      }

      case "explain_relationship": {
        const photos = ComfortDB.getPhotos(target.id);
        const photoContext = photos.length > 0 
          ? `\nContext from photos: ${photos.map(p => p.description).filter(Boolean).join('. ')}`
          : '';
        
        const relationshipPrompt = `Generate a warm, gentle explanation of who ${target.name} is to ${state.name}.

Relationship: ${target.relationship}${photoContext}

Requirements:
- 2-3 sentences maximum
- Use present tense
- Include specific, positive details
- Speak as if comforting a confused loved one
- Be reassuring and warm`;

        try {
          const explanation = await model.invoke(relationshipPrompt);
          responseMsg = String(explanation.content).trim();
          
          if (photos.length > 0) {
            comfortData.photos = photos.slice(0, 2).map(p => ({
              path: p.photo_path,
              description: p.description
            }));
            responseMsg += `\n\n📸 Let me show you some photos to help you remember.`;
          }
          
          ComfortDB.logInteraction(patientId, target.id, "memory_prompt", responseMsg);
        } catch (error) {
          console.error("❌ Failed to generate relationship explanation:", error);
          responseMsg = `${target.name} is your ${target.relationship}. They care about you very much and visit often.`;
        }
        break;
      }
    }
  } else {
    responseMsg = `You have a wonderful family who loves you dearly. They think about you every day.`;
    comfortData.lovedOnes = lovedOnes.slice(0, 3).map(lo => ({
      name: lo.name,
      relationship: lo.relationship,
      profilePicture: lo.profile_picture_path
    }));
    responseMsg += `\n\n👨‍👩‍👧‍👦 Your family includes: ${lovedOnes.map(lo => `${lo.name} (your ${lo.relationship})`).join(', ')}. Would you like to see photos or hear from any of them?`;
    ComfortDB.logInteraction(patientId, null, "general_comfort");
  }

  const memoryEntry = `[COMFORT] User: ${state.input} | Response: ${responseMsg}`;
  MemoryDB.add(patientId, memoryEntry);

  console.log(`💝 Comfort response ready: ${responseMsg.substring(0, 100)}...`);

  return {
    ...state,
    memoryLog: [...state.memoryLog, memoryEntry],
    comfortData,
    routeDecision: "comfort"
  };
}
