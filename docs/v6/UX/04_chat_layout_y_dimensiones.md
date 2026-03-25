# Chat UX (V6) — dimensiones, layout y comportamiento

Este documento documenta las reglas de UI del chat Kiyoko para que el “panel” se vea/funcione consistente en:
- sidebar (`mode=sidebar`),
- flotante (`mode=floating`),
- fullscreen (`mode=expanded`).

## 1) Montaje global
Fuente: `src/components/kiyoko/KiyokoPanel.tsx`

Reglas:
- El panel solo se renderiza dentro de rutas `/project/...` (guard por `pathname`).
- Si el chat está cerrado:
  - se renderiza `KiyokoButton` como launcher.
- `sidebar` es un layout con:
  - `width` controlado por store `sidebarWidth`,
  - resizer por drag de una barra.

## 2) Tamaño del historial (historia/columna)
Fuente: `src/components/chat/KiyokoChat.tsx`

- `historyWidth` se persiste en `localStorage` con clave `kiyoko-history-width`.
- límites recomendados:
  - min 180px
  - max 480px
- el historial no debe “saltar” entre recargas: se mantiene el valor.

## 3) Comportamiento de streaming y scroll
Fuente:
- `useKiyokoChat.ts` (stream state)
- `KiyokoChat.tsx` (scroll a final)
- `ChatMessage.tsx` (skeleton por bloques parciales)

Reglas:
- durante streaming:
  - la última burbuja se actualiza con texto incremental,
  - el chat hace scroll para mantener el cursor visible.
- `messagesEndRef.scrollIntoView(...)` usa:
  - `smooth` si es nuevo mensaje,
  - `instant` si solo se está actualizando.

## 4) Persistencia (cambio V6)
Fuente: `KiyokoChat.tsx`

Antes:
- el chat restauraba la “última conversación” automáticamente al montar.

Ahora (V6):
- el chat **no restaura mensajes automáticamente** al entrar a una página.
- se mantiene `loadConversations()` para que exista historial,
- la selección del usuario dispara `loadConversation(convId)`.

