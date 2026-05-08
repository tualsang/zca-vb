import { useState } from "react";
import { Lock, X, Loader2, ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { C } from "../../lib/constants";

export function LoginModal({ onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password) { setError("Enter email and password."); return; }
    setLoading(true);
    const { error: dbError } = await supabase.auth.signInWithPassword({
      email: email.trim(), password,
    });
    setLoading(false);
    if (dbError) { setError(dbError.message); return; }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: "rgba(14, 26, 51, 0.7)" }}
      onClick={onClose}>
      <div className="w-full sm:max-w-md border-2 p-5 sm:p-6 rounded-t-lg sm:rounded-none"
        style={{ borderColor: C.ink, background: C.cream }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2" style={{ color: C.rust }}>
            <Lock size={14} strokeWidth={2.5} />
            <span className="text-[10px] tracking-[0.25em] uppercase font-bold">
              Admin Login
            </span>
          </div>
          <button onClick={onClose}
            className="p-1 hover:opacity-70 transition-opacity"
            style={{ color: C.ink }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <h2 style={{
          fontFamily: "'Bebas Neue', sans-serif", fontSize: 44,
          lineHeight: 1, color: C.ink, letterSpacing: "0.02em",
        }}>
          Sign In
        </h2>
        <p className="mt-2 mb-5 text-sm italic"
          style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          Organizers only.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
              Email
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              autoFocus autoComplete="email"
              className="w-full px-4 py-3 border bg-transparent focus:outline-none text-base"
              style={{ borderColor: C.ink, color: C.ink }} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
              Password
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              autoComplete="current-password"
              className="w-full px-4 py-3 border bg-transparent focus:outline-none text-base"
              style={{ borderColor: C.ink, color: C.ink }} />
          </div>
        </div>

        {error && (
          <div className="mt-4 px-4 py-3 text-sm"
            style={{ background: "#FBE3DB", color: C.rustDark, border: `1px solid ${C.rust}` }}>
            {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading}
          className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-3 text-sm uppercase tracking-widest disabled:opacity-60"
          style={{ background: C.rust, color: C.cream, fontWeight: 700, letterSpacing: "0.15em" }}>
          {loading ? (
            <><Loader2 className="animate-spin" size={16} /> Signing In…</>
          ) : (
            <>Sign In <ChevronRight size={16} /></>
          )}
        </button>
      </div>
    </div>
  );
}
