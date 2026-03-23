---
description: En Next.js 15, params y searchParams son Promises
globs: ["src/app/**/page.tsx", "src/app/**/layout.tsx"]
---

En Next.js 15, `params` y `searchParams` son `Promise`. Siempre hacer `await`:

```tsx
// ✅ CORRECTO
export default async function Page({
  params,
}: {
  params: Promise<{ shortId: string }>;
}) {
  const { shortId } = await params;
}

// ❌ INCORRECTO — Causa undefined en Next.js 15
export default async function Page({ params }: { params: { shortId: string } }) {
  const { shortId } = params; // undefined!
}
```

Lo mismo aplica a `searchParams`:
```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
}
```
