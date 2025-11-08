export async function callMCP(tool: string, params: any = {}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tool, params }),
  });

  if (!res.ok) throw new Error("MCP tool call failed");
  return res.json();
}
