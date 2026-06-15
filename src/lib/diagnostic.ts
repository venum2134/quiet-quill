// Diagnostic state machine + localStorage persistence (Obsidian)

export type VerificationMethod = "dns" | "meta" | "file";

export type DiagnosticStep =
  | "awaiting_url"
  | "awaiting_method"
  | "awaiting_verification"
  | "verified"
  | "awaiting_consent"
  | "scan_running"
  | "scan_complete";

export type ChatBubble = {
  id: string;
  role: "assistant" | "user" | "system";
  kind?: "text" | "method-picker" | "verification" | "consent" | "scan-progress" | "success" | "error";
  text?: string;
  // For method-picker / verification: payload
  meta?: Record<string, unknown>;
  createdAt: number;
};

export type AuditEntry = {
  domain: string;
  method: VerificationMethod;
  token: string;
  timestamp: number;
  userAgent: string;
  consentText: string;
  ip: string; // "pending-server-capture" for now
};

export type DiagnosticState = {
  step: DiagnosticStep;
  domain: string | null;
  method: VerificationMethod | null;
  token: string | null;
  bubbles: ChatBubble[];
  startedAt: number;
};

const STATE_KEY = "obsidian:diagnostic:current";
const AUDIT_KEY = "obsidian:audit-trail";

function isBrowser() {
  return typeof window !== "undefined";
}

function uid(): string {
  if (isBrowser() && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2);
}

export function makeToken(): string {
  // 24 chars of base36 entropy, prefixed
  const a = Math.random().toString(36).slice(2, 14);
  const b = Math.random().toString(36).slice(2, 14);
  return `obsidian-verify-${a}${b}`;
}

export function initialState(): DiagnosticState {
  return {
    step: "awaiting_url",
    domain: null,
    method: null,
    token: null,
    startedAt: Date.now(),
    bubbles: [
      {
        id: uid(),
        role: "assistant",
        kind: "text",
        text:
          "Bienvenue dans Obsidian Diagnostic. Avant de lancer le moindre scan, on doit confirmer que tu as le droit de tester le domaine.\n\nQuel domaine veux-tu analyser ?",
        createdAt: Date.now(),
      },
    ],
  };
}

export function loadDiagnostic(): DiagnosticState | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DiagnosticState;
  } catch {
    return null;
  }
}

export function saveDiagnostic(state: DiagnosticState) {
  if (!isBrowser()) return;
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function resetDiagnostic() {
  if (!isBrowser()) return;
  localStorage.removeItem(STATE_KEY);
}

export function appendAuditTrail(entry: AuditEntry) {
  if (!isBrowser()) return;
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const arr: AuditEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(entry);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export function isValidDomain(input: string): boolean {
  const s = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!s) return false;
  // basic domain regex (labels + TLD)
  return /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2}[a-z]*$/.test(s);
}

export function normalizeDomain(input: string): string {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

// Simulated verification check. Returns a promise resolving to success/failure.
// TODO: replace with serverFn calling DNS resolver / HTTP fetch from a Worker.
export function checkVerification(
  _domain: string,
  _method: VerificationMethod,
  _token: string,
): Promise<{ ok: boolean; reason?: string }> {
  return new Promise((resolve) => {
    // 80% success after 1.5–2.5s
    const delay = 1500 + Math.random() * 1000;
    setTimeout(() => {
      const ok = Math.random() > 0.2;
      resolve(ok ? { ok: true } : { ok: false, reason: "Token introuvable. Vérifie que la modification est bien déployée." });
    }, delay);
  });
}

export const CONSENT_TEXT =
  "Je certifie être propriétaire du domaine indiqué ou disposer d'une autorisation écrite du propriétaire pour effectuer ce test de sécurité. Je comprends qu'un scan non autorisé peut constituer une infraction pénale dans ma juridiction. J'accepte les CGU et la politique d'usage responsable d'Obsidian.";

export function newBubble(b: Omit<ChatBubble, "id" | "createdAt">): ChatBubble {
  return { ...b, id: uid(), createdAt: Date.now() };
}
