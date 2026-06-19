import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

type Props = { title: string };

export function TopBar({ title }: Props) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <header
      className="sticky top-0 z-20 flex shrink-0 items-center justify-between"
      style={{
        height: 48,
        paddingLeft: 20,
        paddingRight: 12,
        backgroundColor: "var(--c-bg)",
        borderBottom: "1px solid var(--c-border)",
      }}
    >
      <div
        className="truncate"
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--c-fg)",
          letterSpacing: "-0.012em",
        }}
      >
        {title}
      </div>
      <button
        onClick={toggleTheme}
        className="pplx-side-item flex items-center justify-center"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          color: "var(--c-fg)",
          background: "transparent",
          border: "none",
          cursor: "pointer",
        }}
        aria-label={isDark ? "Activer le mode clair" : "Activer le mode sombre"}
        title={isDark ? "Mode clair" : "Mode sombre"}
      >
        {isDark ? <Sun size={16} strokeWidth={1.7} /> : <Moon size={16} strokeWidth={1.7} />}
      </button>
    </header>
  );
}
