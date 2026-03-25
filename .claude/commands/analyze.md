---
description: Análisis completo del proyecto. Build, tipos, DB, componentes, dead code, colores hardcoded.
allowed-tools: Bash(npx tsc:*), Bash(npm run:*), Bash(git:*), Read, Glob, Grep, mcp__supabase
context: fork
---

## Análisis completo del proyecto Kiyoko AI

Ejecutar todos estos checks y generar un reporte consolidado:

### 1. Build check
```bash
npm run build 2>&1 | tail -30
```
Reportar: errores de compilación si hay.

### 2. TypeScript strict check
```bash
npx tsc --noEmit 2>&1 | head -50
```
Reportar: errores de tipos.

### 3. Colores hardcoded (violaciones del design system)
```bash
grep -rn "bg-\[#\|text-\[#\|border-\[#" src/components/ src/app/ --include="*.tsx"
```
Reportar: archivos y líneas con colores inline.

### 4. Componentes con "use client" en pages
```bash
grep -rn '"use client"' src/app/ --include="page.tsx" --include="layout.tsx"
```
Reportar: violaciones de la regla Server Components.

### 5. useState + fetch anti-pattern
```bash
grep -rn "useState.*useEffect" src/app/ src/components/ --include="*.tsx" -l
```
Luego verificar si es un patrón fetch → debería ser useQuery.

### 6. Dead exports (componentes no importados)
Para cada componente en `src/components/`, verificar si está importado en algún otro archivo.

### 7. DB sync check
Ejecutar vía MCP:
```sql
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```
Comparar con las tablas referenciadas en `src/types/database.types.ts`.

### 8. RLS check
Ejecutar vía MCP:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false ORDER BY tablename;
```
Reportar tablas sin RLS.

### 9. any types
```bash
grep -rn ": any\|as any" src/ --include="*.ts" --include="*.tsx" | head -30
```
Reportar: archivos con tipos `any`.

## Output

Generar reporte con secciones:
- **Build**: OK / X errores
- **TypeScript**: OK / X errores
- **Design System**: X violaciones de colores
- **Architecture**: X violaciones de Server Components
- **Anti-patterns**: X useState+fetch → migrar a useQuery
- **Dead code**: X componentes sin uso
- **Database**: X tablas, X sin RLS
- **Type safety**: X usos de `any`
- **Recomendaciones**: lista priorizada de acciones
