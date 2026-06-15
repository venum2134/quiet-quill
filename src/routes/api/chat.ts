import { createLovableAiGatewayProvider, withLovableAiGatewayRunIdHeader } from "@/lib/ai-gateway.server";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM_PROMPT = `Tu es Obsidian, un assistant IA expert en cybersécurité (pentest, OWASP, CVE, durcissement, threat modeling). Réponds en français par défaut, clairement et de manière actionnable.
Formate avec markdown : **gras**, listes, titres, et blocs de code avec langage. Cite les CVE/CWE pertinents. Sois direct et substantif.`;

const ALLOWED_MODELS = new Set([
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-pro-preview",
  "openai/gpt-5",
  "openai/gpt-5.4",
]);

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { messages?: UIMessage[]; model?: string };
          const messages = body.messages;
          if (!Array.isArray(messages)) {
            return new Response("Messages are required", { status: 400 });
          }

          const modelId =
            body.model && ALLOWED_MODELS.has(body.model) ? body.model : "google/gemini-3-flash-preview";

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

          const gateway = createLovableAiGatewayProvider(key);
          const result = streamText({
            model: gateway(modelId),
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
