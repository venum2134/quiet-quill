import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Plus, Globe, BookOpen, LineChart, Image as ImageIcon, Sparkles,
  Square, ShieldCheck, Check, ChevronDown, Copy, RefreshCw, ThumbsUp, ThumbsDown,
  Volume2, Pencil, X,
} from "lucide-react";
import {
  deleteThread as deleteThreadStore,
  deriveTitle, getThread, saveThread, downloadThreadMarkdown,
} from "@/lib/threads";
import { MODELS, getModel } from "@/lib/models";
import { useSelectedModel, useFeedback } from "@/lib/preferences";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { fadeIn, fadeInUp, staggerContainer, easeOut, springSnappy } from "@/lib/motion";

const suggestions = [
  { icon: Globe, label: "Expliquer une CVE", prompt: "Explique-moi la CVE-2024-3094 (xz-utils) et ses implications." },
  { icon: BookOpen, label: "OWASP Top 10", prompt: "Résume l'OWASP Top 10 2021 avec un exemple concret pour chaque risque." },
  { icon: LineChart, label: "Headers HTTP", prompt: "Quels headers de sécurité dois-je activer sur un site WordPress en prod ?" },
  { icon: Sparkles, label: "Auditer WordPress", prompt: "Donne-moi une checklist d'audit sécurité pour un site WordPress mutualisé." },
  { icon: ImageIcon, label: "Threat modeling", prompt: "Aide-moi à faire un threat model STRIDE pour une API REST de paiement." },
];

type SlashCommand = {
  cmd: string;
  description: string;
  run: (ctx: SlashCtx) => void;
};
type SlashCtx = {
  navigate: ReturnType<typeof useNavigate>;
  threadId: string;
  setInput: (s: string) => void;
  setMessages: (m: UIMessage[]) => void;
};

const SLASH_COMMANDS: SlashCommand[] = [
  {
    cmd: "/diagnostic",
    description: "Lancer un diagnostic de sécurité sur un domaine",
    run: ({ navigate }) => navigate({ to: "/diagnostic" }),
  },
  {
    cmd: "/cve",
    description: "Expliquer une CVE (ex: /cve CVE-2024-3094)",
    run: ({ setInput }) => setInput("Explique-moi la CVE-"),
  },
  {
    cmd: "/scan",
    description: "Pré-remplir un scan d'URL",
    run: ({ setInput }) => setInput("Analyse la sécurité du site : https://"),
  },
  {
    cmd: "/clear",
    description: "Vider la conversation actuelle",
    run: ({ setMessages, threadId }) => {
      setMessages([]);
      const t = getThread(threadId);
      if (t) saveThread({ ...t, messages: [], title: "New Thread" });
      toast.success("Conversation vidée");
    },
  },
  {
    cmd: "/export",
    description: "Exporter la conversation en Markdown",
    run: ({ threadId }) => {
      const t = getThread(threadId);
      if (t) downloadThreadMarkdown(t);
    },
  },
];

const transport = new DefaultChatTransport({ api: "/api/chat" });

type Props = { threadId: string; initialMessages: UIMessage[] };

