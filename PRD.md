# Tinkú — Product Requirements Document

> Plataforma educativa para chicos de 6 a 12 años, con contenido alineado al currículo argentino (DNC) y datos verificados de cada región/provincia. Aprender jugando, de verdad.

---

## 🎯 Visión

**"Aprender jugando, de verdad."**

Tinkú acompaña a los chicos a descubrir Matemática, Lengua, Ciencias y Ciudadanía en un mundo de islas, con contenido del currículo argentino y datos reales — no con personajes genéricos ni traducciones mediocres de productos americanos. Se siente argentino (rioplatense en la voz, avatares diversos, historias locales) sin ser tosco.

Tinkú **complementa**, no reemplaza, la escuela. No es una tarea más, es un rato del día que el chico elige.

---

## 👥 Personas

### 1. Paulina — La alumna (6 a 12 años)
- Usa Tinkú en la tablet/compu de la casa.
- No tiene email, no tiene contraseña propia, no tiene teléfono.
- Entra con un **código de 6 caracteres** que le da el padre.
- Quiere jugar, ver medallas, competir contra sí misma. No quiere sentirse en la escuela.

### 2. Javier — El padre/madre (30–50 años)
- Paga o decide si se paga.
- Quiere ver **progreso real** de su hija, no métricas de engagement infladas.
- Valora la privacidad de datos del menor (Ley 26.061 / 25.326).
- No tiene tiempo: tiene que poder configurar todo en ≤5 minutos.

### 3. La maestra (Ola 3+)
- Quiere una foto del aula: qué temas flojean, qué alumnos necesitan refuerzo.
- No quiere otro login más: idealmente usa Google Workspace educativo.

---

## 🧱 Requisitos funcionales (Ola 1)

### Auth del padre
- [x] Signup con email + password (Supabase Auth).
- [x] Login con Google OAuth (Supabase provider).
- [x] Doble opt-in por email (Resend en sandbox; DNS pendiente).
- [x] Para usuarios Google: email_double_opt_in_completed=true automático.

### Gestión de hijos
- [x] Crear alumno con **consentimiento parental explícito** versionado.
- [x] IP + User-Agent registrados en `parental_consents` (event log inmutable).
- [x] Edición de datos del hijo (nombre, grado, avatar).
- [x] Regenerar código de ingreso.
- [x] Solicitud de baja con **30 días de gracia** + cancelación posible.
- [x] Plan free: 1 hijo. Plan premium (futuro): hasta 5.

### Auth del alumno
- [x] Login por código de 6 caracteres (sin O, 0, I, 1).
- [x] **Anonymous Sign-in** de Supabase vinculado al student.
- [x] Rate-limit por IP en `/entrar`.
- [x] Sesión persistente (cookies httpOnly).

### Experiencia del alumno
- [x] Mapa de islas (**4 islas activas**: Números, Palabras, Ciencias, Argentina).
- [x] Grid de conceptos por grado con progress bar de `p_known`.
- [x] **Motor adaptativo** (BKT simplificado) que ajusta dificultad — funciona transparentemente en las 4 islas.
- [x] Tipos de ejercicio: `multiple_choice`, `numeric_input`.
- [x] Feedback positivo (sin rojos), celebraciones ≥1.5s.
- [x] Badges + XP + streak.
- [x] Página "Mis medallas" (ganadas + para desbloquear).
- [x] **Modo repaso diario 5 min** — 5 ejercicios de conceptos más flojos.
- [x] **"Momento de ayuda del grande"** — 2 fails seguidos en un concepto → alerta en dashboard del padre; se limpia sola cuando acierta o el padre confirma "ya lo ayudé".

### Compliance legal
- [x] RLS activo en las 17 tablas (31 políticas).
- [x] Consentimiento parental con texto versionado (`/content/legal/consent-v1.md`).
- [x] Auditoría centralizada (`data_access_log` + helper `logDataAccess`).
- [x] Anonimización automática tras 30 días de baja solicitada (cron).
- [x] Datos del menor minimizados: solo `first_name` + `birth_year` + `grade` + `avatar_id`.

### PWA / accesibilidad
- [x] `manifest.webmanifest` + iconos PNG (192/512/180 apple-touch) + SVG.
- [x] Service worker con cache-first de assets + offline fallback.
- [x] Tap targets ≥48px.
- [x] Font Andika (alta legibilidad infantil).

### Admin / ops
- [x] Review pedagógica de ejercicios (`/review-exercises`, admin-only).
- [x] Seeds idempotentes para contenido.
- [x] Logs estructurados en `app_logs`.

