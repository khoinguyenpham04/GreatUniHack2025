import { NextRequest, NextResponse } from "next/server";
import { SessionManager } from "@/lib/session-manager";

export async function GET(req: NextRequest) {
  const patientId = 1; // Default patient
  
  try {
    const session = SessionManager.getSession(patientId);
    
    return NextResponse.json({
      success: true,
      activeAgent: session.activeAgent,
      conversationHistory: session.conversationHistory,
      lastActivity: session.lastActivity,
    });
  } catch (error) {
    console.error("❌ Error getting session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get session" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const patientId = 1; // Default patient
  
  try {
    SessionManager.clearSession(patientId);
    
    return NextResponse.json({
      success: true,
      message: "Session cleared",
    });
  } catch (error) {
    console.error("❌ Error clearing session:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear session" },
      { status: 500 }
    );
  }
}
