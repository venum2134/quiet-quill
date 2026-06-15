import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { DiagnosticFlow } from "@/components/DiagnosticFlow";

export const Route = createFileRoute("/diagnostic")({
  head: () => ({
    meta: [
      { title: "Diagnostic — Obsidian" },
      { name: "description", content: "Vérification de propriété et consentement avant tout scan de sécurité." },
      { property: "og:title", content: "Diagnostic — Obsidian" },
      { property: "og:description", content: "Vérification de propriété et consentement avant tout scan." },
      { property: "og:url", content: "/diagnostic" },
    ],
    links: [{ rel: "canonical", href: "/diagnostic" }],
  }),
  component: DiagnosticPage,
});

function DiagnosticPage() {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <Sidebar />
      <main className="relative flex min-h-screen flex-1 flex-col" style={{ marginLeft: 264 }}>
        <DiagnosticFlow />
      </main>
    </div>
  );
}
