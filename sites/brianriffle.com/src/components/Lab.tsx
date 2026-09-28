import { lab } from "@/content/press";
import { profile } from "@/content/profile";
import Picture from "./Picture";
import { TextLink } from "./ui";

export default function Lab() {
  return (
    <section aria-labelledby="lab" className="plan-grid border-b border-grid">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-20 sm:px-8 md:py-24 lg:grid-cols-12 lg:items-center lg:gap-12">
        <div className="lg:col-span-5">
          <h2 id="lab" className="font-condensed text-[clamp(2.25rem,4.5vw,3.5rem)] font-extrabold leading-[0.95]">
            I build my own retail tools, too.
          </h2>
          <p className="mt-5 max-w-[46ch] text-[1.0625rem] leading-relaxed text-ink/85">
            Retail Layout Studio is a drag-and-drop floor planner with a live fixture tally, and one of several small
            apps I&apos;ve built with Claude Code. They&apos;re all live and free to try.
          </p>
          <p className="mt-6">
            <TextLink href={profile.riffcode}>Browse the projects on Riff Code</TextLink>
          </p>
        </div>
        <a
          href={profile.riffcode}
          target="_blank"
          rel="noopener noreferrer"
          className="block border-[1.5px] border-ink bg-white shadow-[8px_8px_0_0_var(--color-ink)] transition-transform duration-200 hover:-translate-y-1 lg:col-span-7"
        >
          <Picture image={lab.image} sizes="(min-width: 1024px) 720px, 100vw" className="block h-auto w-full" />
          <span className="sr-only">Open Riff Code (opens in a new tab)</span>
        </a>
      </div>
    </section>
  );
}
