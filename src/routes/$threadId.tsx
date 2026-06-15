import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { UIMessage } from "ai";
import { Sidebar } from "@/components/Sidebar";
import { ChatView } from "@/components/ChatView";
import { getThread } from "@/lib/threads";

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

  useEffect(() => {
    const t = getThread(threadId);
    setInitial(t?.messages ?? []);
  }, [threadId]);

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      <Sidebar />
      <main className="relative flex min-h-screen flex-1 flex-col" style={{ marginLeft: 264 }}>
        <div className="pplx-fade-in absolute right-6 top-5 z-10 flex items-center gap-2">
          <button className="pplx-pill px-4 py-2" style={{ borderRadius: 9999, fontSize: 14, fontWeight: 500, color: "#27251e", background: "transparent", border: "none" }}>
            Log in
          </button>
          <button className="pplx-dark-pill px-4 py-2" style={{ borderRadius: 9999, fontSize: 14, fontWeight: 500, color: "#faf8f5", background: "#000000", border: "none" }}>
            Sign up
          </button>
        </div>

        {initial !== null && (
          <ChatView key={threadId} threadId={threadId} initialMessages={initial} />
        )}
      </main>
    </div>
  );
}
