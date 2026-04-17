# Roadmap — Tinkú

Backlog priorizado. P0 = bloqueante para el siguiente hito. P1 = importante. P2 = Ola 2+. P3 = nice-to-have.

Actualizar acá después de cada sprint.

---

## ✅ Ya hecho (Ola 1)

Lista completa en `CHANGELOG.md`. Resumen:

- Scaffold Next.js + Supabase + 17 tablas + 31 RLS.
- Auth padre (email+password + Google OAuth).
- Auth alumno (código 6-char + anonymous sign-in).
- Gestión de hijos + consentimiento parental versionado.
- Motor adaptativo BKT + Isla de los Números (grade_1 + grade_2).
- 122 ejercicios seedeados (63 grade_2 + 59 grade_1) con **explicaciones pedagógicas**.
- Gamificación (XP, streak, badges, celebraciones, Mis Logros, streaks de repaso).
- Modo repaso diario 5 min.
- Admin review UI para curar ejercicios.
- PWA básico + cron anonimización + auditoría central.
- **Dashboard del padre con progreso detallado por hijo + actividad card con botón WhatsApp**.

---

## 🔴 P0 — Bloqueantes inmediatos

Ninguno activo. El producto es **funcionalmente usable** hoy con Paulina.

---

## 🟡 P1 — Calidad Ola 1 (shippeable antes de probar con usuarios reales)

### Producto
- [x] ~~Dashboard del padre con progreso real del hijo~~ — **shippeado 2026-04-17**.
- [x] ~~Recordatorio de repaso diario en dashboard del padre~~ — **shippeado 2026-04-17** (StudentActivityCard).
- [x] ~~Streak del repaso diario~~ — **shippeado 2026-04-17** (streak_3/7/30_review badges).
- [x] ~~Explicaciones post-respuesta cuando el chico falla~~ — **shippeado 2026-04-17** (121 ejercicios con explicación).
- [ ] **Revisión pedagógica** de los 122 ejercicios seedeados (automático-approved hoy). Bloquea mostrar a padres de otros chicos. *Owner: Javier · UI en `/review-exercises`.*

### Contenido
- [ ] Seed de ejercicios para **grade_3** (~20 por concepto en 3 conceptos).
- [ ] Revisar/mejorar distractores de los MCQ generados por template (algunos son demasiado obvios).
- [x] ~~Agregar explicaciones post-respuesta cuando el chico falla~~ — **shippeado 2026-04-17**.

### Infra / deploy
- [ ] **Verificar dominio Resend** cuando termine el DNS checking → actualizar `RESEND_FROM` en `.env.local` y en producción.
- [ ] Agregar secrets en GitHub repo antes de deploy: `TINKU_APP_URL`, `CRON_SECRET`.
- [ ] `ADMIN_EMAILS` en env de producción (hoy tiene solo el test user).
- [ ] **Sentry** real para errores frontend + server actions (hoy stub en `app_logs`).
- [ ] **PostHog** real para analytics event-level (hoy stub en `app_logs`).
- [ ] Landing page `/` — hoy está vacía. Copy rioplatense + CTA al signup.
- [ ] Onboarding del padre (tour de 3 pasos tras el signup) — hoy tira al dashboard sin contexto.

### Compliance
- [ ] Publicar `/content/legal/privacy-v1.md` y `/content/legal/terms-v1.md` como páginas públicas (hoy solo el consentimiento).
- [ ] Export de datos del alumno ("Descargar mis datos") en formato JSON.

---

## 🟢 P2 — Ola 2 (próximo hito mayor)

### Contenido
- [ ] **Isla de las Palabras** (Lengua) — lectura, vocabulario, ortografía.
- [ ] Expandir Matemática a grade_4 + grade_5 (números hasta 10.000, multiplicación, división, fracciones simples).
- [ ] Más tipos de ejercicio:
  - [ ] `fill_blank` (completar con palabra/número).
  - [ ] `drag_drop` (ordenar, clasificar).
  - [ ] `matching` (emparejar pares).

