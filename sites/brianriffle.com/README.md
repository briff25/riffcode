# brianriffle.com

Brian Riffle's professional site. Next.js 16 (App Router) + Tailwind CSS v4,
exported to plain static files for Pair Networks.

Design direction is "Redline": a store drawing set (ink on drafting paper)
marked up in red pen. The hero floor plan draws itself once on load; that is
the page's only non-interactive motion, and it is skipped under
`prefers-reduced-motion`.

## Editing content

All copy lives in `src/content/`:

| File | What's in it |
|---|---|
| `profile.ts` | name, contact links, hero, About copy |
| `career.ts` | roles for the career-journey shelf (oldest first) |
| `press.ts` | speaking events and articles (Brian was quoted, not the author) |
| `expertise.ts` | disciplines, tools, certifications, education |

The private reference documents this site was built from (LinkedIn profile, the
verified events/articles list) live in the private dev repo, not here.

The CMA|SIMA speaker graphic and the Shop! MarketPlace photo (VMSD) belong to their
owners and are used with credit on the page.

## Images

Originals are in `assets-src/`. After adding or changing one:

```sh
npm run media   # writes sized .webp + .jpg pairs to public/media/
```

The headshot is cropped, duotoned and masked in `scripts/prepare-media.mjs`;
drop a new `assets-src/brian-headshot.jpg` in and adjust `crop`/`keep()` if the framing changes.

## Run and build

```sh
npm run dev      # http://localhost:3000
npm run build    # static export to out/
npm run serve    # serve out/ like Apache would (gzip, 404.html) on :8791
```

## Deploy

From `C:\Users\brian\Code\Websites`:

```sh
python tools/deploy.py brianriffle --dry-run
python tools/deploy.py brianriffle
```

The `brianriffle` entry points at this project's `out/` folder. `public/.htaccess`
ships with the build (404 page, caching, gzip, and 301s for the old site's pages).
The site is HTTPS-only: `.htaccess` redirects http to https, and `SITE_URL` in
`src/content/profile.ts` is https. Links and redirects to riffcode.brianriffle.com use
https too.
