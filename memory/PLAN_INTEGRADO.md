# Plan Integrado — Tinkú Ola 2.5

## 🎯 OBJETIVO

Agregar librerías clave pendientes + resolver blockers P0/P1 para mejorar la UX y preparar monetización.

---

## 📦 FASE 1: LIBRERÍAS NUEVAS

### 1.1 Motion (ex Framer Motion) — Animaciones岛上
**Install:** `npm install motion`
**Peso:** ~55kb
**Repo:** https://github.com/motiondivision/motion

**Uso previsto:**
- Transiciones entre islas (fade + slide)
- Celebraciones de correcto/incorrecto (más rico que solo confetti)
- Animaciones de feedback (rebote, scale)
- Transiciones de page transitions

**Alternativa:** Si no querés migrar, `framer-motion` sigue funcionando.

---

### 1.2 Howler.js + use-sound — Audio
**Install:** `npm install howler use-sound`
**Peso:** ~25kb + ~9kb
**Repo:** https://github.com/goldfire/howler.js

**Uso previsto:**
- SFX en ejercicios (correcto/incorrecto)
- Música de fondo en islas (opcional)
- Sonidos de UI (botones, transiciones)

**Implementación sugerida:**
- Crear hook `useAudio()` que cargue lazy
- Usar sprites para múltiples sonidos
- Crossfade entre pistas de música

---

### 1.3 Recharts — Dashboard padre
**Install:** `npm install recharts`
**Peso:** ~90kb tree-shakeable
**Repo:** https://github.com/recharts/recharts

**Uso previsto:**
- Gráfico de progreso por hijo (XP over time)
- Gráfico de streak semanal
- Gráfico de岛上 completadas por materia

---

## 🔴 FASE 2: P0 BLOCKERS

### 2.1 Secrets + Admin Emails ✅
```
TINKU_APP_URL=https://tinku.app
CRON_SECRET=<generar>
ADMIN_EMAILS=rjavierst@gmail.com
```
✅ COMPLETADO

### 2.2 Revisar 24 Ejercicios Problemáticos ✅
- Los marcados "needs_revision" en DB
- Distractores obviously wrong (±1)
- Revisados con OpenRouter (Llama 3.3 70B)
- 24 → 6 → 0 (eliminados todos)

### 2.3 Procesar 6 Pending ✅
- fill_blank y drag_drop no procesados
- Ya approved en revisión anterior

---

## 🟡 FASE 3: P1 CALIDAD

### 3.1 Ampliar Ejercicios
- 10 → 20 por concepto (prioridad: Math G1-G2)

### 3.2 Sentry Real
**Install:** `npm install @sentry/nextjs`
**Repo:** https://github.com/getsentry/sentry-javascript

### 3.3 Export Datos JSON
- Cumplimiento Ley 25.326

---

## 📋 ROADMAP INTEGRADO

| Fase | Item | Prioridad | Esfuerzo |
|------|------|----------|----------|
| 1.1 | Motion | P2 | Medium |
| 1.2 | Howler.js | P2 | Medium |
| 1.3 | Recharts | P1 | Low |
| 2.1 | Secrets | P0 | Low |
| 2.2 | Revisar 24 | P0 | High |
| 2.3 | Pending 6 | P0 | Low |
| 3.1 | Ampliar | P1 | High |
| 3.2 | Sentry | P1 | Medium |
| 3.3 | Export | P1 | Low |

---

## ⚡ SUGERENCIA DE ORDEN

1. **Primero P0** (2.1 → 2.2 → 2.3) — para poder desplegar
2. **Después librerías core** (1.1 → 1.2) — UX inmediato
3. **Después Recharts** (1.3) — dashboard mejora rápido
4. **Lo demás** (P1) — cuando haya usuarios

---

## 📝 ARCHIVOS A MODIFICAR

- `frontend/package.json` — agregar dependencias
- `frontend/src/app/layout.tsx` — agregar Sentry
- `scripts/` —可能被忽略
- ROADMAP.md — actualizar con progreso

---

## ✅ PRÓXIMO PASS

Elegí por dónde arrancamos:
1. **P0 Secrets** — rápido y necesario para producción
2. **Librerías** — Motion + Howler para UX
3. **Recharts** — dashboard del padre

¿Qué preferís?