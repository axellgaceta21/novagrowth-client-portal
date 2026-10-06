import type { ReactNode } from "react";

export function FormField({ name, label, required, error, hint, fullWidth, children }: { name: string; label: string; required?: boolean; error?: string; hint?: string; fullWidth?: boolean; children: ReactNode }) {
  return <div className={`form-field${fullWidth ? " md:col-span-2" : ""}`}>
    <label htmlFor={name}>{label}{required ? <span className="required-star" aria-hidden="true"> *</span> : <span className="optional">Optional</span>}</label>
    {children}
    {hint && <p id={`${name}-hint`} className="field-hint">{hint}</p>}
    {error && <p id={`${name}-error`} className="field-error">{error}</p>}
  </div>;
}
