import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { createThread, loadThreads } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Obsidian" },
      { name: "description", content: "Le pentest automatisé, démocratisé." },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const existing = loadThreads();
    const target = existing[0] ?? createThread();
    navigate({ to: "/$threadId", params: { threadId: target.id }, replace: true });
  }, [navigate]);
  return <div style={{ minHeight: "100vh", backgroundColor: "var(--c-bg)" }} />;
}
