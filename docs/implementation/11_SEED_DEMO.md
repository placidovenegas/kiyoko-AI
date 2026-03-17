# Fase 11 — Seed Proyecto Demo Domenech

## Estado: PENDIENTE

## Objetivo

Crear los datos completos del proyecto demo "Domenech Peluquerías" en formato JSON y SQL seed, con 28 escenas, 4 personajes, 3 fondos, arco narrativo, timeline y diagnóstico.

## Datos a Seedear

### 11.1 Proyecto
- Título: Domenech Peluquerías
- Estilo: Pixar 3D
- Plataforma: YouTube
- Duración: ~75s
- `is_demo: true`

### 11.2 Personajes (4)
1. José — Director, blazer azul, pelo castaño rojizo
2. Conchi — Estilista senior, jersey rosa, pelo rubio rizado
3. Nerea — Especialista prótesis, chaquetón, moño bajo
4. Raúl — Barbero, camiseta negra, barba cuidada

### 11.3 Fondos (3)
1. REF-EXT — Fachada exterior del salón
2. REF-PELUCAS — Sala de prótesis capilares
3. REF-ESTILISMO — Sala principal de estilismo

### 11.4 Escenas (28 total)
- 9 principales (E1-E9) con prompts imagen
- 4 relleno (R1-R4)
- 12 nuevas (N1-N12) con prompts y notas de dirección
- 3 extra vídeo (V6, V7, V8)

### 11.5 Arco Narrativo (6 fases)
1. Gancho (0-5s)
2. Presentación (5-15s)
3. Servicios (15-35s)
4. Especialidad (35-55s)
5. Transformación (55-65s)
6. CTA (65-75s)

### 11.6 Timeline (15+ entradas)
Con tiempos exactos de 0:00 a 1:25

### 11.7 Diagnóstico
- 3 fortalezas
- 3 advertencias
- 3 sugerencias

## Archivos
- `docs/seed-data/domenech-*.json` — 7 JSONs
- `supabase/migrations/00004_seed_domenech.sql` — SQL seed

## Criterios de Aceptación
- [ ] Todos los datos insertados en Supabase
- [ ] El proyecto demo se renderiza en todas las pestañas
- [ ] Los prompts están completos y correctos
