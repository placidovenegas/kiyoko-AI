---
name: kiyoko-dark-ui
description: Sistema visual para paneles, modales y controles oscuros estilo Kiyoko IA. Usar cuando haya que diseñar drawers, botones, bordes, radios y superficies con acabado profesional dark-first.
---

# Skill: Kiyoko Dark UI

## Objetivo

Aplicar un lenguaje visual oscuro, limpio y profesional inspirado en el panel de IA de Kiyoko: superficies casi negras, bordes sutiles, contraste controlado, radios moderados y jerarquía clara.

## Principios

1. Dark-first real: el fondo principal debe sentirse negro suave, no gris lavado.
2. Bordes finos: usar siempre border con border-border, sin dobles marcos ni contrastes agresivos.
3. Radios contenidos: por defecto usar rounded-md en controles y rounded-lg o rounded-xl en paneles. Evitar rounded-2xl salvo casos muy justificados.
4. CTA sobrios: acción principal oscura y sólida; secundarias neutras con borde.
5. Estructura limpia: header simple, cuerpo claro, aside de contexto y footer corto.

## Paleta recomendada

Usar siempre tokens, no hex hardcoded en componentes.

- Fondo app: background
- Fondo panel: card
- Fondo elevado: popover
- Borde: border
- Superficie secundaria: accent o secondary
- Texto principal: foreground
- Texto secundario: muted-foreground
- Acción principal: foreground sobre background o primary cuando la acción deba destacar más

## Botones

### Primario profesional

Usar para confirmar, crear o avanzar.

```tsx
<Button variant="primary" className="kiyoko-panel-primary-button" />
```

### Secundario profesional

Usar para cancelar, limpiar, abrir opciones no críticas.

```tsx
<Button variant="secondary" className="kiyoko-panel-secondary-button" />
```

### Reglas

1. No usar pills por defecto.
2. No usar esquinas muy redondeadas en botones pequeños.
3. No usar degradados de color salvo en marketing.

## Paneles y drawers

Base recomendada:

```tsx
<ModalShell
  dialogClassName="sm:max-w-[min(880px,100vw)]"
  title="..."
  description="..."
/>
```

Secciones internas:

```tsx
<section className="kiyoko-panel-section">...</section>
<div className="kiyoko-panel-section-muted">...</div>
```

Chip superior:

```tsx
<div className="kiyoko-panel-chip">...</div>
```

## Campos

En HeroUI usar TextField, Input, TextArea y Select con superficies neutras:

```tsx
<TextField variant="secondary" className="[&_input]:bg-background [&_input]:border-border [&_input]:shadow-none">
```

```tsx
<TextField variant="secondary" className="[&_textarea]:bg-background [&_textarea]:border-border [&_textarea]:shadow-none">
```

```tsx
<Select className="[&_[data-slot='trigger']]:bg-background [&_[data-slot='trigger']]:border-border [&_[data-slot='trigger']]:shadow-none">
```

## No hacer

1. No usar rounded-[24px] como norma general.
2. No usar sombras muy visibles en cada bloque.
3. No mezclar varios colores fuertes en un mismo panel.
4. No convertir drawers en modales centrados maquillados.
5. No usar botones secundarios con look lavado o demasiado brillante.

## Composición objetivo

El panel debe sentirse como una extensión del chat de IA del navbar: oscuro, técnico, ordenado y silencioso visualmente.