/* ---------- Code block with copy ---------- */
function CodeBlock({ className, children }: { className?: string; children?: React.ReactNode }) {
  const lang = (className || "").replace("language-", "") || "text";
  const code = String(children ?? "");
  const onCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié");
  };
  return (
    <div style={{ borderRadius: 10, overflow: "hidden", margin: "0 0 12px", border: "1px solid var(--c-inverse-hover)" }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "var(--c-inverse-hover)", color: "var(--c-muted)", fontSize: 11, padding: "6px 12px",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.04em",
      }}>
        <span style={{ textTransform: "uppercase" }}>{lang}</span>
        <button
          onClick={onCopy}
          className="pplx-pill"
          style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--c-bg)", background: "transparent", border: "none", fontSize: 11, padding: "2px 6px", borderRadius: 4, cursor: "pointer" }}
        >
          <Copy size={11} strokeWidth={1.8} /> Copy
        </button>
      </div>
      <pre style={{ margin: 0, padding: "12px 14px", background: "var(--c-fg)", color: "var(--c-bg)", fontSize: 13, lineHeight: 1.55, overflowX: "auto" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ---------- Message bubble ---------- */
function MessageBubble({
  message, isLast, onEdit, onRegenerate, modelLabel, durationMs,
}: {
  message: UIMessage;
  isLast: boolean;
  onEdit: (newText: string) => void;
  onRegenerate: () => void;
  modelLabel?: string;
  durationMs?: number;
}) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const images = message.parts.filter((p) => p.type === "file" && p.mediaType?.startsWith("image/")) as Array<{ url: string }>;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [feedback, setFeedback] = useFeedback();
  const fb = feedback[message.id];

  if (message.role === "user") {
    if (editing) {
      return (
        <motion.div variants={fadeInUp} initial="hidden" animate="show" exit="exit" layout="position" className="flex justify-end">
          <div style={{ maxWidth: "85%", width: "100%", background: "var(--c-surface)", borderRadius: 16, padding: 12 }}>

            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              autoFocus
              className="w-full resize-none bg-transparent outline-none"
              rows={Math.min(8, draft.split("\n").length + 1)}
              style={{ fontSize: 15, color: "var(--c-fg)", border: "none" }}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button onClick={() => { setEditing(false); setDraft(text); }} className="pplx-pill" style={{ padding: "4px 12px", borderRadius: 9999, fontSize: 13, background: "transparent", border: "1px solid var(--c-border-strong)", color: "var(--c-fg)" }}>
                Annuler
              </button>
              <button onClick={() => { onEdit(draft); setEditing(false); }} className="pplx-dark-pill" style={{ padding: "4px 12px", borderRadius: 9999, fontSize: 13, background: "var(--c-inverse)", color: "var(--c-bg)", border: "none" }}>
                Envoyer
              </button>
            </div>
          </div>
        </motion.div>

      );
    }
    return (
      <motion.div variants={fadeInUp} initial="hidden" animate="show" exit="exit" layout="position" className="group flex justify-end">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", maxWidth: "85%", gap: 6 }}>
          {images.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {images.map((img, i) => (
                <img key={i} src={img.url} alt="" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 10, border: "1px solid var(--c-surface-strong)" }} />
              ))}
            </div>
          )}
          {text && (
            <div style={{ background: "var(--c-surface)", color: "var(--c-fg)", borderRadius: 16, padding: "10px 16px", fontSize: 15, lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {text}
            </div>
          )}
          <button
            onClick={() => { setDraft(text); setEditing(true); }}
            className="pplx-pill opacity-0 group-hover:opacity-100"
            style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 6, fontSize: 11, color: "var(--c-muted-fg)", background: "transparent", border: "none", transition: "opacity 150ms" }}
            aria-label="Edit message"
          >
            <Pencil size={11} strokeWidth={1.7} /> Modifier
          </button>
        </div>
      </motion.div>

    );
  }

  const setFb = (v: "up" | "down") => {
    const next = { ...feedback };
    if (next[message.id] === v) delete next[message.id];
    else next[message.id] = v;
    setFeedback(next);
    toast.success(v === "up" ? "Merci pour le retour 👍" : "Merci, on note 👎");
  };

  const speak = () => {
    if (!("speechSynthesis" in window)) return toast.error("Synthèse vocale non disponible");
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "fr-FR";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="show" exit="exit" layout="position" className="group">
      <div className="pplx-markdown" style={{ color: "var(--c-fg)", fontSize: 15, lineHeight: 1.65 }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code(props) {
              const { className, children, node, ...rest } = props as { className?: string; children?: React.ReactNode; node?: { position?: { start: { line: number }; end: { line: number } } } };
              const isBlock = (className && className.startsWith("language-")) ||
                (node?.position && node.position.start.line !== node.position.end.line);
              if (isBlock) return <CodeBlock className={className}>{children}</CodeBlock>;
              return <code className={className} {...rest}>{children}</code>;
            },
          }}
        >
          {text || "…"}
        </ReactMarkdown>
      </div>

      <div className="mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100" style={{ transition: "opacity 150ms" }}>
        <ActionBtn label="Copier" onClick={() => { navigator.clipboard.writeText(text); toast.success("Réponse copiée"); }}>
          <Copy size={13} strokeWidth={1.7} />
        </ActionBtn>
        {isLast && (
          <ActionBtn label="Régénérer" onClick={onRegenerate}>
            <RefreshCw size={13} strokeWidth={1.7} />
          </ActionBtn>
        )}
        <ActionBtn label="J'aime" onClick={() => setFb("up")} active={fb === "up"}>
          <ThumbsUp size={13} strokeWidth={1.7} />
        </ActionBtn>
        <ActionBtn label="J'aime pas" onClick={() => setFb("down")} active={fb === "down"}>
          <ThumbsDown size={13} strokeWidth={1.7} />
        </ActionBtn>
        <ActionBtn label="Lire à voix haute" onClick={speak}>
          <Volume2 size={13} strokeWidth={1.7} />
        </ActionBtn>
        {modelLabel && (
          <span style={{ marginLeft: 8, fontSize: 11, color: "var(--c-muted)" }}>
            {modelLabel}{durationMs ? ` · ${(durationMs / 1000).toFixed(1)}s` : ""}
          </span>
        )}
      </div>
    </motion.div>

  );
}

