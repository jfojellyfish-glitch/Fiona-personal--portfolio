# Fiona Qian — Portfolio v36

A static portfolio for GitHub Pages. This revision **keeps the v34 layout and animation**, with **only the daytime color palette**, now featuring unified Arial Narrow/Arial large headlines and a subtle 1990s print texture. Night mode, IP timezone detection, and the theme switch have been removed.

## File layout
- `index.html`: website and section/archive links
- `css/`: design, gentle scroll animations, permanent daytime palette and contact layout
- `js/main.js`: Archive navigation, looping lotus motif and other existing interactions
- `js/scroll-motion.js`: animated headings and gentle parallax
- `js/intro-webgl.js`: original 3D logo entrance (unchanged from v34)
- `assets/`: original artwork and `fiona-logo.glb`

## Deploy to GitHub Pages
1. Upload the **contents** of this folder (not the folder itself) to the root of your repository's `main` branch.
2. Go to **Settings → Pages → Build and deployment**, choose **Deploy from a branch**, `main`, `/(root)`, then save.
3. The site uses no package manager or build step.

## Preview locally
For the full 3D model to load in the multi-file project, run `python3 -m http.server 8000` from the project directory and open `http://localhost:8000/` rather than double-clicking the file.

Daytime colors are in `css/theme.css`. The site now makes **no IP lookup requests** for themes, and previous visitors' stored dark-mode preference is ignored. For people with reduced-motion preferences, nonessential scroll and lotus animation are disabled.

## v36 typography
- `css/typography.css` is the only new stylesheet. Display text across sections and Archive pages uses Arial Narrow (Arial fallback), regular weight and compact letter spacing.
- The signature retains its original lettering; the About Me name remains within the biography column.
- A faint grain is added to the daylight website after entry, while paragraph copy remains legible. The intro model and its display rules are unchanged.

## v40 — portrait writings cover
The 01 / writings artwork now retains the original p2 image's **736 × 981** portrait proportion (not a wide padded canvas). Its lilac palette and pixel texture are preserved. At small screen sizes it scales down proportionally. Archive navigation, 3D entrance and other pages are unchanged.

## v41 — 01 / writings cover
Replaced only the cover image with the supplied pastel flower artwork. The cover remains 736 × 981, preserving its current desktop/mobile dimensions and Archive link. The full photograph is centered without cropping or stretching, with softly faded edges matching the existing daytime paper color. All other CSS, JavaScript and the original 3D logo are unchanged.


## v43 — Pearls cover & caption spacing
- Renamed the first Archive entry and related navigation from `writings` to `pearls`.
- Removed the obsolete portrait aspect-ratio from the now-horizontal `i <3 my inner child` image.
- The `01 / pearls` caption now sits directly below the image. The image file is unmodified.
- The `#writing` URL fragment is intentionally unchanged, preserving existing links and page navigation.
- Intro WebGL model, 3D assets, all other media, and layouts are unchanged.


## v44 — typography polish
Every large display element shares the Arial Narrow / Liberation Sans Narrow / Arial font stack, 400 weight, and compact -0.065em tracking. General section headings are lowercase and centered. The original custom signature, poem, and About Me name retain their written capitalization and layout. Subtle ink shadow plus a fine overlay grain creates the requested early-digital feel without blurring images or body copy. The original GLB/WebGL entrance, `01 / pearls`, content, images, links, and animations are unchanged.


## v45: social branding
Brand SVG icons now appear before LinkedIn, GitHub and Instagram labels. This includes the About Me and Contact sections; GitHub project links use the same GitHub mark. The linked URLs, layout, 3D opening and animation files are unchanged.


## v46 — editable work drawers
01 / pearls, 02 / 3d objects and 03 / photography are now content-driven from `content/` JSON indices. See [HOW_TO_ADD_WORKS.md](HOW_TO_ADD_WORKS.md) for simple instructions. No real work has been added yet. The same v45 homepage, original 3D GLB, scrolling and CSS remain in place.


**v47:** The 02 drawer now supports self-hosted interactive GLB models, in addition to Sketchfab links. A compact, optimized version of “old water Mark / 2025” is included. The main site and intro logo have not been redesigned. See `HOW_TO_ADD_WORKS.md`.


## v48 update
The example title from the supplied code was not the model’s actual name. It is now labelled **old water Mark / 2025**. The page shows the model directly on an unboxed transparent canvas once visitors enter **02 / 3d objects**. The asset is still the same web-optimised GLB; the original upload is not modified.

## v50 — reliability and TypeScript

Added a typed archive schema (`src/catalogue.ts`), optional keyboard-friendly collection search (`src/archive-tools.ts`), and GitHub Actions checks to compile TypeScript and validate content paths and GLB size. The deployed site remains HTML + CSS + compiled JavaScript on GitHub Pages. The visual layout and original 3D introduction are unchanged.

Run `npm install` and `npm run check` to check changes. See `HOW_TO_ADD_WORKS.md` for updating entries. The old large standalone preview was removed from the live branch but preserved in `backup-before-v50-2026-11-21`.
