import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, Plus, Mic, ArrowRight, Compass, Grid3x3, LineChart, Heart,
  MoreHorizontal, Monitor, Sparkles, Globe, BookOpen, Image as ImageIcon,
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
      className="pplx-nav flex w-full items-center gap-3 px-3 py-2 text-left"
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

function SuggestionCard({ icon: Icon, label, delay }: { icon: typeof Search; label: string; delay: number }) {
  return (
    <button
      className="pplx-card pplx-fade-up flex shrink-0 flex-col gap-3 p-4 text-left"
      style={{
        width: 180,
        borderRadius: 12,
        backgroundColor: "#faf8f5",
        border: "1px solid #ece9e2",
        animationDelay: `${delay}ms`,
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
        className="pplx-fade-in fixed left-0 top-0 flex h-screen flex-col"
        style={{ width: 260, backgroundColor: "#faf8f5", padding: 12, animationDelay: "0ms" }}
      >
        {/* Brand dot */}
        <div className="mb-5 flex items-center gap-2 px-2 pt-2">
          <div
            style={{
              width: 22, height: 22, borderRadius: 9999,
              background: "#27251e",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#faf8f5", fontSize: 12, fontWeight: 500,
            }}
          >
            p
          </div>
          <span style={{ fontSize: 15, color: "#27251e", fontWeight: 500, letterSpacing: "-0.02em" }}>
            perplexity
          </span>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#72706b" }} />
          <input
            placeholder="Search"
            className="w-full py-2 pl-9 pr-3 outline-none placeholder:text-[#92918b] transition-colors focus:bg-[#ece9e2]"
            style={{ fontSize: 14, color: "#27251e", borderRadius: 8, backgroundColor: "#f1efea", border: "none" }}
          />
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
          <NavItem icon={MoreHorizontal} label="More" />
        </nav>

        {/* History */}
        <div className="mt-8 px-3">
          <div style={{ fontSize: 13, color: "#27251e", fontWeight: 500, letterSpacing: "-0.01em" }}>History</div>
          <div className="mt-1.5" style={{ fontSize: 12, color: "#72706b", lineHeight: 1.5 }}>
            Recent and active threads will appear here.
          </div>
        </div>

        <div className="mt-auto flex items-center gap-2 px-3 py-2" style={{ fontSize: 12, color: "#92918b" }}>
          <div style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: "#92918b" }} />
          <span>v1.0</span>
        </div>
      </aside>

      {/* Main */}
      <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center px-8" style={{ marginLeft: 260 }}>
        {/* Top-right auth bar */}
        <div className="pplx-fade-in absolute right-6 top-5 flex items-center gap-2" style={{ animationDelay: "150ms" }}>
          <button
            className="pplx-pill px-4 py-2"
            style={{
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              color: "#27251e",
              background: "transparent",
              border: "none",
            }}
          >
            Log in
          </button>
          <button
            className="pplx-dark-pill px-4 py-2"
            style={{
              borderRadius: 9999,
              fontSize: 14,
              fontWeight: 500,
              color: "#faf8f5",
              background: "#000000",
              border: "none",
            }}
          >
            Sign up
          </button>
        </div>

        <div className="flex w-full flex-col items-center" style={{ maxWidth: 720 }}>
          {/* Wordmark */}
          <h1
            className="pplx-wordmark-in mb-10 text-center"
            style={{
              fontSize: 60,
              fontWeight: 450,
              color: "#27251e",
              lineHeight: 1,
              fontVariationSettings: '"wght" 450',
            }}
          >
            perplexity
          </h1>

          {/* Input */}
          <div
            className="pplx-input-wrap pplx-fade-up w-full"
            style={{
              backgroundColor: "#faf8f5",
              border: "1px solid #ece9e2",
              borderRadius: 16,
              padding: 14,
              animationDelay: "180ms",
            }}
          >
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type @ for connectors and sources"
              rows={2}
              className="w-full resize-none bg-transparent outline-none placeholder:text-[#92918b]"
              style={{ fontSize: 16, color: "#27251e", lineHeight: 1.5, border: "none" }}
            />

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  className="pplx-pill flex h-8 w-8 items-center justify-center"
                  style={{ borderRadius: 9999, color: "#72706b", background: "transparent", border: "none" }}
                  aria-label="Attach"
                >
                  <Plus size={18} strokeWidth={1.5} />
                </button>
                <button
                  className="pplx-pill flex items-center gap-1.5 px-3 py-1.5"
                  style={{
                    borderRadius: 9999,
                    border: "1px solid #d4d2cc",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#27251e",
                    background: "transparent",
                  }}
                >
                  <Monitor size={14} strokeWidth={1.5} />
                  <span>Computer</span>
                  <Plus size={13} strokeWidth={1.5} style={{ color: "#72706b" }} />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  className="pplx-pill flex items-center gap-1 px-3 py-1.5"
                  style={{ borderRadius: 9999, fontSize: 13, fontWeight: 500, color: "#27251e", background: "transparent", border: "none" }}
                >
                  <span>Model</span>
                  <span style={{ fontSize: 10 }}>▾</span>
                </button>
                <button
                  className="pplx-pill flex h-8 w-8 items-center justify-center"
                  style={{ borderRadius: 9999, color: "#72706b", background: "transparent", border: "none" }}
                  aria-label="Voice"
                >
                  <Mic size={18} strokeWidth={1.5} />
                </button>
                <button
                  className="pplx-submit flex h-9 w-9 items-center justify-center"
                  style={{ borderRadius: 9999, backgroundColor: "#000000", color: "#faf8f5", border: "none" }}
                  aria-label="Submit"
                >
                  <ArrowRight size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="mt-10 flex w-full gap-3 overflow-x-auto pb-2">
            {suggestions.map((s, i) => (
              <SuggestionCard key={s.label} {...s} delay={260 + i * 70} />
            ))}
          </div>
        </div>

        {/* Footer disclaimer */}
        <div
          className="pplx-fade-in absolute bottom-5 left-1/2 -translate-x-1/2 text-center"
          style={{ fontSize: 12, color: "#92918b", animationDelay: "500ms" }}
        >
          Perplexity may produce inaccurate information about people, places, or facts.
        </div>
      </main>
    </div>
  );
}
