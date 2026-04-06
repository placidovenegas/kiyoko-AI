import Link from 'next/link';
import {
  Layers, Sparkles, Video, Mic, FileText, Users,
  ArrowRight, CheckCircle, Play, Wand2, Copy,
  Clapperboard,
} from 'lucide-react';
import { KiyokoLogo, KiyokoLogoBrand } from '@/components/shared/KiyokoLogo';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: Layers,
    title: 'Storyboard Visual',
    desc: 'Tres vistas: compacto, grid y timeline con arco narrativo integrado. Drag & drop para reordenar.',
    gradient: 'from-brand-teal to-brand-green',
  },
  {
    icon: Sparkles,
    title: 'IA Generativa',
    desc: 'Genera prompts de imagen y video en inglés + descripción en español. La IA entiende tu proyecto.',
    gradient: 'from-brand-coral to-brand-coral/70',
  },
  {
    icon: Video,
    title: 'Multi-Video',
    desc: 'Un proyecto, múltiples videos. YouTube, Reels, TikTok — cada uno con sus escenas y configuración.',
    gradient: 'from-brand-purple to-brand-purple/60',
  },
  {
    icon: Mic,
    title: 'Narración con Voz',
    desc: 'Genera guiones completos y audio con ElevenLabs. Diálogos en cámara o voz en off.',
    gradient: 'from-brand-coral/80 to-brand-purple/80',
  },
  {
    icon: FileText,
    title: 'Exportar Todo',
    desc: 'PDF storyboard, HTML interactivo, JSON datos, Markdown guión, MP3 narración y ZIP completo.',
    gradient: 'from-brand-green to-brand-teal',
  },
  {
    icon: Users,
    title: 'Colaboración',
    desc: 'Trabaja en equipo en tiempo real. Comparte con link público, con password o entre usuarios.',
    gradient: 'from-brand-coral/90 to-brand-green/80',
  },
] as const;

const STEPS = [
  { icon: Clapperboard, title: 'Crea tu proyecto', desc: 'Define estilo visual, plataforma y duración.' },
  { icon: Wand2, title: 'La IA genera prompts', desc: 'Imagen + video en inglés, descripción en español.' },
  { icon: Copy, title: 'Copia y genera', desc: 'Lleva los prompts a Runway, Kling, Flux, Midjourney...' },
  { icon: Play, title: 'Produce y exporta', desc: 'Añade narración, exporta storyboard y comparte.' },
] as const;

