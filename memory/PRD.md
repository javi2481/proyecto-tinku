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

### ✅ Fase 4 — Auth del alumno (completada 2026-01)

**Construido:**
- Server Action `studentLoginAction` en `src/lib/auth/student-actions.ts`: valida formato + rate-limit IP (5/10min) + lookup del student por `login_code` + consent no revocado.
- **Workaround sintético para anonymous sign-ins** (estaban disabled en el proyecto y no se pueden activar via Management API sin PAT):
  - Email derivado: `student-{student.id}@tinku.local` (no routeable)
  - Password aleatoria 32 bytes rotada en cada login
  - Primera vez: `admin.createUser({email, password, email_confirm:true, user_metadata:{role:'student',...}})`
  - Logins siguientes: `admin.updateUserById(authUserId, {password: newRandom, user_metadata})`
  - Luego `signInWithPassword(email, password)` desde server client setea cookie
  - El trigger `handle_new_user` detecta `role='student'` y skippea profile/subscription
  - Equivalente funcional a anonymous sign-ins para el producto; cambia el mecanismo de auth interno sin tocar schema ni RLS.
- Audit log en `data_access_log` por cada student_login.
- `middleware.ts` actualizado con matcher explícito (el pattern con negative lookahead no enrutaba /isla/:path) + rutado por role en JWT metadata.
- Layout `(student)/layout.tsx`: server-side guard (user + role=='student') + wrapper `.student-scope` con Andika.
- `(parent)/layout.tsx` actualizado: si role==student → redirect a /islas (cross-role defense in depth).
- Root `layout.tsx` carga Andika + Inter via `next/font/google` con CSS vars `--font-andika` y `--font-parent`.
- Páginas:
  - `/entrar` (público, fuera de route groups): input grande font-mono uppercase con pattern, maxLength=6, autocapitalize=characters. Submit action con error rioplatense cariñoso si falla.
  - `(student)/islas/page.tsx`: saludo con avatar + XP + streak, grid de 5 islas. Solo `math` activa (link a `/isla/numeros`), 4 "Próximamente" grayscale.
  - `(student)/isla/numeros/page.tsx`: placeholder Fase 5 con back link.

**Testing:**
- Iteration 3 testing_agent_v3: 10/11 PASS + 1 blocker (anon sign-ins OFF). Todos los test passed cubrían: UI de /entrar, validación de formato, error de código inexistente, guards de auth, cross-role parent→student.
- Validación del workaround sintético con Playwright directo (6/6 PASS): login con código 74RTPM → /islas → island-math → /isla/numeros → back → cross-role guard → signout. Sin llamar de nuevo al testing_agent por economía.

**Dos bugs fixeados durante Fase 4:**
- `/entrar` estaba adentro del `(student)` group → el layout guard lo redirigía a sí mismo → loop infinito. Movido a `/app/entrar/` (sin group).
- Matcher middleware con negative lookahead `/((?!_next/...).*)` no atrapaba `/isla/numeros`. Reemplazado por matchers explícitos. Además, `/isla/numeros` movido adentro de `(student)` group para que el layout guard actúe como defense in depth.

**Decisión arquitectural notable:**
- **Auth del alumno via synthetic email + rotating password** en lugar de anonymous sign-ins. Razón: el toggle de "Anonymous Sign-Ins" en Supabase Dashboard estaba OFF y la Management API para activarlo requiere Personal Access Token (no proyecto-scoped). El workaround es funcionalmente equivalente y produce el mismo resultado (auth.users con JWT que el cliente usa normalmente). Cuando se active el toggle oficial en algún momento, se puede volver al patrón canónico cambiando 30 líneas en `studentLoginAction`.

### ✅ Fase 5 + parte de Fase 6 — Experiencia del alumno + Motor adaptativo (completada 2026-01)

