import { NextResponse } from "next/server";
import { getPatientMemory, updateMedicationLog } from "@/lib/mcp/tools";

export async function POST(req: Request) {
  const { tool } = await req.json();

  if (tool === "getPatientMemory") {
    const data = await getPatientMemory();
    return NextResponse.json(data);
  }

  if (tool === "updateMedicationLog") {
    const data = await updateMedicationLog();
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
}
