import type { ReactNode } from "react";

export function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: ReactNode }) {
  return <section className="form-section" aria-labelledby={`section-${number}`}>
    <div className="section-heading"><span className="section-number" aria-hidden="true">{number}</span><div><h2 id={`section-${number}`}>{title}</h2><p>{description}</p></div></div>
    <div className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">{children}</div>
  </section>;
}
