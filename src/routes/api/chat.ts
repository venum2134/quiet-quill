import { createLovableAiGatewayProvider, withLovableAiGatewayRunIdHeader } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `You are Perplexity, a helpful AI assistant. Answer the user clearly and concisely.
Format responses with markdown: use **bold**, lists, headings, and \`code\` where helpful.
Use code blocks with language tags for code. Be direct and substantive.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages } = (await request.json()) as { messages?: UIMessage[] };
          if (!Array.isArray(messages)) {
            return new Response("Messages are required", { status: 400 });
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway("google/gemini-3-flash-preview"),
            system: SYSTEM_PROMPT,
            messages: await convertToModelMessages(messages),
          });

          const response = result.toUIMessageStreamResponse({ originalMessages: messages });
          return withLovableAiGatewayRunIdHeader(response, gateway);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Unknown error";
          return new Response(message, { status: 500 });
        }
      },
    },
  },
});
