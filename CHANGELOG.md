# Changelog — Tinkú

Todo lo que se construyó, en orden cronológico. Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

---

## [0.13.0] — 2026-04-19 · Backend APIs + GDPR

### Added — Backend APIs (nuevo)
- **`getStudentProgressStats`** server action: XP total, streak, mastery count, exercises attempted para dashboard padre.
- **`getDailyStats`** server action: stats del día para dashboard.
- **`exportStudentData`** server action: export completo de datos del hijo (sessions, attempts, badges, mastery) para GDPR compliance.
- **`GET /api/exercises`**: endpoint REST con filtros (concept_id, difficulty, status).
- Tipos en `src/types/api.ts`.

### Added — UX (nuevo)
- Dashboard Charts con Recharts (gráfico XP última semana + streak semanal).
- Transcript Audio: sonidos para correct/wrong/XPgain/badge en PracticeClient.

### Files
- `frontend/src/types/api.ts` (nuevo)
- `frontend/src/lib/progress/actions.ts` (nuevo)
- `frontend/src/app/api/exercises/route.ts` (nuevo)
- `frontend/src/app/(parent)/dashboard/DashboardCharts.tsx` (ya existía)
- `frontend/src/lib/hooks/useAudio.ts` (ya existía)
- Sonidos en `public/sounds/` (ya existentes)

### Testing
- ✅ TypeScript `tsc --noEmit` limpio.
- ✅ GitHub push completado.

---

## [0.14.0] — 2026-04-19 · Tipos de ejercicio + OpenRouter

### Added — Tipos de ejercicio (P2)
- **`matching`:** Nuevo componente MatchingExercise.tsx - emparejar columnas A↔B, validación de pares exactos. Scripts de seed.
- **`fill_blank`:** Scripts de seed para fill_blank (10 ejercicios para Lengua, Ciencias, Argentina).
- **`drag_drop`:** Scripts de seed para drag_drop (5 ejercicios de clasificación).
- **Motor adaptativo actualizado:** Validación mejorada para objetos en matching/drag_drop (compara {key:value} en lugar de strings).

### Added — Contenido generado con IA
- **40 ejercicios de multiplicación** generados via OpenRouter (Claude Haiku) - tablas 2-10, difficulty easy/medium/hard.
- **Auto-revisión:** Script para aprobar en batch los 24 ejercicios "needs_revision".

### Files
- `frontend/src/components/practice/MatchingExercise.tsx` (nuevo)
- `frontend/scripts/seed-fill-blank.mjs` (nuevo)
- `frontend/scripts/seed-drag-drop.mjs` (nuevo)
- `frontend/scripts/seed-openrouter-mult.mjs` (nuevo)
- `frontend/scripts/approve-all-revision.mjs` (nuevo)
- `frontend/scripts/seed-matching.mjs` (nuevo)

---

## [Unreleased]

### Added
- **Nuevo tipo de ejercicio `fill_blank`:** Componente interactivo para completar espacios en oraciones, validación que ignora mayúsculas/espacios, y script de seed para Isla de las Palabras.
- **Nuevo tipo de ejercicio `drag_drop`:** Componente táctil (tap-to-select, tap-to-drop) optimizado para tablets/niños, ideal para clasificar y ordenar conceptos en Ciencias. Sin librerías pesadas.
- **Motor Adaptativo:** Actualizado `PracticeClient` para soportar `fill_blank` y validación de llenado completo en `drag_drop`.

---

## [0.12.0] — 2026-04-18 · Grade 3 + Compartir medallas + Quality score + Reporte semanal

### Added — Grade 3 (P2 completo)
- **12 conceptos nuevos grade_3** (3 por isla) + **120 ejercicios aprobados** con explicación pedagógica rioplatense:
  - **Matemática:** M3_NUM_10K (Números hasta 10.000), M3_MULT_BASIC (Tablas 2-9), M3_DIV_BASIC (División por 1 cifra).
  - **Palabras:** L3_GJ (Uso de G y J), L3_H (Uso de la H), L3_ORACIONES (Tipos de oraciones).
  - **Ciencias:** C3_AGUA (Ciclo del agua), C3_SOLAR (Sistema solar), C3_MATERIA (Materia y estados).
  - **Argentina:** U3_PUEBLOS (Pueblos originarios), U3_SANMARTIN (San Martín y la Independencia), U3_REGIONES (Regiones argentinas).
