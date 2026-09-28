import { about } from "@/content/profile";
import { expertise } from "@/content/expertise";
import { SectionHeading } from "./ui";

export default function About() {
  return (
    <section aria-labelledby="about" className="border-b border-grid">
      <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 md:py-28">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
            <SectionHeading id="about">About</SectionHeading>
            <p className="font-narrow mt-8 text-[clamp(1.6rem,3vw,2.25rem)] font-bold leading-[1.15] tracking-[-0.01em]">
              {about.statement}
            </p>
          </div>
          <div className="space-y-5 text-[1.125rem] leading-[1.7] text-ink/85 lg:col-span-7 lg:pt-3">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="max-w-[64ch]">
                {p}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-x-8 gap-y-12 border-t border-grid pt-12 sm:grid-cols-2 md:mt-24 lg:grid-cols-4">
          {expertise.map((group) => (
            <div key={group.title}>
              <h3 className="font-narrow text-[15px] font-bold text-redline-deep">{group.title}</h3>
              <ul className="mt-4 divide-y divide-grid border-y border-grid text-[15.5px]">
                {group.items.map((item) => (
                  <li key={item} className="py-2.5 leading-snug">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
