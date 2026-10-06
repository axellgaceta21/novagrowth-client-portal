type BrandLogoProps = { symbolSize?: number; showDescriptor?: boolean };

// Three substantial modules form an abstract N. Narrow negative-space joints
// keep each module legible, while the rising end cuts imply forward movement.
export function BrandLogo({ symbolSize = 30, showDescriptor = true }: BrandLogoProps) {
  return <div className="brand-lockup">
    <svg className="brand-symbol" width={symbolSize} height={symbolSize} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <path d="M3 6 10 3v23l-7 3V6Z" fill="currentColor" />
      <path d="m12 6 8 8v12l-8-8V6Z" fill="currentColor" />
      <path d="m22 6 7-3v23l-7 3V6Z" fill="currentColor" />
    </svg>
    <div><div className="wordmark">NovaGrowth<span className="brand-dot" aria-hidden="true" /></div>{showDescriptor && <div className="brand-descriptor">Digital Growth Agency</div>}</div>
  </div>;
}
