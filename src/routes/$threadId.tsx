import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { Sidebar } from "@/components/Sidebar";
import { ChatView } from "@/components/ChatView";
import { TopBar } from "@/components/TopBar";
import { getThread } from "@/lib/threads";
import { useSidebarCollapsed } from "@/lib/preferences";

export const Route = createFileRoute("/$threadId")({
  head: () => ({
    meta: [
      { title: "Obsidian" },
      { name: "description", content: "Le pentest automatisé, démocratisé." },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [title, setTitle] = useState<string>("Obsidian");
  const [collapsed] = useSidebarCollapsed();

  useEffect(() => {
    const t = getThread(threadId);
    setInitial(t?.messages ?? []);
    setTitle(t?.title ?? "Obsidian");
  }, [threadId]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--c-bg)" }}>
      <Sidebar />
      <main
        className="relative flex min-h-screen flex-1 flex-col"
        style={{ marginLeft: collapsed ? 60 : 260, transition: "margin-left 200ms cubic-bezier(0.16,1,0.3,1)" }}
      >
        <TopBar title={title} />
        {initial !== null && (
          <ChatView key={threadId} threadId={threadId} initialMessages={initial} />
        )}
      </main>
    </div>
  );
}

