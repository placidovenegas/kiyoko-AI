---
description: Resumen del estado actual del proyecto. Qué funciona, qué falta, qué está roto.
allowed-tools: Bash(git:*), Bash(npm:*), Read
context: fork
---

## Analiza el estado actual

1. Leer `git status` y `git log --oneline -10`
2. Verificar que `npm run build` compila sin errores
3. Contar páginas existentes en `src/app/`
4. Comparar con las rutas definidas en `docs/new_implementacion/app_architecture_v4.md`
5. Listar qué falta por crear

## Output

Generar un resumen con:
- Archivos modificados sin commit
- Páginas que existen vs las que faltan
- Errores de build si los hay
- Próximos pasos recomendados
