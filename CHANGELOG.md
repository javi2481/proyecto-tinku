# Changelog — Tinkú

Todo lo que se construyó, en orden cronológico. Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

---

## [Unreleased]

Nada pendiente sin shippear. Si arranca un sprint nuevo, acá va.

---

## [0.8.0] — 2026-04-17 · Grade 1 + Repaso diario

### Added
- **Seed de contenido grade_1** (1° grado) — 3 conceptos nuevos + 59 ejercicios.
  - `M1_NUM_100` (Números hasta 100) — 21 ejercicios (8 easy, 8 medium, 5 hard).
  - `M1_ADD_SIMPLE` (Sumas fáciles hasta 20) — 19 ejercicios.
  - `M1_SUB_SIMPLE` (Restas fáciles hasta 20) — 19 ejercicios.
  - Mix MCQ + numeric_input.
  - Script idempotente: `frontend/scripts/seed-grade1.mjs`.
- **Modo repaso diario 5 minutos**:
  - Card destacada en `/isla/numeros` con estados `open`/`done`.
  - Ruta `/isla/numeros/repaso` selecciona 5 ejercicios priorizando conceptos con menor `p_known` (round-robin por concepto, difficulty ajustada al nivel).
  - Nueva medalla `daily_review` con celebración especial al completar el primer repaso.
  - Detección "ya hecho hoy" vía `data_access_log.access_target='daily_review.complete'`.
  - Server actions: `lib/review/daily.ts` → `getDailyReviewStatus`, `startDailyReviewAction`, `completeDailyReviewAction`.
- Script `scripts/seed-badges.mjs` para insertar/actualizar badges del catálogo.

### Files
- `frontend/src/app/(student)/isla/numeros/repaso/page.tsx` · `DailyReviewClient.tsx`
- `frontend/src/app/(student)/isla/numeros/DailyReviewCard.tsx`
- `frontend/src/lib/review/daily.ts`
- `frontend/scripts/seed-grade1.mjs` · `seed-badges.mjs`

---

## [0.7.0] — 2026-04-17 · Google OAuth + arreglo de sesión cruzada

### Added
- **Google OAuth** como método de signup/login (Supabase provider).
- Migration `0005_oauth_support.sql`: actualiza `handle_new_user` para detectar provider (email vs google/etc), marca `email_double_opt_in_completed=true` automáticamente para OAuth, resuelve `full_name` desde `raw_user_meta_data.name` de Google.
- Route handler `/auth/callback` con PKCE code exchange + fix proxy-safe origin.
- Botón `GoogleAuthButton` (SVG oficial, estados loading/error) en `/login` y `/signup`.
- Strings: `Continuar con Google`, `Registrarse con Google`, separador "o".
- `OAuthErrorBanner` para errores (access_denied, no_code, exchange_failed).
- Script `scripts/delete-auth-users.mjs` para ops de borrado de usuarios (cleanup legacy de password users).
- Pantalla **"Estás usando tu cuenta de padre/madre"** en `/entrar` cuando un parent intenta acceder al login del alumno. 2 opciones claras: incógnito o cerrar sesión.

### Removed
- Dependencia bloqueante de Resend para el happy path (email users siguen funcionando, pero el registro por Google no necesita email).

### Files
- `supabase/migrations/0005_oauth_support.sql`
- `frontend/src/app/auth/callback/route.ts`
- `frontend/src/components/auth/GoogleAuthButton.tsx`
- `frontend/src/app/(auth)/login/OAuthErrorBanner.tsx`
- `frontend/src/app/entrar/ParentSessionPrompt.tsx`
- `frontend/scripts/delete-auth-users.mjs` · `apply-migration.mjs`

---

## [0.6.0] — 2026-04-17 · Admin Review UI

### Added
- Ruta `/review-exercises` (admin-only) para revisión pedagógica de ejercicios.
  - Agrupados por concepto, ordenados easy → medium → hard.
  - Acciones por ejercicio: **Aprobar** · **Revisar** (needs_revision) · **Rechazar** (soft-delete → excluido del engine).
  - **Bulk approve por concepto** — botón "Aprobar los X pendientes".
  - **Reset global** de los seedeados automáticos (filtra `pedagogical_reviewer_id IS NULL`).
  - Filter tabs: todos / sin revisar / aprobado / necesita revisión / rechazado.
  - Textarea expandible para nota pedagógica (persistida en `pedagogical_notes`).
- Server actions: `reviewExerciseAction`, `bulkApproveByConceptAction`, `resetUnreviewedToPendingAction`.
- `lib/auth/admin.ts` con `isAdminEmail()` vs env var `ADMIN_EMAILS`.
- Link "🧑‍🏫 Revisión pedagógica (admin)" en el dashboard del padre (solo admin).

### Files
- `frontend/src/app/(parent)/review-exercises/page.tsx` · `ReviewClient.tsx`
- `frontend/src/lib/review/actions.ts`
- `frontend/src/lib/auth/admin.ts`

### Also
- `memory/RULES.md` — regla innegociable "no gastar créditos/tokens" grabada permanentemente para todos los agentes + reglas de idioma, stack, UX infantil, y compliance legal.

---

## [0.5.0] — 2026-04-17 · Sprint P1 (cron + seed grade_2 + numeric_input + PNG icons)

