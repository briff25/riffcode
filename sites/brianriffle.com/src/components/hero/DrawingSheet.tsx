import type { CSSProperties } from "react";

// A typical store floor plan drawn in SVG, then marked up in red. Every stroke
// uses pathLength=1 so the .draw class can animate it in with one keyframe.
// The notes column (x > 580) is cropped away on phones by the parent, where
// leaders and notes hide, numbered triangles mark the clouds, and the notes
// render as HTML below the sheet.

export const markupNotes = [
  { n: 1, value: "−75%", label: "fixture procurement cycle" },
  { n: 2, value: "1,400", label: "stores planned at Big Lots" },
  { n: 3, value: "+12%", label: "planogram effectiveness" },
  { n: 4, value: "−27%", label: "space-planning cycle time" },
];

type Box = [x: number, y: number, w: number, h: number];

const rect = ([x, y, w, h]: Box) => `M${x},${y}H${x + w}V${y + h}H${x}Z`;

// Revision cloud: clockwise around the box, one shallow arc per scallop.
function cloud([x, y, w, h]: Box, size = 22) {
  const pts: [number, number][] = [];
  const side = (x1: number, y1: number, x2: number, y2: number) => {
    const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / size));
    for (let i = 0; i < n; i++) pts.push([x1 + ((x2 - x1) * i) / n, y1 + ((y2 - y1) * i) / n]);
  };
  side(x, y, x + w, y);
  side(x + w, y, x + w, y + h);
  side(x + w, y + h, x, y + h);
  side(x, y + h, x, y);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= pts.length; i++) {
    const [px, py] = pts[i % pts.length];
    const r = size * 0.66;
    d += `A${r},${r} 0 0 1 ${px.toFixed(1)},${py.toFixed(1)}`;
  }
  return d;
}

const t = (delay: number, dur?: number) =>
  ({ "--delay": `${delay}s`, ...(dur ? { "--dur": `${dur}s` } : {}) }) as CSSProperties;

function Stroke({ d, delay, dur, className }: { d: string; delay: number; dur?: number; className?: string }) {
  return <path d={d} pathLength={1} className={`draw ${className ?? ""}`} style={t(delay, dur)} />;
}

const gondolaX = [100, 168, 236, 304];
const bubblesX = [100, 236, 380, 500];
const bubblesY = [110, 230, 350];

const clouds: { box: Box; delay: number; leader: [number, number, number, number] }[] = [
  { box: [434, 56, 120, 88], delay: 1.9, leader: [558, 86, 598, 74] },
  { box: [92, 98, 238, 196], delay: 2.15, leader: [334, 160, 598, 172] },
  { box: [384, 192, 120, 100], delay: 2.4, leader: [508, 242, 598, 270] },
  { box: [92, 326, 152, 34], delay: 2.65, leader: [248, 343, 598, 368] },
];

function Triangle({ x, y, n, delay }: { x: number; y: number; n: number; delay: number }) {
  return (
    <g className="markup" style={t(delay)}>
      <path d={`M${x},${y - 10}L${x + 10},${y + 7}H${x - 10}Z`} className="fill-paper stroke-redline" strokeWidth={1.6} />
      <text x={x} y={y + 5} textAnchor="middle" className="fill-redline-deep text-[10px] font-bold">
        {n}
      </text>
    </g>
  );
}

