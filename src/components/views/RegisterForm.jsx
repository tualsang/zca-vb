import { useState } from "react";
import {
  Trophy, Loader2, ChevronRight,
} from "lucide-react";
import { CHURCHES, C } from "../../lib/constants";
import { formatPhone } from "../../lib/helpers";
import { NameInput } from "../inputs/NameInput";
import { PhoneInput } from "../inputs/PhoneInput";
import { FormBlock } from "../shared/FormBlock";
import { ChoiceCard } from "../shared/ChoiceCard";

export function RegisterForm({ onSubmit, isAdmin, registrationOpenForPublic }) {
  const [church, setChurch] = useState("");
  const [division, setDivision] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!church) return setError("Select your church.");
    if (!division) return setError("Pick a division.");
    if (!agentName.trim()) return setError("Enter your name.");
    if (agentPhone.length !== 10) return setError("Enter a valid 10-digit phone number.");

    setSubmitting(true);
    try {
      await onSubmit({
        kind: "free_agent", church, division,
        player_name: agentName.trim(),
        phone: formatPhone(agentPhone),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
      <aside className="lg:col-span-3">
        <div className="text-[10px] uppercase tracking-[0.3em] mb-2" style={{ color: C.rust, fontWeight: 700 }}>
          Step One
        </div>
        <h2 className="leading-none" style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: "clamp(40px, 10vw, 56px)", color: C.ink,
        }}>
          Sign Up
        </h2>
        <p className="mt-3 text-sm italic" style={{ fontFamily: "'Newsreader', serif", color: C.inkSoft }}>
          No team? Register as a free agent and we'll be in touch about placement.
        </p>
        {isAdmin && !registrationOpenForPublic && (
          <div className="mt-4 p-3 text-xs"
            style={{ background: C.warnBg, border: `1px solid ${C.warn}`, color: C.ink }}>
            <strong>Admin override:</strong> Public registration is closed, but you can still register on someone's behalf.
          </div>
        )}
      </aside>

      <section className="lg:col-span-9 border p-5 sm:p-6 md:p-8" style={{ borderColor: C.ink, background: C.paper }}>
        <FormBlock number="01" label="Which church do you represent?">
          <select value={church} onChange={(e) => setChurch(e.target.value)}
            className="w-full px-4 py-3 border bg-transparent focus:outline-none"
            style={{ borderColor: C.ink, color: C.ink, fontSize: 16 }}>
            <option value="">— Select your church —</option>
            {CHURCHES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </FormBlock>

        {church && (
          <FormBlock number="02" label="Division">
            <div className="grid sm:grid-cols-2 gap-3">
              <ChoiceCard active={division === "mens"} onClick={() => setDivision("mens")}
                title="Men's Division" icon={<Trophy size={18} />} />
              <ChoiceCard active={division === "womens"} onClick={() => setDivision("womens")}
                title="Women's Division" icon={<Trophy size={18} />} />
            </div>
          </FormBlock>
        )}

        {church && division && (
          <FormBlock number="03" label="Your details">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                  Your Name
                </label>
                <NameInput value={agentName} onChange={setAgentName} placeholder="e.g. Sam Okonkwo" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest mb-1" style={{ color: C.inkSoft }}>
                  Your Phone
                </label>
                <PhoneInput value={agentPhone} onChange={setAgentPhone} />
                <p className="mt-1 text-[10px] italic" style={{ color: C.inkSoft, fontFamily: "'Newsreader', serif" }}>
                  For organizers only — not shown publicly.
                </p>
              </div>
            </div>
          </FormBlock>
        )}

        {church && division && (
          <div className="mt-8">
            {error && (
              <div className="mb-4 px-4 py-3 text-sm"
                style={{ background: "#FBE3DB", color: C.rustDark, border: `1px solid ${C.rust}` }}>
                {error}
              </div>
            )}
            <button onClick={handleSubmit} disabled={submitting}
              className="w-full sm:w-auto group inline-flex items-center justify-center gap-3 px-6 sm:px-8 py-4 text-sm sm:text-base uppercase tracking-widest transition-all hover:gap-5 disabled:opacity-60"
              style={{
                background: C.rust, color: C.cream,
                fontWeight: 700, letterSpacing: "0.15em",
              }}>
              {submitting ? (
                <><Loader2 className="animate-spin" size={18} /> Submitting…</>
              ) : (
                <>Submit Registration <ChevronRight size={18} /></>
              )}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