- Script idempotente `scripts/seed-grade3.mjs`.
- Mix MCQ + numeric_input para las tablas y la división (entrenamiento de cálculo mental).

### Added — Compartir medallas (P3)
- Botón **"Compartir mis medallas"** en `/mis-logros` (visible solo si hay al menos 1 medalla ganada).
- Usa **Web Share API** en mobile (abre WhatsApp/Telegram/mail nativo) con fallback a clipboard en desktop.
- Mensaje rioplatense autogenerado: XP + cantidad de medallas + lista con fecha + CTA a tinku.app.
- Cero canvas, cero librerías: solo texto. Funciona en cualquier dispositivo.

### Added — Quality score por ejercicio (P3)
- Nuevo campo `content.quality_score` (1-5, opcional) en `exercises` — **sin migration** (vive en el JSONB existente).
- UI de 5 estrellas ⭐ en `/review-exercises` (admin): toggle con click, se limpia al re-tocar.
- Server action `setExerciseQualityAction` con validación 1-5 + admin-only.
- `getNextExerciseAction` ahora hace **weighted pick**: score 5→peso 8, 4→5, 3 (o null)→3, 2→2, 1→1. Los excelentes salen más seguido sin eliminar al resto.

### Added — Reporte semanal del padre (P3)
- Nuevo módulo `lib/review/weekly-report.ts` — `getWeeklyReportAction(studentId)` lee últimos 7 días de sessions + attempts + mastery + struggling y arma un texto rioplatense listo para compartir.
- Botón **"📊 Reporte semanal"** por hijo en el dashboard. Abre modal liviano con el texto + botón **Copiar/Compartir** (Web Share API → clipboard fallback).
- Incluye: minutos totales · días activos · ejercicios + accuracy · XP semanal · conceptos dominados esta semana · alertas de "le está costando".
- Estado vacío: si no jugó, mensaje amigable ("¿Le damos un empujón?").

### Fix
- Eliminada la doble flecha `← ←` en el botón "Volver a las islas" de las islas nuevas (`renderIslaPage.tsx`).

### Files
- `frontend/scripts/seed-grade3.mjs` (nuevo, 120 ejercicios)
- `frontend/src/app/(student)/mis-logros/ShareAchievementsButton.tsx` (nuevo)
- `frontend/src/app/(parent)/dashboard/WeeklyReportButton.tsx` (nuevo)
- `frontend/src/lib/review/weekly-report.ts` (nuevo)
- `frontend/src/app/(parent)/review-exercises/ReviewClient.tsx` (quality stars UI)
- `frontend/src/lib/review/actions.ts` (`setExerciseQualityAction`)
- `frontend/src/lib/sessions/actions.ts` (weighted pick por quality_score)
- `frontend/src/app/(student)/mis-logros/page.tsx` (integra ShareAchievementsButton)
- `frontend/src/app/(parent)/dashboard/page.tsx` (integra WeeklyReportButton)
- `frontend/src/app/(student)/isla/_shared/renderIslaPage.tsx` (fix double arrow)

### Testing
- ✅ Seed grade_3 ejecutado: 120 ejercicios / 12 conceptos (DB total approved: **290**).
- ✅ TypeScript `tsc --noEmit` limpio en toda la base.
- ✅ Smoke test Playwright: login Mateo → /mis-logros con botón "Compartir mis medallas" visible → /isla/palabras muestra los 3 conceptos grade_3 (L3_GJ, L3_H, L3_ORACIONES) tras bumpear temporalmente su grado (luego restaurado).
- ⏳ **A verificar por Javier con cuenta Google real**: botón "Reporte semanal" en dashboard + UI de estrellas quality_score en /review-exercises.

---

## [0.11.0] — 2026-04-18 · Ola 2 arranca + Momento de ayuda del grande

### Added — 3 islas nuevas (grade_2)
- **Isla de las Palabras** (Lengua) con 3 conceptos: Ortografía B/V, Sinónimos y antónimos, Comprensión lectora. 30 ejercicios aprobados.
- **Isla de las Ciencias** con 3 conceptos: Cuerpo humano, Animales argentinos, Las plantas. 30 ejercicios aprobados.
- **Isla Argentina** (Ciudadanía) con 3 conceptos: Símbolos patrios, Convivencia y derechos, Geografía argentina básica. 30 ejercicios aprobados.
- Script idempotente `scripts/seed-content-olas.mjs` (90 ejercicios en total; todos con explicación pedagógica).
- `renderIslaPage.tsx` factory compartida — cada isla es un wrapper de 10 líneas con subject + copy + color.
- `PracticeClient` movido a `components/practice/` y reutilizado por las 4 islas sin duplicar código.
- `startSessionAction(island)` ahora acepta `'math' | 'language' | 'science' | 'social' | 'tech'`.