export default function DrawingSheet() {
  return (
    <svg viewBox="0 0 800 452" className="block h-auto w-full" role="img" aria-labelledby="plan-title">
      <title id="plan-title">
        Floor plan of a typical store, marked up in red with results: 75% faster fixture procurement, 1,400 stores
        planned, 12% better planogram effectiveness and 27% faster space-planning cycle time.
      </title>

      {/* Structural grid: bubbles and faint column/row lines */}
      <g className="stroke-grid" strokeWidth={1} strokeDasharray="6 5" fill="none">
        {bubblesX.map((x) => (
          <line key={x} x1={x} y1={31} x2={x} y2={400} />
        ))}
        {bubblesY.map((y) => (
          <line key={y} x1={21} y1={y} x2={560} y2={y} />
        ))}
      </g>
      <g className="markup" style={t(1.2)}>
        {bubblesX.map((x, i) => (
          <g key={x}>
            <circle cx={x} cy={20} r={9} className="fill-paper stroke-graphite" strokeWidth={1} />
            <text x={x} y={24} textAnchor="middle" className="fill-graphite text-[10px] font-semibold">
              {"ABCD"[i]}
            </text>
          </g>
        ))}
        {bubblesY.map((y, i) => (
          <g key={y}>
            <circle cx={12} cy={y} r={9} className="fill-paper stroke-graphite" strokeWidth={1} />
            <text x={12} y={y + 4} textAnchor="middle" className="fill-graphite text-[10px] font-semibold">
              {i + 1}
            </text>
          </g>
        ))}
      </g>

      {/* Walls */}
      <g className="stroke-ink" fill="none" strokeLinecap="square">
        <Stroke d="M260,400H30V50H560V400H330" delay={0.1} dur={1.2} className="[stroke-width:5]" />
        <Stroke d="M430,50V100M430,128V150H560" delay={0.7} dur={0.6} className="[stroke-width:3]" />
      </g>

      {/* Fixtures */}
      <g className="stroke-ink" fill="none" strokeWidth={1.4}>
        <Stroke d={rect([46, 58, 370, 14])} delay={0.8} />
        <Stroke
          d={Array.from({ length: 9 }, (_, i) => `M${46 + 37 * (i + 1)},58V72`).join("")}
          delay={1.0}
          dur={0.5}
          className="[stroke-width:0.8]"
        />
        <Stroke d={rect([38, 92, 14, 236])} delay={0.85} />
        <Stroke d={rect([538, 190, 14, 140])} delay={0.9} />
        {gondolaX.map((x, i) => (
          <g key={x}>
            <Stroke d={rect([x, 118, 24, 158])} delay={0.9 + i * 0.12} />
            <Stroke d={`${rect([x, 104, 24, 14])}${rect([x, 276, 24, 14])}`} delay={1.05 + i * 0.12} dur={0.5} />
            <Stroke d={`M${x + 12},118V276`} delay={1.15 + i * 0.12} dur={0.5} className="[stroke-width:0.8]" />
          </g>
        ))}
        <Stroke d="M393,214a15,15 0 1,0 30,0a15,15 0 1,0 -30,0" delay={1.25} />
        <Stroke d="M463,214a15,15 0 1,0 30,0a15,15 0 1,0 -30,0" delay={1.3} />
        <Stroke d={`${rect([393, 252, 30, 30])}M393,252L423,282M423,252L393,282`} delay={1.35} />
        <Stroke d={`${rect([463, 252, 30, 30])}M463,252L493,282M493,252L463,282`} delay={1.4} />
        {[100, 150, 200].map((x, i) => (
          <Stroke key={x} d={`${rect([x, 334, 36, 18])}${rect([x + 4, 338, 9, 9])}`} delay={1.3 + i * 0.08} dur={0.5} />
        ))}
        {/* Doors: entry pair and stockroom */}
        <Stroke d="M260,400V366A34,34 0 0,1 294,400" delay={1.3} dur={0.6} className="[stroke-width:1]" />
        <Stroke d="M330,400V366A34,34 0 0,0 296,400" delay={1.3} dur={0.6} className="[stroke-width:1]" />
        <Stroke d="M430,128H458A28,28 0 0,0 430,100" delay={1.2} dur={0.6} className="[stroke-width:1]" />
      </g>

      {/* Room labels and dimension */}
      <g className="markup fill-graphite text-[11px]" style={t(1.45)}>
        <text x={494} y={104} textAnchor="middle">
          Stockroom
        </text>
        <text x={295} y={359} textAnchor="middle">
          Entry
        </text>
        <text x={231} y={87} textAnchor="middle">
          Wall bays
        </text>
      </g>
      <g className="markup stroke-graphite" style={t(1.5)} strokeWidth={0.8} fill="none">
        <path d="M30,406V440M560,406V440M30,432H560M24,438L36,426M554,438L566,426" />
        <rect x={266} y={423} width={58} height={16} className="fill-paper stroke-none" />
        <text x={295} y={435} textAnchor="middle" className="fill-graphite stroke-none text-[11px]">
          106′-0″
        </text>
      </g>

      {/* Redline markup */}
      <g className="stroke-redline" fill="none" strokeWidth={2} strokeLinejoin="round">
        {clouds.map((c, i) => (
          <g key={i}>
            <Stroke d={cloud(c.box)} delay={c.delay} dur={0.7} />
            <g className="max-sm:hidden">
              <Stroke
                d={`M${c.leader[0]},${c.leader[1]}L${c.leader[2]},${c.leader[3]}`}
                delay={c.delay + 0.35}
                dur={0.35}
                className="[stroke-width:1.4]"
              />
              <circle cx={c.leader[0]} cy={c.leader[1]} r={2.6} className="markup fill-redline stroke-none" style={t(c.delay + 0.3)} />
            </g>
            <g className="sm:hidden">
              <Triangle x={c.box[0] + 4} y={c.box[1] - 4} n={i + 1} delay={c.delay + 0.35} />
            </g>
          </g>
        ))}
      </g>

      <g className="max-sm:hidden">
        {markupNotes.map((note, i) => {
          const [, , x, y] = clouds[i].leader;
          const delay = clouds[i].delay + 0.55;
          return (
            <g key={note.n} transform={`rotate(-3 ${x} ${y})`}>
              <Triangle x={x + 16} y={y - 2} n={note.n} delay={delay} />
              <g className="markup" style={t(delay + 0.05)}>
                <text x={x + 34} y={y + 9} className="font-condensed fill-redline text-[36px] font-extrabold">
                  {note.value}
                </text>
                <text x={x + 6} y={y + 31} className="font-narrow fill-redline-deep text-[15px] font-semibold">
                  {note.label}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
