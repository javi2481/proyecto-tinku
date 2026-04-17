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

### ⏳ Fase 1 — Tipos generados de Supabase + /content/strings
### ⏳ Fase 2 — Auth del padre (signup + doble opt-in con Resend STUB + login)
### ⏳ Fase 3 — Gestión de alumnos + consentimiento parental
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
