/* ---------------------------------------------------------------------------
   projects.js — the only file you edit to add a project.

   Copy a block, change the fields, drop a screenshot in Images/projects/.
   That's it. New tags show up in the filter bar automatically.

   Required : id, title, url
   Optional : tagline, featured, tags, emoji, accent, shot, year, built, external

   featured: true  -> renders as the big hero at the top. Keep it on exactly one.
   accent          -> hex color that tints the card glow and the hero gradient.
   shot            -> screenshot path. Leave it out and the card draws a
                      gradient + emoji cover instead, which looks fine.
   external        -> true opens in a new tab. Auto-detected for http(s) urls,
                      so you normally don't need to set it.
--------------------------------------------------------------------------- */

window.PROJECTS = [
  {
    id: "license-plate",
    title: "License Plate Game",
    tagline:
      "The road-trip classic, on a live map of the US. Tap each state as you spot its plate, watch the map fill in, and chase all 50 before you get there.",
    url: "apps/license-plate/",
    featured: true,
    tags: ["Game", "Kids", "Maps"],
    emoji: "🚗",
    accent: "#7c3aed",
    shot: "Images/projects/license-plate",
    year: 2026,
    built: ["Claude Code", "D3.js", "TopoJSON", "Vanilla JS"]
  },
  {
    id: "fun-with-math",
    title: "Fun With Math",
    tagline:
      "Math-fact practice that actually keeps kids going: pick the operations, drill the facts, earn a sticker every five in a row. Mastery mode re-queues anything they missed.",
    url: "apps/fun-with-math/",
    tags: ["Game", "Kids", "Learning"],
    emoji: "➕",
    accent: "#ff5ca7",
    shot: "Images/projects/fun-with-math",
    year: 2026,
    built: ["Claude Code", "SVG", "Web Audio"]
  },
  {
    id: "christine-riffle",
    title: "Christine's Book Reviews",
    tagline:
      "Snap a photo of a book cover and it publishes itself. Claude reads the cover, identifies the title, pulls clean artwork, writes the card into the page, and ships it to the server.",
    url: "http://christineriffle.com",
    tags: ["Family", "AI Pipeline", "Books"],
    emoji: "📚",
    accent: "#ff6b6b",
    shot: "Images/projects/christine-riffle",
    year: 2026,
    built: ["Claude Code", "Claude Vision", "Python", "Open Library API"]
  },
  {
    id: "kate-riffle",
    title: "Kate's Art Gallery",
    tagline:
      "A nine-year-old's art, framed the way she wanted it framed: big carousel, bright gradients, and yes, Comic Sans. Art direction was not mine.",
    url: "http://kateriffle.com",
    tags: ["Family", "Kids", "Gallery"],
    emoji: "🎨",
    accent: "#ff6b9d",
    shot: "Images/projects/kate-riffle",
    year: 2026,
    built: ["Claude Code", "Bootstrap"]
  },
  {
    id: "retail-layout-studio",
    title: "Retail Layout Studio",
    tagline:
      "A space-planning canvas for a 60′ × 40′ store floor. Drag in gondolas, racks and checkouts, resize them to the inch, and watch the fixture tally and floor coverage update live.",
    url: "apps/retail-layout-studio/",
    tags: ["Business", "Tool", "Retail"],
    emoji: "📐",
    accent: "#487f7b",
    shot: "Images/projects/retail-layout-studio",
    year: 2026,
    built: ["Claude Code", "SVG", "Vanilla JS"]
  },
  {
    id: "next-step-retail",
    title: "Next Step Retail",
    tagline:
      "A turn-key store-launch consultancy, from floor plans and fixtures to the day the doors open. Built end to end as a real marketing site.",
    url: "apps/next-step-retail/",
    tags: ["Business", "Landing Page"],
    emoji: "🏬",
    accent: "#2f7d84",
    shot: "Images/projects/next-step-retail",
    year: 2026,
    built: ["Claude Code", "CSS Grid"]
  },
  {
    id: "retail-layout-creator-2",
    title: "Retail Layout Creator 2",
    tagline:
      "The second pass at the store planner: resize the floor itself, select and move fixtures as a group, keep a library of named plans, and export the finished layout as a PNG.",
    url: "apps/retail-layout-creator-2/",
    tags: ["Business", "Tool", "Retail"],
    emoji: "🗺️",
    accent: "#3b6ea5",
    shot: "Images/projects/retail-layout-creator-2-v2",
    year: 2026,
    built: ["Claude Code", "SVG", "Vanilla JS"]
  }
];