const PLANS = [
  { name: 'Free', price: '0', popular: false, cta: 'Empezar gratis', features: ['2 proyectos', '1-2 videos/proyecto', 'IA básica', 'Exportar PDF'] },
  { name: 'Pro', price: '19', popular: true, cta: 'Elegir Pro', features: ['Proyectos ilimitados', '10 videos/proyecto', 'IA avanzada', 'Narración TTS', 'Soporte prioritario'] },
  { name: 'Business', price: '49', popular: false, cta: 'Elegir Business', features: ['Todo en Pro', 'Videos ilimitados', 'IA ilimitada', 'Colaboración equipo', 'API access'] },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-dark text-white">
      {/* ---- Navbar ---- */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-brand-dark/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <KiyokoLogoBrand variant="dark" size={28} textClassName="text-white" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white/60 transition hover:text-white"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden pb-24 pt-20 lg:pb-32 lg:pt-28">
        {/* BG orbs */}
        <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-brand-teal/15 blur-[150px]" />
        <div className="absolute -right-32 top-20 h-[500px] w-[500px] rounded-full bg-brand-coral/10 blur-[130px]" />
        <div className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-brand-purple/8 blur-[100px]" />

        {/* Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 text-center">
          {/* Badge */}
          <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2 text-sm font-medium text-brand-green">
            <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
            AI Storyboard Production Studio
          </div>

          {/* Logo big */}
          <div className="mx-auto mb-8">
            <KiyokoLogo variant="dark" size={80} className="mx-auto" />
          </div>

          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-7xl">
            Crea videos con{' '}
            <span className="bg-linear-to-r from-brand-green via-brand-teal to-brand-teal bg-clip-text text-transparent">
              inteligencia
            </span>
            <br />
            <span className="bg-linear-to-r from-brand-coral via-brand-coral/80 to-brand-green bg-clip-text text-transparent">
              artificial
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/50">
            Genera storyboards, prompts de imagen y video, narraciones con voz —
            todo desde una sola plataforma potenciada por IA.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2.5 rounded-xl bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground shadow-xl shadow-primary/30 transition hover:bg-primary/90 hover:shadow-primary/50"
            >
              Empezar gratis
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-white/70 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
            >
              Ver características
            </Link>
          </div>

          {/* Stats */}
          <div className="mx-auto mt-20 flex max-w-lg justify-center gap-12">
            {[
              { value: 'IA', label: 'Prompts automáticos' },
              { value: 'Multi', label: 'Videos por proyecto' },
              { value: 'TTS', label: 'Narración con voz' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-brand-green">{s.value}</p>
                <p className="mt-1 text-xs text-white/40">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Features ---- */}
      <section id="features" className="relative py-24">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-primary/5 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-coral">Características</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Todo lo que necesitas</h2>
            <p className="mt-3 text-white/50">
              De la idea al video final, Kiyoko te acompaña en cada paso.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-sm transition hover:border-white/10 hover:bg-white/[0.04]"
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-linear-to-br ${f.gradient} shadow-lg`}>
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-green">Flujo de trabajo</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-4xl">4 pasos para tu video</h2>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center">
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-1/2 top-8 hidden h-px w-full bg-linear-to-r from-primary/40 to-transparent lg:block" />
                )}
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                  <s.icon className="h-7 w-7 text-brand-green" />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-coral text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold">{s.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/40">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Showcase mockup ---- */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-1 shadow-2xl">
            {/* Fake browser chrome */}
            <div className="flex items-center gap-2 rounded-t-xl bg-white/5 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-white/10" />
                <span className="h-3 w-3 rounded-full bg-white/10" />
                <span className="h-3 w-3 rounded-full bg-white/10" />
              </div>
              <div className="mx-auto flex-1 text-center">
                <span className="rounded-md bg-white/5 px-6 py-1 text-[11px] text-white/30">kiyoko.ai/project/mi-video/storyboard</span>
              </div>
            </div>
            {/* Content area */}
            <div className="flex h-72 items-center justify-center rounded-b-xl bg-linear-to-br from-brand-dark to-brand-dark/90 sm:h-96">
              <div className="text-center">
                <KiyokoLogo variant="dark" size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-sm text-white/20">Vista previa del storyboard</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Pricing ---- */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-brand-coral/3 to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-coral">Precios</p>
          <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Empieza gratis</h2>
          <p className="mt-3 text-white/50">
            Plan gratuito con proyectos limitados. Escala cuando lo necesites.
          </p>
          <div className="mx-auto mt-12 grid max-w-4xl items-stretch gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border p-7 text-left transition ${
                  plan.popular
                    ? 'border-primary/50 bg-primary/5 shadow-xl shadow-primary/10'
                    : 'border-white/5 bg-white/[0.02]'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-lg">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-3">
                  <span className="text-4xl font-extrabold">{plan.price}&euro;</span>
                  <span className="text-sm text-white/40">/mes</span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-white/60">
                      <CheckCircle className="h-4 w-4 shrink-0 text-brand-green" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-8 block rounded-xl px-6 py-3 text-center text-sm font-medium transition ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90'
                      : 'border border-white/10 text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- CTA ---- */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-linear-to-r from-brand-teal/20 via-brand-dark to-brand-coral/10" />
        <div className="absolute -left-20 bottom-0 h-[300px] w-[300px] rounded-full bg-brand-teal/20 blur-[100px]" />
        <div className="absolute -right-20 top-0 h-[300px] w-[300px] rounded-full bg-brand-coral/15 blur-[100px]" />

        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <KiyokoLogo variant="dark" size={56} className="mx-auto mb-6" />
          <h2 className="text-3xl font-bold lg:text-4xl">
            Listo para crear tu próximo video?
          </h2>
          <p className="mt-4 text-white/50">
            Regístrate gratis y empieza a producir storyboards con IA hoy mismo.
          </p>
          <Link
            href="/register"
            className="group mt-8 inline-flex items-center gap-2.5 rounded-xl bg-brand-coral px-8 py-3.5 text-sm font-medium text-white shadow-xl shadow-brand-coral/25 transition hover:bg-brand-coral/90 hover:shadow-brand-coral/40"
          >
            Crear cuenta gratis
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* ---- Footer ---- */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <KiyokoLogoBrand variant="dark" size={22} textClassName="text-sm text-white/60" />
            <div className="flex gap-6 text-sm text-white/30">
              <Link href="/terms" className="transition hover:text-white/60">Términos</Link>
              <Link href="/privacy" className="transition hover:text-white/60">Privacidad</Link>
              <Link href="/docs" className="transition hover:text-white/60">Documentación</Link>
            </div>
            <p className="text-xs text-white/20">
              &copy; 2026 Kiyoko AI. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
