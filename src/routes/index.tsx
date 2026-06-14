import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, Plus, Mic, ArrowRight, Compass, Grid3x3, LineChart, Heart,
  MoreHorizontal, Monitor, Clock, Sparkles, Globe, BookOpen, Image as ImageIcon,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "perplexity" },
      { name: "description", content: "Where knowledge begins." },
    ],
  }),
  component: Index,
});

const navItems = [
  { icon: Search, label: "Discover", active: false },
  { icon: Monitor, label: "Computer", active: true },
  { icon: Compass, label: "Spaces", active: false },
  { icon: Grid3x3, label: "Library", active: false },
  { icon: LineChart, label: "Finance", active: false },
  { icon: Heart, label: "Travel", active: false },
];

const suggestions = [
  { icon: Sparkles, label: "Try Computer" },
  { icon: Globe, label: "Research a topic" },
  { icon: BookOpen, label: "Summarize a paper" },
  { icon: LineChart, label: "Analyze markets" },
  { icon: ImageIcon, label: "Generate an image" },
];

function NavItem({ icon: Icon, label, active }: { icon: typeof Search; label: string; active?: boolean }) {
  return (
    <button
      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
      style={{
        borderRadius: 8,
        color: "#27251e",
        fontWeight: active ? 500 : 400,
        fontSize: 14,
        backgroundColor: active ? "#ece9e2" : "transparent",
      }}
    >
      <Icon size={18} strokeWidth={1.5} style={{ color: active ? "#27251e" : "#72706b" }} />
      <span>{label}</span>
    </button>
  );
}

function SuggestionCard({ icon: Icon, label }: { icon: typeof Search; label: string }) {
  return (
    <button
      className="flex shrink-0 flex-col gap-3 p-4 text-left transition-colors hover:bg-[#f4f1ec]"
      style={{
        width: 180,
        borderRadius: 12,
        backgroundColor: "#faf8f5",
        border: "1px solid #ece9e2",
      }}
    >
      <div className="flex items-center gap-2">
        <Icon size={16} strokeWidth={1.5} style={{ color: "#27251e" }} />
        <span style={{ fontSize: 14, color: "#27251e", fontWeight: 500 }}>{label}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <div style={{ height: 6, borderRadius: 4, backgroundColor: "#ece9e2", width: "90%" }} />
        <div style={{ height: 6, borderRadius: 4, backgroundColor: "#ece9e2", width: "70%" }} />
        <div style={{ height: 6, borderRadius: 4, backgroundColor: "#ece9e2", width: "55%" }} />
      </div>
    </button>
  );
}

function Index() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 flex h-screen flex-col"
        style={{ width: 260, backgroundColor: "#faf8f5", padding: 16 }}
      >
        {/* Wordmark small */}
        <div className="mb-6 px-2 pt-2" style={{ fontSize: 20, color: "#27251e", fontWeight: 400, letterSpacing: "-0.01em" }}>
          perplexity
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#72706b" }} />
          <input
            placeholder="Search"
            className="w-full bg-transparent py-2 pl-9 pr-3 outline-none placeholder:text-[#92918b]"
            style={{ fontSize: 14, color: "#27251e", borderRadius: 8, border: "1px solid #ece9e2" }}
          />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
          <NavItem icon={MoreHorizontal} label="More" />
        </nav>

        {/* History */}
        <div className="mt-8 px-3">
          <div style={{ fontSize: 14, color: "#27251e", fontWeight: 500 }}>History</div>
          <div className="mt-1" style={{ fontSize: 12, color: "#72706b", lineHeight: 1.5 }}>
            Recent and active threads will appear here.
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 px-3 py-2" style={{ fontSize: 12, color: "#72706b" }}>
          <Clock size={14} strokeWidth={1.5} />
          <span>Updated just now</span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-h-screen flex-1 flex-col items-center justify-center px-8" style={{ marginLeft: 260 }}>
        <div className="flex w-full flex-col items-center" style={{ maxWidth: 768 }}>
          {/* Wordmark */}
          <h1
            className="mb-8 text-center"
            style={{
              fontSize: 56,
              fontWeight: 400,
              color: "#27251e",
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}
          >
            perplexity
          </h1>

          {/* Input */}
          <div
            className="w-full"
            style={{
              backgroundColor: "#faf8f5",
              border: "1px solid #ece9e2",
              borderRadius: 16,
              padding: 16,
            }}
          >
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type @ for connectors and sources"
              rows={2}
              className="w-full resize-none bg-transparent outline-none placeholder:text-[#92918b]"
              style={{ fontSize: 16, color: "#27251e", lineHeight: 1.5 }}
            />

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-[#ece9e2]"
                  style={{ borderRadius: 9999, color: "#72706b" }}
                  aria-label="Attach"
                >
                  <Plus size={18} strokeWidth={1.5} />
                </button>
                <button
                  className="flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-[#f4f1ec]"
                  style={{
                    borderRadius: 9999,
                    border: "1px solid #d4d2cc",
                    fontSize: 14,
                    color: "#27251e",
                  }}
                >
                  <Monitor size={14} strokeWidth={1.5} />
                  <span>Computer</span>
                  <Plus size={14} strokeWidth={1.5} style={{ color: "#72706b" }} />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 transition-colors hover:bg-[#ece9e2]"
                  style={{ borderRadius: 9999, fontSize: 14, color: "#27251e" }}
                >
                  <span>Model</span>
                  <span style={{ fontSize: 10 }}>▾</span>
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center transition-colors hover:bg-[#ece9e2]"
                  style={{ borderRadius: 9999, color: "#72706b" }}
                  aria-label="Voice"
                >
                  <Mic size={18} strokeWidth={1.5} />
                </button>
                <button
                  className="flex h-8 w-8 items-center justify-center transition-opacity hover:opacity-90"
                  style={{ borderRadius: 9999, backgroundColor: "#000000", color: "#faf8f5" }}
                  aria-label="Submit"
                >
                  <ArrowRight size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-8 flex w-full gap-3 overflow-x-auto pb-2">
            {suggestions.map((s) => (
              <SuggestionCard key={s.label} {...s} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
