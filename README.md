# Riff Code

**Small web projects I vibe-coded with Claude Code — every one of them is live.**

🔗 **[riffcode.brianriffle.com](http://riffcode.brianriffle.com/)**

![The License Plate Game, half the map filled in](riffcode/Images/projects/license-plate.jpg)

I'm a business leader, not a full-time developer. These are real tools and toys
I wanted for my family and my work, built by describing them to
[Claude Code](https://claude.com/claude-code) and iterating until they were right.

## Projects

| | Project | What it does | |
|---|---|---|---|
| 🚗 | **License Plate Game** | The road-trip classic on a live map of the US. Tap each state as you spot its plate. | [Live](http://riffcode.brianriffle.com/apps/license-plate/) · [Code](riffcode/apps/license-plate/) |
| ➕ | **Fun With Math** | Math-fact practice for kids: pick the operations, earn stickers, mastery mode re-queues misses. | [Live](http://riffcode.brianriffle.com/apps/fun-with-math/) · [Code](riffcode/apps/fun-with-math/) |
| 📐 | **Retail Layout Studio** | Drag-and-drop floor planner for a 60′ × 40′ store with a live fixture tally. | [Live](http://riffcode.brianriffle.com/apps/retail-layout-studio/) · [Code](riffcode/apps/retail-layout-studio/) |
| 🗺️ | **Retail Layout Creator 2** | The second pass: resizable floor, group moves, saved plans, PNG export. | [Live](http://riffcode.brianriffle.com/apps/retail-layout-creator-2/) · [Code](riffcode/apps/retail-layout-creator-2/) |
| 🏬 | **Next Step Retail** | Marketing site for a turn-key store-launch consultancy. | [Live](http://riffcode.brianriffle.com/apps/next-step-retail/) · [Code](riffcode/apps/next-step-retail/) |
| 📚 | **Christine's Book Reviews** | Snap a photo of a book cover and it publishes itself: Claude Vision identifies the book, a Python pipeline builds the card and uploads it. | [Live](http://christineriffle.com) · [Code](sites/christineriffle.com/) |
| 🎨 | **Kate's Art Gallery** | A nine-year-old's art, framed the way she wanted it framed. | [Live](http://kateriffle.com) · [Code](sites/kateriffle.com/) |

## How it's built

- **Plain HTML, CSS and JavaScript.** No framework, no build step, no `npm install` —
  open any `index.html` and it runs.
- **Libraries only where they earn it:** D3 + TopoJSON for the map, Bootstrap on the older sites.
- **Python for the automation:** SFTP deploys, and the book-review pipeline that calls the
  Claude API.
- **Hosted on Pair Networks** as plain static files.

## Repo layout

```
riffcode/              riffcode.brianriffle.com — the gallery
  index.html           gallery page
  projects.js          the list of projects the gallery renders
  apps/<name>/         one folder per project, each with its own index.html
sites/                 the family sites, one folder per domain
  brianriffle.com/
  christineriffle.com/
  kateriffle.com/
tools/deploy.py        uploads a site over SFTP
```

## Run it locally

```sh
python -m http.server 8777 --directory riffcode
```

Then open http://localhost:8777. (Most pages also work straight from disk.)

## Deploy

Credentials go in a `.env` at the repo root (copy [`.env.example`](.env.example)); it is gitignored.

```sh
python tools/deploy.py riffcode --dry-run   # show what would upload
python tools/deploy.py riffcode             # upload new and changed files
```

Sites: `riffcode`, `brianriffle`, `christine`, `kate`. READMEs, Python scripts and `.env`
files never upload. Requires `paramiko` and `python-dotenv`.

## Adding a project

1. Create `riffcode/apps/<name-with-dashes>/index.html` and a short `README.md`.
2. Add its entry to [`riffcode/projects.js`](riffcode/projects.js) and a screenshot pair in
   `riffcode/Images/projects/`.
3. Add a row to the table above, commit, deploy.

Details in [riffcode/README.md](riffcode/README.md).

## License

Code is [MIT](LICENSE). Images, artwork, photos and written content are © Brian Riffle and family,
all rights reserved.
