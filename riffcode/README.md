# riffcode.brianriffle.com

A gallery of small web projects I built by vibe coding, plus the projects
themselves. Hand-written static HTML — no framework, no build step, no npm.

Live at **[riffcode.brianriffle.com](http://riffcode.brianriffle.com/)**.

## Layout

```
index.html          the gallery page
projects.js         <- the gallery's list of projects
css/gallery.css     styling
js/gallery.js       search, tag filtering, theme, scroll reveal
Images/projects/    screenshots, one .webp + one .jpg per project
apps/<name>/        one folder per project, each with its own index.html
```

## The projects

| Project | Folder |
|---|---|
| License Plate Game | [apps/license-plate/](apps/license-plate/) |
| Fun With Math | [apps/fun-with-math/](apps/fun-with-math/) |
| Next Step Retail | [apps/next-step-retail/](apps/next-step-retail/) |
| Retail Layout Studio | [apps/retail-layout-studio/](apps/retail-layout-studio/) |
| Retail Layout Creator 2 | [apps/retail-layout-creator-2/](apps/retail-layout-creator-2/) |

Christine's and Kate's sites are linked from the gallery but live in `../sites/`.

## Adding a project

1. Make `apps/my-thing/index.html` (lowercase-with-dashes folder name). Put its
   CSS/JS next to it and link them relatively (`styles.css`, not `/styles.css`).
   Add a short `README.md` there too: what it is, status, date started.
   READMEs and `.py` files never upload.

2. Append a block to `projects.js`:

   ```js
   {
     id: "my-thing",
     title: "My Thing",
     tagline: "One sentence on why it's fun.",
     url: "apps/my-thing/",        // or https://… for an external site
     tags: ["Game", "Kids"],       // new tags appear in the filter bar automatically
     emoji: "🎲",
     accent: "#7c3aed",            // tints the card glow
     shot: "Images/projects/my-thing",   // no extension; .webp and .jpg are both loaded
     built: ["Claude Code"]
   }
   ```

   Only `id`, `title` and `url` are required. With no `shot`, the card draws a
   gradient with the emoji on it instead — nothing breaks.
   `featured: true` promotes a project to the hero. Keep it on exactly one.

3. Drop `Images/projects/my-thing.webp` and `.jpg` in place (1200×750).
   See [Images/projects/README.txt](Images/projects/README.txt).

4. Deploy from the repo root: `python tools/deploy.py riffcode`.

Retiring a project: move its folder to `apps/_archive/` (never uploaded) and
remove its block from `projects.js`.

Filters live in the URL, so `#tag=Game&q=map` is a shareable, reloadable view.

## Local preview

`index.html` opens straight from disk — `projects.js` is a plain script, not a
`fetch`, specifically so `file://` works. Over HTTP, use the `riffcode`
entry in `.claude/launch.json`, or:

```sh
python -m http.server 8777 --directory riffcode
```
