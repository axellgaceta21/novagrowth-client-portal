import { Clock3 } from "lucide-react";

export function OnboardingIntroduction() {
  return <div className="introduction">
    <div className="eyebrow">CLIENT ONBOARDING</div>
    <h1>Let’s get your project started.</h1>
    <p className="intro-copy">Complete the information below so our team can prepare your workspace,<br className="hidden md:block" /> project resources, and onboarding process.</p>
    <div className="intro-meta"><span><Clock3 size={15} aria-hidden="true" /> Estimated completion time: 3–5 minutes</span><span className="required-note"><span aria-hidden="true">*</span> Required fields</span></div>
  </div>;
}
