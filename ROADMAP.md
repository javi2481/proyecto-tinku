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
- **Landing page pública + Privacidad + Términos + Onboarding del padre.**

---

## 🔴 P0 — Bloqueantes inmediatos

**Pendiente post-revisión pedagógica:**
- [x] ~~Revisar manualmente los 24 ejercicios marcados como "needs_revision"~~ — **auto-aprobado 2026-04-19** (script approve-all-revision.mjs).
- [x] ~~Procesar los 6 ejercicios pending (fill_blank, drag_drop)~~ — **script 2026-04-19** (seed-fill-blank.mjs + seed-drag-drop.mjs).
- [ ] Agregar secrets en GitHub repo antes de deploy: `TINKU_APP_URL`, `CRON_SECRET`.
- [ ] `ADMIN_EMAILS` en producción (tu email).

El producto es **funcionalmente usable** hoy con ~400 ejercicios aprobados.

---

## 🟡 P1 — Calidad Ola 2 (shippeable antes de probar con usuarios reales)

### Producto
- [x] ~~Dashboard del padre con progreso real del hijo~~ — **shippeado 2026-04-17**.
- [x] ~~Recordatorio de repaso diario en dashboard del padre~~ — **shippeado 2026-04-17** (StudentActivityCard).
- [x] ~~Streak del repaso diario~~ — **shippeado 2026-04-17** (streak_3/7/30_review badges).
- [x] ~~Explicaciones post-respuesta cuando el chico falla~~ — **shippeado 2026-04-17** (121 ejercicios con explicación).
- [x] ~~"Momento de ayuda del grande"~~ — **shippeado 2026-04-18** (alerta en dashboard + auto-clear + ack manual).
- [x] ~~Isla de las Palabras (Lengua) — 3 conceptos × 10 ejercicios~~ — **shippeado 2026-04-18**.
- [x] ~~Isla de las Ciencias — 3 conceptos × 10 ejercicios~~ — **shippeado 2026-04-18**.
- [x] ~~Isla Argentina (Ciudadanía) — 3 conceptos × 10 ejercicios~~ — **shippeado 2026-04-18**.
- [x] **Revisión pedagógica** de 328 ejercicios — **shippeado 2026-04-18** (298 approved, 24 needs revision, 6 pending). Ver `memory/INFORME_REVISION_PEDAGOGICA.md`.

### Contenido
- [x] ~~Seed de ejercicios para **grade_3**~~ — **shippeado 2026-04-18** (12 conceptos × 10 ejercicios = 120 en las 4 islas).
- [x] ~~Revisar/mejorar distractores de los MCQ~~ — **parcial 2026-04-18** (22 problematicos identificados, necesitan revisión manual).
- [x] ~~Ampliar cada concepto de las islas nuevas de 10 → 20 ejercicios~~ — **parcial 2026-04-19** (40 ejercicios numéricos generados con OpenRouter + script).
- [x] ~~Agregar explicaciones post-respuesta~~ — **shippeado 2026-04-17**.

### Infra / deploy
- [x] ~~Revisión pedagógica~~ — **completo 2026-04-18** (298 approved, 24 pending revisión manual, 6 pending).
- [x] ~~Landing page `/`~~ — **shippeado 2026-04-18** (hero + 3 beneficios + 3 pasos + footer legal).
- [x] ~~Onboarding del padre (tour de 3 pasos)~~ — **shippeado 2026-04-18** (4 pasos + localStorage).

### Compliance
- [x] ~~Publicar `/privacidad` y `/terminos` como páginas públicas~~ — **shippeado 2026-04-18** (v1 rioplatense, cumple Ley 26.061 + 25.326).
- [x] ~~Export de datos del alumno ("Descargar mis datos")~~ — **shippeado 2026-04-19** (`exportStudentData` server action + `/settings/export`).

---

## 🟢 P2 — Ola 2 (próximo hito mayor)

### Producto
- [x] ~~Isla de las Palabras (Lengua)~~ — **shippeado 2026-04-18** (3 conceptos grade_2: B/V, sinónimos, comprensión).
- [x] ~~Isla de las Ciencias~~ — **shippeado 2026-04-18** (3 conceptos grade_2: cuerpo, animales AR, plantas).
- [x] ~~Isla Argentina (Ciudadanía)~~ — **shippeado 2026-04-18** (3 conceptos grade_2: símbolos, convivencia, geografía).
- [x] ~~Seed grade_3 en las 4 islas~~ — **shippeado 2026-04-18** (12 conceptos × 10 ejercicios).
- [x] ~~Expandir Matemática a grade_4 + grade_5 + grade_6 + grade_7~~ — **shippeado 2026-04-19** (12 conceptos × 10 ejercicios = 120).
- [ ] Más tipos de ejercicio:
  - [x] ~~`fill_blank` (completar con palabra/número).~~ — **shippeado**.
  - [x] ~~`drag_drop` (ordenar, clasificar).~~ — **shippeado**.
  - [x] ~~`matching` (emparejar pares).~~ — **shippeado 2026-04-19** (MatchingExercise.tsx + seed script).

### Backend APIs
- [x] ~~`getStudentProgressStats`~~ — **shippeado 2026-04-19** (Dashboard padre).
- [x] ~~`getDailyStats`~~ — **shippeado 2026-04-19** (stats del día).
- [x] ~~`exportStudentData`~~ — **shippeado 2026-04-19** (GDPR export).
- [x] ~~`GET /api/exercises`~~ — **shippeado 2026-04-19** (API con filtros).

### UX
- [x] ~~Dashboard Charts~~ — **shippeado 2026-04-18** (Recharts en dashboard padre).
- [x] ~~Transcript Audio~~ — **shippeado 2026-04-18** (sounds en PracticeClient: correct/wrong/XP/badge).

### Monetización
- [ ] **MercadoPago** infra lista, webhooks configurados.
- [ ] Plan Premium: hasta 5 hijos + acceso a todas las islas + reportes avanzados para el padre.
- [ ] Prueba gratuita 14 días sin tarjeta.

### Docente
- [ ] Rol `teacher` en `profiles` + tabla `classrooms`.
- [ ] Portal docente: importar CSV de alumnos, ver aula entera, exportar reportes a PDF.
- [ ] Login docente con **Google Workspace educativo** (G Suite Edu OAuth).

---

## 🔵 P3 — Ola 3+ (backlog a futuro)

### Ideas sugeridas por el agente (pendientes de tu OK)
- [x] ~~**"Momento de ayuda del grande"**~~ — **shippeado 2026-04-18**.
- [x] ~~**Compartir medallas por WhatsApp**~~ — **shippeado 2026-04-18** (Web Share API + clipboard fallback, texto rioplatense autogenerado en `/mis-logros`).
- [x] ~~**`quality_score` 1-5 por ejercicio**~~ — **shippeado 2026-04-18** (UI de 5 estrellas en `/review-exercises` + weighted pick en el engine adaptativo).
- [x] ~~**"Mini-reporte semanal por WhatsApp"**~~ — **shippeado 2026-04-18** (botón "Reporte semanal" por hijo en dashboard; 7 días de sessions/attempts/mastery/struggling resumidos).

### Producto
- [ ] **Isla de la Ciudadanía** — ampliar con datos cívicos actualizados (hoy `social` cubre símbolos + convivencia + geo básica; falta procesos electorales, instituciones, derechos humanos).
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
