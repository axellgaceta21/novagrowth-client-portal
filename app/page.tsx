import { Clock3 } from "lucide-react";
import { PortalHeader } from "@/components/portal-header";
import { OnboardingForm } from "@/components/onboarding-form";

export default function Home() {
  return <>
    <a className="skip-link" href="#onboarding">Skip to onboarding form</a>
    <PortalHeader />
    <main className="mx-auto w-full max-w-[1160px] px-6 md:px-10">
      <div className="introduction">
        <div className="eyebrow">CLIENT ONBOARDING</div>
        <h1>Let’s get your project started.</h1>
        <p className="intro-copy">Complete the information below so our team can prepare your workspace,<br className="hidden md:block" /> project resources, and onboarding process.</p>
        <div className="intro-meta"><span><Clock3 size={15} aria-hidden="true" /> Estimated completion time: 3–5 minutes</span><span className="required-note"><span aria-hidden="true">*</span> Required fields</span></div>
      </div>
      <OnboardingForm />
      <footer className="portal-footer"><span>© 2026 NovaGrowth. Client onboarding portal.</span><span>Digital Growth Agency</span></footer>
    </main>
  </>;
}
