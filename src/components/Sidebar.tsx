import { Link, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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
      <motion.aside layout initial={false} animate={{ width: 60 }} transition={springSoft} className="fixed left-0 top-0 flex h-screen flex-col items-center py-2" style={{ backgroundColor: "var(--c-sidebar)", overflow: "hidden", gap: 4 }}>
        <button
          onClick={() => setCollapsed(false)}
          className="pplx-side-item flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 8, color: "var(--c-fg)" }}
          aria-label="Expand sidebar"
          title="Étendre (⌘\\)"
        >
          <PanelLeftOpen size={20} strokeWidth={1.5} />
        </button>
        <button
          onClick={handleNew}
          className="pplx-side-item flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 8, color: "var(--c-fg)" }}
          aria-label="New chat" title="Nouveau (⌘K)"
        >
          <SquarePen size={20} strokeWidth={1.5} />
        </button>
        <Link
          to="/diagnostic"
          className="pplx-side-item flex items-center justify-center"
          style={{ width: 36, height: 36, borderRadius: 8, color: "var(--c-fg)", background: onDiagnostic ? "var(--c-sidebar-active)" : "transparent" }}
          aria-label="Diagnostic" title="Diagnostic"
        >
          <ShieldCheck size={20} strokeWidth={1.5} />
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
      animate={{ width: 260 }}
      transition={springSoft}
      className="fixed left-0 top-0 flex h-screen flex-col"
      style={{ backgroundColor: "var(--c-sidebar)", overflow: "hidden" }}
    >

      <div className="flex shrink-0 items-center justify-between" style={{ height: 44, paddingLeft: 10, paddingRight: 6 }}>
        <div className="flex items-center" style={{ gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7, background: "var(--c-fg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--c-sidebar)", fontSize: 13, fontWeight: 600,
          }}>◆</div>
          <span style={{ fontSize: 14, color: "var(--c-fg)", fontWeight: 600, letterSpacing: "-0.012em" }}>
            obsidian
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="pplx-side-item flex items-center justify-center"
          style={{ width: 32, height: 32, borderRadius: 8, color: "var(--c-muted-fg)" }}
          aria-label="Collapse sidebar" title="Réduire (⌘\\)"
        >
          <PanelLeftClose size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* ChatGPT-style nav rows */}
      <div className="flex shrink-0 flex-col" style={{ padding: "4px 8px 8px", gap: 2 }}>
        <button
          onClick={handleNew}
          className="pplx-side-item flex w-full items-center justify-between"
          style={{ height: 36, padding: "0 10px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}
        >
          <span className="flex items-center" style={{ gap: 10 }}>
            <SquarePen size={20} strokeWidth={1.5} style={{ color: "var(--c-fg)" }} />
            <span style={{ fontSize: 14, color: "var(--c-fg)", fontWeight: 400, letterSpacing: "-0.01em" }}>New chat</span>
          </span>
          <span className="pplx-kbd">⌘K</span>
        </button>

        <SearchRow filter={filter} setFilter={setFilter} />

        <Link
          to="/diagnostic"
          className="pplx-side-item flex w-full items-center justify-between"
          style={{
            height: 36, padding: "0 10px", borderRadius: 8,
            background: onDiagnostic ? "var(--c-sidebar-active)" : "transparent",
            color: "var(--c-fg)",
          }}
        >
          <span className="flex items-center" style={{ gap: 10 }}>
            <ShieldCheck size={20} strokeWidth={1.5} style={{ color: "var(--c-fg)" }} />
            <span style={{ fontSize: 14, color: "var(--c-fg)", fontWeight: 400, letterSpacing: "-0.01em" }}>Diagnostic</span>
          </span>
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "2px 5px",
            borderRadius: 4, background: "var(--c-fg)", color: "var(--c-sidebar)", letterSpacing: "0.04em",
          }}>NEW</span>
        </Link>
      </div>

      <div className="pplx-sidebar-scroll flex-1 overflow-y-auto" style={{ padding: "0 8px 8px" }}>
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
              className="flex flex-col overflow-hidden"
              style={{ paddingBottom: 4 }}
            >
              <SectionLabel>Pinned</SectionLabel>
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

        <div className="flex flex-col">
          {Object.entries(groups).map(([group, items]) => {
            if (items.length === 0) return null;
            return (
              <motion.div key={group} layout className="flex flex-col" style={{ paddingBottom: 4 }}>
                <SectionLabel>{group}</SectionLabel>
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
            <div style={{ fontSize: 13, color: "var(--c-muted)", padding: "8px 10px" }}>
              {filter ? "No threads match." : "No threads yet."}
            </div>
          )}
        </div>

      </div>

      <div className="shrink-0" style={{ padding: "6px 8px 10px" }}>
        <UserMenu />
      </div>
    </motion.aside>
  );
}