function ActionBtn({ children, label, onClick, active }: { children: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, backgroundColor: "var(--c-surface-strong)" }}
      whileTap={{ scale: 0.92 }}
      transition={springSnappy}
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        width: 28, height: 28, borderRadius: 6, border: "none",
        background: active ? "var(--c-surface-strong)" : "transparent",
        color: active ? "var(--c-fg)" : "var(--c-muted-fg)", cursor: "pointer",
      }}
    >
      {children}
    </motion.button>
  );
}


/* ---------- Main ChatView ---------- */
export function ChatView({ threadId, initialMessages }: Props) {
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useSelectedModel();
  const [attachments, setAttachments] = useState<{ url: string; name: string; mediaType: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const [generationStart, setGenerationStart] = useState<number | null>(null);
  const [lastDuration, setLastDuration] = useState<number | undefined>(undefined);
  const [usedModel, setUsedModel] = useState<string | undefined>(undefined);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { messages, sendMessage, status, stop, error, setMessages, regenerate } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  const isLoading = status === "submitted" || status === "streaming";
  const isEmpty = messages.length === 0;

  // duration tracking
  useEffect(() => {
    if (status === "submitted") {
      setGenerationStart(Date.now());
      setUsedModel(getModel(selectedModel).short);
    } else if (status === "ready" && generationStart) {
      setLastDuration(Date.now() - generationStart);
      setGenerationStart(null);
    }
  }, [status, generationStart, selectedModel]);

  // persist
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      const existing = getThread(threadId);
      const title = existing?.title && existing.title !== "New Thread" ? existing.title : deriveTitle(messages);
      saveThread({ id: threadId, title, updatedAt: Date.now(), messages, pinned: existing?.pinned });
    }
  }, [status, messages, threadId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, status]);

  useEffect(() => { textareaRef.current?.focus(); }, [threadId]);

  // Esc to stop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isLoading) {
        e.preventDefault();
        stop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLoading, stop]);

  const submit = useCallback((text: string) => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || isLoading) return;
    const parts: Array<
      | { type: "text"; text: string }
      | { type: "file"; url: string; mediaType: string; filename?: string }
    > = [];
    for (const a of attachments) parts.push({ type: "file", url: a.url, mediaType: a.mediaType, filename: a.name });
    if (trimmed) parts.push({ type: "text", text: trimmed });
    setInput("");
    setAttachments([]);
    setSlashOpen(false);
    void sendMessage({ parts } as Parameters<typeof sendMessage>[0], { body: { model: selectedModel } });
  }, [attachments, isLoading, sendMessage, selectedModel]);

  const handleEditUser = (msgId: string, newText: string) => {
    const idx = messages.findIndex((m) => m.id === msgId);
    if (idx < 0) return;
    const truncated = messages.slice(0, idx);
    setMessages(truncated);
    setTimeout(() => {
      void sendMessage({ text: newText }, { body: { model: selectedModel } });
    }, 0);
  };

  const handleRegenerate = () => {
    void regenerate({ body: { model: selectedModel } });
  };

  /* ---------- File handling ---------- */
  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (arr.length === 0) {
      toast.error("Seules les images sont supportées pour le moment.");
      return;
    }
    arr.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} dépasse 5 MB`);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setAttachments((prev) => [...prev, { url: reader.result as string, name: file.name, mediaType: file.type }]);
      };
      reader.readAsDataURL(file);
    });
  };

  /* ---------- Slash commands ---------- */
  const filteredSlash = useMemo(() => {
    if (!input.startsWith("/")) return [];
    const q = input.slice(1).toLowerCase();
    return SLASH_COMMANDS.filter((c) => c.cmd.slice(1).toLowerCase().startsWith(q));
  }, [input]);

  useEffect(() => {
    setSlashOpen(input.startsWith("/") && filteredSlash.length > 0);
    setSlashIdx(0);
  }, [input, filteredSlash.length]);

  const runSlash = (cmd: SlashCommand) => {
    setInput("");
    setSlashOpen(false);
    cmd.run({ navigate, threadId, setInput, setMessages });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx((i) => (i + 1) % filteredSlash.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSlashIdx((i) => (i - 1 + filteredSlash.length) % filteredSlash.length); return; }
      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runSlash(filteredSlash[slashIdx]); return; }
      if (e.key === "Escape") { e.preventDefault(); setSlashOpen(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(input);
    }
  };

  const model = getModel(selectedModel);

  const inputBox = (
    <div className="relative w-full">
      {/* Slash menu */}
      <AnimatePresence>
        {slashOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: easeOut }}
            className="absolute left-0 right-0 z-20"
            style={{
              bottom: "calc(100% + 8px)", background: "var(--c-bg)", border: "1px solid var(--c-surface-strong)",
              borderRadius: 12, padding: 6, boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
            }}
          >
            {filteredSlash.map((c, i) => (
              <motion.button
                key={c.cmd}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025, duration: 0.18, ease: easeOut }}
                onMouseEnter={() => setSlashIdx(i)}
                onClick={() => runSlash(c)}
                className="flex w-full items-center justify-between px-3 py-2 text-left"
                style={{
                  borderRadius: 8, background: i === slashIdx ? "var(--c-surface-strong)" : "transparent",
                  border: "none", cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fg)", fontFamily: "ui-monospace, monospace" }}>{c.cmd}</span>
                <span style={{ fontSize: 12, color: "var(--c-muted-fg)" }}>{c.description}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>


      <div
        className="pplx-input-wrap w-full"
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
        style={{
          backgroundColor: "var(--c-bg)",
          border: `1px solid ${isDragging ? "var(--c-fg)" : "var(--c-surface-strong)"}`,
          borderRadius: 16, padding: 14,
        }}
      >
        {/* attachments preview */}
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {attachments.map((a, i) => (
                <motion.div
                  key={a.url}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={springSnappy}
                  className="relative"
                  style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--c-surface-strong)" }}
                >
                  <img src={a.url} alt={a.name} style={{ width: 60, height: 60, objectFit: "cover", display: "block" }} />
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    style={{
                      position: "absolute", top: 2, right: 2, width: 18, height: 18,
                      borderRadius: 9999, background: "rgba(0,0,0,0.7)", color: "var(--c-bg)",
                      border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    }}
                    aria-label="Remove"
                  >
                    <X size={11} strokeWidth={2.5} />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}


        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={isEmpty ? "Pose une question cybersécurité, ou tape /diagnostic" : "Pose une question complémentaire…"}
          rows={isEmpty ? 2 : 1}
          className="w-full resize-none bg-transparent outline-none placeholder:text-[var(--c-muted)]"
          style={{ fontSize: 16, color: "var(--c-fg)", lineHeight: 1.5, border: "none", maxHeight: 200 }}
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef} type="file" accept="image/*" multiple hidden
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
            />
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: "var(--c-surface-strong)" }}
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-8 w-8 items-center justify-center"
              style={{ borderRadius: 9999, color: "var(--c-muted-fg)", background: "transparent", border: "none" }}
              aria-label="Attach image"
              title="Joindre une image"
            >
              <Plus size={18} strokeWidth={1.5} />
            </motion.button>

          </div>

          <div className="flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  className="pplx-pill flex items-center gap-1 px-3 py-1.5"
                  style={{ borderRadius: 9999, fontSize: 13, fontWeight: 500, color: "var(--c-fg)", background: "transparent", border: "none" }}
                >
                  <span>{model.short}</span>
                  <ChevronDown size={12} strokeWidth={2} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-[300px] p-1" style={{ background: "var(--c-bg)", border: "1px solid var(--c-surface-strong)", borderRadius: 12 }}>
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={staggerContainer}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  {MODELS.map((m) => {
                    const active = m.id === selectedModel;
                    const hovered = hoveredModel === m.id;
                    const highlighted = hovered || (hoveredModel === null && active);
                    return (
                      <motion.button
                        key={m.id}
                        variants={fadeInUp}
                        onMouseEnter={() => setHoveredModel(m.id)}
                        onFocus={() => setHoveredModel(m.id)}
                        onClick={() => { setSelectedModel(m.id); toast.success(`Modèle : ${m.short}`); }}
                        whileTap={{ scale: 0.98 }}
                        className="relative flex w-full items-start gap-2 px-3 py-2 text-left"
                        style={{ background: "transparent", border: "none", cursor: "pointer", borderRadius: 8 }}
                      >
                        {highlighted && (
                          <motion.div
                            layoutId="model-hover-bg"
                            transition={springSnappy}
                            style={{ position: "absolute", inset: 0, background: "var(--c-surface-strong)", borderRadius: 8, zIndex: 0 }}
                          />
                        )}
                        <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
                          <motion.div
                            animate={{ x: hovered ? 3 : 0 }}
                            transition={springSnappy}
                            style={{ fontSize: 13, fontWeight: 600, color: "var(--c-fg)" }}
                          >
                            {m.label}
                          </motion.div>
                          <div style={{ fontSize: 12, color: "var(--c-muted-fg)", marginTop: 2 }}>{m.description}</div>
                        </div>
                        <AnimatePresence>
                          {active && (
                            <motion.span
                              key="check"
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              transition={springSnappy}
                              style={{ position: "relative", zIndex: 1, marginTop: 2 }}
                            >
                              <Check size={14} strokeWidth={2} style={{ color: "var(--c-fg)" }} />
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </PopoverContent>
            </Popover>

            <AnimatePresence mode="wait" initial={false}>
              {isLoading ? (
                <motion.button
                  key="stop"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={springSnappy}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => stop()}
                  className="flex h-9 w-9 items-center justify-center"
                  style={{ borderRadius: 9999, backgroundColor: "var(--c-inverse)", color: "var(--c-bg)", border: "none" }}
                  aria-label="Stop (Esc)"
                  title="Arrêter (Esc)"
                >
                  <Square size={14} strokeWidth={2.2} fill="var(--c-bg)" />
                </motion.button>
              ) : (
                <motion.button
                  key="send"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={springSnappy}
                  whileHover={(input.trim() || attachments.length > 0) ? { scale: 1.08 } : undefined}
                  whileTap={(input.trim() || attachments.length > 0) ? { scale: 0.9 } : undefined}
                  onClick={() => submit(input)}
                  disabled={!input.trim() && attachments.length === 0}
                  className="flex h-9 w-9 items-center justify-center"
                  style={{ borderRadius: 9999, backgroundColor: (input.trim() || attachments.length > 0) ? "var(--c-inverse)" : "var(--c-border-strong)", color: "var(--c-bg)", border: "none" }}
                  aria-label="Submit"
                >
                  <ArrowRight size={16} strokeWidth={2.2} />
                </motion.button>
              )}
            </AnimatePresence>

          </div>
        </div>
      </div>
    </div>
  );

  if (isEmpty) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center px-8">
        <div className="flex w-full flex-col items-center" style={{ maxWidth: 720 }}>
          <h1
            className="pplx-wordmark-in mb-3 text-center"
            style={{ fontSize: 60, fontWeight: 450, color: "var(--c-fg)", lineHeight: 1, fontVariationSettings: '"wght" 450' }}
          >
            obsidian
          </h1>
          <p
            className="pplx-fade-up mb-8 text-center"
            style={{ fontSize: 14, color: "var(--c-muted-fg)", animationDelay: "80ms", maxWidth: 460 }}
          >
            Le pentest automatisé, démocratisé. Pose une question, ou lance un diagnostic sur ton domaine.
          </p>

          <Link
            to="/diagnostic"
            className="pplx-fade-up pplx-dark-pill mb-6 flex items-center gap-2 px-5 py-2.5"
            style={{ animationDelay: "100ms", borderRadius: 9999, fontSize: 14, fontWeight: 500, color: "var(--c-bg)", background: "var(--c-inverse)", border: "none" }}
          >
            <ShieldCheck size={15} strokeWidth={1.8} />
            Lancer un diagnostic
            <ArrowRight size={14} strokeWidth={2} />
          </Link>

          <div className="pplx-fade-up w-full" style={{ animationDelay: "160ms" }}>{inputBox}</div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-10 flex w-full gap-3 overflow-x-auto pb-2"
            style={{ paddingTop: 4 }}
          >
            {suggestions.map((s) => (
              <motion.button
                key={s.label}
                variants={fadeInUp}
                whileHover={{ y: -3, borderColor: "var(--c-border-strong)" }}
                whileTap={{ scale: 0.98 }}
                transition={springSnappy}
                onClick={() => submit(s.prompt)}
                className="flex shrink-0 flex-col gap-3 p-4 text-left"
                style={{ width: 180, borderRadius: 12, backgroundColor: "var(--c-bg)", border: "1px solid var(--c-surface-strong)", cursor: "pointer" }}
              >
                <div className="flex items-center gap-2">
                  <s.icon size={16} strokeWidth={1.5} style={{ color: "var(--c-fg)" }} />
                  <span style={{ fontSize: 14, color: "var(--c-fg)", fontWeight: 500 }}>{s.label}</span>
                </div>
                <div style={{ fontSize: 12, color: "var(--c-muted-fg)", lineHeight: 1.4 }}>
                  {s.prompt}
                </div>
              </motion.button>
            ))}
          </motion.div>

        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-center" style={{ fontSize: 12, color: "var(--c-muted)" }}>
          Obsidian peut produire des informations inexactes. Vérifie toujours les recommandations critiques.
        </div>
      </div>
    );
  }

  const lastAssistantId = [...messages].reverse().find((m) => m.role === "assistant")?.id;

  return (
    <div className="flex h-screen flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ paddingTop: 64 }}>
        <div className="mx-auto flex flex-col gap-6 px-6 pb-8" style={{ maxWidth: 760 }}>
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isLast={m.id === lastAssistantId}
                onEdit={(newText) => handleEditUser(m.id, newText)}
                onRegenerate={handleRegenerate}
                modelLabel={m.role === "assistant" && m.id === lastAssistantId ? usedModel : undefined}
                durationMs={m.role === "assistant" && m.id === lastAssistantId ? lastDuration : undefined}
              />
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {status === "submitted" && (
              <motion.div
                key="thinking"
                variants={fadeIn}
                initial="hidden"
                animate="show"
                exit="exit"
                style={{ color: "var(--c-muted-fg)", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}
              >
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--c-fg)", display: "inline-block" }}
                />
                <span className="pplx-shimmer">Réflexion en cours…</span>
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <motion.div variants={fadeInUp} initial="hidden" animate="show" style={{ background: "var(--c-surface)", border: "1px solid var(--c-surface-strong)", borderRadius: 12, padding: 12, fontSize: 13, color: "var(--c-fg)" }}>
              {error.message || "Une erreur est survenue. Réessaie."}
            </motion.div>
          )}
        </div>

      </div>

      <div className="shrink-0 px-6 pb-6 pt-2" style={{ background: "linear-gradient(to bottom, rgba(var(--c-bg-rgb), 0), var(--c-bg) 30%)" }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          {inputBox}
          <div className="mt-2 text-center" style={{ fontSize: 11, color: "var(--c-muted)" }}>
            Obsidian peut produire des informations inexactes. Esc pour arrêter.
          </div>
        </div>
      </div>
    </div>
  );
}

// keep unused import warnings quiet
void deleteThreadStore;
