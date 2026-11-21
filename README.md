# Fiona Qian — Portfolio v51 (Next.js 16)

This project now contains **Next.js App Router + React 19 + TypeScript**.
The published site is a static export (GitHub Pages needs no Node server).

## Preserving the original site
- `app/page.tsx` pre-renders the original layout from `legacy/site-template.txt`.
- `components/LegacyBoot.tsx` initialises the original WebGL 3D entrance, scroll animations, and the archive drawers in the browser.
- `app/archive/page.tsx` is a real React Server Component generated from the same manifest files.
- The original models, images, CSS, written content, navigation, and labels are served from `public/`.
- Future additions can replace legacy sections with smaller React components without redesigning the site.

## Local development
`npm install`
`NEXT_PUBLIC_BASE_PATH= npm run dev` (open http://localhost:3000)
`NEXT_PUBLIC_BASE_PATH= npm run build` for a local root-path preview.

## Deploy to GitHub Pages
`npm run check` verifies manifest files, GLB headers, test cases, TypeScript and the Next.js static build.
The Pages workflow produces `out/` and deploys it with GitHub Actions.
**Change Settings → Pages → Source to GitHub Actions**, not "Deploy from a branch".
The default repository URL is `https://jfojellyfish-glitch.github.io/Fiona-personal--portfolio/`.

This project cannot use Next.js runtime server APIs, Server Actions or cookies on Pages because `output:'export'` is required. For full-stack functionality later, move the same Next.js app to a Node-supported host.

The earlier site is safely preserved on `backup-before-nextjs-2026-11-21`.

## v53 — React Archive drawers

The **Pearls**, **3D Objects** and **Photography** drawers are now native, independently maintainable React components, replacing `public/js/archive-content.js`'s DOM mutation routines.
- `components/archive/PearlsDrawer.tsx`: article listing, safe Markdown rendering and hash-based reading.
- `components/archive/ObjectsDrawer.tsx`: frameless local GLB with lazy model-viewer loading; Sketchfab embeds remain supported.
- `components/archive/PhotographyDrawer.tsx`: photo gallery with accessible modal, arrow keys and Escape.
- `components/archive/CollectionSearch.tsx`: search visible only when a collection has 4 or more works.
- `components/archive/ArchiveDrawers.tsx`: preserves the same `#writing`, `#objects`, `#photography` links.
- `app/page.tsx` pre-renders the unchanged home design and lets React render only the three existing drawer pages.

The original 3D opening model, SVG lotus, fonts, colors, logos, and layout remain unchanged.
The previous archive script remains in the repository for reference, but is not booted.

## Repository vanity URL — ready for `fiona333anglekurage`

The planned free Pages URL is `https://jfojellyfish-glitch.github.io/fiona333anglekurage/`.

- The site remains unchanged and safely deployed under its **existing** URL until the repository itself is renamed in **Settings → General → Repository name**.
- The Next.js build and browser smoke test now derive `NEXT_PUBLIC_BASE_PATH` from the current `GITHUB_REPOSITORY`; all client bundles, images, CSS, JavaScript, Markdown and GLB assets will use the renamed project path on the **next build**.
- The deployment workflow checks both the actual repository path and the proposed `/fiona333anglekurage` path on pull requests.
- After using GitHub's **Rename** control, open **Actions → Build and deploy Next.js Portfolio → Run workflow → main**. GitHub Pages **Source** should remain **GitHub Actions**. A fresh deployment is needed after a rename; a repository rename alone may not trigger the workflow.
- Important: GitHub does **not automatically redirect GitHub Pages project-site URLs** when repositories are renamed. Existing links to the original `/Fiona-personal--portfolio/` may stop working. Update personal links after confirming the new site.
- The original content has not been changed. A Git backup branch `backup-before-vanity-rename-2026-11-21` is available.
