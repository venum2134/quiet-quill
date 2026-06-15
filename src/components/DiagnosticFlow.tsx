import { useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, ShieldCheck, Globe, FileText, Code as CodeIcon, Copy, Check,
  Loader2, RefreshCw, AlertTriangle, Sparkles,
} from "lucide-react";
import {
  appendAuditTrail, checkVerification, CONSENT_TEXT, initialState, isValidDomain,
  loadDiagnostic, makeToken, newBubble, normalizeDomain, resetDiagnostic, saveDiagnostic,
  type DiagnosticState, type VerificationMethod, type ChatBubble,
} from "@/lib/diagnostic";
import { fadeInUp, springSnappy, easeOut } from "@/lib/motion";

type Action =
  | { type: "hydrate"; state: DiagnosticState }
  | { type: "submit-url"; domain: string }
  | { type: "invalid-url"; raw: string }
  | { type: "pick-method"; method: VerificationMethod; token: string }
  | { type: "start-verification" }
  | { type: "verification-failed"; reason: string }
  | { type: "verification-ok" }
  | { type: "consent-given" }
  | { type: "scan-tick"; line: string }
  | { type: "scan-complete" }
  | { type: "reset" };

function reducer(state: DiagnosticState, action: Action): DiagnosticState {
  switch (action.type) {
    case "hydrate":
      return action.state;
    case "submit-url": {
      return {
        ...state,
        domain: action.domain,
        step: "awaiting_method",
        bubbles: [
          ...state.bubbles,
          newBubble({ role: "user", kind: "text", text: action.domain }),
          newBubble({
            role: "assistant",
            kind: "text",
            text: `Parfait — **${action.domain}**.\n\nPour confirmer que tu en es bien propriétaire, choisis une méthode de vérification :`,
          }),
          newBubble({ role: "assistant", kind: "method-picker" }),
        ],
      };
    }
    case "invalid-url":
      return {
        ...state,
        bubbles: [
          ...state.bubbles,
          newBubble({ role: "user", kind: "text", text: action.raw }),
          newBubble({
            role: "assistant",
            kind: "error",
            text: "Ce domaine n'a pas l'air valide. Exemple attendu : `monsite.ma`. Réessaie.",
          }),
        ],
      };
    case "pick-method": {
      return {
        ...state,
        method: action.method,
        token: action.token,
        step: "awaiting_verification",
        bubbles: [
          ...state.bubbles,
          newBubble({
            role: "user",
            kind: "text",
            text:
              action.method === "dns"
                ? "Méthode : DNS TXT"
                : action.method === "meta"
                ? "Méthode : Meta tag HTML"
                : "Méthode : Fichier .well-known",
          }),
          newBubble({
            role: "assistant",
            kind: "verification",
            meta: { method: action.method, token: action.token, domain: state.domain },
          }),
        ],
      };
    }
    case "start-verification":
      return {
        ...state,
        bubbles: [
          ...state.bubbles,
          newBubble({ role: "assistant", kind: "text", text: "Vérification en cours…" }),
        ],
      };
    case "verification-failed":
      return {
        ...state,
        bubbles: [
          ...state.bubbles,
          newBubble({ role: "assistant", kind: "error", text: action.reason }),
        ],
      };
    case "verification-ok":
      return {
        ...state,
        step: "awaiting_consent",
        bubbles: [
          ...state.bubbles,
          newBubble({
            role: "assistant",
            kind: "success",
            text: `Domaine vérifié : **${state.domain}**`,
          }),
          newBubble({
            role: "assistant",
            kind: "text",
            text: "Dernière étape avant le scan : confirme que tu as l'autorisation légale de tester ce domaine.",
          }),
          newBubble({ role: "assistant", kind: "consent" }),
        ],
      };
    case "consent-given":
      return {
        ...state,
        step: "scan_running",
        bubbles: [
          ...state.bubbles,
          newBubble({ role: "user", kind: "text", text: "Je confirme et je lance le scan." }),
          newBubble({ role: "assistant", kind: "scan-progress", meta: { lines: [] as string[], done: false } }),
        ],
      };
    case "scan-tick": {
      const bubbles = [...state.bubbles];
      const last = bubbles[bubbles.length - 1];
      if (last?.kind === "scan-progress") {
        const lines = ((last.meta?.lines as string[]) ?? []).slice();
        lines.push(action.line);
        bubbles[bubbles.length - 1] = { ...last, meta: { ...last.meta, lines } };
      }
      return { ...state, bubbles };
    }
    case "scan-complete": {
      const bubbles = [...state.bubbles];
      const last = bubbles[bubbles.length - 1];
      if (last?.kind === "scan-progress") {
        bubbles[bubbles.length - 1] = { ...last, meta: { ...last.meta, done: true } };
      }
      return { ...state, step: "scan_complete", bubbles };
    }
    case "reset":
      return initialState();
    default:
      return state;
  }
}

