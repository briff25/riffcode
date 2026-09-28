import { articles, events } from "@/content/press";
import Picture from "./Picture";
import { SectionHeading, TextLink } from "./ui";

export default function Press() {
  return (
    <section aria-labelledby="speaking" className="border-b border-grid">
      <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 md:py-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <SectionHeading id="speaking">Speaking &amp; press</SectionHeading>
          </div>
          <p className="max-w-[44ch] text-[1.0625rem] leading-relaxed text-graphite lg:col-span-5 lg:justify-self-end">
            Conference sessions I&apos;ve led, and articles where I was interviewed as an industry expert.
          </p>
        </div>

        <div className="mt-14 space-y-16 md:mt-20 md:space-y-24">
          {events.map((e) => (
            <article key={e.id} className="grid gap-8 lg:grid-cols-12 lg:gap-12">
              <figure className="lg:col-span-7">
                <div className="border-[1.5px] border-ink bg-ink">
                  <Picture
                    image={e.image}
                    sizes="(min-width: 1024px) 720px, 100vw"
                    className="block h-auto w-full"
                  />
                </div>
                <figcaption className="mt-2 text-[13px] text-graphite">{e.credit}</figcaption>
              </figure>
              <div className="lg:col-span-5 lg:pt-2">
                <p className="text-[15px] font-semibold text-redline-deep">{e.role}</p>
                <h3 className="font-condensed mt-2 text-[clamp(2.25rem,4vw,3.25rem)] font-extrabold leading-[0.95]">
                  {e.name}
                </h3>
                <p className="font-narrow mt-4 text-[1.3rem] font-bold leading-snug">{e.session}</p>
                <p className="mt-3 text-[15.5px] text-graphite">
                  {e.date}
                  <br />
                  {e.place}
                </p>
                <p className="mt-5 max-w-[48ch] leading-relaxed text-ink/85">{e.summary}</p>
                <p className="mt-6">
                  <TextLink href={e.link.href}>{e.link.label}</TextLink>
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-24 md:mt-32">
          <h3 className="font-condensed text-4xl font-extrabold md:text-5xl">Quoted as an industry expert</h3>
          <ul className="mt-8 border-t-2 border-ink">
            {articles.map((a) => (
              <li key={a.id} className="grid grid-cols-[88px_1fr] gap-5 border-b border-grid py-7 sm:grid-cols-[140px_1fr] sm:gap-8 md:grid-cols-[160px_1fr_auto] md:items-center">
                <Picture image={a.image} sizes="(min-width: 640px) 160px, 88px" className="aspect-square h-auto w-full border border-grid bg-white" />
                <div>
                  <p className="text-[14px] text-graphite">{a.byline}</p>
                  <h4 className="font-narrow mt-1.5 text-[1.3rem] font-bold leading-snug sm:text-[1.45rem]">
                    <a
                      href={a.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="decoration-redline decoration-2 underline-offset-4 hover:underline"
                    >
                      {a.title}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </h4>
                  <p className="mt-2 max-w-[62ch] text-[15.5px] leading-relaxed text-ink/80">{a.angle}</p>
                </div>
                <p className="col-span-2 md:col-span-1 md:pl-6">
                  <TextLink href={a.href}>Read on ARC Campus</TextLink>
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 max-w-[80ch] text-[13.5px] leading-relaxed text-graphite">
            These articles were written and published by ARC Campus, and I was interviewed for each. The summaries
            here are paraphrased, and the illustrations are original artwork inspired by each piece.
          </p>
        </div>
      </div>
    </section>
  );
}
