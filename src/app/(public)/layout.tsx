import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { KiyokoLogoBrand } from '@/components/shared/KiyokoLogo';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/">
            <KiyokoLogoBrand variant="dark" size={28} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-6 py-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 text-xs text-muted-foreground">
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
