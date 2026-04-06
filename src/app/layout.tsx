import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { KiyokoToaster } from '@/components/ui/toast';
import { Providers } from '@/app/providers';
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
  var isDark = t === 'dark' || (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={cn(geistSans.variable, geistMono.variable)}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  if(!navigator||!navigator.locks||!navigator.locks.request)return;
  navigator.locks.request=function(_n,a,b){
    var cb=typeof a==='function'?a:b;
    return cb?cb(null):Promise.resolve();
  };
})();
` }} />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <Providers>
          <NextIntlClientProvider messages={messages}>
            <QueryProvider>
              {children}
            </QueryProvider>
          </NextIntlClientProvider>
        </Providers>
        <KiyokoToaster />
      </body>
    </html>
  );
}
