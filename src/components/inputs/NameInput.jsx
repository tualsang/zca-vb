import { C } from "../../lib/constants";
import { sanitizeNameInput } from "../../lib/helpers";

export function NameInput({ value, onChange, placeholder, ...props }) {
  return (
    <input
      type="text"
      autoComplete="off"
      autoCapitalize="words"
      value={value}
      onChange={(e) => onChange(sanitizeNameInput(e.target.value))}
      placeholder={placeholder}
      className="w-full px-4 py-3 border bg-transparent focus:outline-none text-base"
      style={{ borderColor: C.ink, color: C.ink, fontSize: 16 }}
      {...props}
    />
  );
}
