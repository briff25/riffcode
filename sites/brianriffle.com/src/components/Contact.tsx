import { profile } from "@/content/profile";
import { Monogram } from "./SiteHeader";
import { ButtonLink } from "./ui";

export default function Contact() {
  return (
    <section aria-labelledby="contact" className="plan-grid-dark text-paper">
      <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-20 sm:px-8 md:pb-24 md:pt-28">
        <h2
          id="contact"
          className="font-condensed max-w-[14ch] text-[clamp(3.25rem,9vw,7rem)] font-extrabold leading-[0.88] tracking-[-0.015em]"
        >
          Let&apos;s talk about your stores.
        </h2>
        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <p className="max-w-[48ch] text-lg leading-relaxed text-mist lg:col-span-6">
            Space strategy, category management, retail analytics, or a speaker for your next event: I&apos;m always
            glad to compare notes.
          </p>
          <div className="lg:col-span-6 lg:justify-self-end">
            <div className="flex flex-wrap gap-3">
              <ButtonLink href={`mailto:${profile.email}`}>Email Brian</ButtonLink>
              <ButtonLink href={profile.linkedin} variant="outline-light" external>
                Connect on LinkedIn
              </ButtonLink>
            </div>
            <p className="mt-4 text-[15px] text-mist">
              <a href={`mailto:${profile.email}`} className="underline decoration-mist/40 underline-offset-4 hover:text-paper">
                {profile.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const year = 2026;
  return (
    <footer className="bg-ink text-paper">
      <div className="border-t border-paper/10">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-4 px-4 py-8 text-[13px] text-mist sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Monogram className="size-6" inverted />
            <span>
              © {year} {profile.name}. {profile.location}.
            </span>
          </div>
          <p className="md:text-right">
            Speaker graphic courtesy of the Category Management Association. Event photo courtesy of VMSD.
          </p>
        </div>
      </div>
    </footer>
  );
}
