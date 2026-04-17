# Tinkú — PRD vivo

## Problema / Norte
Plataforma educativa PWA para chicos argentinos 6-12 años. Matemática y Lengua del currículo NAP en un mundo gamificado ("Las Islas del Saber"). Metodología SDD: specs → plan → implementación revisada. Ver artefactos fundacionales:
- `tinku-fundacional-v2.md` (v3 pendiente)
- `tinku-prompt-emergent-v2.md`
- `tinku-schema-v1.sql` (reemplazado por `/app/supabase/migrations/*`)

## Stack
- Next.js 14.2.15 (App Router) + TypeScript strict + TailwindCSS
- Supabase (Auth + Postgres 17.6 + RLS + Edge Functions)
- `@supabase/ssr` para server/client/service clients
- Deploy: preview de Emergent (Ola 1). Vercel después.

## Personas
- **Alumno** (6-12): accede con login_code de 6 chars. Anonymous sign-in en Supabase.
- **Padre/Madre**: auth email+password + doble opt-in. Hasta 3 hijos en Premium, 1 en Free.
- **Docente**: Ola posterior.
- **Admin**: gestión interna.

## Decisiones inmutables (Javier)
1. Supabase exclusivo (no Mongo/Firebase).
2. RLS activado día 1, sin excepción.
3. Consentimiento parental explícito verificable (Ley 26.061 / 25.326).
4. Español rioplatense en UI.
5. UX infantil: Andika 18/24px, tap 48/56px, sin rojo puro, celebraciones ≥1.5s, sin hamburguesa alumno.

## Scope Ola 1
- Isla de los Números (Matemática 1°-3°).
- Auth de padre (signup, login, doble opt-in).
- Alta de hijo con consentimiento.
- Login de alumno con código.
- Ejercicios custom (MCQ + numeric_input). H5P postergado a Ola 2.
- Motor adaptativo heurístico (umbrales 0.40/0.65/0.85).
- Dashboard del padre con progreso.
- ~20 ejercicios seed curados.

## Fuera de Ola 1
Tutor IA Ari (Ola 4), MercadoPago real, portal docente, push, offline avanzado, leaderboards, IA generativa, app nativa, H5P, Isla de las Palabras, Sentry/PostHog reales (stub en `app_logs`).

---

## Implementación

### ✅ Fase 0 — Setup (completada)

**Fecha:** 2026-01

- Scaffold limpiado (React CRA + FastAPI borrados).
- Next.js 14 + TS strict + Tailwind instalado en `/app/frontend`.
- `@supabase/ssr` + `@supabase/supabase-js` integrados.
- Clientes creados:
  - `src/lib/supabase/client.ts` (browser, anon)
  - `src/lib/supabase/server.ts` (server component, cookies-based)
  - `src/lib/supabase/service.ts` (service_role, bypassa RLS)
- Design tokens base en `tailwind.config.ts` (paleta Tinkú, tap-min/tap-exercise, `animate-celebrate`).
- Scope CSS `.student-scope` con Andika (font-family var lista para `next/font/local`).
- Smoke test en `/` valida stack end-to-end.
- Migrations aplicadas a Supabase:
  - `/app/supabase/migrations/0001_initial_schema.sql` — 17 tablas, triggers, funciones helper.
  - `/app/supabase/migrations/0002_rls_policies.sql` — 31 policies, RLS activo en todas.
- Supervisor reconfigurado: `yarn start` ahora corre `next dev -p 3000`. FastAPI queda ocioso en :8001 (sin tocar, usaremos Server Actions).
- Credenciales en `/app/frontend/.env.local` (gitignored).

**Verificación:**
- `curl localhost:3000/` → HTTP 200, `status-supabase: OK (xp_rules visible: 0)` (0 por RLS `TO authenticated`, correcto).
- `xp_rules` tiene 12 filas (3 difficulties × 4 outcomes).
- 5 badges seed en `badges_catalog`.

### ✅ Fase 1+2 — Types + strings + legal + Auth del padre (completada 2026-01)

