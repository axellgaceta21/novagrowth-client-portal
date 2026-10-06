import { PortalHeader } from "@/components/portal-header";
import { OnboardingForm } from "@/components/onboarding-form";

export default function Home() {
  return <>
    <a className="skip-link" href="#onboarding">Skip to onboarding form</a>
    <PortalHeader />
    <main className="mx-auto w-full max-w-[1160px] px-6 md:px-10">
      <OnboardingForm />
      <footer className="portal-footer"><span>© 2026 NovaGrowth. Client onboarding portal.</span><span>Digital Growth Agency</span></footer>
    </main>
  </>;
}
