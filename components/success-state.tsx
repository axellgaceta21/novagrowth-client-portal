"use client";

import { Check, CheckCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Confirmation } from "@/lib/types";

export function SuccessState({ confirmation }: { confirmation: Confirmation }) {
  const heading = useRef<HTMLHeadingElement>(null);
  const { data, clientId, status, submittedAt } = confirmation;
  useEffect(() => { heading.current?.focus(); }, []);
  return <section id="onboarding" className="success-state" aria-labelledby="success-heading">
    <div className="success-icon"><Check size={24} strokeWidth={1.8} aria-hidden="true" /></div>
    <div className="eyebrow">YOU’RE ALL SET</div>
    <h2 id="success-heading" ref={heading} tabIndex={-1}>Onboarding received</h2>
    <p className="success-thanks">Thanks, {data.firstName}. Your onboarding details for <strong>{data.companyName}</strong> have been received.</p>
    <p className="success-description">Our team will begin preparing your workspace and project resources.<br className="hidden md:block" /> We’ll contact you if we need any additional information.</p>
    <dl className="confirmation-summary"><div><dt>Client</dt><dd>{data.companyName}</dd></div><div><dt>Client ID</dt><dd className="client-id">{clientId}</dd></div><div><dt>Service</dt><dd>{data.service}</dd></div><div><dt>Package</dt><dd>{data.package}</dd></div><div><dt>Status</dt><dd><span className="status-dot" />{status}</dd></div></dl>
    <div className="next-steps"><h3>What happens next</h3><ol>{["We’ll review your onboarding information.", "Your project workspace and resources will be prepared.", "Our team will contact you with the next steps."].map((item, index) => <li key={item}><span>{String(index + 1).padStart(2, "0")}</span>{item}</li>)}</ol></div>
    <p className="confirmation-detail"><CheckCheck size={16} aria-hidden="true" /> Submitted successfully · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(submittedAt))}</p>
  </section>;
}