**Fase 1:**
- `src/types/database.ts` — types TS hand-rolled de las 17 tablas.
- `src/content/strings/es-AR.ts` — fuente única de texto UI en rioplatense.
- `src/content/legal/consent-v1.md` — borrador completo de texto legal de consentimiento parental (**PENDIENTE review de Javier**).
- `src/lib/observability/logger.ts` — logger estructurado → `app_logs` (reemplaza Sentry Ola 1).
- `src/lib/email/stub.ts` — email stub. Loguea link completo a stdout + app_logs.
- `src/lib/schemas/auth.ts` — Zod schemas para signup/login.
- `src/lib/utils/rate-limit.ts` — rate-limit in-memory.
- `src/lib/utils/cn.ts` — helper className.

**Fase 2 (Auth del padre):**
- Migration `0003_auth_trigger.sql` aplicada — trigger `handle_new_user` crea profile + subscription(free) al crear auth.users. Skippea alumnos (role=student en metadata).
- Server Actions `src/lib/auth/actions.ts`: `signupAction`, `loginAction`, `verifyEmailToken`, `resendVerifyAction`, `signOutAction`.
- `middleware.ts` — refresh de cookies Supabase + protección /dashboard /students /account.
- Páginas:
  - `/` landing marketing con redirect si autenticado.
  - `(auth)/signup` + SignupForm client con `useFormState`.
  - `(auth)/login` + LoginForm client.
  - `(auth)/verify-email?token=X` — consume token del stub.
  - `(parent)/layout.tsx` con guard server-side + botón Salir.
  - `(parent)/dashboard` con VerifyBanner + plan label + CTA deshabilitado.
- `next.config.mjs` actualizado con `allowedOrigins` para Server Actions en preview de Emergent (agregado por testing agent).

**Testing (iteration_1.json — 90% success):**
- 15 tests PASS: landing, signup happy path, validación cliente, email duplicado, dashboard con banner, plan gratuito, signout, login válido/inválido, rate limit implícito, redirects de guard.
- 1 bug FIXED: middleware no redirigía usuarios logueados desde /signup y /login → agregado check en layout `(auth)` (defense in depth con `supabase.auth.getUser()` + `redirect('/dashboard')`). Verificado manualmente con Playwright: ambas navegaciones ahora redirigen correctamente.

**Decisiones de implementación:**
- Usamos `admin.createUser({email_confirm:true})` con service_role para bypassear la confirmación built-in de Supabase y gestionar nuestro propio double opt-in en `email_verifications`.
- Trigger Postgres crea profile + subscription atómico con auth.users (canónico Supabase).
- Email stub = `sendEmail()` loguea el link a stdout + `app_logs` row. Reemplazable a Resend sin tocar llamadores.
- Rate limits: 10 signups/hora por IP, 8 logins/10min por IP, 3 resends/10min por user.

### ✅ Fase 3 — Gestión de alumnos + consentimiento parental (completada 2026-01)

**Construido:**
- Migrations aplicadas completas (0001-0003). Sin migrations nuevas en Fase 3.
- `src/lib/schemas/student.ts` — Zod `createStudentSchema` (requiere `consent_accepted='true'` literal), `updateStudentSchema`.
- `src/lib/students/avatars.ts` — 6 avatares emoji (zorro/perro/gato/panda/león/rana) con colores de fondo.
- `src/lib/students/limits.ts` — `getStudentCapacity(parentId)`. PLAN_LIMITS free=1, premium_active=3.
- `src/lib/students/actions.ts`:
  - `createStudentAction` — service_role: INSERT atómico en `students` + `parental_consents` (event 'granted' con IP/UA + consent_text_version=v1) + `data_access_log`. Genera login_code único vía RPC `generate_login_code` con retry.
  - `updateStudentAction` — vía cliente con RLS (no necesita service_role).
  - `regenerateLoginCodeAction` — service_role + ownership check.
  - `requestDeleteStudentAction` — marca `deletion_requested_at` + `consent_revoked_at` + event 'revoked' en parental_consents.
  - `cancelDeleteStudentAction` — limpia ambos timestamps + event 'reconfirmed'.
