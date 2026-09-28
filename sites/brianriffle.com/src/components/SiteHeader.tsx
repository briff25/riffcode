import { profile } from "@/content/profile";

const links = [
  { href: "#about", label: "About" },
  { href: "#journey", label: "Journey" },
  { href: "#speaking", label: "Speaking & press" },
  { href: "#contact", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-grid bg-paper/90 backdrop-blur-md">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-[1320px] items-center gap-6 px-4 sm:px-8">
        <a href="#top" className="mr-auto flex items-center gap-3">
          <Monogram />
          <span className="font-narrow text-[17px] font-bold tracking-tight">{profile.name}</span>
        </a>
        <ul className="hidden items-center gap-7 text-[15px] font-medium md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-ink/75 transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href={`mailto:${profile.email}`}
          className="bg-ink px-4 py-2.5 text-[14px] font-semibold leading-none text-paper transition-colors hover:bg-redline"
        >
          Email Brian
        </a>
      </nav>
    </header>
  );
}

export function Monogram({ className = "size-8", inverted }: { className?: string; inverted?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" fill={inverted ? "var(--color-paper)" : "var(--color-ink)"} />
      <text
        x="15"
        y="22.5"
        textAnchor="middle"
        className="font-condensed"
        fontSize="17"
        fontWeight="800"
        fill={inverted ? "var(--color-ink)" : "var(--color-paper)"}
      >
        BR
      </text>
      <path d="M32 22v10H22z" fill="var(--color-redline)" />
    </svg>
  );
}
