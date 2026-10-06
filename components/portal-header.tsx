import { LockKeyhole } from "lucide-react";
import { BrandLogo } from "./brand-logo";

export function PortalHeader() {
  return <header className="portal-header">
    <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-4 px-6 md:px-10">
      <BrandLogo />
      <div className="header-context"><span>Client Onboarding</span><span className="secure-label"><LockKeyhole size={13} aria-hidden="true" /> Secure Portal</span></div>
    </div>
  </header>;
}
