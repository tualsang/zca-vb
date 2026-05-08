import { Check } from "lucide-react";
import { C } from "../../lib/constants";

export function ChoiceCard({ active, onClick, title, desc, icon, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="text-left p-4 border-2 transition-all disabled:cursor-not-allowed disabled:opacity-50"
      style={{
        borderColor: active ? C.rust : C.ink,
        background: active ? C.ink : "transparent",
        color: active ? C.cream : C.ink,
      }}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="font-bold uppercase tracking-wider text-sm">{title}</span>
        {active && <Check size={16} className="ml-auto" style={{ color: C.rust }} />}
      </div>
      {desc && (
        <div className="text-xs leading-snug opacity-80 italic"
          style={{ fontFamily: "'Newsreader', serif" }}>
          {desc}
        </div>
      )}
    </button>
  );
}
