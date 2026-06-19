import { createFileRoute } from "@tanstack/react-router";
import { Sidebar } from "@/components/Sidebar";
import { DiagnosticFlow } from "@/components/DiagnosticFlow";
import { TopBar } from "@/components/TopBar";
import { useSidebarCollapsed } from "@/lib/preferences";

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
  const [collapsed] = useSidebarCollapsed();
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--c-bg)" }}>
      <Sidebar />
      <main
        className="relative flex min-h-screen flex-1 flex-col"
        style={{ marginLeft: collapsed ? 60 : 260, transition: "margin-left 200ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        <TopBar title="Diagnostic" />
        <DiagnosticFlow />
      </main>
    </div>
  );
}

