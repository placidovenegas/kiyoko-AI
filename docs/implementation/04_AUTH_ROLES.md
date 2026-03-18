# Fase 04 — Autenticación y Roles

## Estado: ✅ COMPLETADO

## Objetivo

Implementar el sistema completo de autenticación con Supabase Auth, roles de usuario, middleware de protección de rutas, y panel de administración de usuarios.

## Tareas

### 4.1 Supabase Auth Setup
- `src/lib/supabase/client.ts` — Cliente browser
- `src/lib/supabase/server.ts` — Cliente server (RSC)
- `src/lib/supabase/middleware.ts` — Helper para middleware
- `src/lib/supabase/admin.ts` — Cliente con service_role_key

### 4.2 Middleware (`src/middleware.ts`)
- Sin sesión → redirect `/login`
- `role=pending` → redirect `/pending`
- `role=blocked` → redirect `/blocked`
- Ruta `/admin/*` y `role≠admin` → redirect `/dashboard`

### 4.3 Páginas de Auth
- `/login` — Formulario email + password
- `/register` — Nombre, email, password, confirmar password
- `/pending` — Pantalla de espera de aprobación
- `/blocked` — Pantalla de cuenta bloqueada
- `/forgot-password` — Recuperar contraseña

### 4.4 Panel Admin
- `/admin` — Resumen
- `/admin/users` — Tabla de usuarios, cambiar roles, aprobar/bloquear
- API routes: `/api/admin/users`, `/api/admin/users/[userId]`

### 4.5 Hooks
- `useAuth.ts` — Login, logout, register, user state
- `useAdmin.ts` — CRUD de usuarios (solo admin)

## Flujo de Roles
```
Registro → role=pending (excepto ADMIN_EMAIL → admin)
Admin aprueba → role=editor (CRUD propio) o viewer (solo lectura)
Admin bloquea → role=blocked (sin acceso)
```

## Criterios de Aceptación
- [x] Login/registro funcional con Supabase Auth
- [x] Auto-creación de perfil via trigger
- [x] Middleware protege todas las rutas
- [x] Admin puede aprobar/bloquear usuarios
- [x] Redirecciones correctas según role

## Notas de implementación
- Todas las páginas auth implementadas: login, register, pending, blocked, forgot-password
- Layout de auth con diseño consistente
- Middleware.ts con protección de rutas completa
- Admin panel: /admin (resumen) + /admin/users (tabla)
- API routes: /api/admin/users + /api/admin/users/[userId]
- Hooks: useAuth.ts + useAdmin.ts
- Supabase clients: client.ts, server.ts, middleware.ts, admin.ts
