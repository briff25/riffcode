import { hero, profile } from "@/content/profile";
import DrawingSheet, { markupNotes } from "./DrawingSheet";
import { ButtonLink } from "../ui";

export default function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-grid">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 pb-14 pt-10 sm:px-8 md:gap-14 md:pt-14 xl:grid-cols-12 xl:items-center xl:gap-12 xl:pb-20 xl:pt-16">
        <div className="md:grid md:grid-cols-2 md:items-end md:gap-12 xl:col-span-5 xl:block">
          <h1
            id="hero-title"
            className="font-condensed text-[clamp(3.6rem,13vw,6.75rem)] font-extrabold leading-[0.88] tracking-[-0.015em] md:text-[clamp(4.5rem,9vw,6.75rem)] xl:text-[clamp(4.5rem,6.2vw,6.75rem)]"
          >
            {hero.headline}
          </h1>
          <div>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-ink/80 md:mt-0 md:text-xl md:leading-relaxed xl:mt-6">
              {hero.lede}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`mailto:${profile.email}`}>Email Brian</ButtonLink>
              <ButtonLink href={profile.linkedin} variant="outline" external>
                Connect on LinkedIn
              </ButtonLink>
            </div>
          </div>
        </div>

        <figure className="xl:col-span-7">
          <div className="plan-grid border-[1.5px] border-ink shadow-[8px_8px_0_0_var(--color-ink)]">
            <div className="overflow-hidden p-3 sm:p-5">
              {/* 800/580: phones crop the notes column off the right edge */}
              <div className="w-[137.93%] sm:w-full">
                <DrawingSheet />
              </div>
            </div>

            <ol className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-ink/20 px-4 py-4 sm:hidden" aria-label="Markup notes">
              {markupNotes.map((note) => (
                <li key={note.n} className="flex items-start gap-2">
                  <svg viewBox="0 0 22 20" className="mt-1 h-5 w-[22px] shrink-0" aria-hidden>
                    <path d="M11 1.5L20.5 18.5H1.5Z" className="fill-paper stroke-redline" strokeWidth={1.6} />
                    <text x={11} y={16} textAnchor="middle" className="fill-redline-deep text-[10px] font-bold">
                      {note.n}
                    </text>
                  </svg>
                  <span className="leading-tight">
                    <span className="font-condensed block text-2xl font-extrabold text-redline">{note.value}</span>
                    <span className="font-narrow mt-1 block text-[13px] font-semibold leading-snug text-redline-deep">{note.label}</span>
                  </span>
                </li>
              ))}
            </ol>

            <TitleBlock />
          </div>
        </figure>
      </div>
    </section>
  );
}

function TitleBlock() {
  return (
    <figcaption className="grid grid-cols-[auto_1fr] border-t-[1.5px] border-ink bg-paper text-[13px] leading-snug sm:grid-cols-[1.1fr_auto_1.5fr]">
      <p className="hidden border-r border-ink/25 p-3 text-graphite sm:block">
        Typical store floor plan.
        <br />
        <span className="font-semibold text-redline-deep">Red marks</span> are results from my work.
      </p>
      <div className="border-r border-ink/25 p-2">
        <picture>
          <source type="image/webp" srcSet="/media/brian-portrait-400.webp 400w, /media/brian-portrait-800.webp 800w" sizes="104px" />
          <img
            src="/media/brian-portrait-400.jpg"
            srcSet="/media/brian-portrait-400.jpg 400w, /media/brian-portrait-800.jpg 800w"
            sizes="104px"
            width={400}
            height={500}
            alt="Portrait of Brian Riffle"
            className="h-[118px] w-[94px] object-cover sm:h-[130px] sm:w-[104px]"
            fetchPriority="high"
          />
        </picture>
      </div>
      <dl className="grid grid-cols-2 grid-rows-[1fr_auto]">
        <div className="col-span-2 border-b border-ink/25 px-3 py-2">
          <dt className="sr-only">Name</dt>
          <dd className="font-condensed text-[26px] font-extrabold leading-none">{profile.name}</dd>
          <dd className="mt-1 text-graphite">{profile.role}</dd>
        </div>
        <div className="border-r border-ink/25 px-3 py-2">
          <dt className="text-[11px] text-graphite">Location</dt>
          <dd className="font-medium">{profile.location}</dd>
        </div>
        <div className="px-3 py-2">
          <dt className="text-[11px] text-graphite">Sheet</dt>
          <dd className="font-medium">A-101</dd>
        </div>
      </dl>
    </figcaption>
  );
}
