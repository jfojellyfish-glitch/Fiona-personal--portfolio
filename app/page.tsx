import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LegacyBoot } from '@/components/LegacyBoot';

// Next.js pre-renders the artist's established site layout while the rest
// of the application moves to typed React components incrementally.
const template = readFileSync(join(process.cwd(), 'legacy', 'site-template.txt'), 'utf8');
const markup = template.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '';
const html = markup.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
if (!html.includes('id="intro-enter"')) throw new Error('The original 3D intro was not found');
export default function Home() {
  return <><div id="portfolio-site" dangerouslySetInnerHTML={{ __html: html }} /><LegacyBoot /></>;
}
