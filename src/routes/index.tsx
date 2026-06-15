import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search, Plus, Mic, ArrowRight, Compass, Library, MoreHorizontal,
  Monitor, Sparkles, Globe, BookOpen, LineChart, Image as ImageIcon,
  PanelLeftClose, SquarePen, MoreVertical,
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

const mainNav = [
  { icon: Compass, label: "Discover" },
  { icon: Monitor, label: "Spaces" },
  { icon: Library, label: "Library" },
];

const history = {
  Today: [
    "Quantum computing basics",
    "React 19 use() hook patterns",
    "Best espresso machines under $500",
  ],
  Yesterday: [
    "Trip to Lisbon — 4 day itinerary",
    "TypeScript generics deep dive",
  ],
  "Previous 7 days": [
    "Climate report 2024 summary",
    "Postgres vs SQLite for edge",
    "Marathon training plan",
  ],
};

const suggestions = [
  { icon: Sparkles, label: "Try Computer" },
  { icon: Globe, label: "Research a topic" },
  { icon: BookOpen, label: "Summarize a paper" },
  { icon: LineChart, label: "Analyze markets" },
  { icon: ImageIcon, label: "Generate an image" },
];

function SideNavItem({ icon: Icon, label }: { icon: typeof Search; label: string }) {
  return (
    <button
      className="pplx-side-item flex w-full items-center gap-2.5 px-2 text-left"
      style={{ height: 32, borderRadius: 6, color: "#27251e", fontSize: 13, fontWeight: 500, letterSpacing: "-0.006em" }}
    >
      <Icon size={16} strokeWidth={1.6} style={{ color: "#72706b" }} />
      <span>{label}</span>
    </button>
  );
}

function HistoryItem({ label }: { label: string }) {
  return (
    <button
      className="pplx-side-item group flex w-full items-center justify-between gap-2 px-2 text-left"
      style={{ height: 30, borderRadius: 6 }}
    >
      <span
        className="truncate"
        style={{ fontSize: 13, color: "#27251e", fontWeight: 400, letterSpacing: "-0.006em" }}
      >
        {label}
      </span>
      <MoreHorizontal size={14} strokeWidth={1.5} className="pplx-side-more shrink-0" style={{ color: "#72706b" }} />
    </button>
  );
}