export function DiagnosticFlow() {
  const [state, dispatch] = useReducer(reducer, null, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hydrate
  useEffect(() => {
    const persisted = loadDiagnostic();
    if (persisted) dispatch({ type: "hydrate", state: persisted });
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (hydrated) saveDiagnostic(state);
  }, [state, hydrated]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [state.bubbles]);

  // Focus textarea when awaiting URL
  useEffect(() => {
    if (state.step === "awaiting_url") inputRef.current?.focus();
  }, [state.step]);

  const handleSubmitUrl = () => {
    const raw = input.trim();
    if (!raw) return;
    setInput("");
    if (!isValidDomain(raw)) {
      dispatch({ type: "invalid-url", raw });
      return;
    }
    dispatch({ type: "submit-url", domain: normalizeDomain(raw) });
  };

  const handlePickMethod = (method: VerificationMethod) => {
    dispatch({ type: "pick-method", method, token: makeToken() });
  };

  const handleVerify = async () => {
    if (!state.domain || !state.method || !state.token) return;
    dispatch({ type: "start-verification" });
    const res = await checkVerification(state.domain, state.method, state.token);
    if (res.ok) {
      dispatch({ type: "verification-ok" });
    } else {
      dispatch({ type: "verification-failed", reason: res.reason ?? "Échec de la vérification." });
    }
  };

  const handleConsent = () => {
    if (!state.domain || !state.method || !state.token) return;
    appendAuditTrail({
      domain: state.domain,
      method: state.method,
      token: state.token,
      timestamp: Date.now(),
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      consentText: CONSENT_TEXT,
      ip: "pending-server-capture",
    });
    dispatch({ type: "consent-given" });
    // Fake streaming scan
    const lines = [
      "Initialisation des agents…",
      "Web Recon agent : démarré",
      "Network agent : démarré",
      "TLS/Crypto agent : démarré",
      "OWASP scanner : en cours…",
      "Subdomain enumeration : 142 hôtes détectés",
      "Knowledge graph mis à jour",
    ];
    lines.forEach((line, i) => {
      setTimeout(() => dispatch({ type: "scan-tick", line }), 700 + i * 850);
    });
    setTimeout(() => dispatch({ type: "scan-complete" }), 700 + lines.length * 850 + 400);
  };

  const handleReset = () => {
    resetDiagnostic();
    dispatch({ type: "reset" });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitUrl();
    }
  };

  return (
    <div className="flex h-screen flex-1 flex-col">
      {/* Header band */}
      <div
        className="pplx-fade-in absolute left-0 right-0 top-0 flex items-center justify-between px-6"
        style={{ height: 56, paddingLeft: 288, background: "linear-gradient(to bottom, #faf8f5 65%, rgba(250,248,245,0))", zIndex: 5 }}
      >
        <div className="flex items-center gap-2" style={{ color: "#27251e" }}>
          <ShieldCheck size={16} strokeWidth={1.7} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>Diagnostic</span>
          <span style={{ fontSize: 12, color: "#92918b", marginLeft: 6 }}>
            {state.domain ? `· ${state.domain}` : "· nouvelle analyse"}
          </span>
        </div>
        <button
          onClick={handleReset}
          className="pplx-pill flex items-center gap-1.5 px-3 py-1.5"
          style={{ borderRadius: 9999, border: "1px solid #ece9e2", fontSize: 12, fontWeight: 500, color: "#27251e", background: "transparent" }}
        >
          <RefreshCw size={12} strokeWidth={1.7} />
          Réinitialiser
        </button>
      </div>

      {/* Scrollable bubbles */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ paddingTop: 80 }}>
        <div className="mx-auto flex flex-col gap-5 px-6 pb-8" style={{ maxWidth: 760 }}>
          <AnimatePresence initial={false}>
            {state.bubbles.map((b) => (
              <motion.div
                key={b.id}
                layout
                variants={fadeInUp}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <BubbleView
                  bubble={b}
                  onPickMethod={handlePickMethod}
                  onVerify={handleVerify}
                  onConsent={handleConsent}
                  step={state.step}
                />
              </motion.div>
            ))}
          </AnimatePresence>

        </div>
      </div>

      {/* Input zone */}
      <div className="shrink-0 px-6 pb-6 pt-2" style={{ background: "linear-gradient(to bottom, rgba(250,248,245,0), #faf8f5 30%)" }}>
        <div className="mx-auto" style={{ maxWidth: 760 }}>
          {state.step === "awaiting_url" && (
            <div
              className="pplx-input-wrap w-full pplx-fade-up"
              style={{ backgroundColor: "#faf8f5", border: "1px solid #ece9e2", borderRadius: 16, padding: 14 }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="ex : monsite.ma"
                rows={1}
                className="w-full resize-none bg-transparent outline-none placeholder:text-[#92918b]"
                style={{ fontSize: 16, color: "#27251e", lineHeight: 1.5, border: "none", maxHeight: 200 }}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <span style={{ fontSize: 12, color: "#92918b" }}>
                  Saisis le domaine racine, sans `https://`.
                </span>
                <button
                  onClick={handleSubmitUrl}
                  disabled={!input.trim()}
                  className="pplx-submit flex h-9 w-9 items-center justify-center"
                  style={{ borderRadius: 9999, backgroundColor: input.trim() ? "#000000" : "#d4d2cc", color: "#faf8f5", border: "none" }}
                  aria-label="Continuer"
                >
                  <ArrowRight size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          )}

          {state.step !== "awaiting_url" && state.step !== "scan_complete" && (
            <div
              className="pplx-fade-in flex items-center justify-center"
              style={{ height: 56, borderRadius: 16, border: "1px dashed #ece9e2", color: "#92918b", fontSize: 13 }}
            >
              {state.step === "scan_running"
                ? "Scan en cours — tu peux fermer cette fenêtre, on te préviendra."
                : "Continue dans le chat ci-dessus pour avancer."}
            </div>
          )}

          {state.step === "scan_complete" && (
            <div
              className="pplx-fade-in flex items-center justify-between gap-3 px-4"
              style={{ height: 56, borderRadius: 16, border: "1px solid #ece9e2", background: "#f1efea", fontSize: 13, color: "#27251e" }}
            >
              <div className="flex items-center gap-2">
                <Sparkles size={14} strokeWidth={1.7} />
                <span>Analyse simulée terminée. Le rapport réel arrivera quand les agents seront branchés.</span>
              </div>
              <button
                onClick={handleReset}
                className="pplx-dark-pill px-3 py-1.5"
                style={{ borderRadius: 9999, fontSize: 12, fontWeight: 500, color: "#faf8f5", background: "#000000", border: "none" }}
              >
                Nouveau diagnostic
              </button>
            </div>
          )}

          <div className="mt-2 text-center" style={{ fontSize: 11, color: "#92918b" }}>
            Obsidian n'effectue aucun scan sans vérification de propriété et consentement explicite.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Bubble rendering ---------------- */

function BubbleView({
  bubble, onPickMethod, onVerify, onConsent, step,
}: {
  bubble: ChatBubble;
  onPickMethod: (m: VerificationMethod) => void;
  onVerify: () => void;
  onConsent: () => void;
  step: DiagnosticState["step"];
}) {
  if (bubble.role === "user") {
    return (
      <div className="flex justify-end pplx-fade-in">
        <div
          style={{
            maxWidth: "85%", background: "#f1efea", color: "#27251e",
            borderRadius: 16, padding: "10px 16px", fontSize: 15, lineHeight: 1.5,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}
        >
          {bubble.text}
        </div>
      </div>
    );
  }

  if (bubble.kind === "method-picker") {
    return <MethodPicker onPick={onPickMethod} disabled={step !== "awaiting_method"} />;
  }
  if (bubble.kind === "verification") {
    return (
      <VerificationCard
        domain={(bubble.meta?.domain as string) ?? ""}
        method={bubble.meta?.method as VerificationMethod}
        token={(bubble.meta?.token as string) ?? ""}
        onVerify={onVerify}
        disabled={step !== "awaiting_verification"}
      />
    );
  }
  if (bubble.kind === "consent") {
    return <ConsentCard onConfirm={onConsent} disabled={step !== "awaiting_consent"} />;
  }
  if (bubble.kind === "scan-progress") {
    const lines = (bubble.meta?.lines as string[]) ?? [];
    const done = Boolean(bubble.meta?.done);
    return <ScanProgress lines={lines} done={done} />;
  }
  if (bubble.kind === "success") {
    return (
      <div
        className="pplx-fade-in flex items-center gap-2"
        style={{ alignSelf: "flex-start", padding: "8px 14px", borderRadius: 12, background: "#eef3ee", border: "1px solid #d8e3d8", color: "#27251e", fontSize: 14 }}
      >
        <Check size={14} strokeWidth={2} />
        <Markdown text={bubble.text ?? ""} inline />
      </div>
    );
  }
  if (bubble.kind === "error") {
    return (
      <div
        className="pplx-fade-in flex items-start gap-2"
        style={{ padding: "10px 14px", borderRadius: 12, background: "#faf3ee", border: "1px solid #e8d8c8", color: "#27251e", fontSize: 14 }}
      >
        <AlertTriangle size={14} strokeWidth={1.8} style={{ marginTop: 3, flexShrink: 0 }} />
        <Markdown text={bubble.text ?? ""} inline />
      </div>
    );
  }

  // default: text
  return (
    <div className="pplx-fade-in pplx-markdown" style={{ color: "#27251e", fontSize: 15, lineHeight: 1.65 }}>
      <Markdown text={bubble.text ?? ""} />
    </div>
  );
}

/* ---------------- Sub-cards ---------------- */

function MethodPicker({ onPick, disabled }: { onPick: (m: VerificationMethod) => void; disabled: boolean }) {
  const opts: { method: VerificationMethod; label: string; desc: string; icon: typeof Globe }[] = [
    { method: "file", label: "Fichier .well-known", desc: "Pose un fichier texte sur ton serveur web.", icon: FileText },
    { method: "dns", label: "DNS TXT record", desc: "Ajoute une entrée TXT chez ton registrar.", icon: Globe },
    { method: "meta", label: "Meta tag HTML", desc: "Insère une balise dans le <head>.", icon: CodeIcon },
  ];
  return (
    <div className="pplx-fade-in grid grid-cols-3 gap-2">
      {opts.map((o) => (
        <button
          key={o.method}
          onClick={() => !disabled && onPick(o.method)}
          disabled={disabled}
          className="pplx-card flex flex-col gap-2 p-3 text-left"
          style={{
            borderRadius: 12, backgroundColor: "#faf8f5", border: "1px solid #ece9e2",
            cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1,
          }}
        >
          <div className="flex items-center gap-2">
            <o.icon size={14} strokeWidth={1.7} style={{ color: "#27251e" }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: "#27251e" }}>{o.label}</span>
          </div>
          <span style={{ fontSize: 11, color: "#72706b", lineHeight: 1.4 }}>{o.desc}</span>
        </button>
      ))}
    </div>
  );
}

function VerificationCard({
  domain, method, token, onVerify, disabled,
}: {
  domain: string;
  method: VerificationMethod;
  token: string;
  onVerify: () => void;
  disabled: boolean;
}) {
  const [copied, setCopied] = useState(false);

  let snippet = "";
  let label = "";
  let instructions = "";
  if (method === "dns") {
    label = "Record DNS TXT à ajouter";
    snippet = `obsidian-verify=${token}`;
    instructions = `Connecte-toi chez ton registrar et ajoute un record TXT à la racine de \`${domain}\` avec la valeur ci-dessous.`;
  } else if (method === "meta") {
    label = "Meta tag à insérer dans <head>";
    snippet = `<meta name="obsidian-verify" content="${token}" />`;
    instructions = `Ajoute cette balise dans le \`<head>\` de la page d'accueil de \`${domain}\`, puis redéploie.`;
  } else {
    label = "Fichier à déposer";
    snippet = token;
    instructions = `Crée le fichier \`https://${domain}/.well-known/obsidian-verify.txt\` contenant exactement la valeur ci-dessous.`;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="pplx-fade-in flex flex-col gap-3 p-4"
      style={{ borderRadius: 12, border: "1px solid #ece9e2", background: "#faf8f5" }}
    >
      <div style={{ fontSize: 13, color: "#27251e", lineHeight: 1.55 }}>
        <Markdown text={instructions} />
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontSize: 11, fontWeight: 500, color: "#92918b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {label}
        </span>
        <button
          onClick={copy}
          className="pplx-pill flex items-center gap-1 px-2 py-1"
          style={{ borderRadius: 6, fontSize: 11, color: "#27251e", background: "transparent", border: "1px solid #ece9e2" }}
        >
          {copied ? <Check size={11} strokeWidth={2} /> : <Copy size={11} strokeWidth={1.7} />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <pre
        style={{
          background: "#27251e", color: "#faf8f5", padding: "12px 14px", borderRadius: 10,
          overflowX: "auto", fontSize: 12.5, lineHeight: 1.5, margin: 0,
        }}
      >
        <code>{snippet}</code>
      </pre>
      <button
        onClick={onVerify}
        disabled={disabled}
        className="pplx-dark-pill self-end flex items-center gap-2 px-4 py-2"
        style={{
          borderRadius: 9999, fontSize: 13, fontWeight: 500,
          color: "#faf8f5", background: disabled ? "#92918b" : "#000000", border: "none",
          cursor: disabled ? "default" : "pointer",
        }}
      >
        {disabled ? <Loader2 size={13} strokeWidth={2} className="animate-spin" /> : <ShieldCheck size={13} strokeWidth={1.8} />}
        {disabled ? "Vérification…" : "Vérifier maintenant"}
      </button>
    </div>
  );
}

function ConsentCard({ onConfirm, disabled }: { onConfirm: () => void; disabled: boolean }) {
  const [checked, setChecked] = useState(false);
  return (
    <div
      className="pplx-fade-in flex flex-col gap-3 p-4"
      style={{ borderRadius: 12, border: "1px solid #ece9e2", background: "#faf8f5" }}
    >
      <p style={{ fontSize: 13, color: "#27251e", lineHeight: 1.6, margin: 0 }}>
        {CONSENT_TEXT}
      </p>
      <label className="flex items-start gap-2" style={{ cursor: disabled ? "default" : "pointer" }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          disabled={disabled}
          style={{ marginTop: 3, accentColor: "#27251e" }}
        />
        <span style={{ fontSize: 13, color: "#27251e" }}>
          J'accepte les CGU et la politique d'usage responsable.
        </span>
      </label>
      <button
        onClick={onConfirm}
        disabled={!checked || disabled}
        className="pplx-dark-pill self-end px-4 py-2"
        style={{
          borderRadius: 9999, fontSize: 13, fontWeight: 500,
          color: "#faf8f5", background: !checked || disabled ? "#d4d2cc" : "#000000",
          border: "none", cursor: !checked || disabled ? "default" : "pointer",
        }}
      >
        Je confirme et je lance le scan
      </button>
      <span style={{ fontSize: 11, color: "#92918b" }}>
        Timestamp, user-agent et consentement seront enregistrés dans l'audit trail.
      </span>
    </div>
  );
}

function ScanProgress({ lines, done }: { lines: string[]; done: boolean }) {
  return (
    <div
      className="pplx-fade-in flex flex-col gap-2 p-4"
      style={{ borderRadius: 12, border: "1px solid #ece9e2", background: "#faf8f5", fontSize: 13, color: "#27251e" }}
    >
      <div className="flex items-center gap-2" style={{ fontSize: 12, color: "#72706b", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>
        {done ? <Check size={12} strokeWidth={2} /> : <Loader2 size={12} strokeWidth={2} className="animate-spin" />}
        {done ? "Scan terminé" : "Agents en cours d'exécution"}
      </div>
      <div className="flex flex-col gap-1 font-mono" style={{ fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace', fontSize: 12.5, lineHeight: 1.6 }}>
        <div style={{ color: "#72706b" }}>$ obsidian scan --consent verified</div>
        {lines.map((l, i) => (
          <div key={i} className="pplx-fade-in" style={{ color: "#27251e" }}>
            <span style={{ color: "#92918b" }}>›</span> {l}
          </div>
        ))}
        {!done && <div style={{ color: "#92918b" }}>…</div>}
      </div>
      {done && (
        <p style={{ fontSize: 13, color: "#27251e", margin: 0 }}>
          Les résultats arriveront dans <strong>Library</strong> dès que les agents auront finalisé leur diagnostic.
        </p>
      )}
    </div>
  );
}

/* ---------------- Minimal markdown (bold + inline code) ---------------- */

function Markdown({ text, inline = false }: { text: string; inline?: boolean }) {
  // Split by code/bold tokens preserving order
  const parts: { type: "text" | "code" | "bold" | "br"; value: string }[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\n)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push({ type: "text", value: text.slice(lastIndex, m.index) });
    const tok = m[0];
    if (tok === "\n") parts.push({ type: "br", value: "" });
    else if (tok.startsWith("`")) parts.push({ type: "code", value: tok.slice(1, -1) });
    else parts.push({ type: "bold", value: tok.slice(2, -2) });
    lastIndex = m.index + tok.length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });

  const nodes = parts.map((p, i) => {
    if (p.type === "br") return <br key={i} />;
    if (p.type === "code")
      return (
        <code key={i} style={{ background: "#f1efea", padding: "1px 6px", borderRadius: 4, fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace', fontSize: "0.88em" }}>
          {p.value}
        </code>
      );
    if (p.type === "bold") return <strong key={i} style={{ fontWeight: 600 }}>{p.value}</strong>;
    return <span key={i}>{p.value}</span>;
  });

  if (inline) return <span>{nodes}</span>;
  return <p style={{ margin: 0 }}>{nodes}</p>;
}
