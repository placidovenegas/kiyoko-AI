---
description: Prevenir "use client" en page.tsx y layout.tsx
globs: ["src/app/**/page.tsx", "src/app/**/layout.tsx"]
---

NUNCA añadir `"use client"` en este archivo. Los `page.tsx` y `layout.tsx` son Server Components.

Si necesitas interactividad, crea un Client Component separado en `src/components/` e impórtalo aquí.

Patrón correcto:
```tsx
// page.tsx (Server Component)
import { ClientView } from '@/components/nombre/ClientView';
export default async function Page({ params }) {
  const data = await fetchData(params);
  return <ClientView data={data} />;
}
```