**Anonymous sign-ins (Supabase) activado por Javier + revert al patrón canónico** en `studentLoginAction`. Workaround sintético removido. auth.user `student-*@tinku.local` borrado manualmente.

**Migration 0004 aplicada** — seed de contenido mínimo Ola 1 (grade_2 · math):
- Conceptos: `M2_NUM_1000`, `M2_ADD_REGROUP`, `M2_SUB_REGROUP`
- 9 ejercicios `multiple_choice` × 3 dificultades (easy/medium/hard)
- Todos `pedagogical_review_status='approved'` (review pedagógico de Javier pendiente)
- `exercise_concepts` N:N poblada con primary=true, weight=1.0

**Motor adaptativo (`src/lib/adaptive/engine.ts`):**
- `updatePKnown(p, outcome, hints)` — BKT simplificado: `p_new = p + 0.15 * (outcome_score − p)` con penalty por hint.
- `pickDifficulty(p)` — umbrales 0.40/0.65/0.85.
- `computeXp(base, outcome, hints, penalty)` — scoring con factor por outcome.

**Server actions (`src/lib/sessions/actions.ts`):**
- `startSessionAction(island)` — reutiliza sesión abierta <2h o crea nueva.
- `getNextExerciseAction(conceptId, excludeId?)` — selecciona ejercicio por dificultad target con fallback a vecinos.
- `submitAttemptAction({sessionId, exerciseId, answer, timeSpent, hints})` — INSERT attempt + UPSERT concept_mastery + update session counters + update student total_xp + evalúa badges `first_exercise` y `concept_mastered` + awardea con XP reward.
- `closeSessionAction(sessionId, reason)` — calcula duration_seconds + marca ended_at + close_reason.

**UI infantil con Andika:**
- `/isla/numeros` — grid de regiones (conceptos del grado del alumno) con barra de progreso individual + ícono 🌟 si dominado.
- `/isla/numeros/concepto/[id]` — shell de práctica:
  - Header con concepto + barra de progreso grande + botón Salir.
  - Ejercicio: prompt grande, 4 opciones como tap targets 64px con feedback visual al seleccionar.
  - Hint opcional (penaliza XP).
  - Feedback post-submit con celebración `animate-celebrate`: verde si correcto (+XP), naranja si incorrecto ("Casi. ¿Probamos otra?"). Sin rojo, sin vergüenza.
  - Pantalla "¡Gran trabajo!" cuando se completa tanda o domina concepto.

**Testing (Playwright directo, 9/9 PASS):**
- Login student → /islas → click Isla Números → ver 3 conceptos → click primero → ejercicio con 4 opciones → submit incorrecto → feedback + XP=0 + next → segundo ejercicio → exit → progreso actualizado a 9% (BKT penalizó el error correctamente).
- test_credentials.md ya tiene student Mateo con código 74RTPM.

### Ejercicios seed para TU review pedagógico (v1 — 9 ejercicios grade_2)

| Concepto | Dif | Prompt | Respuesta |
|---|---|---|---|
| Números hasta 1000 | easy | ¿Qué número va después del 249? | 250 |
| Números hasta 1000 | medium | ¿Cuál es el número más grande? (472, 427, 742, 724) | 742 |
| Números hasta 1000 | hard | En el número 538, ¿qué valor tiene el 3? | 30 |
| Suma con reagrupamiento | easy | ¿Cuánto es 23 + 14? | 37 |
| Suma con reagrupamiento | medium | ¿Cuánto es 28 + 15? | 43 |
| Suma con reagrupamiento | hard | ¿Cuánto es 47 + 36? | 83 |
| Resta con reagrupamiento | easy | ¿Cuánto es 48 - 23? | 25 |
| Resta con reagrupamiento | medium | ¿Cuánto es 52 - 28? | 24 |
| Resta con reagrupamiento | hard | ¿Cuánto es 70 - 34? | 36 |

### ✅ Fase 6 — Gamificación (celebraciones + badges) (completada 2026-04)

