import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, PanelLeftClose, PanelLeftOpen, SquarePen, MoreHorizontal,
  ShieldCheck, Settings, LogOut, Download, Trash2, Pin, PinOff, Pencil, FileDown, Sun, Moon,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import {
  createThread, deleteThread, deleteAllThreads, downloadAllThreadsJSON,
  downloadThreadMarkdown, groupByDate, loadThreads, renameThread,
  subscribeThreads, togglePin, type Thread,
} from "@/lib/threads";
import { useSidebarCollapsed } from "@/lib/preferences";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { springSoft, springSnappy, easeOut } from "@/lib/motion";

export function Sidebar() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeId = params.threadId;
  const onDiagnostic = pathname === "/diagnostic";
  const [threads, setThreads] = useState<Thread[]>([]);
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");

  useEffect(() => {
    setThreads(loadThreads());
    return subscribeThreads(() => setThreads(loadThreads()));
  }, []);

  // ⌘K → new thread, ⌘\ → toggle sidebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const t = createThread();
        navigate({ to: "/$threadId", params: { threadId: t.id } });
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        setCollapsed(!collapsed);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, collapsed, setCollapsed]);

  const filtered = filter
    ? threads.filter((t) => t.title.toLowerCase().includes(filter.toLowerCase()))
    : threads;
  const pinned = filtered.filter((t) => t.pinned);
  const unpinned = filtered.filter((t) => !t.pinned);
  const groups = groupByDate(unpinned);

  const handleNew = () => {
    const t = createThread();
    navigate({ to: "/$threadId", params: { threadId: t.id } });
  };

  const handleDelete = (id: string) => {
    deleteThread(id);
    toast.success("Conversation supprimée");
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

  const startRename = (t: Thread) => {
    setRenamingId(t.id);
    setRenameDraft(t.title);
  };
  const commitRename = () => {
    if (renamingId) {
      renameThread(renamingId, renameDraft);
      toast.success("Renommé");
    }
    setRenamingId(null);
  };

  /* ---------- Collapsed sidebar ---------- */
  if (collapsed) {
    return (
      <motion.aside layout initial={false} animate={{ width: 56 }} transition={springSoft} className="fixed left-0 top-0 flex h-screen flex-col items-center py-3" style={{ backgroundColor: "var(--c-bg)", borderRight: "1px solid var(--c-surface-strong)", overflow: "hidden" }}>
        <button
          onClick={() => setCollapsed(false)}
          className="pplx-side-item flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 6, color: "var(--c-fg)", marginBottom: 6 }}
          aria-label="Expand sidebar"
          title="Étendre (⌘\\)"
        >
          <PanelLeftOpen size={16} strokeWidth={1.6} />
        </button>
        <button
          onClick={handleNew}
          className="pplx-side-item flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 6, color: "var(--c-fg)", marginBottom: 6 }}
          aria-label="New Thread" title="Nouveau (⌘K)"
        >
          <SquarePen size={16} strokeWidth={1.6} />
        </button>
        <Link
          to="/diagnostic"
          className="pplx-side-item flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 6, color: "var(--c-fg)", background: onDiagnostic ? "var(--c-surface-strong)" : "transparent" }}
          aria-label="Diagnostic" title="Diagnostic"
        >
          <ShieldCheck size={16} strokeWidth={1.7} />
        </Link>
        <div style={{ flex: 1 }} />
        <UserMenu compact />
      </motion.aside>

    );
  }

  /* ---------- Expanded sidebar ---------- */
  return (
    <motion.aside
      layout
      initial={false}
      animate={{ width: 264 }}
      transition={springSoft}
      className="fixed left-0 top-0 flex h-screen flex-col"
      style={{ backgroundColor: "var(--c-bg)", overflow: "hidden" }}
    >

      <div className="flex shrink-0 items-center justify-between px-3" style={{ height: 52 }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 22, height: 22, borderRadius: 6, background: "var(--c-fg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--c-bg)", fontSize: 12, fontWeight: 600,
          }}>◆</div>
          <span style={{ fontSize: 14, color: "var(--c-fg)", fontWeight: 500, letterSpacing: "-0.012em" }}>
            obsidian
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="pplx-side-item flex items-center justify-center"
          style={{ width: 28, height: 28, borderRadius: 6, color: "var(--c-muted-fg)" }}
          aria-label="Collapse sidebar" title="Réduire (⌘\\)"
        >
          <PanelLeftClose size={16} strokeWidth={1.6} />
        </button>
      </div>

      <div className="flex shrink-0 flex-col gap-1 px-2 pb-2">
        <motion.button
          whileHover={{ y: -1, backgroundColor: "var(--c-surface)" }}
          whileTap={{ scale: 0.98 }}
          transition={springSnappy}
          onClick={handleNew}
          className="flex items-center justify-between px-2"
          style={{ height: 36, borderRadius: 8, border: "1px solid var(--c-surface-strong)", background: "var(--c-bg)", cursor: "pointer" }}
        >
          <div className="flex items-center gap-2.5">
            <SquarePen size={15} strokeWidth={1.6} style={{ color: "var(--c-fg)" }} />
            <span style={{ fontSize: 13, color: "var(--c-fg)", fontWeight: 500 }}>New Thread</span>
          </div>
          <span className="pplx-kbd">⌘K</span>
        </motion.button>


        <div className="relative">
          <Search size={14} strokeWidth={1.6} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--c-muted)" }} />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search threads"
            className="w-full outline-none placeholder:text-[var(--c-muted)] transition-colors focus:bg-[var(--c-surface)]"
            style={{ height: 32, fontSize: 13, color: "var(--c-fg)", borderRadius: 6, backgroundColor: "transparent", border: "none", paddingLeft: 30, paddingRight: 8 }}
          />
        </div>
      </div>

      <div className="pplx-sidebar-scroll flex-1 overflow-y-auto px-2 pb-2">
        <nav className="flex flex-col gap-0.5 pb-3">
          <Link
            to="/diagnostic"
            className="pplx-side-item flex w-full items-center gap-2.5 px-2 text-left"
            style={{
              height: 32, borderRadius: 6, color: "var(--c-fg)", fontSize: 13,
              fontWeight: onDiagnostic ? 600 : 500, letterSpacing: "-0.006em",
              background: onDiagnostic ? "var(--c-surface-strong)" : "transparent",
            }}
          >
            <ShieldCheck size={16} strokeWidth={1.7} style={{ color: "var(--c-fg)" }} />
            <span>Diagnostic</span>
            <span style={{
              marginLeft: "auto", fontSize: 9, fontWeight: 600, padding: "2px 6px",
              borderRadius: 4, background: "var(--c-fg)", color: "var(--c-bg)", letterSpacing: "0.04em",
            }}>NEW</span>
          </Link>
        </nav>

        {/* Pinned */}
        <AnimatePresence initial={false}>
          {pinned.length > 0 && (
            <motion.div
              key="pinned-section"
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: easeOut }}
              className="flex flex-col gap-0.5 overflow-hidden pb-3"
            >
              <div className="pplx-section-label" style={{ marginBottom: 4, lineHeight: "20px" }}>Pinned</div>
              <AnimatePresence initial={false}>
                {pinned.map((t) => (
                  <ThreadRow
                    key={t.id} thread={t} isActive={t.id === activeId} renamingId={renamingId}
                    renameDraft={renameDraft} setRenameDraft={setRenameDraft}
                    onCommitRename={commitRename} onStartRename={startRename} onDelete={handleDelete}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-3 pt-2">
          {Object.entries(groups).map(([group, items]) => {
            if (items.length === 0) return null;
            return (
              <motion.div key={group} layout className="flex flex-col gap-0.5">
                <div className="pplx-section-label" style={{ marginBottom: 4, lineHeight: "20px" }}>
                  {group}
                </div>
                <AnimatePresence initial={false}>
                  {items.map((t) => (
                    <ThreadRow
                      key={t.id} thread={t} isActive={t.id === activeId} renamingId={renamingId}
                      renameDraft={renameDraft} setRenameDraft={setRenameDraft}
                      onCommitRename={commitRename} onStartRename={startRename} onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--c-muted)", padding: "8px 8px" }}>
              {filter ? "No threads match." : "No threads yet."}
            </div>
          )}
        </div>

      </div>

      <div className="shrink-0 px-2 pb-2 pt-2" style={{ borderTop: "1px solid var(--c-surface-strong)" }}>
        <UserMenu />
      </div>
    </motion.aside>
  );
}

/* ---------- Thread row with menu ---------- */
function ThreadRow({
  thread, isActive, renamingId, renameDraft, setRenameDraft,
  onCommitRename, onStartRename, onDelete,
}: {
  thread: Thread;
  isActive: boolean;
  renamingId: string | null;
  renameDraft: string;
  setRenameDraft: (s: string) => void;
  onCommitRename: () => void;
  onStartRename: (t: Thread) => void;
  onDelete: (id: string) => void;
}) {
  const isRenaming = renamingId === thread.id;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8, height: 0, marginTop: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: easeOut }}
      className="pplx-side-item group relative flex w-full items-center"
      style={{ borderRadius: 6, background: "transparent" }}
    >
      {isActive && (
        <motion.div
          layoutId="active-thread-bg"
          transition={springSoft}
          style={{ position: "absolute", inset: 0, background: "var(--c-surface-strong)", borderRadius: 6, zIndex: 0 }}
        />
      )}
      <div style={{ position: "relative", zIndex: 1, display: "flex", width: "100%", alignItems: "center" }}>

      {isRenaming ? (
        <input
          autoFocus
          value={renameDraft}
          onChange={(e) => setRenameDraft(e.target.value)}
          onBlur={onCommitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onCommitRename(); }
            if (e.key === "Escape") { e.preventDefault(); onCommitRename(); }
          }}
          className="flex-1 outline-none"
          style={{ height: 30, fontSize: 13, color: "var(--c-fg)", background: "var(--c-bg)", border: "1px solid var(--c-border-strong)", borderRadius: 4, padding: "0 8px", margin: "0 2px" }}
        />
      ) : (
        <Link
          to="/$threadId" params={{ threadId: thread.id }}
          className="flex flex-1 items-center px-2"
          style={{ height: 30, minWidth: 0 }}
        >
          {thread.pinned && <Pin size={10} strokeWidth={2} style={{ color: "var(--c-muted-fg)", marginRight: 6, flexShrink: 0 }} />}
          <span
            className="truncate"
            style={{ fontSize: 13, color: "var(--c-fg)", fontWeight: isActive ? 500 : 400, letterSpacing: "-0.006em", flex: 1 }}
          >
            {thread.title}
          </span>
        </Link>
      )}
      {!isRenaming && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              className="pplx-side-more mr-1 flex h-6 w-6 items-center justify-center"
              style={{ borderRadius: 4, color: "var(--c-muted-fg)", background: "transparent", border: "none" }}
              aria-label="Thread options"
            >
              <MoreHorizontal size={14} strokeWidth={1.7} />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" sideOffset={4} className="w-[180px] p-1" style={{ background: "var(--c-bg)", border: "1px solid var(--c-surface-strong)", borderRadius: 10 }}>
            <MenuItem icon={Pencil} label="Renommer" onClick={() => onStartRename(thread)} />
            <MenuItem
              icon={thread.pinned ? PinOff : Pin}
              label={thread.pinned ? "Désépingler" : "Épingler"}
              onClick={() => { togglePin(thread.id); toast.success(thread.pinned ? "Désépinglé" : "Épinglé"); }}
            />
            <MenuItem icon={FileDown} label="Exporter (.md)" onClick={() => downloadThreadMarkdown(thread)} />
            <div style={{ height: 1, background: "var(--c-surface-strong)", margin: "4px 0" }} />
            <MenuItem icon={Trash2} label="Supprimer" danger onClick={() => onDelete(thread.id)} />
          </PopoverContent>
        </Popover>
      )}
      </div>
    </motion.div>
  );

}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: typeof Pin; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left pplx-side-item"
      style={{ borderRadius: 6, fontSize: 13, color: danger ? "var(--c-danger)" : "var(--c-fg)", background: "transparent", border: "none", cursor: "pointer" }}
    >
      <Icon size={14} strokeWidth={1.7} />
      <span>{label}</span>
    </button>
  );
}