- `src/lib/legal/ConsentTextV1.tsx` — texto legal v1 como componente React, renderizable inline en el form.
- Páginas:
  - `/dashboard` rediseñada: lista de hijos con avatar + código + XP + streak + badge 'baja pendiente' si corresponde. Capacity label "X / Y hijos".
  - `/students/new` — page con check de capacity (muestra `limit-reached` si no puede) + `NewStudentForm`. Submit deshabilitado hasta consent.
  - `/students/[id]` — detail con avatar grande, datos, **código login en monospace 3xl** seleccionable, acciones.
  - `/students/[id]/edit` — form de edición (first_name, grade, avatar; no birth_year).
  - `StudentActions` client component: copiar código, regen (con confirm), edit link, request-delete (con confirm), cancel-deletion.
- `/not-found.tsx` — 404 localizado en rioplatense con brújula 🧭.

**Testing (iteration_2.json — 100% success):**
- 22 flows testeados: dashboard vacío, creación de alumno con consent, avatar picker, submit bloqueado sin consent, detail con login code, regeneración, copy button, edit completo, request-delete con grace, cancel deletion, límite Free = 1, 404.
- Seed de test: alumno "Mateo E." (grade_2, birth 2017, avatar_03) con login_code regenerado durante los tests. Está al límite del plan Free.
- 0 fallos. 1 issue cosmético de 404 resuelto.

**Decisiones de UX notables:**
- Consent rendered INLINE scrolleable (no modal) — mejor para mobile + accesibilidad.
- login_code mostrado grande + monospace + seleccionable para facilitar lectura al padre.
- Deletion con grace period UX-explícita: banner naranja en detail + texto "baja pendiente" en dashboard + botón cancelar visible siempre.
- Avatares con emoji (OK para contenido infantil, no icons).

### ⏳ Fase 4 — Auth del alumno (próxima)
### ⏳ Fase 4 — Auth del alumno (anonymous sign-in + login_code)
### ⏳ Fase 5 — Experiencia del alumno (islas → ejercicio)
### ⏳ Fase 6 — Motor adaptativo heurístico
### ⏳ Fase 7 — Auditoría + PWA básico + pulido UX infantil

---

## Backlog prioritizado (P0 / P1 / P2)

### P0 — Bloqueantes Ola 1
- [ ] Generar `types/database.ts` con Supabase CLI (o supabase-js codegen via HTTP).
- [ ] Fundacional v3 (Javier adjuntará reemplazo de v2).
- [ ] Fase 2: signup del padre + creación de `profiles` + `subscriptions` (free).
- [ ] Fase 2: doble opt-in por email (stub con log a `app_logs` en Ola 1, Resend real después).
- [ ] Fase 3: flujo de consentimiento parental con versionado de texto legal en `/content/legal/consent-v1.md`.
- [ ] Fase 4: anonymous sign-in + `students.auth_user_id` vinculado.
- [ ] Fase 5: `ExerciseShell` + `MultipleChoice` + `NumericInput` con tap targets infantiles.
- [ ] Fase 6: heurística de selección + actualización de `concept_mastery`.
- [ ] Seed de ~20 ejercicios math 1°-3° aprobados.

### P1 — Calidad Ola 1
- [ ] Rate-limit en `/entrar` (IP + código).
- [ ] Logger estructurado → `app_logs`.
- [ ] Middleware Next.js para proteger rutas `(parent)` y `(student)`.
- [ ] Page 404/500 rioplatense con feedback infantil.

### P2 — Ola 2+
- [ ] Migrar a H5P si surgen tipos de ejercicio que lo justifiquen.
- [ ] Resend real para emails.
- [ ] Sentry + PostHog.
- [ ] MercadoPago.
- [ ] Isla de las Palabras (Lengua).
- [ ] Portal docente.
- [ ] Reglas de concept_links pobladas.

---

## Dependencias externas registradas
- **Supabase project ref:** `rihbkanevxlvisanlvsn`
- **Pooler:** `aws-1-us-east-2.pooler.supabase.com:6543` (tx pooler)
- **Direct-DB IPv6:** `2600:1f16:1cd0:331a:209b:594d:ddf8:a2b3` (no usable desde este container)

## Notas de proceso
- Credencial de DB usada 1 vez para aplicar migrations, no quedó persistida en el repo.
- Supervisor config es READONLY → todo corre bajo program `frontend` en :3000.
- `/api/*` en browser va a FastAPI (:8001) por ingress → usamos Server Actions en todo el flujo interno. Webhooks externos irán a `/webhooks/*`.
