import { KiyokoLogo, KiyokoLogoBrand } from '@/components/shared/KiyokoLogo';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — immersive brand */}
      <div className="relative hidden w-1/2 overflow-hidden bg-[#0A0B1E] lg:flex lg:flex-col lg:justify-between">
        {/* Gradient orbs — teal + orange from logo */}
        <div className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full bg-[#058B96]/20 blur-[150px]" />
        <div className="absolute -bottom-40 right-0 h-[500px] w-[500px] rounded-full bg-[#FE6A3C]/12 blur-[130px]" />
        <div className="absolute right-20 top-1/3 h-[350px] w-[350px] rounded-full bg-[#58DAAC]/8 blur-[100px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-1 flex-col justify-between p-12">
          {/* Logo */}
          <KiyokoLogoBrand variant="dark" size={36} textClassName="text-white" />

          {/* Center — big logo + text */}
          <div className="space-y-8">
            <KiyokoLogo variant="dark" size={72} />

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#058B96]/30 bg-[#058B96]/10 px-4 py-1.5 text-sm text-[#58DAAC]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#58DAAC] animate-pulse" />
                Potenciado por IA
              </div>
              <h2 className="text-4xl font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
                Tu estudio de<br />
                producción<br />
                <span className="bg-linear-to-r from-[#58DAAC] via-[#2AAD9D] to-[#058B96] bg-clip-text text-transparent">
                  inteligente
                </span>
              </h2>
            </div>
            <p className="max-w-md text-base leading-relaxed text-white/50">
              Crea storyboards, genera prompts de imagen y video,
              produce narraciones — todo con inteligencia artificial.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {['Storyboard IA', 'Multi-Video', 'Narración TTS', 'Exportar'].map((f) => (
                <span
                  key={f}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/60 backdrop-blur-sm"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-white/20">
            &copy; 2026 Kiyoko AI. Todos los derechos reservados.
          </p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="relative flex flex-1 items-center justify-center bg-[#0A0B1E] p-6 lg:bg-background">
        {/* Mobile gradients */}
        <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-[#058B96]/10 blur-[80px] lg:hidden" />
        <div className="absolute -bottom-20 -right-20 h-[250px] w-[250px] rounded-full bg-[#FE6A3C]/10 blur-[60px] lg:hidden" />

        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
