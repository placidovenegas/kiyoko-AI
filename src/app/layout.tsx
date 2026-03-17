import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Kiyoko AI — Storyboard Production Studio',
    template: '%s | Kiyoko AI',
  },
  description: 'Del brief al storyboard en minutos, no en días. Crea storyboards profesionales asistidos por IA.',
  keywords: ['storyboard', 'AI', 'producción', 'vídeo', 'inteligencia artificial'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-surface text-foreground`}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'bg-surface text-foreground',
          }}
        />
      </body>
    </html>
  );
}
