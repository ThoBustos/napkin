import "./napkin-identity.css"

export function NapkinSymbol({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 56 56" fill="none" aria-hidden="true">
    <path d="M8 10 47 7 49 47 7 49 8 8M6 13l43-3M10 6 9 51M45 5l3 46M5 46l46-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19 38V19h4l10 13V18h4v20h-4L23 25v13Z" fill="currentColor" />
  </svg>
}

export function NapkinIdentity({ href = "/" }: { href?: string }) {
  return <a className="napkin-identity" href={href} aria-label="Napkin home"><NapkinSymbol /><span>Napkin</span></a>
}
