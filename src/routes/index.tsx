import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { createThread, loadThreads } from "@/lib/threads";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "perplexity" },
      { name: "description", content: "Where knowledge begins." },
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
  return <div style={{ minHeight: "100vh", backgroundColor: "#faf8f5" }} />;
}
