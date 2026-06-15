import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowRight, Mic, Plus, Monitor, Sparkles, Globe, BookOpen, LineChart,
  Image as ImageIcon, Square,
} from "lucide-react";
import { deriveTitle, getThread, saveThread } from "@/lib/threads";

const suggestions = [
  { icon: Globe, label: "Expliquer une CVE", prompt: "Explique-moi la CVE-2024-3094 (xz-utils) et ses implications." },
  { icon: BookOpen, label: "OWASP Top 10", prompt: "Résume l'OWASP Top 10 2021 avec un exemple concret pour chaque risque." },
  { icon: LineChart, label: "Analyser un header HTTP", prompt: "Quels headers de sécurité dois-je activer sur un site WordPress en prod ?" },
  { icon: Sparkles, label: "Auditer WordPress", prompt: "Donne-moi une checklist d'audit sécurité pour un site WordPress mutualisé." },
  { icon: ImageIcon, label: "Threat modeling", prompt: "Aide-moi à faire un threat model STRIDE pour une API REST de paiement." },
];

const transport = new DefaultChatTransport({ api: "/api/chat" });

type Props = { threadId: string; initialMessages: UIMessage[] };

function MessageBubble({ message }: { message: UIMessage }) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");

  if (message.role === "user") {
    return (
      <div className="flex justify-end pplx-fade-in">
        <div
          style={{
            maxWidth: "85%",
            background: "#f1efea",
            color: "#27251e",
            borderRadius: 16,
            padding: "10px 16px",
            fontSize: 15,
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="pplx-fade-in pplx-markdown" style={{ color: "#27251e", fontSize: 15, lineHeight: 1.65 }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text || "…"}</ReactMarkdown>
    </div>
  );
}

export function ChatView({ threadId, initialMessages }: Props) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  // Persist messages after each finished response
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      const existing = getThread(threadId);
      const title = existing?.title && existing.title !== "New Thread" ? existing.title : deriveTitle(messages);
      saveThread({ id: threadId, title, updatedAt: Date.now(), messages });
    }
  }, [status, messages, threadId]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Focus textarea
  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    void sendMessage({ text: trimmed });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  const inputBox = (
    <div
      className="pplx-input-wrap w-full"
      style={{ backgroundColor: "#faf8f5", border: "1px solid #ece9e2", borderRadius: 16, padding: 14 }}
    >
      <textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={isEmpty ? "Pose une question cybersécurité, ou tape /diagnostic" : "Ask a follow-up…"}
        rows={isEmpty ? 2 : 1}
        className="w-full resize-none bg-transparent outline-none placeholder:text-[#92918b]"
        style={{ fontSize: 16, color: "#27251e", lineHeight: 1.5, border: "none", maxHeight: 200 }}
      />

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button className="pplx-pill flex h-8 w-8 items-center justify-center" style={{ borderRadius: 9999, color: "#72706b", background: "transparent", border: "none" }} aria-label="Attach">
            <Plus size={18} strokeWidth={1.5} />
          </button>
          <button className="pplx-pill flex items-center gap-1.5 px-3 py-1.5" style={{ borderRadius: 9999, border: "1px solid #d4d2cc", fontSize: 13, fontWeight: 500, color: "#27251e", background: "transparent" }}>
            <Monitor size={14} strokeWidth={1.5} />
            <span>Computer</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="pplx-pill flex items-center gap-1 px-3 py-1.5" style={{ borderRadius: 9999, fontSize: 13, fontWeight: 500, color: "#27251e", background: "transparent", border: "none" }}>
            <span>Gemini 3 Flash</span>
            <span style={{ fontSize: 10 }}>▾</span>
          </button>
          <button className="pplx-pill flex h-8 w-8 items-center justify-center" style={{ borderRadius: 9999, color: "#72706b", background: "transparent", border: "none" }} aria-label="Voice">
            <Mic size={18} strokeWidth={1.5} />
          </button>
          {isLoading ? (
            <button
              onClick={() => stop()}
              className="pplx-submit flex h-9 w-9 items-center justify-center"
              style={{ borderRadius: 9999, backgroundColor: "#000000", color: "#faf8f5", border: "none" }}
              aria-label="Stop"
            >
              <Square size={14} strokeWidth={2.2} fill="#faf8f5" />
            </button>
          ) : (
            <button
              onClick={() => submit(input)}
              disabled={!input.trim()}
              className="pplx-submit flex h-9 w-9 items-center justify-center"
              style={{ borderRadius: 9999, backgroundColor: input.trim() ? "#000000" : "#d4d2cc", color: "#faf8f5", border: "none" }}
              aria-label="Submit"
            >
              <ArrowRight size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isEmpty) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-8">
        <div className="flex w-full flex-col items-center" style={{ maxWidth: 720 }}>
          <h1
            className="pplx-wordmark-in mb-10 text-center"
            style={{ fontSize: 60, fontWeight: 450, color: "#27251e", lineHeight: 1, fontVariationSettings: '"wght" 450' }}
          >
            perplexity
          </h1>
          <div className="pplx-fade-up w-full" style={{ animationDelay: "120ms" }}>{inputBox}</div>

          <div className="mt-10 flex w-full gap-3 overflow-x-auto pb-2">
            {suggestions.map((s, i) => (
              <button
                key={s.label}
                onClick={() => submit(s.prompt)}
                className="pplx-card pplx-fade-up flex shrink-0 flex-col gap-3 p-4 text-left"
                style={{ width: 180, borderRadius: 12, backgroundColor: "#faf8f5", border: "1px solid #ece9e2", animationDelay: `${200 + i * 70}ms` }}
              >
                <div className="flex items-center gap-2">
                  <s.icon size={16} strokeWidth={1.5} style={{ color: "#27251e" }} />
                  <span style={{ fontSize: 14, color: "#27251e", fontWeight: 500 }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "#72706b", lineHeight: 1.4 }}>
                  {s.prompt}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center" style={{ fontSize: 12, color: "#92918b" }}>
          Perplexity may produce inaccurate information about people, places, or facts.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ paddingTop: 64 }}>
        <div className="mx-auto flex flex-col gap-6 px-6 pb-8" style={{ maxWidth: 760 }}>
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {status === "submitted" && (
            <div className="pplx-fade-in" style={{ color: "#72706b", fontSize: 14 }}>
              Thinking<span className="pplx-caret" />
            </div>
          )}
          {error && (
            <div style={{ background: "#f1efea", border: "1px solid #ece9e2", borderRadius: 12, padding: 12, fontSize: 13, color: "#27251e" }}>
              {error.message || "Something went wrong. Try again."}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-6 pb-6 pt-2" style={{ background: "linear-gradient(to bottom, rgba(250,248,245,0), #faf8f5 30%)" }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          {inputBox}
          <div className="mt-2 text-center" style={{ fontSize: 11, color: "#92918b" }}>
            Perplexity may produce inaccurate information.
          </div>
        </div>
      </div>
    </div>
  );
}
