# Updating your portfolio — v46

Your v45 homepage and 3D entrance are preserved. These drawers now read content from **three JSON lists**. You can edit them directly in GitHub. No React/Next.js, database, build, API key, or Sketchfab login is needed to display public models.

## 01 / Pearls — publish a piece of writing

1. In `content/pearls/`, copy `_TEMPLATE.md` to (for example) `a-little-thought.md` and replace its sample words with your own. Markdown supports paragraphs, `##` headings, `**bold**`, `*italic*`, `> quotes`, numbered/bulleted lists and links.
2. Open `content/pearls/index.json`, and add an object to the `entries` list:

```json
{
  "entries": [
    {
      "slug": "a-little-thought",
      "title": "a little thought",
      "date": "2026-11-20",
      "description": "One line about the note.",
      "category": "journal",
      "file": "content/pearls/a-little-thought.md"
    }
  ]
}
```

The reader automatically lists the note and opens it at `#writing/a-little-thought`. A slug should contain lowercase letters, numbers and hyphens only; each slug must be unique. List order is the display order. The note file path is relative to the repository root.

## 02 / 3D Objects — add a model after uploading

A public **Sketchfab** model can be embedded directly on the page. After publishing, open its Sketchfab model page and copy its 32-character model ID (typically the letters/numbers at the end of its URL). If your platform is actually another service called Sketchlab, share a link so we can adapt the viewer.

Edit `content/objects/index.json`:

```json
{
  "models": [
    {
      "title": "my first sculpture",
      "year": "2026",
      "description": "A short note about the piece.",
      "sketchfabId": "0123456789abcdef0123456789abcdef"
    }
  ]
}
```

Replace the example ID with your real model ID. The embed only loads after someone clicks **view in 3d**, which keeps the home page fast. Optional `cover` is a file path, for example `assets/models/sculpture-cover.webp`. For a non-Sketchfab external project use a `url` field instead; it will be linked rather than embedded. Keep models **public** or embed-enabled in your Sketchfab settings; private models may not show publicly.

## 03 / Photography — add photographs

1. Put compressed photos into `assets/photography/` (e.g. `spring-window.webp`). Aim for 1200–2000px on the long side and preferably less than ~500KB per image, balancing sharpness and size.
2. Edit `content/photography/index.json`:

```json
{
  "photos": [
    {
      "title": "spring window",
      "year": "2026",
      "location": "a place to remember",
      "file": "assets/photography/spring-window.webp",
      "alt": "Soft afternoon light falling through a window"
    }
  ]
}
```

Clicking a photograph opens a large viewer with arrows and keyboard controls. `alt` is useful for screen-reader accessibility. File names should avoid spaces and special characters for easier linking. List order controls gallery order.

## How publishing works

- Upload/edit your content and commit the changes to `main` in GitHub. Your GitHub Pages site updates on its next deployment (allow for its normal publishing delay).
- In **Settings → Pages**, publish from `main` at `/(root)` if you haven't already.
- The ZIP is prepared so `index.html`, `assets`, `css`, `js`, `content`, and `.nojekyll` sit at the root. Do not upload only the ZIP file; extract it and upload its contents.
- To preview locally: inside the project folder run `python3 -m http.server 8000` then browse to `http://localhost:8000/` (or use the supplied single-file preview for the initial empty portfolio). Double-clicking the multi-file `index.html` will not load JSON/Markdown because of browser `file://` restrictions.
- You can add entries without changing any HTML/CSS/JavaScript. Keep JSON commas and quotes valid. Commit the new `.md`/image and the JSON index together.

## What has *not* been done

No real articles, photos or 3D models have been invented or published. No changes have been pushed to GitHub. No external account has been connected or modified. The existing homepage and original rotating `assets/fiona-logo.glb` 3D entrance remain unchanged.


## v47 — use your own GLB without Sketchfab

You can now show local `.glb` models directly in **02 / 3D Objects**.

1. Place the web-optimized GLB inside `assets/models/`.
2. Add to `content/objects/index.json` under `models`:

```json
{
  "models": [
    {
      "title": "old water Mark",
      "year": "2025",
      "file": "assets/models/model-01.glb",
      "alt": "Interactive 3D artwork",
      "description": ""
    }
  ]
}
```

3. The visitor opens **02 / 3D Objects**, and the viewer loads when the objects page is opened; the model loads from your own GitHub Pages host.
4. Always preview from `https://...github.io/...` or `python3 -m http.server 8000` rather than double-clicking `index.html`, because the browser may block `file://` 3D assets and JSON fetches.

The source `Project,.glb` was about 270 MiB, too large for normal GitHub upload or comfortable mobile viewing. `model-01.glb` is a simplified, website-specific copy preserving original materials and UV coordinates. Store your high-poly master separately.

Your intro 3D logo (`assets/fiona-logo.glb`) is independent and unchanged.


## v48 update
The example title from the supplied code was not the model’s actual name. It is now labelled **old water Mark / 2025**. The page shows the model directly on an unboxed transparent canvas once visitors enter **02 / 3d objects**. The asset is still the same web-optimised GLB; the original upload is not modified.
