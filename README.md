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
