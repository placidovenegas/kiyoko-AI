import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { KiyokoLogoBrand } from '@/components/shared/KiyokoLogo';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-surface-tertiary bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/">
            <KiyokoLogoBrand variant="dark" size={28} />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-tertiary py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 text-xs text-foreground-muted">
          <p>&copy; 2026 Kiyoko AI</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-foreground">Términos</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacidad</Link>
            <Link href="/docs" className="hover:text-foreground">Docs</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
