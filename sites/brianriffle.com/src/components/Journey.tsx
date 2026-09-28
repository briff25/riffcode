"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { roles, years, formatRange, type Role } from "@/content/career";
import { SectionHeading } from "./ui";

const tenure = (r: Role) => (r.end ? `${years(r).toFixed(1)} yrs` : "Now");
const maxYears = Math.max(...roles.map(years));

// One faint divider per year inside each facing, like product units on a shelf.
const yearLines = (y: number, on: boolean) => ({
  backgroundImage: `linear-gradient(90deg, transparent calc(100% - 1px), rgb(255 255 255 / ${on ? 0.22 : 0.07}) 0)`,
  backgroundSize: `${100 / Math.max(1, y)}% 100%`,
});

export default function Journey() {
  const [active, setActive] = useState(roles.length - 1);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (i: number) => {
    const next = (i + roles.length) % roles.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: active + 1,
      ArrowLeft: active - 1,
      Home: 0,
      End: roles.length - 1,
    };
    if (e.key in keys) {
      e.preventDefault();
      select(keys[e.key]);
    }
  };

  return (
    <section aria-labelledby="journey" className="plan-grid-dark text-paper">
      <div className="mx-auto max-w-[1320px] px-4 py-20 sm:px-8 md:py-28">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <SectionHeading id="journey" tone="ink">
              Career journey
            </SectionHeading>
          </div>
          <p className="max-w-[46ch] text-[1.0625rem] leading-relaxed text-mist lg:col-span-6 lg:justify-self-end">
            Twenty-plus years across visual merchandising, floor planning, macro space and, now, procurement tools
            built with AI.
          </p>
        </div>

        {/* Desktop: the career as a shelf of facings, each sized by years in the role */}
        <div className="mt-14 hidden md:block">
          <div className="relative">
            <div
              role="tablist"
              aria-label="Career roles, oldest to newest"
              className="flex items-stretch gap-1.5"
              onKeyDown={onKeyDown}
            >
              {roles.map((r, i) => {
                const on = i === active;
                const edu = r.kind === "education";
                return (
                  <button
                    key={r.id}
                    ref={(el) => {
                      tabs.current[i] = el;
                    }}
                    role="tab"
                    id={`tab-${r.id}`}
                    aria-selected={on}
                    aria-controls={`panel-${r.id}`}
                    tabIndex={on ? 0 : -1}
                    onClick={() => setActive(i)}
                    style={{ flexGrow: years(r) }}
                    className="group min-w-[84px] basis-0 cursor-pointer text-left focus-visible:outline-offset-4"
                  >
                    <span
                      style={edu ? undefined : yearLines(years(r), on)}
                      className={`relative flex h-[216px] flex-col justify-between border p-3 transition-colors duration-200 ${
                        on
                          ? "border-redline bg-redline text-white"
                          : edu
                            ? "hatch border-dashed border-paper/35 bg-transparent text-paper/80 group-hover:border-paper/70"
                            : "border-paper/15 bg-ink-2 text-paper/85 group-hover:border-paper/50 group-hover:text-paper"
                      }`}
                    >
                      <span className={`text-[12px] font-semibold ${on ? "text-white/85" : "text-mist"}`}>{tenure(r)}</span>
                      <span className="flex rotate-180 gap-1.5 self-start [writing-mode:vertical-rl]">
                        <span className="font-condensed text-[28px] font-extrabold leading-none tracking-tight">
                          {r.shortName}
                        </span>
                        <span className={`text-[12.5px] font-medium leading-none ${on ? "text-white/85" : "text-mist"}`}>
                          {r.focus}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`mt-[14px] block py-1 text-center text-[12.5px] font-semibold tabular-nums transition-colors ${
                        on ? "bg-paper text-ink" : "text-mist group-hover:text-paper"
                      }`}
                    >
                      {r.start.slice(0, 4)}
                    </span>
                  </button>
                );
              })}
            </div>
            {/* the shelf edge the facings sit on */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[219px] h-[7px] bg-mist/80" />
          </div>
          <p className="mt-4 text-[13.5px] text-mist">
            Each facing is sized by years in the role. Select one, or use the arrow keys, to see the work.
          </p>

          {roles.map((r, i) => (
            <div
              key={r.id}
              role="tabpanel"
              id={`panel-${r.id}`}
              aria-labelledby={`tab-${r.id}`}
              hidden={i !== active}
              tabIndex={0}
              className="mt-12 focus-visible:outline-offset-8"
            >
              {i === active && <RoleDetail role={r} />}
            </div>
          ))}
        </div>

        {/* Phones: the same story as a list, newest first */}
        <ol className="mt-12 md:hidden">
          {[...roles].reverse().map((r) => (
            <li key={r.id} className="border-t border-paper/15 py-8">
              <div className="flex items-center gap-3 text-[13.5px] text-mist">
                <span className="tabular-nums">{formatRange(r)}</span>
                <span aria-hidden className="h-1.5 bg-redline" style={{ width: `${Math.max(6, (years(r) / maxYears) * 30)}%` }} />
              </div>
              <h3 className="font-condensed mt-2 text-4xl font-extrabold">{r.company}</h3>
              <p className="font-narrow mt-1 text-lg font-semibold text-paper/90">{r.title}</p>
              <ul className="mt-4 space-y-2.5 text-[15.5px] leading-relaxed text-paper/80">
                {r.highlights.map((h) => (
                  <Highlight key={h}>{h}</Highlight>
                ))}
              </ul>
              {r.metrics.length > 0 && (
                <dl className="mt-5 grid grid-cols-2 gap-3">
                  {r.metrics.map((m) => (
                    <div key={m.label} className="flex flex-col-reverse border-l-4 border-redline bg-paper px-3 py-2 text-ink">
                      <dt className="mt-1 text-[13px] leading-snug text-graphite">{m.label}</dt>
                      <dd className="font-condensed text-3xl font-extrabold leading-none">{m.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function RoleDetail({ role }: { role: Role }) {
  const hasMetrics = role.metrics.length > 0;
  return (
    <div className="panel-in grid gap-10 lg:grid-cols-12">
      <div className={hasMetrics ? "lg:col-span-7" : "lg:col-span-9"}>
        <p className="text-[15px] tabular-nums text-mist">
          {formatRange(role)}, {role.location}
        </p>
        <h3 className="font-condensed mt-2 text-[clamp(2.5rem,4.5vw,3.75rem)] font-extrabold leading-[0.95]">
          {role.company}
        </h3>
        <p className="font-narrow mt-2 text-xl font-semibold text-paper/90">{role.title}</p>
        <ul className="mt-7 max-w-[64ch] space-y-3.5 text-[1.0625rem] leading-relaxed text-paper/85">
          {role.highlights.map((h) => (
            <Highlight key={h}>{h}</Highlight>
          ))}
        </ul>
      </div>
      {hasMetrics && (
        <dl className="grid content-start gap-3 lg:col-span-5">
          {role.metrics.map((m) => (
            <div key={m.label} className="flex flex-col-reverse border-l-[6px] border-redline bg-paper px-5 py-4 text-ink">
              <dt className="mt-1.5 text-[14.5px] text-graphite">{m.label}</dt>
              <dd className="font-condensed text-[2.75rem] font-extrabold leading-none tracking-tight">{m.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

function Highlight({ children }: { children: string }) {
  return (
    <li className="relative pl-6">
      <span aria-hidden className="absolute left-0 top-[0.62em] size-2 border-[1.5px] border-redline-bright" />
      {children}
    </li>
  );
}
