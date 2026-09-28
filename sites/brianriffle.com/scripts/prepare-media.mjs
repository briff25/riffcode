// Turns the originals in assets-src/ into web-sized files in public/media/.
//   npm run media
// Every output gets a .webp and a .jpg so <picture> can fall back cleanly.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = path.resolve("assets-src");
const OUT = path.resolve("public/media");

// Plan Ink and a cool paper white; the portrait is mapped between these two.
const INK = [16, 28, 46];
const PAPER = [233, 238, 243];

async function write(pipeline, name) {
  await pipeline.clone().webp({ quality: 80 }).toFile(path.join(OUT, name + ".webp"));
  await pipeline.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, name + ".jpg"));
  console.log("  " + name);
}

async function resized(file, width, name) {
  await write(sharp(path.join(SRC, file)).resize({ width, withoutEnlargement: true }), name);
}

const clamp01 = (n) => Math.min(1, Math.max(0, n));

// How much of the original photo to keep at (u, v), both 0..1 across the crop:
// a soft head ellipse plus shoulders that widen toward the bottom. Everything
// outside fades to ink, which removes the checkered wallpaper.
function keep(u, v) {
  const dx = (u - 0.5) / 0.262;
  const dy = (v - 0.34) / 0.29;
  const head = clamp01((1.02 - Math.sqrt(dx * dx + dy * dy)) / 0.1);
  const half = 0.17 + Math.max(0, v - 0.58) * 1.7;
  const shoulders = clamp01((half - Math.abs(u - 0.5)) / 0.05) * clamp01((v - 0.54) / 0.05);
  return Math.max(head, shoulders);
}

// Grayscale -> two-colour duotone between ink and paper, masked by keep().
async function portrait(width, name) {
  const crop = { left: 0, top: 40, width: 1300, height: 1625 };
  const height = Math.round(width * 1.25);
  const { data, info } = await sharp(path.join(SRC, "brian-headshot.jpg"))
    .extract(crop)
    .resize(width, height)
    .grayscale()
    .normalise()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(info.width * info.height * 3);
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = y * info.width + x;
      const u = x / info.width;
      const w = y / info.height;
      let v = Math.pow(data[i] / 255, 1.15); // a touch more contrast in the mids
      const k = keep(u, w);
      const bg = 0.05 + 0.07 * (1 - w); // faint top-lit ink behind the head
      v = v * k + bg * (1 - k);
      for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(INK[c] + (PAPER[c] - INK[c]) * v);
    }
  }
  await write(sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } }), name);
}

await mkdir(OUT, { recursive: true });
console.log("Writing public/media/");
await portrait(400, "brian-portrait-400");
await portrait(800, "brian-portrait-800");
await resized("cma-elevate-2026.jpg", 800, "cma-elevate-2026");
await resized("shop-marketplace-2024.png", 800, "shop-marketplace-2024-800");
await resized("shop-marketplace-2024.png", 1400, "shop-marketplace-2024-1400");
for (const a of ["article-planogram-compliance", "article-macro-space", "article-careers"]) {
  await resized(a + ".png", 320, a + "-320");
  await resized(a + ".png", 640, a + "-640");
}
await resized("retail-layout-creator.jpg", 720, "retail-layout-creator-720");