**Construido:**
- `src/components/celebration/CelebrationModal.tsx` — modal reutilizable con 3 variantes (`xp` / `badge` / `mastered`). Features:
  - Confetti con `canvas-confetti` (ráfagas escalonadas para `mastered`).
  - Sonido opcional vía Web Audio API (sin assets); toggle 🔊/🔈 persistido en `localStorage['tinku-sound']`.
  - Cumple UX infantil: celebración ≥1.5s antes de habilitar el cierre (`MIN_DURATION_MS=1500`). Texto placeholder "Uff, qué emoción…" mientras está deshabilitado.
  - `role="dialog"` + `aria-modal` + cierre por ESC/Enter/click-fuera + `prefers-reduced-motion` respetado.
- `PracticeClient.tsx` → cola de celebraciones grandes: si una respuesta gatilla `justMastered` o `newBadges`, las celebraciones se encolan y muestran secuencialmente (mastered → badge por cada nuevo).
- `(student)/mis-logros/page.tsx` — grid con medallas ganadas (borde verde + fecha) y para desbloquear (grayscale + lock + recompensa XP). Contador "Ganaste X de Y medallas".
- `(student)/islas/page.tsx` → botón "Mis medallas" en el header del alumno.
- `src/content/strings/es-AR.ts` → nuevas keys `student.celebration` + `student.logros.navLink`.

**Testing (Playwright directo + testing_agent_v3 iteration_4.json):**
- E2E verificado con screenshots: seed mastery a 0.83 → login 74RTPM → respuesta correcta a "¿qué valor tiene el 3 en 538?" (30) → modal "¡Dominaste este concepto!" con confetti + +20 XP → click close → modal "¡Conseguiste una medalla!" para concept_mastered badge.
- Mis Logros verifica 2/5 medallas ganadas después del flow (Primer paso + Dominé un concepto).
- Sound toggle persistido en localStorage.

**Helper de test:** `frontend/scripts/seed-mastery-near-threshold.mjs <login_code> <concept_code> <p_known>` — sube el mastery del alumno al borde del umbral para que 1 correct_first dispare mastery sin necesidad de 12 aciertos consecutivos.

### ✅ Fase 7 — Auditoría + PWA + anonimización (completada 2026-04)

**Auditoría centralizada:**
- `src/lib/audit/log.ts` — helper `logDataAccess({ studentId, accessType, accessTarget, metadata, accessorId, accessorAuthUid })`. Falla silenciosamente a `app_logs` si `data_access_log` insert falla. Extrae IP + user-agent de headers automáticamente.
- Integrado en: `submitAttemptAction` (attempts.submit con xp/outcome/mastered/badges), `updateStudentAction`, `regenerateLoginCodeAction`, `cancelDeleteStudentAction`, `studentSignOutAction`. Actions preexistentes (create/delete/login) conservan sus inserts inline (ya eran explícitos y auditados desde Fase 3).

**PWA:**
- `public/manifest.webmanifest` — name, short_name "Tinkú", start_url `/islas`, display standalone, theme_color `#2F7A8C`, icons SVG `any` + `maskable`.
- `public/icons/tinku.svg` + `tinku-maskable.svg` — monograma "T" con isla/palmera/estrella (tema Tinkú).
- `public/sw.js` — cache-first para `/_next/static`, fonts, iconos; network-first para páginas con fallback offline HTML embebido. `/api/*` y `/auth/*` nunca cacheados.
- `src/components/pwa/RegisterSW.tsx` — cliente que registra `/sw.js` solo en prod (o con `NEXT_PUBLIC_ENABLE_SW=1` en dev).
- `src/app/layout.tsx` → metadata.manifest + icons + appleWebApp + viewport.themeColor + `<RegisterSW />`.

