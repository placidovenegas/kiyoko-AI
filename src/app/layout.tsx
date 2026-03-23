import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { KiyokoToaster } from '@/components/ui/toast';
import './globals.css';
import { cn } from '@/lib/utils';
import { QueryProvider } from '@/lib/query/provider';

const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Kiyoko AI — Storyboard Production Studio',
    template: '%s | Kiyoko AI',
  },
  description: 'Del brief al storyboard en minutos, no en días.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kiyoko AI',
  },
};

// Script to apply dark mode class before first paint (prevents flash)
const themeScript = `
(function() {
  var t = localStorage.getItem('kiyoko-theme');
  if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={cn(geistSans.variable, geistMono.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
        <KiyokoToaster />
      </body>
    </html>
  );
}