### Added
- **GitHub Action** `.github/workflows/anonymize-cron.yml` — cron diario 03:15 UTC que hace `POST /webhooks/cron/anonymize`.
- **Seed expandido grade_2** a 63 ejercicios (M2_NUM_1000 · M2_ADD_REGROUP · M2_SUB_REGROUP).
- **Exercise type `numeric_input`** soportado en PracticeClient (input Andika text-5xl con `inputMode="numeric"`).
- **Iconos PNG** (192/512 + 180 apple-touch + maskable) generados via `sharp`.

### Fixed
- Bug crítico Server Actions en ingress k8s: `allowedOrigins` expandido con 40 cluster-N entries + middleware que normaliza `origin` para match con `x-forwarded-host`.
- Cron anonymize: `event_type='erased'` no existía en el enum; cambiado a `'revoked'` con notes descriptivas.

### Files
- `.github/workflows/anonymize-cron.yml`
- `frontend/scripts/seed-exercises-expanded.mjs` · `generate-icon-pngs.mjs`
- `frontend/public/icons/tinku-{192,512,maskable-192,maskable-512,apple-touch}.png`

---

## [0.4.0] — 2026-04-17 · Fase 6 (Gamificación) + Fase 7 (Compliance + PWA)

### Added — Fase 6 (Gamificación)
- `CelebrationModal` reutilizable con 3 variantes (`xp`/`badge`/`mastered`).
  - Confetti via `canvas-confetti`.
  - Sonido opcional vía Web Audio API (toggle persistido en `localStorage['tinku-sound']`).
  - Gate ≥1.5s antes de permitir cerrar (UX infantil).
  - `prefers-reduced-motion` respetado.
- Cola secuencial de celebraciones en `PracticeClient` (mastered → badge por cada nuevo).
- Página `/mis-logros` con medallas ganadas (borde verde + fecha) y por desbloquear (grayscale + lock).
- Link "Mis medallas" en header del alumno.

### Added — Fase 7 (Compliance + PWA)
- Helper central `logDataAccess()` en `lib/audit/log.ts`. Integrado en `submitAttempt`, `updateStudent`, `regenerateCode`, `cancelDelete`, `studentSignOut`.
- `manifest.webmanifest` + iconos SVG (any + maskable).
- `sw.js` con cache-first para `/_next/static`, fonts, iconos; network-first para pages con fallback offline HTML.
- `RegisterSW.tsx` que registra el SW solo en prod (o con `NEXT_PUBLIC_ENABLE_SW=1`).
- Cron endpoint `/webhooks/cron/anonymize` protegido con `Authorization: Bearer CRON_SECRET`.

### Added — Resend real
- `lib/email/stub.ts` reescrito: usa `resend` SDK si `RESEND_API_KEY` presente, fallback a stub si falla.
- Template HTML rioplatense con CTA button.

---

## [0.3.0] — 2026-04 · Fase 5 · Motor adaptativo + Isla activa

### Added
- Motor adaptativo BKT simplificado (`lib/adaptive/engine.ts`):
  - `updatePKnown(prior, isCorrect, hintsUsed)` con learn_rate 0.15, slip 0.1, guess 0.2.
  - `pickDifficulty(p)` con umbrales 0.40 / 0.65 / 0.85.
  - `computeXp(outcome, difficulty, timeSpent, hintsUsed)`.
- `PracticeClient.tsx` con progress bar de `p_known`, hints, feedback, next.
- `lib/sessions/actions.ts` con `startSessionAction`, `getNextExerciseAction`, `submitAttemptAction`, `closeSessionAction`.
- Auto-award del badge `first_exercise` en el primer attempt.
- Auto-award del badge `concept_mastered` cuando `p_known ≥ 0.85` por primera vez.

---

## [0.2.0] — 2026-04 · Fases 3 + 4 · Consentimiento + Login alumno

### Added
- Flujo de creación de alumno con **consentimiento parental explícito**.
  - IP + User-Agent registrados en `parental_consents`.
  - Texto legal versionado (`/content/legal/consent-v1.md`).
- Login del alumno en `/entrar` con código 6-char.
  - Supabase Anonymous Sign-in vinculado al student (`auth_user_id`).
  - `user_metadata = { role: 'student', student_id }` para middleware.
  - Rate-limit por IP.
- Dashboard del padre con lista de hijos, XP, streak, baja pendiente.
- Edición de datos del alumno + regenerar código.
- Flujo de baja (soft-delete con `deletion_requested_at`) + cancelación.

---

## [0.1.0] — 2026-04 · Fases 0+1+2 · Scaffold + Auth padre

### Added
- Next.js 14.2 App Router + TypeScript strict + Tailwind + Supabase `@supabase/ssr`.
- 17 tablas + 31 RLS policies (`supabase/migrations/0001` a `0004`).
- Trigger `handle_new_user` (profile + subscription free al signup).
- Auth del padre:
  - Signup con email+password + admin.createUser + doble opt-in token propio.
  - Login con rate-limit.
  - Verify email idempotente.
  - Resend verify.
- Page 404/500 rioplatense.
- Badges catalog seed inicial (`first_exercise`, `streak_3`, `streak_7`, `concept_mastered`, `explorer`).

---

## [0.0.1] — 2026-04 · Kickoff

- Reemplazado scaffold Emergent estándar (CRA + FastAPI + Mongo) por Next.js + Supabase.
- `/app/memory/PRD.md` + fundacional v3 establecidos.
- `REACT_APP_BACKEND_URL` + ingress conservado para preview de Emergent.
- Regla innegociable del proyecto definida: **"no gastar créditos/tokens innecesariamente"**.
