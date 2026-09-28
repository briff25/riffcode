import type { ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 px-5 py-3 text-[15px] font-semibold leading-none transition-colors duration-150";

const variants = {
  solid: "bg-redline text-white hover:bg-redline-deep",
  outline: "border-[1.5px] border-ink text-ink hover:bg-ink hover:text-paper",
  "outline-light": "border-[1.5px] border-paper/70 text-paper hover:bg-paper hover:text-ink",
};

export function ButtonLink({
  href,
  children,
  variant = "solid",
  external,
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      className={`${base} ${variants[variant]}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

export function TextLink({
  href,
  children,
  tone = "paper",
}: {
  href: string;
  children: ReactNode;
  tone?: "paper" | "ink";
}) {
  const color =
    tone === "paper"
      ? "text-redline-deep decoration-redline/40 hover:decoration-redline"
      : "text-redline-bright decoration-redline-bright/40 hover:decoration-redline-bright";
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={`font-semibold underline decoration-2 underline-offset-[5px] transition-colors ${color}`}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {external && <span className="sr-only"> (opens in a new tab)</span>}
    </a>
  );
}

export function SectionHeading({ id, children, tone = "paper" }: { id: string; children: ReactNode; tone?: "paper" | "ink" }) {
  return (
    <h2
      id={id}
      className={`font-condensed text-[clamp(2.75rem,7vw,5rem)] font-extrabold leading-[0.9] tracking-[-0.01em] ${
        tone === "ink" ? "text-paper" : "text-ink"
      }`}
    >
      {children}
    </h2>
  );
}
