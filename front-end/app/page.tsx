"use client";
import { useState } from "react";

export default function HomePage() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: input }),
    });
    const data = await res.json();
    setOutput(data);
  }

  return (
    <main className="min-h-screen bg-white text-black flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-6">
        🧠 Dementia Companion Agent
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-md gap-4"
      >
        <textarea
          className="border border-gray-300 rounded-md p-3 text-base focus:outline-none focus:ring-1 focus:ring-gray-400"
          placeholder="Type something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          type="submit"
          className="border border-black text-black bg-white rounded-md py-2 font-semibold hover:bg-gray-100 transition"
        >
          Send
        </button>
      </form>

      {output && (
        <div className="mt-8 w-full max-w-lg border border-gray-200 rounded-md p-4 bg-gray-50">
          <p className="mb-2">
            <span className="font-semibold">Decision:</span>{" "}
            {output.routeDecision || "N/A"}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Last Memory:</span>{" "}
            {output.memoryLog?.slice(-1)}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Tasks:</span>{" "}
            {output.tasks?.join(", ")}
          </p>
          <p>
            <span className="font-semibold">Health Notes:</span>{" "}
            {output.healthNotes?.join(", ")}
          </p>
        </div>
      )}
    </main>
  );
}
