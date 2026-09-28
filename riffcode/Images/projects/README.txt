How the screenshots in this folder are made
===========================================

Each project has two files with the SAME base name, matching the `shot` field in
../../projects.js (which stores the path WITHOUT an extension):

    license-plate.webp   <- what almost every browser actually loads
    license-plate.jpg    <- fallback for anything that can't do webp

Both are 1200 x 750 (a 1440 x 900 browser window, scaled down). Keep that shape:
the cards crop to 16:10 from the top, so a 1200x750 shot fills a card exactly.

If a file is missing, nothing breaks -- the card falls back to a colored gradient
with the project's emoji on it.

To refresh one, or add one for a new project
--------------------------------------------

1. Serve the site locally so the browser can open the local pages:

       cd C:\Users\brian\Code\Websites\riffcode
       python -m http.server 8777

2. Ask Claude Code: "re-capture the screenshot for <project>". It drives a real
   browser with the Playwright tools, sizes the window to 1440x900, loads the
   page, scales the capture to 1200px wide and writes both files here.

   Worth saying in the request: put the page in an INTERESTING state first.
   The good versions of these shots aren't the empty first-load state --
     - License Plate: ~27 states already marked, so the map is half filled in.
       (Set localStorage key "lp-v5" to a JSON array of state abbreviations,
       then reload.)
     - Fun With Math: a problem on screen, not just the settings panel.
     - Christine's site: scrolled down to the grid of book covers.

3. By hand instead, if you'd rather: take a 1440x900 screenshot however you like,
   scale it to 1200px wide, and save it here as <name>.webp and <name>.jpg.
   Aim for under ~150 KB each so the page stays fast.
