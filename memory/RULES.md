# Tinkú — Reglas innegociables del proyecto

**Este archivo debe ser leído por cualquier agente (main o fork) al comenzar su trabajo. No negociable.**

## 🔴 Regla #1 — No gastar créditos/tokens innecesariamente

Javier lo dijo literal: *"la regla innegociable respecto a los creditos/tokens... grabala en la memoria para usarla siempre"*.

### Aplicación práctica (obligatoria)

1. **Paralelismo:** Siempre que haya operaciones independientes (creación de archivos, edits, lecturas, bash commands, typechecks, curls) → UNA sola tool-call message con múltiples invokes en paralelo. Nunca sequential si no hay dependencia.

2. **No loops Implement→Screenshot→Implement→Screenshot:** Implementar TODO el batch primero, después 1 (UNA) screenshot sanity check, después testing agent si corresponde.

3. **Screenshot sanity check, no verificación granular:** Para cambios múltiples, 1 screenshot al final alcanza. No screenshot por cambio.

4. **Testing agent solo al cerrar chunks grandes:** Cambios chicos → self-test con Playwright directo o curl. Testing agent consume muchos tokens — reservarlo para Fase completa o 5+ features juntas.

5. **No re-explicar lo ya hecho:** PRD.md es la fuente de verdad. No repetir el historial en cada mensaje.

6. **No ask_human redundantes:** Si la decisión tiene un default razonable y no es crítica, elegir y seguir. Preguntar solo lo bloqueante.

7. **Usar scripts reutilizables:** Para tareas de seed/migration/data-fix, crear un script en `/app/frontend/scripts/` en vez de hacer SQL inline. Queda versionado y reutilizable.

8. **No re-instalar dependencias ya instaladas** — leer `package.json` antes de `yarn add`.

9. **No re-leer archivos en contexto** — si ya los vi en esta sesión, no los vuelvo a leer.

10. **Commits / Save to GitHub son del usuario:** Si pide guardar, indicarle el botón "Save to Github". No tratar de hacerlo yo.

11. **Toda sugerencia va al ROADMAP.md.** Si al finalizar una tarea sugiero un "potential improvement" (o cualquier idea nueva de feature), **antes de devolver el finish** tengo que plasmarla en `/app/ROADMAP.md` en la sección P3 (o la que corresponda). Nunca dejar sugerencias flotando solo en el chat — se pierden.

### Excepciones aceptables
- Testing agent después de Fase completa (≥5 features o compliance legal).
- `web_search_tool_v2` cuando tengo duda real sobre API actual post-knowledge-cutoff.
- Re-leer archivo si detecto que mi edit anterior no se aplicó correctamente (diff verification).

## 🔴 Regla #2 — Idioma

Siempre responder en **español rioplatense** (vos, querés, mirá). Javier es argentino.

## 🔴 Regla #3 — Stack no negociable

- **Next.js 14 App Router + Supabase.** No Mongo, no FastAPI. El scaffold Emergent estándar fue reemplazado.
- **Server Actions, no REST `/api/*`** (el ingress k8s redirige `/api/*` al backend FastAPI no-usado → no funciona). Webhooks externos bajo `/webhooks/*`.
- **Credenciales solo en `.env.local`.** Nunca hardcodear.
- **RLS activo día 1 en TODA tabla.** Service role solo para writes legales (consentimientos, auth admin, audit log).

## 🔴 Regla #4 — UX infantil cuando sea para alumno

- Font Andika 18/24px.
- Tap targets ≥48/56px.
- Nunca rojo puro en errores (usa `tinku-warn` naranja).
- Celebraciones ≥1.5s de duración mínima antes de permitir cerrar.
- Sin menú hamburguesa en scope alumno.

## 🔴 Regla #5 — Legal

- Consentimiento parental: `parental_consents` event log inmutable con IP/UA/texto-versión.
- Auditoría: usar `logDataAccess()` en toda server action que lee/modifica datos del alumno.
- Derecho al olvido: 30 días grace period → cron `/webhooks/cron/anonymize` automático.
- Textos legales versionados en `/content/legal/consent-v*.md`.
