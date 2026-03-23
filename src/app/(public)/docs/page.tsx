import Link from 'next/link';
import {
  Layers, Sparkles, Video, Mic, FileText, Settings,
  BookOpen, ArrowRight,
} from 'lucide-react';

const SECTIONS = [
  {
    icon: BookOpen,
    title: 'Primeros Pasos',
    description: 'Crea tu primer proyecto y aprende los conceptos básicos.',
    items: [
      'Crear una cuenta',
      'Tu primer proyecto',
      'Añadir escenas al storyboard',
      'Generar prompts con IA',
    ],
  },
  {
    icon: Layers,
    title: 'Storyboard',
    description: 'Domina las tres vistas del storyboard y la edición de escenas.',
    items: [
      'Vista compacta, grid y timeline',
      'Arco narrativo integrado',
      'Drag & drop para reordenar',
      'Edición inline de campos',
    ],
  },
  {
    icon: Sparkles,
    title: 'Inteligencia Artificial',
    description: 'Aprovecha la IA para generar prompts, guiones y más.',
    items: [
      'Generación de prompts de imagen',
      'Generación de prompts de video',
      'Chat IA contextual',
      'Descripciones bilingües',
    ],
  },
  {
    icon: Video,
    title: 'Multi-Video',
    description: 'Gestiona múltiples videos dentro de un mismo proyecto.',
    items: [
      'Crear y duplicar videos',
      'Selector de video en header',
      'Copiar escenas entre videos',
      'Plataformas y aspect ratios',
    ],
  },
  {
    icon: Mic,
    title: 'Narración y Voz',
    description: 'Genera narración con IA y audio con ElevenLabs.',
    items: [
      'Diálogos en cámara vs voz en off',
      'Selección de voces',
      'Estilos de narración',
      'Generación de audio',
    ],
  },
  {
    icon: FileText,
    title: 'Exportar',
    description: 'Exporta tu trabajo en múltiples formatos.',
    items: [
      'PDF del storyboard',
      'HTML interactivo',
      'JSON de datos',
      'Markdown del guión',
    ],
  },
] as const;

export default function DocsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Documentación</h1>
      <p className="mt-3 text-muted-foreground">
        Aprende a usar Kiyoko AI para crear storyboards profesionales con inteligencia artificial.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {SECTIONS.map((s) => (
          <div
            key={s.title}
            className="rounded-xl border border-border bg-card p-6"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold">{s.title}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{s.description}</p>
            <ul className="mt-4 space-y-1.5">
              {s.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <ArrowRight className="h-3 w-3 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-xl border border-border bg-card p-8 text-center">
        <h2 className="text-xl font-bold">¿Necesitas ayuda?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Usa el Chat IA dentro de la app para obtener asistencia contextual en tiempo real.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          Empezar ahora
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
