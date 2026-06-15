import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search, Compass, Library, Monitor, PanelLeftClose, SquarePen,
  MoreHorizontal, MoreVertical, Trash2, ShieldCheck,
} from "lucide-react";
import {
  createThread, deleteThread, groupByDate, loadThreads, subscribeThreads,
  type Thread,
} from "@/lib/threads";

const mainNav = [
  { icon: Compass, label: "Discover" },
  { icon: Monitor, label: "Spaces" },
  { icon: Library, label: "Library" },
];

export function Sidebar() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeId = params.threadId;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    setThreads(loadThreads());
    return subscribeThreads(() => setThreads(loadThreads()));
  }, []);

  // ⌘K / Ctrl+K → new thread
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const t = createThread();
        navigate({ to: "/$threadId", params: { threadId: t.id } });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const filtered = filter
    ? threads.filter((t) => t.title.toLowerCase().includes(filter.toLowerCase()))
    : threads;
  const groups = groupByDate(filtered);

  const handleNew = () => {
    const t = createThread();
    navigate({ to: "/$threadId", params: { threadId: t.id } });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    deleteThread(id);
    if (id === activeId) {
      const remaining = loadThreads();
      if (remaining.length > 0) {
        navigate({ to: "/$threadId", params: { threadId: remaining[0].id } });
      } else {
        const t = createThread();
        navigate({ to: "/$threadId", params: { threadId: t.id } });
      }
    }
  };

  return (
    <aside
      className="pplx-fade-in fixed left-0 top-0 flex h-screen flex-col"
      style={{ width: 264, backgroundColor: "#faf8f5" }}
    >
      <div className="flex shrink-0 items-center justify-between px-3" style={{ height: 52 }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 22, height: 22, borderRadius: 6, background: "#27251e",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#faf8f5", fontSize: 12, fontWeight: 600,
          }}>◆</div>
          <span style={{ fontSize: 14, color: "#27251e", fontWeight: 500, letterSpacing: "-0.012em" }}>
            obsidian
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

      <div className="flex shrink-0 flex-col gap-1 px-2 pb-2">
        <button
          onClick={handleNew}
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
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search threads"
            className="w-full outline-none placeholder:text-[#92918b] transition-colors focus:bg-[#f1efea]"
            style={{ height: 32, fontSize: 13, color: "#27251e", borderRadius: 6, backgroundColor: "transparent", border: "none", paddingLeft: 30, paddingRight: 8 }}
          />
        </div>
      </div>

      <div className="pplx-sidebar-scroll flex-1 overflow-y-auto px-2 pb-2">
        <nav className="flex flex-col gap-0.5 pb-3">
          {mainNav.map((item) => (
            <button
              key={item.label}
              className="pplx-side-item flex w-full items-center gap-2.5 px-2 text-left"
              style={{ height: 32, borderRadius: 6, color: "#27251e", fontSize: 13, fontWeight: 500, letterSpacing: "-0.006em" }}
            >
              <item.icon size={16} strokeWidth={1.6} style={{ color: "#72706b" }} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-3 pt-2">
          {Object.entries(groups).map(([group, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={group} className="flex flex-col gap-0.5">
                <div className="pplx-section-label" style={{ marginBottom: 4, lineHeight: "20px" }}>
                  {group}
                </div>
                {items.map((t) => {
                  const isActive = t.id === activeId;
                  return (
                    <div key={t.id} className="pplx-side-item group relative flex w-full items-center" style={{ borderRadius: 6, background: isActive ? "#ece9e2" : "transparent" }}>
                      <Link
                        to="/$threadId"
                        params={{ threadId: t.id }}
                        className="flex flex-1 items-center px-2"
                        style={{ height: 30, minWidth: 0 }}
                      >
                        <span
                          className="truncate"
                          style={{ fontSize: 13, color: "#27251e", fontWeight: isActive ? 500 : 400, letterSpacing: "-0.006em", flex: 1 }}
                        >
                          {t.title}
                        </span>
                      </Link>
                      <button
                        onClick={(e) => handleDelete(t.id, e)}
                        className="pplx-side-more mr-1 flex h-6 w-6 items-center justify-center"
                        style={{ borderRadius: 4, color: "#72706b" }}
                        aria-label="Delete thread"
                      >
                        <Trash2 size={13} strokeWidth={1.6} />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ fontSize: 12, color: "#92918b", padding: "8px 8px" }}>
              {filter ? "No threads match." : "No threads yet."}
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-2 pb-2 pt-2" style={{ borderTop: "1px solid #ece9e2" }}>
        <button className="pplx-side-item flex w-full items-center gap-2.5 px-2" style={{ height: 44, borderRadius: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 9999, background: "#27251e",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#faf8f5", fontSize: 12, fontWeight: 500, flexShrink: 0,
          }}>A</div>
          <div className="flex flex-1 flex-col items-start" style={{ lineHeight: 1.2 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#27251e" }}>Antoine</span>
            <span style={{ fontSize: 11, color: "#72706b" }}>Free plan</span>
          </div>
          <MoreVertical size={14} strokeWidth={1.6} style={{ color: "#72706b" }} />
        </button>
      </div>
    </aside>
  );
}

// Suppress unused
void MoreHorizontal;