function SuggestionCard({ icon: Icon, label, delay }: { icon: typeof Search; label: string; delay: number }) {
  return (
    <button
      className="pplx-card pplx-fade-up flex shrink-0 flex-col gap-3 p-4 text-left"
      style={{
        width: 180, borderRadius: 12, backgroundColor: "#faf8f5",
        border: "1px solid #ece9e2", animationDelay: `${delay}ms`,
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
  const SIDEBAR_W = 264;

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#faf8f5" }}>
      {/* Sidebar */}
      <aside
        className="pplx-fade-in fixed left-0 top-0 flex h-screen flex-col"
        style={{ width: SIDEBAR_W, backgroundColor: "#faf8f5" }}
      >
        {/* Header (sticky top) */}
        <div className="flex shrink-0 items-center justify-between px-3" style={{ height: 52 }}>
          <div className="flex items-center gap-2">
            <div
              style={{
                width: 22, height: 22, borderRadius: 9999, background: "#27251e",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#faf8f5", fontSize: 12, fontWeight: 500,
              }}
            >
              p
            </div>
            <span style={{ fontSize: 14, color: "#27251e", fontWeight: 500, letterSpacing: "-0.012em" }}>
              perplexity
            </span>
          </div>
          <button
            className="pplx-side-item flex items-center justify-center"
            style={{ width: 28, height: 28, borderRadius: 6, color: "#72706b" }}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={16} strokeWidth={1.6} />
          </button>
        </div>

        {/* New Thread + Search (shrink-0) */}
        <div className="flex shrink-0 flex-col gap-1 px-2 pb-2">
          <button
            className="pplx-side-item flex items-center justify-between px-2"
            style={{ height: 36, borderRadius: 8, border: "1px solid #ece9e2", background: "#faf8f5" }}
          >
            <div className="flex items-center gap-2.5">
              <SquarePen size={15} strokeWidth={1.6} style={{ color: "#27251e" }} />
              <span style={{ fontSize: 13, color: "#27251e", fontWeight: 500 }}>New Thread</span>
            </div>
            <span className="pplx-kbd">⌘K</span>
          </button>

          <div className="relative">
            <Search size={14} strokeWidth={1.6} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "#92918b" }} />
            <input
              placeholder="Search threads"
              className="w-full outline-none placeholder:text-[#92918b] transition-colors focus:bg-[#f1efea]"
              style={{ height: 32, fontSize: 13, color: "#27251e", borderRadius: 6, backgroundColor: "transparent", border: "none", paddingLeft: 30, paddingRight: 8 }}
            />
          </div>
        </div>

        {/* Scrollable middle */}
        <div className="pplx-sidebar-scroll flex-1 overflow-y-auto px-2 pb-2">
          {/* Main nav */}
          <nav className="flex flex-col gap-0.5 pb-3">
            {mainNav.map((item) => (
              <SideNavItem key={item.label} {...item} />
            ))}
          </nav>

          {/* History grouped */}
          <div className="flex flex-col gap-3 pt-2">
            {Object.entries(history).map(([group, items]) => (
              <div key={group} className="flex flex-col gap-0.5">
                <div className="pplx-section-label" style={{ marginBottom: 4, lineHeight: "20px" }}>
                  {group}
                </div>
                {items.map((label) => (
                  <HistoryItem key={label} label={label} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* User footer (sticky bottom) */}
        <div className="shrink-0 px-2 pb-2 pt-2" style={{ borderTop: "1px solid #ece9e2" }}>
          <button
            className="pplx-side-item flex w-full items-center gap-2.5 px-2"
            style={{ height: 44, borderRadius: 8 }}
          >
            <div
              style={{
                width: 26, height: 26, borderRadius: 9999, background: "#27251e",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#faf8f5", fontSize: 12, fontWeight: 500, flexShrink: 0,
              }}
            >
              A
            </div>
            <div className="flex flex-1 flex-col items-start" style={{ lineHeight: 1.2 }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#27251e" }}>Antoine</span>
              <span style={{ fontSize: 11, color: "#72706b" }}>Free plan</span>
            </div>
            <MoreVertical size={14} strokeWidth={1.6} style={{ color: "#72706b" }} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="relative flex min-h-screen flex-1 flex-col items-center justify-center px-8" style={{ marginLeft: SIDEBAR_W }}>
        {/* Top-right auth bar */}
        <div className="pplx-fade-in absolute right-6 top-5 flex items-center gap-2" style={{ animationDelay: "150ms" }}>
          <button
            className="pplx-pill px-4 py-2"
            style={{ borderRadius: 9999, fontSize: 14, fontWeight: 500, color: "#27251e", background: "transparent", border: "none" }}
          >
            Log in
          </button>
          <button
            className="pplx-dark-pill px-4 py-2"
            style={{ borderRadius: 9999, fontSize: 14, fontWeight: 500, color: "#faf8f5", background: "#000000", border: "none" }}
          >
            Sign up
          </button>
        </div>

        <div className="flex w-full flex-col items-center" style={{ maxWidth: 720 }}>
          <h1
            className="pplx-wordmark-in mb-10 text-center"
            style={{ fontSize: 60, fontWeight: 450, color: "#27251e", lineHeight: 1, fontVariationSettings: '"wght" 450' }}
          >
            perplexity
          </h1>

          <div
            className="pplx-input-wrap pplx-fade-up w-full"
            style={{ backgroundColor: "#faf8f5", border: "1px solid #ece9e2", borderRadius: 16, padding: 14, animationDelay: "180ms" }}
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
                <button className="pplx-pill flex h-8 w-8 items-center justify-center" style={{ borderRadius: 9999, color: "#72706b", background: "transparent", border: "none" }} aria-label="Attach">
                  <Plus size={18} strokeWidth={1.5} />
                </button>
                <button
                  className="pplx-pill flex items-center gap-1.5 px-3 py-1.5"
                  style={{ borderRadius: 9999, border: "1px solid #d4d2cc", fontSize: 13, fontWeight: 500, color: "#27251e", background: "transparent" }}
                >
                  <Monitor size={14} strokeWidth={1.5} />
                  <span>Computer</span>
                  <Plus size={13} strokeWidth={1.5} style={{ color: "#72706b" }} />
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button className="pplx-pill flex items-center gap-1 px-3 py-1.5" style={{ borderRadius: 9999, fontSize: 13, fontWeight: 500, color: "#27251e", background: "transparent", border: "none" }}>
                  <span>Model</span>
                  <span style={{ fontSize: 10 }}>▾</span>
                </button>
                <button className="pplx-pill flex h-8 w-8 items-center justify-center" style={{ borderRadius: 9999, color: "#72706b", background: "transparent", border: "none" }} aria-label="Voice">
                  <Mic size={18} strokeWidth={1.5} />
                </button>
                <button className="pplx-submit flex h-9 w-9 items-center justify-center" style={{ borderRadius: 9999, backgroundColor: "#000000", color: "#faf8f5", border: "none" }} aria-label="Submit">
                  <ArrowRight size={16} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 flex w-full gap-3 overflow-x-auto pb-2">
            {suggestions.map((s, i) => (
              <SuggestionCard key={s.label} {...s} delay={260 + i * 70} />
            ))}
          </div>
        </div>

        <div className="pplx-fade-in absolute bottom-5 left-1/2 -translate-x-1/2 text-center" style={{ fontSize: 12, color: "#92918b", animationDelay: "500ms" }}>
          Perplexity may produce inaccurate information about people, places, or facts.
        </div>
      </main>
    </div>
  );
}