---

## 🚫 Requisitos NO funcionales (qué NO es Tinkú en Ola 1)

- **No** reemplaza a la escuela.
- **No** tiene chat entre chicos (ningún tipo de social).
- **No** guarda fotos/videos del chico.
- **No** tiene anuncios.
- **No** compra in-app (el padre decide plan premium desde el panel, no el chico).
- **No** tracking con cookies de terceros (solo first-party analytics).

---

## 📐 Principios de producto

1. **Chico primero, padre después, maestro en la esquina.** La UX del chico nunca se compromete por una feature del panel del padre.
2. **Confianza sobre gamificación barata.** Preferimos un progreso lento y real a un fuego de XP que no correlaciona con aprender.
3. **Argentino sin ser chabacano.** Voseo sí, memes de TikTok no.
4. **Un minuto en Tinkú vale más que 20 copiando del pizarrón.** Cada interacción tiene que moverle la aguja.
5. **Privacidad es feature, no compliance.** Los padres van a elegir Tinkú porque cuida a sus hijos, no a pesar.

---

## 🧮 Modelo de datos (resumen)

Tablas principales (ver `/supabase/migrations/0001_initial_schema.sql` para detalle):

- **profiles** — padres (1:1 con `auth.users`)
- **subscriptions** — plan por padre
- **students** — hijos
- **parental_consents** — log inmutable de consentimientos (granted/revoked)
- **concepts** — unidades pedagógicas (grade + primary_subject + display_order)
- **exercises** — MCQ + numeric_input + futures types
- **exercise_concepts** — pivot many-to-many con weight
- **sessions** + **attempts** — interacciones del alumno
- **concept_mastery** — estado BKT por concepto (p_known, total_attempts, is_mastered)
- **badges_catalog** + **student_badges** — gamificación
- **email_verifications** — tokens doble opt-in
- **data_access_log** — auditoría (inmutable, cumple Ley 25.326)
- **app_logs** — logs estructurados de la app

---

## 🔑 Stack técnico

- **Frontend + backend:** Next.js 14.2 App Router (React Server Components + Server Actions).
- **DB + Auth:** Supabase (Postgres 17.6 + RLS + Anonymous Sign-ins + Google OAuth).
- **Lenguaje:** TypeScript strict.
- **Estilos:** Tailwind + design tokens Tinkú (variables CSS).
- **Fonts:** Andika (alumno), Inter (padre).
- **Icons:** Lucide + emojis curados.
- **Email:** (eliminado en Ola 2; no usamos Resend; auth padre es solo Google OAuth).
- **Hosting:** Emergent preview (dev); pendiente decisión producción.

---

## 🌎 Idioma y localización

- **Todo el contenido:** español rioplatense (`es-AR`).
- Voseo: "vos tenés", "vos sabés" (no "tú").
- Expresiones permitidas: "dale", "qué fiera", "genial", "acá".
- Expresiones **prohibidas**: "guay", "chévere", "molón" (no españolas ni caribeñas).
- Fechas: formato argentino (`17 de abril`).
- Números: separador decimal "," (ej: "2,5"), separador de miles "." (ej: "1.234").

---

## 📊 Métricas que importan (KPIs Ola 1)

1. **Retención D7 / D30** del alumno.
2. **Tasa de completitud del repaso diario.**
3. **Tiempo en app por sesión** (target: 6–12 min; más es sospechoso).
4. **Conceptos dominados por alumno** (masa de aprendizaje real).
5. **NPS del padre** (encuesta tras 30 días).

Anti-KPIs (métricas que NO miramos):
- DAU/MAU como vanity.
- Número de notificaciones enviadas.
- Tiempo total por mes (queremos menos, no más).

---

## 🗺️ Roadmap de alto nivel

- **Ola 1** (hecho) — Matemática grade_1/2. Padre + alumno + motor adaptativo. ✅
- **Ola 2** (casi cerrada) — 4 islas activas (Math + Palabras + Ciencias + Argentina) en grade_2 y grade_3 ✅. Reporte semanal + compartir medallas + quality_score ✅. MercadoPago premium 🔜. Portal docente básico 🔜.
- **Ola 3** — Multi-grado (4 a 7). Integración con Google Classroom.
- **Ola 4** — Tutor IA "Ari" (Claude/GPT con guardrails infantiles estrictos).

Ver `ROADMAP.md` para detalle priorizado.