/* ---------- User menu ---------- */
function UserMenu({ compact }: { compact?: boolean } = {}) {
  const trigger = compact ? (
    <button
      className="pplx-side-item flex items-center justify-center"
      style={{ width: 32, height: 32, borderRadius: 9999, background: "var(--c-fg)", color: "var(--c-bg)", fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer" }}
      aria-label="Account"
    >A</button>
  ) : (
    <button className="pplx-side-item flex w-full items-center gap-2.5 px-2" style={{ height: 44, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
      <div style={{
        width: 26, height: 26, borderRadius: 9999, background: "var(--c-fg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--c-bg)", fontSize: 12, fontWeight: 500, flexShrink: 0,
      }}>A</div>
      <div className="flex flex-1 flex-col items-start" style={{ lineHeight: 1.2 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fg)" }}>Antoine</span>
        <span style={{ fontSize: 11, color: "var(--c-muted-fg)" }}>Free plan</span>
      </div>
      <MoreHorizontal size={14} strokeWidth={1.6} style={{ color: "var(--c-muted-fg)" }} />
    </button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent align="start" side="top" sideOffset={8} className="w-[220px] p-1" style={{ background: "var(--c-bg)", border: "1px solid var(--c-surface-strong)", borderRadius: 10 }}>
        <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--c-surface-strong)", marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--c-fg)" }}>Antoine</div>
          <div style={{ fontSize: 11, color: "var(--c-muted-fg)" }}>Free plan · Local-only</div>
        </div>
        <MenuItem icon={Settings} label="Paramètres" onClick={() => toast("Paramètres bientôt disponibles")} />
        <MenuItem icon={Download} label="Exporter tout (JSON)" onClick={downloadAllThreadsJSON} />
        <div style={{ height: 1, background: "var(--c-surface-strong)", margin: "4px 0" }} />
        <MenuItem
          icon={Trash2} label="Effacer toutes les conversations" danger
          onClick={() => {
            if (confirm("Supprimer toutes les conversations ? Cette action est irréversible.")) {
              deleteAllThreads();
              toast.success("Conversations supprimées");
              window.location.href = "/";
            }
          }}
        />
        <MenuItem icon={LogOut} label="Se déconnecter" onClick={() => toast("Auth bientôt disponible")} />
      </PopoverContent>
    </Popover>
  );
}