### Monetización
- [ ] **MercadoPago** para suscripción Premium (AR$ mensual + anual con descuento).
- [ ] Plan Premium: hasta 5 hijos + acceso a todas las islas + reportes avanzados para el padre.
- [ ] Prueba gratuita 14 días sin tarjeta.

### Docente
- [ ] Rol `teacher` en `profiles` + tabla `classrooms`.
- [ ] Portal docente: importar CSV de alumnos, ver aula entera, exportar reportes a PDF.
- [ ] Login docente con **Google Workspace educativo** (G Suite Edu OAuth).

---

## 🔵 P3 — Ola 3+ (backlog a futuro)

### Producto
- [ ] **Isla de las Ciencias** (Naturales + Sociales).
- [ ] **Isla de la Ciudadanía** (derechos, convivencia, datos argentinos).
- [ ] Grade_6 + grade_7 (último año de primaria en sistema argentino de 7 años).
- [ ] **Tutor IA "Ari"** (Claude/GPT con guardrails estrictos: no datos del chico, no sugerir hacer la tarea, solo ayudar a razonar).
- [ ] Modo **offline completo** (todos los ejercicios cacheados en IndexedDB para viajes/sin internet).
- [ ] **Modo familia**: varios hijos compiten semana a semana con medalla "campeón de la semana".

### Integraciones
- [ ] Google Classroom (el aula se carga desde ahí).
- [ ] WhatsApp/SMS double opt-in para consentimiento (padres sin email).
- [ ] H5P para ejercicios de autoría del docente.
- [ ] Grafo `concept_links` poblado con prerequisites reales del currículo argentino.

### Infra
- [ ] Multi-región (Argentina + Uruguay + Chile — currículo distinto, datos distintos).
- [ ] CDN propio para assets pesados.
- [ ] Migración a Supabase Pro con replica read para reportes.

---

## 🎨 UX backlog (refinamiento continuo)

- [ ] Animaciones de transición entre islas (palmera se mueve, olas).
- [ ] Sonidos ambientales sutiles (opcional, default off).
- [ ] Modo alto contraste para chicos con baja visión.
- [ ] Lectura en voz alta del enunciado (TTS) — importante para grade_1 que aún no lee fluido.
- [ ] Avatares personalizables (hoy hay 6 fijos).

---

## 🧪 Deuda técnica / refactor

- [ ] **Generar `types/database.ts`** con Supabase CLI codegen (hoy está escrito a mano y puede divergir del schema).
- [ ] Tests e2e con Playwright en CI (hoy hay solo smoke tests ad-hoc).
- [ ] Tests unitarios de `lib/adaptive/engine.ts` (la matemática del BKT).
- [ ] Reordenar `lib/` en dominios: `domain/auth`, `domain/student`, `domain/learning`.
- [ ] Quitar dependencia en `session.started_at` del método de detección de repaso diario (hoy lo uso en otros lados).

---

## 📌 Anti-roadmap (lo que NO vamos a hacer, nunca)

- ❌ Notificaciones push "Paulina te extraña, volvé a jugar".
- ❌ Compra in-app desde la cuenta del chico.
- ❌ Social / chat entre alumnos.
- ❌ Subir fotos/videos de chicos.
- ❌ Tracking con cookies de terceros.
- ❌ Ads de productos externos.
- ❌ Gamificación vacía tipo "energía" o "vidas" que obliga a esperar / pagar.

---

## 🗳️ Cómo priorizamos

Cada ítem responde a 3 preguntas. Si no pasa las 3, baja de prioridad:

1. **¿Mejora el aprendizaje real del chico?** (no solo engagement)
2. **¿Un padre lo pagaría o lo recomendaría?** (no solo "le gustaría")
3. **¿Nos comprometemos a mantenerlo 2 años?** (no solo hacerlo porque quedaría lindo)

Si la respuesta a alguna es "no" o "no sé", el ítem va a P3 o al anti-roadmap.
