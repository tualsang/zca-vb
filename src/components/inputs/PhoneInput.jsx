import { C } from "../../lib/constants";
import { sanitizePhoneInput, formatPhone } from "../../lib/helpers";

export function PhoneInput({ value, onChange, placeholder, ...props }) {
  return (
    <input
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      value={formatPhone(value)}
      onChange={(e) => onChange(sanitizePhoneInput(e.target.value))}
      placeholder={placeholder || "(555) 123-4567"}
      className="w-full px-4 py-3 border bg-transparent focus:outline-none text-base"
      style={{ borderColor: C.ink, color: C.ink, fontSize: 16 }}
      {...props}
    />
  );
}
