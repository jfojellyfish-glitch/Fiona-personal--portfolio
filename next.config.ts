import type { NextConfig } from 'next';
// GitHub Pages project site: https://jfojellyfish-glitch.github.io/Fiona-personal--portfolio/
const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? '/Fiona-personal--portfolio';
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: prefix,
  images: { unoptimized: true },
};
export default config;