/* ---------- Section label (ChatGPT-style) ---------- */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 600, color: "var(--c-muted-fg)",
      padding: "16px 10px 6px", letterSpacing: "-0.005em",
    }}>
      {children}
    </div>
  );
}

/* ---------- Search row: nav-line that expands into an input on focus ---------- */
function SearchRow({ filter, setFilter }: { filter: string; setFilter: (s: string) => void }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const expanded = focused || filter.length > 0;

  return (
    <div
      className="pplx-side-item flex w-full items-center"
      style={{ height: 36, padding: "0 10px", borderRadius: 8, cursor: "text" }}
      onClick={() => inputRef.current?.focus()}
    >
      <Search size={20} strokeWidth={1.5} style={{ color: "var(--c-fg)", marginRight: 10, flexShrink: 0 }} />
      <input
        ref={inputRef}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setFilter(""); inputRef.current?.blur(); }
        }}
        placeholder={expanded ? "Filtrer les conversations…" : "Search chats"}
        className="flex-1 bg-transparent outline-none"
        style={{
          fontSize: 14, color: "var(--c-fg)", fontWeight: 400, letterSpacing: "-0.01em",
          border: "none", minWidth: 0,
        }}
      />
    </div>
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
      style={{ borderRadius: 8, background: "transparent" }}
    >
      {isActive && (
        <motion.div
          layoutId="active-thread-bg"
          transition={springSoft}
          style={{ position: "absolute", inset: 0, background: "var(--c-sidebar-active)", borderRadius: 8, zIndex: 0 }}
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
          style={{ height: 32, fontSize: 14, color: "var(--c-fg)", background: "var(--c-bg)", border: "1px solid var(--c-border-strong)", borderRadius: 6, padding: "0 10px", margin: "0 2px" }}
        />
      ) : (
        <Link
          to="/$threadId" params={{ threadId: thread.id }}
          className="flex flex-1 items-center"
          style={{ height: 36, minWidth: 0, padding: "0 10px" }}
        >
          {thread.pinned && <Pin size={10} strokeWidth={2} style={{ color: "var(--c-muted-fg)", marginRight: 6, flexShrink: 0 }} />}
          <span
            className="truncate"
            style={{ fontSize: 14, color: "var(--c-fg)", fontWeight: 400, letterSpacing: "-0.01em", flex: 1 }}
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
              className="pplx-side-more mr-1 flex items-center justify-center"
              style={{ width: 24, height: 24, borderRadius: 6, color: "var(--c-muted-fg)", background: "transparent", border: "none" }}
              aria-label="Thread options"
            >
              <MoreHorizontal size={16} strokeWidth={1.6} />
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


  /* ---------- Expanded sidebar ---------- */
  return (
    <motion.aside
      layout
      initial={false}
      animate={{ width: 260 }}
      transition={springSoft}
      className="fixed left-0 top-0 flex h-screen flex-col"
      style={{ backgroundColor: "var(--c-bg)", overflow: "hidden" }}
    >

      <div className="flex shrink-0 items-center justify-between" style={{ height: 48, paddingLeft: 12, paddingRight: 8 }}>
        <div className="flex items-center gap-2">
          <div style={{
            width: 24, height: 24, borderRadius: 6, background: "var(--c-fg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--c-bg)", fontSize: 12, fontWeight: 600,
          }}>◆</div>
          <span style={{ fontSize: 14, color: "var(--c-fg)", fontWeight: 600, letterSpacing: "-0.012em" }}>
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

      {/* ChatGPT-style nav rows */}
      <div className="flex shrink-0 flex-col" style={{ padding: "4px 8px 8px" }}>
        <button
          onClick={handleNew}
          className="pplx-side-item flex w-full items-center justify-between"
          style={{ height: 36, padding: "0 8px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}
        >
          <span className="flex items-center" style={{ gap: 10 }}>
            <SquarePen size={16} strokeWidth={1.7} style={{ color: "var(--c-fg)" }} />
            <span style={{ fontSize: 14, color: "var(--c-fg)", fontWeight: 500 }}>New chat</span>
          </span>
          <span className="pplx-kbd">⌘K</span>
        </button>

        <SearchRow filter={filter} setFilter={setFilter} />

        <Link
          to="/diagnostic"
          className="pplx-side-item flex w-full items-center justify-between"
          style={{
            height: 36, padding: "0 8px", borderRadius: 8,
            background: onDiagnostic ? "var(--c-surface)" : "transparent",
            color: "var(--c-fg)",
          }}
        >
          <span className="flex items-center" style={{ gap: 10 }}>
            <ShieldCheck size={16} strokeWidth={1.7} style={{ color: "var(--c-fg)" }} />
            <span style={{ fontSize: 14, color: "var(--c-fg)", fontWeight: 500 }}>Diagnostic</span>
          </span>
          <span style={{
            fontSize: 9, fontWeight: 600, padding: "2px 5px",
            borderRadius: 4, background: "var(--c-fg)", color: "var(--c-bg)", letterSpacing: "0.04em",
          }}>NEW</span>
        </Link>
      </div>

      <div className="pplx-sidebar-scroll flex-1 overflow-y-auto" style={{ padding: "0 8px 8px" }}>
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
              className="flex flex-col overflow-hidden"
              style={{ paddingBottom: 8 }}
            >
              <SectionLabel>Pinned</SectionLabel>
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

        <div className="flex flex-col">
          {Object.entries(groups).map(([group, items]) => {
            if (items.length === 0) return null;
            return (
              <motion.div key={group} layout className="flex flex-col" style={{ paddingBottom: 8 }}>
                <SectionLabel>{group}</SectionLabel>
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
            <div style={{ fontSize: 12, color: "var(--c-muted)", padding: "8px" }}>
              {filter ? "No threads match." : "No threads yet."}
            </div>
          )}
        </div>

      </div>

      <div className="shrink-0" style={{ padding: "6px 8px 8px", borderTop: "1px solid var(--c-border)" }}>
        <UserMenu />
      </div>
    </motion.aside>
  );
}

/* ---------- Section label (ChatGPT-style: lowercase, subtle) ---------- */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 500, color: "var(--c-muted-fg)",
      padding: "10px 8px 4px", letterSpacing: 0,
    }}>
      {children}
    </div>
  );
}

/* ---------- Search row: nav-line that expands into an input on focus ---------- */
function SearchRow({ filter, setFilter }: { filter: string; setFilter: (s: string) => void }) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const expanded = focused || filter.length > 0;

  return (
    <div
      className="pplx-side-item flex w-full items-center"
      style={{ height: 36, padding: "0 8px", borderRadius: 8, cursor: "text" }}
      onClick={() => inputRef.current?.focus()}
    >
      <Search size={16} strokeWidth={1.7} style={{ color: "var(--c-fg)", marginRight: 10, flexShrink: 0 }} />
      <input
        ref={inputRef}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setFilter(""); inputRef.current?.blur(); }
        }}
        placeholder={expanded ? "Filtrer les conversations…" : "Search chats"}
        className="flex-1 bg-transparent outline-none"
        style={{
          fontSize: 14, color: "var(--c-fg)", fontWeight: expanded ? 400 : 500,
          border: "none", minWidth: 0,
        }}
      />
    </div>
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
    <button className="pplx-side-item flex w-full items-center gap-2.5" style={{ height: 40, padding: "0 8px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}>
      <div style={{
        width: 24, height: 24, borderRadius: 9999, background: "var(--c-fg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--c-bg)", fontSize: 11, fontWeight: 600, flexShrink: 0,
      }}>A</div>
      <div className="flex flex-1 flex-col items-start" style={{ lineHeight: 1.15, minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--c-fg)" }}>Antoine</span>
        <span style={{ fontSize: 11, color: "var(--c-muted-fg)" }}>Free plan</span>
      </div>
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
        <ThemeToggleMenuItem />
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

/* ---------- Theme toggle ---------- */
function ThemeToggleMenuItem() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <MenuItem
      icon={isDark ? Sun : Moon}
      label={isDark ? "Mode clair" : "Mode sombre"}
      onClick={toggleTheme}
    />
  );
}