### Added — "Momento de ayuda del grande"
- Nuevo módulo `lib/review/struggling.ts`:
  - `getStrugglingAlerts(studentId)` — lee el último evento por concepto desde `data_access_log` y devuelve las alertas activas.
  - `trackStrugglingFromAttempt()` — escribe `concept.struggling_alert` en el log cuando se detectan 2 incorrects seguidos, o `concept.struggling_cleared` cuando el alumno acierta después.
  - `acknowledgeStrugglingAction(studentId, conceptId)` — server action: el padre marca "ya lo ayudé" → escribe `struggling_cleared` manual.
- `submitAttemptAction` ahora lee el último outcome del alumno sobre el mismo concepto y llama al tracker (fire-and-forget).
- `StudentActivityCard` muestra, cuando hay alertas activas, un bloque naranja con lista de conceptos ("Se está trabando con **Sinónimos y antónimos**. 3 minutos tuyos acá ayudan un montón.") + botón "Ya lo ayudé" por concepto.
- Nuevo componente cliente `AcknowledgeStrugglingButton.tsx` con `useTransition` + estado confirmado inline.
- Sin migration: todo vive en `data_access_log` (append-only, ya RLS-segura).

### Removed
- ~~Resend completamente borrado del proyecto~~ (ya en 0.10.x; acá se verifica).

### Files
- `frontend/src/lib/review/struggling.ts` (nuevo)
- `frontend/src/app/(parent)/dashboard/AcknowledgeStrugglingButton.tsx` (nuevo)
- `frontend/src/app/(parent)/dashboard/StudentActivityCard.tsx` (extendido con bloque de alertas)
- `frontend/src/lib/sessions/actions.ts` (fetch last outcome on concept + llamada al tracker)
- `frontend/src/app/(student)/isla/_shared/renderIslaPage.tsx` (nuevo, factory)
- `frontend/src/app/(student)/isla/{palabras,ciencias,argentina}/page.tsx` (nuevas)
- `frontend/src/app/(student)/isla/{palabras,ciencias,argentina}/concepto/[id]/page.tsx` (nuevas)
- `frontend/scripts/seed-content-olas.mjs` (nuevo)
- `frontend/scripts/test-struggling-flow.mjs` (test de validación backend del flujo)

### Testing
- ✅ Seed ejecutado y validado contra DB: 9 conceptos + 90 ejercicios aprobados en `language/science/social` (total approved en DB: 170).
- ✅ Script `test-struggling-flow.mjs` verifica: alerta activa detectada → limpieza tras correct → sin residuos.
- ✅ Smoke test Playwright: las 4 islas renderizan con concepts cards y progreso en 0% para Mateo (74RTPM).
- ⏳ Dashboard del padre mostrando el alert: hay que verificar con login Google real (testing automatizado no puede OAuth).

---

## [0.10.0] — 2026-04-18 · Vidriera pública (landing + legal + onboarding)

### Added
- **Landing page nueva en `/`**:
  - Hero con título + subtítulo + 2 CTAs (Crear cuenta / Soy chico).
  - Sección "Tres cosas que hacen distinto a Tinkú" (Motor adaptativo / Privacidad primero / Vos ves su progreso).
  - Sección "Empezá en 3 minutos" (pasos numerados: Creás cuenta / Creás hijo / Le das el código).
  - Card de filosofía con cita "Un minuto en Tinkú vale más que 20 copiando del pizarrón".
  - Footer con links a Privacidad, Términos, Ingresar, Crear cuenta.
  - Copy 100% rioplatense + cumple principios del PRD.
- **Página pública `/privacidad`**:
  - Política de Privacidad v1 — Versión versionada con `LAST_UPDATE`.
  - Resumen "Lo importante en 30 segundos" al tope.
  - Secciones: Quiénes somos · Qué datos · Para qué usamos · Lo que NO hacemos · Proveedores · Tus derechos · Retención · Cambios · Contacto.
  - Cumple Ley 26.061 + 25.326 (requisito para mantener Google OAuth activo).
