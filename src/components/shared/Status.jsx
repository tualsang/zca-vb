import { Loader2 } from "lucide-react";
import { C } from "../../lib/constants";

export function LoadingState() {
  return (
    <div className="flex items-center gap-3 py-12 justify-center" style={{ color: C.inkSoft }}>
      <Loader2 className="animate-spin" size={18} />
      <span className="text-sm uppercase tracking-widest">Loading registrations</span>
    </div>
  );
}

export function EmptyState({ message }) {
  return (
    <div className="text-center py-16">
      <p className="italic text-lg" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
        {message}
      </p>
    </div>
  );
}
