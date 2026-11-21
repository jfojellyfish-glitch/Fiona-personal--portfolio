import type { NextConfig } from 'next';

/**
 * GitHub Pages project-site prefix follows the current repository name.
 * This keeps the portfolio and all 3D/model/css/js assets working after
 * a GitHub repository rename, without hardcoding the old path.
 *
 * Locally defaults to the current repository name. Set
 * NEXT_PUBLIC_BASE_PATH='' to run from localhost:/ or any custom root domain.
 */
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/').pop() || 'Fiona-personal--portfolio';
const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? `/${repositoryName}`;
if (prefix !== '' && !/^\/[a-zA-Z0-9._-]+$/.test(prefix)) {
  throw new Error('Invalid GitHub Pages base path: ' + prefix);
}
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: prefix,
  images: { unoptimized: true },
  // Expose the calculated path to the legacy JS loader and client components.
  env: { NEXT_PUBLIC_BASE_PATH: prefix },
};
export default config;
