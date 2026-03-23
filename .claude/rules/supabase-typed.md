---
description: Clientes Supabase siempre tipados con Database
globs: ["src/lib/supabase/**/*.ts", "src/lib/queries/**/*.ts", "src/hooks/**/*.ts"]
---

Todos los clientes Supabase DEBEN estar tipados con el tipo `Database` generado.

```tsx
import type { Database } from '@/types/database.types';
createBrowserClient<Database>(url, key);
createServerClient<Database>(url, key, { cookies });
createClient<Database>(url, serviceRoleKey);
```

Tras crear o modificar tablas, regenerar tipos:
```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```
