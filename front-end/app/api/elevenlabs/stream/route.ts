import { NextRequest } from "next/server";

/**
 * Configuration constants for ElevenLabs API
 */
const ELEVENLABS_API_BASE_URL = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - ElevenLabs default voice
const DEFAULT_MODEL_ID = "eleven_turbo_v2_5"; // Fast, high-quality model

/**
 * Request body interface for the TTS streaming endpoint
 */
interface TTSRequest {
  /** The text to convert to speech */
  text: string;
  /** Optional ElevenLabs voice ID. Defaults to Rachel voice if not provided */
  voice_id?: string;
  /** Optional model ID. Defaults to 'eleven_turbo_v2_5' if not provided */
  model_id?: string;
  /** Optional voice settings for customization */
  voice_settings?: {
    stability?: number; // 0.0 to 1.0
    similarity_boost?: number; // 0.0 to 1.0
    style?: number; // 0.0 to 1.0
    use_speaker_boost?: boolean;
  };
}

/**
 * Validates the request body and ensures required fields are present
 * 
 * @param body - The parsed request body
 * @returns An object with validation success status and optional error message
 */
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a JSON object" };
  }

  if (!body.text || typeof body.text !== "string") {
    return { valid: false, error: "Text field is required and must be a string" };
  }

  if (body.text.trim().length === 0) {
    return { valid: false, error: "Text cannot be empty" };
  }

  // Limit text length to prevent abuse (ElevenLabs has limits too)
  if (body.text.length > 5000) {
    return { valid: false, error: "Text exceeds maximum length of 5000 characters" };
  }

  return { valid: true };
}

/**
 * Creates a streaming fetch request to ElevenLabs API
 * 
 * @param text - The text to convert to speech
 * @param voiceId - The ElevenLabs voice ID to use
 * @param modelId - The model ID to use
 * @param voiceSettings - Optional voice customization settings
 * @returns A Response object from ElevenLabs API with streaming audio
 * @throws Error if API key is missing or request fails
 */
async function fetchElevenLabsStream(
  text: string,
  voiceId: string,
  modelId: string,
  voiceSettings?: TTSRequest["voice_settings"]
): Promise<Response> {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }

  const url = `${ELEVENLABS_API_BASE_URL}/text-to-speech/${voiceId}/stream`;

  const requestBody = {
    text,
    model_id: modelId,
    ...(voiceSettings && { voice_settings: voiceSettings }),
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Accept": "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `ElevenLabs API error: ${response.status} ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.detail?.message || errorJson.message || errorMessage;
    } catch {
      // If parsing fails, use the raw error text if available
      if (errorText) {
        errorMessage = `${errorMessage} - ${errorText}`;
      }
    }

    throw new Error(errorMessage);
  }

  return response;
}

/**
 * Creates a ReadableStream that pipes audio data from ElevenLabs to the client
 * This enables efficient streaming without buffering the entire audio in memory
 * 
 * @param elevenLabsResponse - The Response object from ElevenLabs API
 * @returns A ReadableStream that can be used in Next.js Response
 */
function createStreamingResponse(elevenLabsResponse: Response): ReadableStream<Uint8Array> {
  const reader = elevenLabsResponse.body?.getReader();

  if (!reader) {
    throw new Error("Failed to get response body reader from ElevenLabs");
  }

  return new ReadableStream({
    /**
     * Called when the stream starts. Begins reading chunks from ElevenLabs
     * and forwarding them to the client stream.
     */
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            controller.close();
            break;
          }

          // Forward the audio chunk to the client
          controller.enqueue(value);
        }
      } catch (error) {
        console.error("Error streaming audio from ElevenLabs:", error);
        controller.error(error);
      }
    },

    /**
     * Called when the stream is cancelled (e.g., client disconnects)
     * Ensures proper cleanup of the ElevenLabs response reader
     */
    cancel() {
      reader.cancel().catch((error) => {
        console.error("Error cancelling ElevenLabs stream:", error);
      });
    },
  });
}

/**
 * POST /api/elevenlabs/stream
 * 
 * Converts text to speech using ElevenLabs streaming API and returns
 * audio stream to the client. The audio is streamed in real-time for
 * low-latency playback.
 * 
 * Request Body:
 *   {
 *     text: string (required) - Text to convert to speech
 *     voice_id?: string (optional) - ElevenLabs voice ID
 *     model_id?: string (optional) - Model ID (default: "eleven_turbo_v2_5")
 *     voice_settings?: object (optional) - Voice customization settings
 *   }
 * 
 * Response:
 *   - Content-Type: audio/mpeg
 *   - Streaming audio data (MP3 format)
 * 
 * Errors:
 *   - 400: Invalid request (missing text, invalid format, etc.)
 *   - 401: Missing or invalid ElevenLabs API key
 *   - 500: Server error or ElevenLabs API error
 * 
 * @param req - Next.js request object containing the TTS request
 * @returns Response with streaming audio or error message
 */
export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body: TTSRequest = await req.json();
    const validation = validateRequest(body);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract parameters with defaults
    const text = body.text.trim();
    const voiceId = body.voice_id || DEFAULT_VOICE_ID;
    const modelId = body.model_id || DEFAULT_MODEL_ID;
    const voiceSettings = body.voice_settings;

    // Fetch streaming audio from ElevenLabs
    const elevenLabsResponse = await fetchElevenLabsStream(
      text,
      voiceId,
      modelId,
      voiceSettings
    );

    // Create a streaming response that pipes audio to the client
    const stream = createStreamingResponse(elevenLabsResponse);

    // Return streaming response with appropriate headers
    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Connection": "keep-alive",
        // Enable CORS if needed for cross-origin requests
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error in ElevenLabs TTS stream endpoint:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Check if it's an API key error
    if (errorMessage.includes("ELEVENLABS_API_KEY")) {
      return new Response(
        JSON.stringify({
          error: "Server configuration error: ElevenLabs API key not configured",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return error response
    return new Response(
      JSON.stringify({
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * OPTIONS /api/elevenlabs/stream
 * 
 * Handles CORS preflight requests for the streaming endpoint.
 * This allows the endpoint to be called from browser clients.
 * 
 * @param req - Next.js request object
 * @returns Response with CORS headers
 */
export async function OPTIONS(req: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  });
}


