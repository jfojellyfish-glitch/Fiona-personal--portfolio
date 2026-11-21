import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? '/Fiona-personal--portfolio';
export const metadata: Metadata = {
  title: 'Fiona Qian — Portfolio',
  description: 'Fiona Qian — portfolio, archive, and passing thoughts.',
  robots: { index: true, follow: true },
};
const styles = ['style','scroll-motion','theme','contact','typography','archive-content'];

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="intro-locked">
      <head>
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#f8f5f1" />
        <link rel="icon" type="image/png" href={`${prefix}/assets/lotus-growth.png`} />
        {styles.map(name => <link key={name} rel="stylesheet" href={`${prefix}/css/${name}.css`} />)}
      </head>
      <body className="intro-locked">{children}</body>
    </html>
  );
}
