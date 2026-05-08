import { C } from "../../lib/constants";

export function FormBlock({ number, label, children }) {
  return (
    <div className="mb-7 pb-7 border-b last:border-b-0 last:mb-0 last:pb-0" style={{ borderColor: C.line }}>
      <div className="flex items-baseline gap-3 mb-3">
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 28,
          color: C.rust, letterSpacing: "0.05em",
        }}>
          {number}
        </span>
        <h3 className="text-xs sm:text-sm uppercase tracking-[0.2em] font-bold" style={{ color: C.ink }}>
          {label}
        </h3>
      </div>
      {children}
    </div>
  );
}
