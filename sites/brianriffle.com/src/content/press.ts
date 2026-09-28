// Source: "Speaking Events and Articles Verified.docx" (checked 2026-09-28).
// Brian did not write the articles; he was interviewed for them.

export type Picture = {
  src: string; // path without extension; .webp and .jpg both exist
  widths?: number[]; // when there are sized variants, e.g. name-800
  width: number;
  height: number;
  alt: string;
};

export const events = [
  {
    id: "cma-sima-2026",
    name: "CMA|SIMA Elevate 2026",
    role: "Speaker, space planning track",
    session: "Macro Space Analytics Fundamentals and Organizational Navigation",
    summary:
      "A breakout on how macro space analytics drive space strategy decisions, and how to steer those recommendations through the organization.",
    date: "February 15–18, 2026",
    place: "Caesars Palace, Las Vegas",
    link: {
      href: "https://www.linkedin.com/posts/category-management-association_cmasima2026-categorymanagement-spaceplanning-activity-7420122809399582720-jcgc",
      label: "View the CMA announcement",
    },
    image: {
      src: "/media/cma-elevate-2026",
      width: 800,
      height: 450,
      alt: "Official CMA|SIMA Elevate 2026 speaker card: Brian Riffle, Retail Merchandising Strategist, presenting Macro Space Analytics Fundamentals and Organizational Navigation, February 15–18, Caesars Palace, Las Vegas.",
    } satisfies Picture,
    credit: "Speaker graphic: Category Management Association",
  },
  {
    id: "shop-marketplace-2024",
    name: "Shop! MarketPlace 2024",
    role: "Panelist, representing Big Lots",
    session: "Mentorship and sponsorship in the retail industry",
    summary:
      "A panel moderated by Rebekah Matheny of The Ohio State University, with Eric Daniel of Little and Brad Stewart of Hera Lighting.",
    date: "April 9–11, 2024",
    place: "Cincinnati, Ohio",
    link: { href: "https://vmsd.com/making-the-most-of-marketplace/", label: "Read the VMSD recap" },
    image: {
      src: "/media/shop-marketplace-2024",
      widths: [800, 1400],
      width: 1536,
      height: 1024,
      alt: "Four panelists seated on the Shop! MarketPlace 2024 stage in Cincinnati; Brian Riffle, third from left, speaks into a microphone.",
    } satisfies Picture,
    credit: "Photo: VMSD",
  },
];

export const articles = [
  {
    id: "planogram-compliance",
    title: "Planogram Compliance, Part Two: More Reasons for Optimism",
    href: "https://www.retailconsumerprofessionals.com/content-library/article/YgQCHq/planogram-compliance-part-two-more-reasons-for-optimism",
    byline: "By Michael Wilkening, ARC Campus",
    angle:
      "Why real-time comparisons between the shelf and the planogram help resets land as planned, and what compliance tech still has to solve.",
    image: {
      src: "/media/article-planogram-compliance",
      widths: [320, 640],
      width: 1254,
      height: 1254,
      alt: "Illustration of a store shelf beside a tablet that flags a missing product against the planogram.",
    } satisfies Picture,
  },
  {
    id: "macro-space",
    title: "Macro Space Analytics, Part Two: The Store as the Space Planner's Stage",
    href: "https://retailconsumerprofessionals.com/content-library/article/USgOj4/macro-space-analytics-part-two-the-store-as-the-space-planner-s-stage",
    byline: "By Michael Wilkening, ARC Campus, June 22, 2025",
    angle:
      "A pet-retail example: trimming an over-assorted category so a fast-growing one gets the room it needs, and letting analytics make those calls faster.",
    image: {
      src: "/media/article-macro-space",
      widths: [320, 640],
      width: 1254,
      height: 1254,
      alt: "Illustration of a store floor plan with an arrow moving space from one fixture to a larger pet-treat fixture.",
    } satisfies Picture,
  },
  {
    id: "careers",
    title: "Careers in Space Planning, Part One: Can Space Seize the Moment in a Challenging Labor Market?",
    href: "https://retailconsumerprofessionals.com/content-library/article/jCCXkC/careers-in-space-planning-part-one-can-space-seize-the-moment-in-a-challenging-labor-market",
    byline: "By Michael Wilkening, ARC Campus, June 16, 2025",
    angle:
      "Why today's CAD tools are quick to teach to digitally fluent hires, while real knowledge of how stores work still takes time to build.",
    image: {
      src: "/media/article-careers",
      widths: [320, 640],
      width: 1254,
      height: 1254,
      alt: "Illustration of a laptop showing a store floor plan next to a graduation cap.",
    } satisfies Picture,
  },
];

export const lab = {
  image: {
    src: "/media/retail-layout-creator-720",
    width: 720,
    height: 450,
    alt: "Retail Layout Studio: a drag-and-drop store floor plan with a fixture library and a live fixture tally.",
  } satisfies Picture,
};