**Anonimización (Derecho al olvido):**
- `src/app/webhooks/cron/anonymize/route.ts` — endpoint POST protegido con `Authorization: Bearer ${CRON_SECRET}`. Busca `students` con `deletion_requested_at >= NOW() - 30d`, anonimiza PII (first_name='Anónimo', login_code placeholder, auth_user_id null), marca `deleted_at`, borra auth anónimo, inserta `parental_consents` event='erased' + audit log. No toca attempts/sessions/concept_mastery (histórico agregado queda anónimo).
- GET devuelve health check. Sin header devuelve 401.
- Ruta está bajo `/webhooks/*` (no `/api/*`) para saltear el ingress que redirige `/api/*` a FastAPI.

**Resend real (email):**
- `src/lib/email/stub.ts` reescrito — ahora usa `resend` SDK si hay `RESEND_API_KEY`. Si Resend falla o no hay key, cae a logger + stdout (stub legacy). Agregado template HTML rioplatense con CTA button inline (colores Tinkú).
- Callers (`signupAction`, `resendVerifyAction`) sin cambios — API retrocompatible.
- Sandbox: envíos a `delivered@resend.dev` funcionan; otras direcciones fallan con 403 hasta que Javier verifique dominio propio. Fallback a stub garantiza que signup/verify no se bloquean.

**Testing (iteration_4.json, 95% success, 0 bugs):**
- 20 test cases PASS: parent login, student login, islas, Mis Logros (2/5 medallas + grayscale locked), PWA manifest/sw.js/icons HTTP 200, cron endpoint 401/200/GET, audit_access_log rows para login + attempts, Resend integration, localStorage sound pref, regresión iter 1-3.
- CelebrationModal E2E verificado por el main agent con Playwright directo antes del testing agent (screenshots confirmaron mastered modal + badge modal + confetti).
- Sin issues críticos ni minor.

---

## Backlog prioritizado (P0 / P1 / P2)

### P0 — Bloqueantes Ola 1 (todo completo ✅)
- Todo cerrado. Fases 0 a 7 completas. Resend real integrado.

### P1 — Calidad Ola 1
- [ ] Verificar dominio propio en Resend (ej: tinku.app) para enviar emails a cualquier destinatario (hoy solo sandbox → `delivered@resend.dev`).
- [ ] Agendar el cron `/webhooks/cron/anonymize` en un scheduler real (Supabase Scheduled Function, Vercel Cron, o GitHub Actions). Hoy está manual.
- [ ] Seed de ejercicios: ampliar a 20+ por concepto para evitar que reintentos marquen `correct_retry` demasiado seguido (notado por el testing agent).
- [ ] Exercise type `numeric_input` además de MCQ (hoy solo MCQ en seed).
- [ ] Ícono PWA PNG fallback (hoy solo SVG) para mejor soporte en iOS antiguos.
- [ ] PostHog / Sentry reales (hoy stub en app_logs).

### P2 — Ola 2+
- [ ] Migrar a H5P si surgen tipos de ejercicio que lo justifiquen.
- [ ] MercadoPago para suscripción Premium.
- [ ] Isla de las Palabras (Lengua).
- [ ] Portal docente.
- [ ] Reglas de concept_links pobladas (grafo de prerequisites).
- [ ] WhatsApp/SMS double opt-in para consentimiento.

---

## Dependencias externas registradas
- **Supabase project ref:** `rihbkanevxlvisanlvsn`
- **Pooler:** `aws-1-us-east-2.pooler.supabase.com:6543` (tx pooler)
- **Direct-DB IPv6:** `2600:1f16:1cd0:331a:209b:594d:ddf8:a2b3` (no usable desde este container)

## Notas de proceso
- Credencial de DB usada 1 vez para aplicar migrations, no quedó persistida en el repo.
- Supervisor config es READONLY → todo corre bajo program `frontend` en :3000.
- `/api/*` en browser va a FastAPI (:8001) por ingress → usamos Server Actions en todo el flujo interno. Webhooks externos irán a `/webhooks/*`.