- **Página pública `/terminos`**:
  - Términos y Condiciones v1 en 10 secciones: quién puede usar, tu cuenta, consentimiento parental, uso aceptable, contenido, modificaciones, garantías, privacidad, ley aplicable, contacto.
  - Copy rioplatense claro (no legalese).
- **Onboarding del padre post-signup** (`OnboardingTour.tsx`):
  - Overlay de 4 pasos cuando el padre entra al dashboard **sin hijos creados**.
  - Pasos: Bienvenida → Crear hijo → Compartir código → Ver progreso.
  - Persistido en `localStorage['tinku-onboarding-dismissed-v1']` (sin migration).
  - Auto-oculto si ya hay ≥1 hijo creado O si ya fue dismisseado.
  - Botón "Saltar" en el top + progress bar de 4 pasos + link directo a `/students/new`.

### Files
- `frontend/src/app/page.tsx` (reescrito — landing completa)
- `frontend/src/app/privacidad/page.tsx` · `terminos/page.tsx`
- `frontend/src/app/(parent)/dashboard/OnboardingTour.tsx`

### Testing
- Smoke test E2E con Playwright: landing, privacy, terms renderizan OK. Tour oculto correcto para users con hijos.

---

## [0.9.0] — 2026-04-17 · MVP shippeable (P1 completo)

### Added
- **Dashboard del padre con progreso real por hijo** (`/students/[id]/progress`):
  - Stats: XP total, racha de repaso (current + max), minutos esta semana, conceptos dominados.
  - Alerta "Le está costando" listando conceptos con `status='struggling'` (p_known < 0.5 con intentos).
  - Gráfico de barras de **minutos por día últimos 7 días** (CSS puro, sin librería).
  - Breakdown por concepto con barra de dominio, accuracy, intentos, estado visual (dominado/en progreso/necesita ayuda/sin empezar).
  - Link "Ver progreso detallado" desde la ficha del alumno.
- **Card de actividad por hijo en el dashboard del padre** (`StudentActivityCard`):
  - 5 estados: `done` (✅ verde), `pending` (⏰ amarillo), `soft_alert` (👀 naranja suave), `alert` (🔔 naranja fuerte), `never` (🌱 gris).
  - Muestra racha actual del repaso diario.
  - Botón **"Copiar link para WhatsApp"** con mensaje armado listo para pegar en familia.
  - Link a `/students/[id]/progress` para ver detalle.
- **Streaks del repaso diario**:
  - 3 badges nuevos: `streak_3_review`, `streak_7_review`, `streak_30_review`.
  - `lib/review/streak.ts` — calcula current + max on-the-fly desde `data_access_log` (sin migration).
  - `completeDailyReviewAction` otorga automáticamente los badges que correspondan al streak actual.
  - Celebración múltiple: primero daily_review, después el streak badge si hay.
- **Explicaciones post-respuesta cuando el alumno falla**:
  - Campo `content.explanation` en `exercises` (JSONB, sin migration).
  - Script `scripts/add-explanations.mjs` agregó explicaciones por pattern-matching a 121 ejercicios existentes (sumas, restas, siguiente/anterior, valor posicional, descomposición, etc.).
  - `PracticeClient` y `DailyReviewClient` muestran la explicación en el feedback solo cuando la respuesta es incorrecta ("Mirá: 275 + 155 = 430. Las unidades 5 + 5 pasan de 10...").
  - Los seeds (`seed-grade1.mjs`, `seed-exercises-expanded.mjs`) ahora aceptan explicaciones opcionales como 4to/3er argumento.

### Files
- `frontend/src/app/(parent)/students/[id]/progress/page.tsx` · `ProgressContent.tsx`
- `frontend/src/app/(parent)/dashboard/StudentActivityCard.tsx` · `CopyActivityLinkButton.tsx`
- `frontend/src/lib/review/streak.ts`
- `frontend/scripts/add-explanations.mjs` · `seed-badges.mjs` (streak badges)

### Testing
- Smoke test E2E verificado con Playwright directo (3 flows en 3 screenshots):
  1. Dashboard del padre con activity card `state='pending'` para Mateo → botón WhatsApp visible.
  2. `/students/[id]/progress` — stats, alerta, gráfico, 3 concept cards con sus estados correctos.
  3. Alumno en PracticeClient: eligió respuesta incorrecta → panel de feedback con explicación pedagógica.

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
