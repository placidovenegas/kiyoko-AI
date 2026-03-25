# Persistencia del chat (V6) — cuándo recargar vs mantener

## Problema que había
Antes, al abrir una página/proyecto, el chat restauraba automáticamente “la última conversación” desde `localStorage`.

Eso hacía que:
- se mostraran mensajes al entrar aunque el usuario no hubiera abierto historial,
- el chat se sintiera “persistente” incluso cuando se esperaba que fuera “fresh” por contexto (dashboard/video/scene).

## Estado V6 (cambio aplicado)
Archivo: `src/components/chat/KiyokoChat.tsx`

Se ajustó el comportamiento eliminando el `useEffect` de:
- “Restore last conversation on mount”

Qué queda:
1. `loadConversations()` sí se ejecuta en el montaje (para llenar el historial).
2. La conversación activa **no** se restaura automáticamente.
3. `conversationId` sigue guardándose en `localStorage` cuando cambia (clave `kiyoko-last-conversation-id`).

## Regla operacional para V6 (recomendada)
- Al cargar una página:
  - el chat muestra estado inicial (empty state / contexto recién establecido),
  - no restaura mensajes previos.
- Solo cuando el usuario usa el historial:
  - se llama `loadConversation(convId)`,
  - y entonces se repuebla la UI con mensajes persistidos.

## BD: dónde vive el historial
- El historial se persiste en `ai_conversations.messages` (Json) y se consulta desde `loadConversations()`/`loadConversation()`.

## Cómo se implementa conceptualmente
- UI:
  - `KiyokoChat` monta `ChatHistorySidebar`.
  - La selección del usuario dispara `loadConversation`.
- Store:
  - `useKiyokoChat.ts` mantiene `messages`, `conversationId` y `conversations`,
  - y ejecuta `loadConversation` con la conversación elegida.

