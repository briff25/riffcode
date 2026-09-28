// Source: LinkedIn profile. Ordered oldest to newest; the journey section
// renders them left to right like facings on a shelf.

export type Metric = { value: string; label: string };

export type Role = {
  id: string;
  company: string;
  shortName: string;
  focus: string; // second line on the shelf facing
  title: string;
  start: string; // "YYYY-MM"
  end: string | null; // null = present
  location: string;
  kind: "role" | "education";
  highlights: string[];
  metrics: Metric[];
};

export const roles: Role[] = [
  {
    id: "dicks",
    company: "Dick's Sporting Goods",
    shortName: "Dick's",
    focus: "Visual merchandising",
    title: "Manager, Visual Merchandising (Corporate)",
    start: "2003-03",
    end: "2011-06",
    location: "Pittsburgh, Pennsylvania",
    kind: "role",
    highlights: [
      "Directed corporate visual presentation for 450 Dick's Sporting Goods and 80 Golf Galaxy stores.",
      "Designed and ran the enterprise merchandising calendar that kept marketing, supply chain and merchandising in sync.",
      "Trained and led the corporate floor-planning team through the chain's growth from 125 to 450 stores.",
      "Moved floor planning onto Autodesk Revit, cutting floor-plan lead time 20%.",
      "Built a space-to-sales framework with finance and merchandising that reallocated space, lifting sales and trimming unproductive inventory.",
    ],
    metrics: [
      { value: "125→450", label: "stores planned through expansion" },
      { value: "−20%", label: "floor-plan lead time" },
    ],
  },
  {
    id: "ohio",
    company: "Ohio University",
    shortName: "MBA",
    focus: "Ohio University",
    title: "Master of Business Administration",
    start: "2012-01",
    end: "2013-12",
    location: "Athens, Ohio",
    kind: "education",
    highlights: [
      "Completed an MBA at Ohio University, adding finance and strategy to a career built on the sales floor.",
      "Earlier: BA in Philosophy with a minor in Mathematics from Washington & Jefferson College.",
    ],
    metrics: [],
  },
  {
    id: "ignite",
    company: "Ignite Ashland",
    shortName: "Ignite",
    focus: "Consulting",
    title: "Co-Founder & Consultant",
    start: "2014-09",
    end: "2017-09",
    location: "Ashland, Kentucky",
    kind: "role",
    highlights: [
      "Consulted for small businesses and startups on business planning, market analysis and scaling operations.",
      "Built data-driven marketing and financial frameworks that guided investment and growth decisions.",
      "Coached founders on digital presence, customer engagement and execution.",
    ],
    metrics: [],
  },
  {
    id: "petpeople",
    company: "PetPeople",
    shortName: "PetPeople",
    focus: "Store design",
    title: "Store Design & Visual Merchandising",
    start: "2017-06",
    end: "2019-11",
    location: "Columbus, Ohio",
    kind: "role",
    highlights: [
      "Directed store design, category management and visual execution as the specialty chain grew from 42 to 74 stores.",
      "Created store-specific floor plans from sales and productivity data to put space where it earned the most.",
      "Ran new-store design and fixture procurement from concept to opening, cutting store-opening fixture costs 18%.",
    ],
    metrics: [
      { value: "42→74", label: "stores" },
      { value: "−18%", label: "store-opening fixture costs" },
    ],
  },
  {
    id: "biglots-floor",
    company: "Big Lots",
    shortName: "Big Lots",
    focus: "Floor planning",
    title: "Manager, Floor Planning",
    start: "2019-11",
    end: "2021-03",
    location: "Columbus, Ohio",
    kind: "role",
    highlights: [
      "Managed store remodel programs reaching 85% of the chain, setting brand standards and keeping in-store execution consistent.",
      "Program-managed cross-functional initiatives: tracking KPIs, surfacing blockers and driving issues to resolution.",
    ],
    metrics: [{ value: "85%", label: "of the chain remodeled" }],
  },
  {
    id: "biglots-macro",
    company: "Big Lots",
    shortName: "Big Lots",
    focus: "Macro space",
    title: "Director, Macro Space Planning & Analytics",
    start: "2021-03",
    end: "2025-03",
    location: "Columbus, Ohio",
    kind: "role",
    highlights: [
      "Led the enterprise implementation of the Blue Yonder (JDA) Category Management Suite: RFP, vendor selection, organizational redesign, testing, training and change management.",
      "Cut space-planning cycle time 27% by redesigning and automating the macro-to-micro process.",
      "Built Power BI dashboards and analytic frameworks for executive leadership that improved planogram effectiveness 12%.",
      "Used structured problem-solving and sensitivity analysis to optimize space utilization and capital deployment across 1,400 stores.",
    ],
    metrics: [
      { value: "1,400", label: "stores" },
      { value: "−27%", label: "planning cycle time" },
      { value: "+12%", label: "planogram effectiveness" },
    ],
  },
  {
    id: "corps",
    company: "Corps Team",
    shortName: "Corps Team",
    focus: "Procurement + AI",
    title: "Specialist, Fixture Procurement",
    start: "2025-10",
    end: null,
    location: "New Albany, Ohio",
    kind: "role",
    highlights: [
      "Manage fixture procurement for 100 new store openings for a Fortune 500 rural lifestyle retailer.",
      "Built custom GPTs that consolidate multi-source data, apply business rules to set quantities, pick the best sources and produce submission-ready purchase orders, cutting procurement cycle time 75%.",
      "Automated project-based order processing with Copilot and Power Query, cutting manual hours 80%.",
    ],
    metrics: [
      { value: "−75%", label: "procurement cycle time" },
      { value: "−80%", label: "manual order hours" },
      { value: "100", label: "new stores supported" },
    ],
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Fixed "today" so the static build is deterministic; bump on redeploy if it matters.
const NOW = "2026-09";

function toMonths(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
}

export function years(role: Role) {
  return (toMonths(role.end ?? NOW) - toMonths(role.start)) / 12;
}

export function formatRange(role: Role) {
  const fmt = (ym: string) => {
    const [y, m] = ym.split("-").map(Number);
    return `${MONTHS[m - 1]} ${y}`;
  };
  if (role.kind === "education") return `${role.start.slice(0, 4)}–${role.end?.slice(0, 4)}`;
  return `${fmt(role.start)} – ${role.end ? fmt(role.end) : "present"}`;
}
