'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Settings, ChevronDown, Star, Bell, Search, Mail, Eye, Palette, Film, BookOpen, AlertTriangle, Info, CheckCircle2, Layers, Tag, Zap, Maximize2, X, BarChart2, Clapperboard, Wand2 } from 'lucide-react';
import { KSelect } from '@/components/ui/kiyoko-select';
import { Chip } from '@/components/ui/chip';
import { Spinner } from '@/components/ui/spinner';
import { AlertDialogIcon } from '@/components/ui/alert-dialog';
import { MultiSelect } from '@/components/ui/multi-select';
import { TagInput } from '@/components/ui/tag-input';
import { ChatMessage, ChatAvatar, TypingIndicator, ChatContainer } from '@/components/ui/chat-bubble';
import { ChatInput, type ChatContextItem } from '@/components/ui/chat-input';
import { ChatPanel, type ChatPanelMessage, type ChatContextItem as PanelCtxItem } from '@/components/ui/chat-panel';
import { toast } from '@/components/ui/toast';
import { KiyokoIcon, KiyokoWordmark } from '@/components/ui/logo';
import { cn } from '@/lib/utils/cn';

/* ── Section wrapper ─────────────────────────────────────── */
function Section({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('space-y-5', className)}>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {label && <p className="text-xs text-muted-foreground">{label}</p>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────── */
export function ComponentsShowcase() {
  const [selectVal, setSelectVal] = useState('');
  const [switchOn, setSwitchOn] = useState(false);
  const [sliderVal, setSliderVal] = useState([40]);
  const [sliderRange, setSliderRange] = useState([20, 80]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [progress] = useState(68);
  const [multiVal, setMultiVal] = useState<string[]>(['cinematico']);
  const [tags, setTags] = useState<string[]>(['react', 'nextjs']);
  const [tagsColor, setTagsColor] = useState<string[]>(['motion']);

  // Chat demo
  const [chatMessages, setChatMessages] = useState<ChatPanelMessage[]>([
    { id: '1', role: 'ai',   content: 'Hola! Soy Kiyoko. ¿En qué te puedo ayudar hoy?',                                                                   timestamp: '10:30' },
    { id: '2', role: 'user', content: 'Quiero cambiar la escena 3',                                                                                           timestamp: '10:31' },
    { id: '3', role: 'ai',   content: 'Claro, ¿qué quieres cambiar de la escena 3? Puedo modificar el prompt, la duración o los personajes.',               timestamp: '10:31' },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatContext: PanelCtxItem[] = [
    { type: 'project', label: 'Spot Verano 2026' },
    { type: 'video',   label: 'Video principal' },
    { type: 'scene',   label: 'Escena 3' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl space-y-14 px-6 py-12">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Design System</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todos los componentes UI con sus variaciones · <code className="text-xs">/components</code>
          </p>
        </div>

        <Separator />

        {/* ── Button — variant × color ── */}
        <Section title="Button · Variants">
          {(['solid', 'flat', 'bordered', 'light', 'faded', 'ghost'] as const).map((v) => (
            <Row key={v} label={v}>
              {(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const).map((c) => (
                <Button key={c} variant={v} color={c}>{c}</Button>
              ))}
            </Row>
          ))}
        </Section>

        <Separator />

        {/* ── Button — sizes ── */}
        <Section title="Button · Sizes & Radius">
          <Row label="Sizes">
            <Button size="xs">XSmall</Button>
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row label="Radius">
            <Button radius="none" variant="bordered" color="primary">None</Button>
            <Button radius="sm"   variant="bordered" color="primary">SM</Button>
            <Button radius="md"   variant="bordered" color="primary">MD</Button>
            <Button radius="lg"   variant="bordered" color="primary">LG</Button>
            <Button radius="full" variant="bordered" color="primary">Full</Button>
          </Row>
          <Row label="Full width">
            <div className="w-full max-w-xs">
              <Button fullWidth color="primary">Full width</Button>
            </div>
          </Row>
        </Section>

        <Separator />

        {/* ── Button — states ── */}
        <Section title="Button · States & Content">
          <Row label="Loading">
            <Button isLoading color="primary">Saving...</Button>
            <Button isLoading variant="flat" color="danger">Deleting...</Button>
            <Button isLoading variant="bordered" color="success">Generating</Button>
          </Row>
          <Row label="With icons">
            <Button color="primary" startContent={<Plus />}>Nuevo</Button>
            <Button variant="flat" color="danger" endContent={<Trash2 />}>Eliminar</Button>
            <Button variant="bordered" color="default" startContent={<Settings />}>Ajustes</Button>
          </Row>
          <Row label="Icon only">
            <Button isIconOnly size="xs" variant="flat" color="default"><Bell /></Button>
            <Button isIconOnly size="sm" variant="flat" color="primary"><Plus /></Button>
            <Button isIconOnly size="md" variant="bordered" color="danger"><Trash2 /></Button>
            <Button isIconOnly size="lg" color="primary"><Star /></Button>
          </Row>
          <Row label="Disabled">
            <Button disabled color="primary">Disabled solid</Button>
            <Button disabled variant="bordered" color="danger">Disabled bordered</Button>
          </Row>
        </Section>

        <Separator />

        {/* ── Badge ── */}
        <Section title="Badge · Variants">
          {(['solid', 'flat', 'faded', 'shadow'] as const).map((v) => (
            <Row key={v} label={v}>
              {(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const).map((c) => (
                <Badge key={c} variant={v} color={c}>{c}</Badge>
              ))}
            </Row>
          ))}
          <Row label="Sizes">
            <Badge size="sm" color="primary">Small</Badge>
            <Badge size="md" color="primary">Medium</Badge>
            <Badge size="lg" color="primary">Large</Badge>
          </Row>
          <Row label="Radius">
            <Badge radius="none" variant="faded" color="primary">None</Badge>
            <Badge radius="sm"   variant="faded" color="primary">SM</Badge>
            <Badge radius="md"   variant="faded" color="primary">MD</Badge>
            <Badge radius="lg"   variant="faded" color="primary">LG</Badge>
            <Badge radius="full" variant="faded" color="primary">Full</Badge>
          </Row>
        </Section>

        <Separator />

        {/* ── StatusBadge ── */}
        <Section title="StatusBadge">
          <Row>
            <StatusBadge status="draft" />
            <StatusBadge status="prompt_ready" />
            <StatusBadge status="generating" />
            <StatusBadge status="generated" />
            <StatusBadge status="approved" />
            <StatusBadge status="rejected" />
            <StatusBadge status="in_progress" />
            <StatusBadge status="completed" />
            <StatusBadge status="archived" />
          </Row>
          <Row label="Without dot">
            <StatusBadge status="draft" showDot={false} />
            <StatusBadge status="in_progress" showDot={false} />
            <StatusBadge status="completed" showDot={false} />
          </Row>
        </Section>

        <Separator />

        {/* ── Input ── */}
        <Section title="Input · Variants">
          {(['flat', 'bordered', 'underlined', 'faded'] as const).map((v) => (
            <Row key={v} label={v}>
              <Input variant={v} placeholder="Placeholder..." className="w-64" />
              <Input variant={v} color="primary" placeholder="Primary color" className="w-64" />
            </Row>
          ))}
          <Row label="With label & description">
            <Input
              variant="bordered"
              label="Nombre del proyecto"
              description="Puedes cambiarlo después"
              placeholder="Mi proyecto..."
              className="w-72"
            />
          </Row>
          <Row label="Error state">
            <Input
              variant="bordered"
              color="danger"
              isInvalid
              errorMessage="Este campo es obligatorio"
              placeholder="Campo inválido"
              className="w-72"
            />
          </Row>
          <Row label="With icons">
            <Input variant="bordered" startContent={<Search className="size-4" />} placeholder="Buscar..." className="w-64" />
            <Input variant="bordered" startContent={<Mail className="size-4" />} endContent={<Eye className="size-4" />} placeholder="Email" className="w-64" />
          </Row>
          <Row label="Sizes">
            <Input size="sm" variant="bordered" placeholder="Small" className="w-40" />
            <Input size="md" variant="bordered" placeholder="Medium" className="w-40" />
            <Input size="lg" variant="bordered" placeholder="Large" className="w-40" />
          </Row>
          <Row label="Disabled">
            <Input variant="bordered" disabled placeholder="Disabled" className="w-48" />
          </Row>
        </Section>

        <Separator />

        {/* ── Textarea ── */}
        <Section title="Textarea">
          <Row>
            <Textarea placeholder="Escribe aquí..." className="w-full max-w-sm" rows={3} />
          </Row>
        </Section>

        <Separator />

        {/* ── Tabs ── */}
        <Section title="Tabs · Variants">
          {(['solid', 'light', 'underlined', 'bordered'] as const).map((v) => (
            <div key={v} className="space-y-2">
              <p className="text-xs text-muted-foreground">{v}</p>
              <Tabs defaultValue="tab1" variant={v}>
                <TabsList>
                  <TabsTrigger value="tab1" icon={<Layers className="size-3.5" />}>General</TabsTrigger>
                  <TabsTrigger value="tab2">Avanzado</TabsTrigger>
                  <TabsTrigger value="tab3">Ajustes</TabsTrigger>
                </TabsList>
                <TabsContent value="tab1">
                  <div className="mt-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">General</div>
                </TabsContent>
                <TabsContent value="tab2">
                  <div className="mt-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Avanzado</div>
                </TabsContent>
                <TabsContent value="tab3">
                  <div className="mt-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Ajustes</div>
                </TabsContent>
              </Tabs>
            </div>
          ))}

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Colors (underlined)</p>
            <div className="flex flex-wrap gap-6">
              {(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const).map((c) => (
                <Tabs key={c} defaultValue="a" variant="underlined" color={c} size="sm">
                  <TabsList>
                    <TabsTrigger value="a">{c}</TabsTrigger>
                    <TabsTrigger value="b">Tab 2</TabsTrigger>
                  </TabsList>
                </Tabs>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Colors (solid)</p>
            <div className="flex flex-wrap gap-6">
              {(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const).map((c) => (
                <Tabs key={c} defaultValue="a" variant="solid" color={c} size="sm">
                  <TabsList>
                    <TabsTrigger value="a">{c}</TabsTrigger>
                    <TabsTrigger value="b">Tab 2</TabsTrigger>
                  </TabsList>
                </Tabs>
              ))}
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── Select ── */}
        <Section title="Select · KSelect">
          {(['flat', 'bordered', 'underlined', 'faded'] as const).map((v) => (
            <Row key={v} label={v}>
              <KSelect
                variant={v}
                value={selectVal}
                onChange={setSelectVal}
                placeholder="Elige un estilo..."
                className="w-64"
                options={[
                  { value: 'cinematico', label: 'Cinematográfico', description: 'Estilo de película profesional', icon: <Film className="size-4" /> },
                  { value: 'documental', label: 'Documental', icon: <BookOpen className="size-4" /> },
                  { value: 'artistico',  label: 'Artístico', icon: <Palette className="size-4" /> },
                ]}
              />
              <KSelect
                variant={v}
                color="primary"
                value={selectVal}
                onChange={setSelectVal}
                placeholder="Primary color..."
                className="w-56"
                options={[
                  { value: 'a', label: 'Opción A' },
                  { value: 'b', label: 'Opción B' },
                  { value: 'c', label: 'Opción C' },
                ]}
              />
            </Row>
          ))}
          <Row label="With label & description">
            <KSelect
              variant="bordered"
              label="Estilo de video"
              description="Elige el estilo visual para tu proyecto"
              value={selectVal}
              onChange={setSelectVal}
              placeholder="Seleccionar estilo..."
              className="w-72"
              options={[
                { value: 'cinematico', label: 'Cinematográfico' },
                { value: 'documental', label: 'Documental' },
                { value: 'artistico',  label: 'Artístico', disabled: true },
              ]}
            />
          </Row>
          <Row label="Error state">
            <KSelect
              variant="bordered"
              color="danger"
              isInvalid
              errorMessage="Debes seleccionar una opción"
              label="Campo requerido"
              isRequired
              value=""
              onChange={setSelectVal}
              placeholder="Obligatorio..."
              className="w-72"
              options={[
                { value: 'a', label: 'Opción A' },
                { value: 'b', label: 'Opción B' },
              ]}
            />
          </Row>
          <Row label="Sizes">
            {(['sm', 'md', 'lg'] as const).map((s) => (
              <KSelect
                key={s}
                size={s}
                variant="bordered"
                value={selectVal}
                onChange={setSelectVal}
                placeholder={s}
                className="w-36"
                options={[{ value: 'a', label: 'Opción A' }, { value: 'b', label: 'Opción B' }]}
              />
            ))}
          </Row>
          <Row label="Colors · solid selection">
            {(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const).map((c) => (
              <KSelect
                key={c}
                color={c}
                variant="bordered"
                value="a"
                onChange={setSelectVal}
                className="w-36"
                options={[{ value: 'a', label: c }]}
              />
            ))}
          </Row>
        </Section>

        <Separator />

        {/* ── Switch & Progress ── */}
        <Section title="Controls">
          <Row label="Switch">
            <div className="flex items-center gap-3">
              <Switch checked={switchOn} onCheckedChange={setSwitchOn} id="sw1" />
              <label htmlFor="sw1" className="text-sm text-foreground cursor-pointer">
                {switchOn ? 'Activado' : 'Desactivado'}
              </label>
            </div>
          </Row>
          <Row label="Progress">
            <div className="w-64 space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">{progress}% completado</p>
            </div>
          </Row>
        </Section>

        <Separator />

        {/* ── Slider ── */}
        <Section title="Slider · Colors & Sizes">
          <Row label="Colors">
            {(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const).map((c) => (
              <div key={c} className="w-48">
                <Slider color={c} defaultValue={[55]} label={c} showValue />
              </div>
            ))}
          </Row>
          <Row label="Sizes">
            <div className="w-64 space-y-4">
              <Slider size="sm" color="primary" defaultValue={[30]} label="Small" showValue />
              <Slider size="md" color="primary" defaultValue={[55]} label="Medium" showValue />
              <Slider size="lg" color="primary" defaultValue={[75]} label="Large" showValue />
            </div>
          </Row>
          <Row label="Range (two thumbs)">
            <div className="w-72">
              <Slider
                color="primary"
                value={sliderRange}
                onValueChange={setSliderRange}
                min={0} max={100} step={1}
                label="Rango de tiempo"
                showValue
                formatValue={(v) => `${v}s`}
              />
            </div>
          </Row>
          <Row label="Interactive">
            <div className="w-64">
              <Slider
                color="secondary"
                value={sliderVal}
                onValueChange={setSliderVal}
                min={0} max={100} step={1}
                label="Volumen"
                showValue
                formatValue={(v) => `${v}%`}
              />
            </div>
          </Row>
        </Section>

        <Separator />

        {/* ── MultiSelect ── */}
        <Section title="MultiSelect · Multi-selection dropdown">
          <Row label="Variants">
            {(['flat', 'bordered', 'faded'] as const).map((v) => (
              <MultiSelect
                key={v}
                variant={v}
                value={multiVal}
                onChange={setMultiVal}
                placeholder={`Variante ${v}...`}
                className="w-64"
                options={[
                  { value: 'cinematico',  label: 'Cinematográfico', icon: <Film className="size-4" /> },
                  { value: 'documental',  label: 'Documental',      icon: <BookOpen className="size-4" /> },
                  { value: 'artistico',   label: 'Artístico',       icon: <Palette className="size-4" /> },
                  { value: 'corporativo', label: 'Corporativo' },
                ]}
              />
            ))}
          </Row>
          <Row label="Searchable">
            <MultiSelect
              searchable
              variant="bordered"
              color="primary"
              value={multiVal}
              onChange={setMultiVal}
              placeholder="Buscar estilos..."
              label="Estilos de video"
              description="Selecciona uno o varios"
              className="w-72"
              options={[
                { value: 'cinematico',  label: 'Cinematográfico' },
                { value: 'documental',  label: 'Documental' },
                { value: 'artistico',   label: 'Artístico' },
                { value: 'corporativo', label: 'Corporativo' },
                { value: 'animacion',   label: 'Animación' },
                { value: 'timelapse',   label: 'Timelapse', disabled: true },
              ]}
            />
          </Row>
          <Row label="Colors">
            {(['primary', 'success', 'warning', 'danger'] as const).map((c) => (
              <MultiSelect
                key={c}
                color={c}
                variant="bordered"
                value={['a']}
                onChange={() => {}}
                className="w-40"
                options={[{ value: 'a', label: c }, { value: 'b', label: 'Opción B' }]}
              />
            ))}
          </Row>
        </Section>

        <Separator />

        {/* ── TagInput ── */}
        <Section title="TagInput · Type & press Enter">
          <Row label="Variants">
            {(['bordered', 'flat', 'faded'] as const).map((v) => (
              <TagInput
                key={v}
                variant={v}
                value={tags}
                onChange={setTags}
                placeholder={`Variante ${v}...`}
                className="w-64"
              />
            ))}
          </Row>
          <Row label="Colors">
            {(['primary', 'secondary', 'success', 'danger'] as const).map((c) => (
              <TagInput
                key={c}
                color={c}
                variant="bordered"
                value={tagsColor}
                onChange={setTagsColor}
                placeholder={`Color ${c}...`}
                className="w-48"
              />
            ))}
          </Row>
          <Row label="With label & maxTags">
            <TagInput
              variant="bordered"
              color="primary"
              label="Etiquetas del proyecto"
              description="Máximo 5 etiquetas. Pulsa Enter o coma para añadir."
              maxTags={5}
              value={tags}
              onChange={setTags}
              className="w-80"
            />
          </Row>
          <Row label="With validation">
            <TagInput
              variant="bordered"
              color="warning"
              label="Solo letras"
              validate={(tag) => /^[a-zA-Z]+$/.test(tag)}
              value={tagsColor}
              onChange={setTagsColor}
              placeholder="Solo letras (sin números)..."
              className="w-64"
            />
          </Row>
        </Section>

        <Separator />

        {/* ── Chat Panel ── */}
        <Section title="Chat · Panel completo">
          <div className="flex flex-wrap gap-8">

            {/* ── Live demo ── */}
            <div className="w-80 overflow-hidden rounded-2xl border border-border shadow-lg" style={{ height: 560 }}>
              <ChatPanel
                title="Kiyoko AI"
                subtitle="Tu directora de video"
                messages={chatMessages as ChatPanelMessage[]}
                isLoading={chatLoading}
                suggestions={chatLoading ? [] : ['Cambiar ángulo de cámara', 'Agregar personajes', 'Modificar iluminación']}
                context={chatContext as PanelCtxItem[]}
                allowFiles
                onSend={(msg, files) => {
                  if (!msg && files.length === 0) return;
                  const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
                  setChatMessages(prev => [...prev, { role: 'user', content: msg || `${files.length} archivo(s)`, timestamp: now, id: String(Date.now()) }]);
                  setChatLoading(true);
                  setTimeout(() => {
                    setChatMessages(prev => [...prev, {
                      id: String(Date.now()),
                      role: 'ai',
                      content: 'Entendido! Voy a procesar tu solicitud ahora mismo.',
                      timestamp: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
                    }]);
                    setChatLoading(false);
                  }, 1800);
                }}
                onStop={() => setChatLoading(false)}
                onSuggestionClick={(s) => {
                  const now = new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
                  setChatMessages(prev => [...prev, { id: String(Date.now()), role: 'user', content: s, timestamp: now }]);
                  setChatLoading(true);
                  setTimeout(() => {
                    setChatMessages(prev => [...prev, { id: String(Date.now()+1), role: 'ai', content: 'Perfecto, trabajando en eso...', timestamp: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) }]);
                    setChatLoading(false);
                  }, 1500);
                }}
                onNewChat={() => setChatMessages([])}
                quickActions={[
                  { icon: <BarChart2 className="size-3.5 shrink-0" />, label: 'Analizar video',    prompt: 'Analiza el video actual y dame un resumen.' },
                  { icon: <Clapperboard className="size-3.5 shrink-0" />, label: 'Generar escenas', prompt: 'Genera escenas para este proyecto.' },
                  { icon: <Wand2 className="size-3.5 shrink-0" />, label: 'Mejorar prompts',       prompt: 'Mejora todos los prompts del proyecto.' },
                  { icon: <Layers className="size-3.5 shrink-0" />, label: 'Ver estado',            prompt: 'Dame el estado actual del proyecto.' },
                ]}
              />
            </div>

            {/* ── Empty state demo ── */}
            <div className="w-80 overflow-hidden rounded-2xl border border-border shadow-lg" style={{ height: 560 }}>
              <ChatPanel
                title="Kiyoko AI"
                subtitle="Sin proyecto activo"
                messages={[]}
                isLoading={false}
                onSend={() => {}}
                quickActions={[
                  { icon: <BarChart2 className="size-3.5 shrink-0" />, label: 'Analizar video',    prompt: '' },
                  { icon: <Clapperboard className="size-3.5 shrink-0" />, label: 'Generar escenas', prompt: '' },
                  { icon: <Wand2 className="size-3.5 shrink-0" />, label: 'Mejorar prompts',       prompt: '' },
                  { icon: <Layers className="size-3.5 shrink-0" />, label: 'Ver estado',            prompt: '' },
                ]}
              />
            </div>

          </div>

          {/* Primitives */}
          <Row label="Avatars">
            <ChatAvatar name="Pedro García" size="xs" />
            <ChatAvatar name="Pedro García" size="sm" />
            <ChatAvatar name="Admin" size="md" />
            <ChatAvatar name="Admin" size="lg" />
            <ChatAvatar src="https://i.pravatar.cc/40?img=3" size="md" />
          </Row>
          <Row label="Typing indicator">
            <div className="inline-flex rounded-2xl rounded-tl-md border border-border bg-card px-3.5 py-2.5">
              <TypingIndicator />
            </div>
          </Row>
        </Section>

        <Separator />

        {/* ── Toast ── */}
        <Section title="Toast · Notifications">
          <Row label="Types">
            <Button
              variant="flat" color="success"
              startContent={<CheckCircle2 className="size-4" />}
              onClick={() => toast.success('Proyecto guardado correctamente', { description: 'Los cambios se han guardado en la nube.' })}
            >
              Success
            </Button>
            <Button
              variant="flat" color="danger"
              startContent={<Trash2 className="size-4" />}
              onClick={() => toast.error('Error al eliminar', { description: 'No se pudo conectar con el servidor.' })}
            >
              Error
            </Button>
            <Button
              variant="flat" color="warning"
              startContent={<AlertTriangle className="size-4" />}
              onClick={() => toast.warning('Cambios sin guardar', { description: 'Guarda antes de salir.' })}
            >
              Warning
            </Button>
            <Button
              variant="flat" color="primary"
              startContent={<Info className="size-4" />}
              onClick={() => toast.info('Nueva funcionalidad disponible', { description: 'Revisa el changelog para más detalles.' })}
            >
              Info
            </Button>
          </Row>
          <Row label="Loading & Promise">
            <Button
              variant="bordered" color="default"
              startContent={<Spinner size="xs" color="primary" />}
              onClick={() => toast.loading('Generando storyboard...', { duration: 3000 })}
            >
              Loading
            </Button>
            <Button
              variant="bordered" color="primary"
              onClick={() => {
                toast.promise(
                  new Promise((res) => setTimeout(res, 2000)),
                  {
                    loading: 'Exportando video...',
                    success: 'Video exportado correctamente',
                    error: 'Error al exportar',
                  }
                );
              }}
            >
              Promise
            </Button>
          </Row>
        </Section>

        <Separator />

        {/* ── Skeleton ── */}
        <Section title="Skeleton">
          <div className="space-y-2 max-w-xs">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </Section>

        <Separator />

        {/* ── Tooltip ── */}
        <Section title="Tooltip">
          <Row>
            <Tooltip>
              <TooltipTrigger render={<Button variant="bordered" color="default" />}>
                Hover me
              </TooltipTrigger>
              <TooltipContent>Esto es un tooltip</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<Button isIconOnly variant="light" color="default" />}>
                <Star className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent side="right">Añadir a favoritos</TooltipContent>
            </Tooltip>
          </Row>
        </Section>

        <Separator />

        {/* ── Dropdown ── */}
        <Section title="Dropdown Menu">
          <Row>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="bordered" color="default" endContent={<ChevronDown />}>
                  Opciones
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem><Plus className="h-4 w-4" /> Nuevo</DropdownMenuItem>
                <DropdownMenuItem><Settings className="h-4 w-4" /> Ajustes</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Row>
        </Section>

        <Separator />

        {/* ── AlertDialog ── */}
        <Section title="AlertDialog">
          <Row>
            {/* Danger */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="flat" color="danger" startContent={<Trash2 />}>Eliminar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogIcon color="danger"><Trash2 className="size-5" /></AlertDialogIcon>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminarán todos los videos, escenas y archivos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Warning */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="flat" color="warning" startContent={<AlertTriangle />}>Advertencia</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogIcon color="warning"><AlertTriangle className="size-5" /></AlertDialogIcon>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tienes cambios pendientes. Si sales ahora perderás todos los cambios realizados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Quedarme</AlertDialogCancel>
                  <AlertDialogAction className="bg-warning-500 hover:bg-warning-600">Salir sin guardar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Info */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="flat" color="primary" startContent={<Info />}>Info</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogIcon color="primary"><Info className="size-5" /></AlertDialogIcon>
                <AlertDialogHeader>
                  <AlertDialogTitle>Nueva funcionalidad</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hemos añadido nuevas herramientas de análisis de video. Puedes encontrarlas en el menú de herramientas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Más tarde</AlertDialogCancel>
                  <AlertDialogAction className="bg-primary-500 hover:bg-primary-600">Explorar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Row>
        </Section>

        <Separator />

        {/* ── ConfirmDialog ── */}
        <Section title="ConfirmDialog (custom)">
          <Row label="Fixed overlay (z-70, por encima de todo)">
            <Button variant="bordered" color="default" onClick={() => setConfirmOpen(true)}>
              Abrir ConfirmDialog
            </Button>
            <ConfirmDialog
              open={confirmOpen}
              title="¿Eliminar este elemento?"
              description="Esta acción no se puede deshacer."
              actions={[
                { label: 'Sí, eliminar', variant: 'danger', onClick: () => setConfirmOpen(false) },
                { label: 'Cancelar',     variant: 'ghost',  onClick: () => setConfirmOpen(false) },
              ]}
            />
          </Row>
        </Section>

        <Separator />

        {/* ── Chip ── */}
        <Section title="Chip · Variants">
          {(['solid', 'flat', 'faded', 'bordered', 'dot'] as const).map((v) => (
            <Row key={v} label={v}>
              {(['default', 'primary', 'secondary', 'success', 'warning', 'danger'] as const).map((c) => (
                <Chip key={c} variant={v} color={c}>{c}</Chip>
              ))}
            </Row>
          ))}
          <Row label="Sizes">
            <Chip size="sm" color="primary">Small</Chip>
            <Chip size="md" color="primary">Medium</Chip>
            <Chip size="lg" color="primary">Large</Chip>
          </Row>
          <Row label="Dismissible">
            <Chip color="primary" onClose={() => {}}>Cinematográfico</Chip>
            <Chip color="success" variant="faded" onClose={() => {}}>Aprobado</Chip>
            <Chip color="danger" variant="bordered" onClose={() => {}}>Eliminar</Chip>
          </Row>
          <Row label="With icons">
            <Chip color="primary" startContent={<Film className="size-3" />}>Video</Chip>
            <Chip color="secondary" startContent={<Tag className="size-3" />}>Tag</Chip>
            <Chip color="warning" variant="faded" startContent={<Zap className="size-3" />}>AI</Chip>
          </Row>
        </Section>

        <Separator />

        {/* ── Spinner ── */}
        <Section title="Spinner · Loading">
          <Row label="Colors">
            {(['default', 'primary', 'secondary', 'success', 'warning', 'danger', 'current'] as const).map((c) => (
              <Spinner key={c} color={c} />
            ))}
          </Row>
          <Row label="Sizes">
            <Spinner size="xs" color="primary" />
            <Spinner size="sm" color="primary" />
            <Spinner size="md" color="primary" />
            <Spinner size="lg" color="primary" />
            <Spinner size="xl" color="primary" />
          </Row>
          <Row label="With label">
            <Spinner color="primary" label="Cargando..." />
            <Spinner color="success" size="lg" label="Generando video" />
          </Row>
        </Section>

        <Separator />

        {/* ── Colors ── */}
        <Section title="Color Tokens">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { name: 'background',  cls: 'bg-background border border-border' },
              { name: 'card',        cls: 'bg-card border border-border' },
              { name: 'primary',     cls: 'bg-primary' },
              { name: 'secondary',   cls: 'bg-secondary' },
              { name: 'muted',       cls: 'bg-muted' },
              { name: 'border',      cls: 'bg-border' },
              { name: 'destructive', cls: 'bg-destructive' },
              { name: 'teal-500',    cls: 'bg-teal-500' },
            ].map((c) => (
              <div key={c.name} className="space-y-1.5">
                <div className={cn('h-12 rounded-lg', c.cls)} />
                <p className="text-xs text-muted-foreground font-mono">{c.name}</p>
              </div>
            ))}
          </div>
        </Section>

        <Separator />

        {/* ── Logo ── */}
        <Section title="Logo · Kiyoko Icon">
          <Row label="Icon — sizes">
            <KiyokoIcon size={12} className="text-foreground" />
            <KiyokoIcon size={16} className="text-foreground" />
            <KiyokoIcon size={20} className="text-foreground" />
            <KiyokoIcon size={28} className="text-foreground" />
            <KiyokoIcon size={40} className="text-foreground" />
            <KiyokoIcon size={56} className="text-foreground" />
          </Row>
          <Row label="Icon — colors">
            <KiyokoIcon size={28} className="text-primary-500" />
            <KiyokoIcon size={28} className="text-secondary-500" />
            <KiyokoIcon size={28} className="text-success-500" />
            <KiyokoIcon size={28} className="text-warning-500" />
            <KiyokoIcon size={28} className="text-danger-500" />
            <KiyokoIcon size={28} className="text-muted-foreground" />
          </Row>
          <Row label="Wordmark">
            <KiyokoWordmark size={20} className="text-foreground" textClassName="text-base" />
            <KiyokoWordmark size={28} className="text-primary-500" textClassName="text-lg text-foreground" />
            <KiyokoWordmark size={36} className="text-foreground" textClassName="text-2xl" showText={false} />
          </Row>
          <Row label="On colored backgrounds">
            <span className="inline-flex items-center gap-2 rounded-xl bg-primary-500 px-4 py-2.5">
              <KiyokoIcon size={20} className="text-white" />
              <span className="text-sm font-semibold text-white">Kiyoko AI</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-default-900 px-4 py-2.5">
              <KiyokoIcon size={20} className="text-white" />
              <span className="text-sm font-semibold text-white">Kiyoko AI</span>
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 shadow-sm">
              <KiyokoIcon size={20} className="text-default-900" />
              <span className="text-sm font-semibold text-default-900">Kiyoko AI</span>
            </span>
          </Row>
        </Section>

        <Separator />

        {/* ── Typography ── */}
        <Section title="Typography">
          <div className="space-y-3">
            <p className="text-2xl font-bold text-foreground">Heading 2xl bold</p>
            <p className="text-xl font-semibold text-foreground">Heading xl semibold</p>
            <p className="text-lg font-semibold text-foreground">Heading lg semibold</p>
            <p className="text-base font-medium text-foreground">Body base medium</p>
            <p className="text-sm text-foreground">Body sm regular</p>
            <p className="text-sm text-muted-foreground">Body sm muted</p>
            <p className="text-xs text-muted-foreground">Caption xs muted</p>
            <p className="text-xs font-mono text-muted-foreground">Mono xs · code snippet</p>
          </div>
        </Section>

      </div>
    </div>
  );
}
