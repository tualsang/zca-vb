import { C } from "../../lib/constants";

export function TabButton({ active, onClick, children, primary }) {
  // Primary tab (Register) — always rust-colored, highlighted whether active or not
  if (primary) {
    return (
      <button onClick={onClick}
        className="px-3 sm:px-4 py-2 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all border-2"
        style={{
          background: C.rust,
          color: C.cream,
          borderColor: active ? C.ink : C.rust,
          fontWeight: 700, letterSpacing: "0.1em",
          boxShadow: active ? `0 0 0 1px ${C.ink} inset` : "none",
        }}>
        {children}
      </button>
    );
  }

  // Secondary tabs — outline only, fill in on active
  return (
    <button onClick={onClick}
      className="px-3 sm:px-4 py-2 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 transition-all border"
      style={{
        background: active ? C.ink : "transparent",
        color: active ? C.cream : C.inkSoft,
        borderColor: active ? C.ink : C.line,
        fontWeight: active ? 700 : 500,
        letterSpacing: "0.08em",
      }}>
      {children}
    </button>
  );
}
