# Guía Pedagógica de Revisión — Tinkú

## Introducción

Esta guía establece los criterios para revisar y aprobar ejercicios pedagógicos en Tinkú. Está diseñada para revisores (docentes, pedagogos) que evaluarán los 212 ejercicios seedeados.

---

## 1. Escala de Quality Score (1-5)

| Score | Definición | Significado |
|-------|------------|--------------|
| **5** | Ejercicio范例 — pedagogy perfecta | Listo para producción sin cambios. Uso como modelo para crear más ejercicios. |
| **4** | Muy bueno — minimos detalles menores | Apto para producción. может tener ajustes menores (wording, distractores menores). |
| **3** | Aceptable — cumple criterios mínimos | Producción usable. Requiere mejoras menores de clarity o distractor. Aprobar con nota. |
| **2** | Problemas significativos | Necesita revisión sustancial. Distractores obvios o concepto mal representado. |
| **1** | No usable — error fundamental | Rechazar. Error conceptual, respuesta correcta errónea, o distractores inválidos. |

### Criterios medibles por nivel:

**Score 5 (Ejemplar):**
- [ ] La pregunta es clara y sin ambigüedad para un niño de 6-12 años
- [ ] La respuesta correcta es objetivamente correcta
- [ ] Los distractores son todos plausibles (ninguno "obvio wrong")
- [ ] El nivel de dificultad coincide con la difficulty asignada
- [ ] El hint, si existe, guía sin dar la respuesta directa

**Score 4 (Muy bueno):**
- [ ] Cumple todos los criterios de 5
- [ ] Pero tiene detalles menores (wording mejorable, 1 distractor mejorable)

**Score 3 (Aceptable):**
- [ ] Funciona pedagógicamente
- [ ] Pero 1-2 distractores son mejorables
- [ ] O el wording podría ser más claro para niños

**Score 2 (Problemas):**
- [ ] Al menos 1 distractor es "obvio wrong" (error de cálculo común)
- [ ] O la difficulty no coincide con el contenido
- [ ] O la pregunta es confusa para el target age

**Score 1 (No usable):**
- [ ] La respuesta correcta es errónea
- [ ] O hay error conceptual en el contenido
- [ ] O los distractores no tienen sentido pedagógico

---

## 2. Criterios de Aprobación por Exercise Type

### 2.1 Multiple Choice (MCQ)

**Criterios obligatorios:**
1. **4 opciones** (el engine espera 4 botones)
2. **Una sola respuesta correcta** — ninguna ambigüedad
3. **Orden de opciones aleatorizable** — el engine debe randomizar el orden
4. **Distractores válidos** (ver sección 3)

**Para niños 6-12 años:**
- El prompt debe usar vocabulario apropiado para la edad
- Evitar negaciones complejas ("¿Cuál NO es...?")
- Las opciones numéricas deben tener spacing razonable
- Para numeric_input: el placeholder indica el formato esperado

**Ejemplo BUENO (MCQ):**
```
Prompt: ¿Cuánto es 23 + 14?
Options: [37] [47] [36] [38]
Correct: 37
```

**Ejemplo MALO (MCQ):**
```
Prompt: ¿Cuánto es 23 + 14?
Options: [37] [1] [2] [3]  ← distractores sin sentido
```

### 2.2 Numeric Input

**Criterios obligatorios:**
1. **Un solo valor numérico** como respuesta
2. **El input valida que sea número** (el frontend valida, el backend compara strings trimmeados)
3. **Placeholder claro** que indique el formato ("Ej: 125" o "Ej: -5")
4. **Para números negativos**, el prompt debe indicar claramente que puede ser negativo

**Para niños 6-12 años:**
- Evitar inputs que requieran más de un número (ej: fracciones,decimales complejos)
- El placeholder ayuda al niño a entender el formato esperado
- Para restas: a veces el resultado es negativo, debe estar claro en el prompt

**Ejemplo BUENO (Numeric Input):**
```
Prompt: ¿Cuánto es 15 - 23?
Placeholder: "Ej: -8"
Correct: "-8" (acepta "-8" o "-08")
```

**Ejemplo MALO (Numeric Input):**
```
Prompt: ¿Cuánto es 15 - 23?
(no placeholder, niño no sabe si puede usar negativo)
```

### 2.3 Fill Blank

**Criterios obligatorios:**
1. **Una sola palabra/frase como respuesta**
2. **El blank está claramente marcado** (usan placeholder en content)
3. **La respuesta es única** — no hay ambigüedad

### 2.4 Drag Drop / Matching

**Criterios obligatorios:**
1. **Cantidad igual de items y targets** (drag sources = drop targets)
2. **Cada item tiene exactamente una respuesta correcta**
3. **Múltiples combinaciones son posibles** — no hay un solo orden "correcto" único (salvo que sea así por diseño)

---

## 3. Reglas de Distractores para MCQ

### Regla de Oro

**Un distractor NO debe ser obviously wrong.** Un niño con conocimiento básico del tema debe poder eliminationar distractores incorrectos NO por cálculo incorrecto sino por razonamiento.

### Tipos de distractores

| Tipo | Ejemplo | ¿Aceptable? |
|------|---------|-------------|
| **Error de cálculo común** | 23+14=37, pero un niño suma mal: 23+10=33, +4=37 → distractor "37" | ❌ OBVIO WRONG |
| **Respuesta相近** | Pregunta: valor del 3 en 538 (30). Options: [3] [30] [300] [038] | ✅ Plausible |
| **Error sistemático** | 47 + 36 = 83. Distractor: 7+3=10, 4+6=10 → 73 | ❌ OBVIO WRONG (error común pero already wrong) |
| **Número irrelevante** | En 538, el 3 vale 30. Distractor: "538" | ✅ No related |
| **Inverso** | 47 - 36, distractor: 83 (inverso de la suma) | ✅ Plausible |

### Reglas específicas

1. **Al menos 1 distractor plausible** — uno que requiera pensarlo, no obvious
2. **Al menos 1 distractor no-trivial** — uno que un niño podría elegir wrong si no entiende bien
3. **Ningún distractor obviously wrong** — error de cálculo básicasNO como distractor

### Checklist de distractor

- [ ] ¿Puedes eliminationar al menos 1 distractor por ser obviously wrong?
- [ ] ¿Al menos 1 distractor requiere pensamiento, no solo memoria?
- [ ] ¿Hay algún distractor que sea un error de cálculo común (NO usar)?
- [ ] ¿Las opciones están en un rango razonable (no "1", "2", "3" randomly)?

---

## 4. Template de Checklist para Revisores

### Pre-review: Verificar el ejercicio

```
## Ejercicio: [ID o Title]
Concepto: [concept_name]
Difficulty: [easy/medium/hard]
Type: [MCQ/numeric_input/etc]

### Paso 1: Verificar la pregunta
- [ ] ¿El prompt es claro para un niño de [edad] años?
- [ ] ¿No hay ambigüedad en lo que se pregunta?
- [ ] ¿El vocabulario es apropiado?

### Paso 2: Verificar la respuesta
- [ ] ¿La respuesta correcta es OBJETIVAMENTE correcta?
- [ ] Verificar: [escribí el cálculo aqu ]

### Paso 3: Verificar distractores (si MCQ)
- [ ] Distractor 1: [opción] → [-plausible / -obvious wrong / -no sense]
- [ ] Distractor 2: [opción] → [-plausible / -obvious wrong / -no sense]
- [ ] Distractor 3: [opción] → [-plausible / -obvious wrong / -no sense]
- [ ] ¿Al menos 1 es plausible Y al menos 1 es no-trivial?

### Paso 4: Asignar score
[ ] Score: ___ / 5

### Paso 5: Decisión
[ ] Aprobar (score ≥ 3)
[ ] Necesita revisión (score = 2) → razón:
[ ] Rechazar (score = 1) → razón:

### Notas Pedagógicas (opcional)
[espacio para notas]
```

---

## 5. Ejemplos de Buenos vs Malos Ejercicios

### Ejemplo 1: Números hasta 1000

**MALO:**
```
Prompt: ¿Qué número va después del 249?
Options: [250] [251] [252] [349]  ← 349 es obviously wrong (no es consecutive)
```
❌ "349" no es plausible — cualquier niño sabe que el siguiente es 250.

**BUENO:**
```
Prompt: ¿Qué número va después del 249?
Options: [250] [300] [240] [251]
```
✅ "300" plausible (redondeo), "240" plausible (error de decade), "251" plausible (off by 1).

---

### Ejemplo 2: Suma con reagrupamiento

**MALO:**
```
Prompt: ¿Cuánto es 28 + 15?
Options: [43] [33] [13] [403]  ← 403 obviously wrong
```
❌ "403" no tiene sentido.

**BUENO:**
```
Prompt: ¿Cuánto es 28 + 15?
Options: [43] [33] [413] [40]
```
✅ "33" plausible (28+15=43 pero hace 28+5=33,忘记carry), "413" obviously wrong pero no obviously wrong de 43, "40" plausible (28+12=40).

---

### Ejemplo 3: Valor posicional

**MALO:**
```
Prompt: En el número 538, ¿qué valor tiene el 3?
Options: [3] [30] [300] [538]
```
❌ Las opciones están muy cerca — "3" y "30" ambos plausibles, pero "300" no.

**BUENO:**
```
Prompt: En el número 538, ¿qué valor tiene el 3?
Options: [3] [30] [300] [038]
```
✅ "3" ( еди), "30" (decenas), "300" (centenas), "038" (formato con cero alante). Todos plausibles.

---

## 6. Difficulty Guidelines por Edad

### Grade 1 (6-7 años): easy

- Números hasta 100 (no hasta 1000)
- Sumas/restas sin reagrupamiento
- Verbal/writing simple

### Grade 2 (7-8 años): easy/medium

- Números hasta 1000
- Sumas/restas con reagrupamiento básico
- Valor posicional

### Grade 3 (8-9 años): medium/hard

- Números más grandes
- Multiplicación/división básica
- Problemas de 2 pasos

---

## 7. Notes para el Reviewer

- **No rush:** Es mejor aprobar pocos bien que muchos mal.
- **Considera la frustración del niño:** Si un distractor es obviously wrong, el niño se frustra al elegirlo y sentirse "tonto".
- **El niño no knows cuando está wrong:** No puede self-correct easily — por eso los distractores importan.
- **El hint es ayuda, no cheating:** Un buen hint guía sin dar la respuesta.

---

## Apéndice: Cómo usar esta guía

### Flujo de revisión:

1. **Lee el ejercicio completo** (prompt + options + correcta)
2. **Verifica cada criterion** del checklist
3. **Asigna score** (1-5)
4. **Si score ≥ 3:** Aprueba, pasa al siguiente
5. **Si score = 2:** Nota por qué, marca para revisión
6. **Si score = 1:** Rechaza con razón

### Bulk review:

- Para review rápido: primeiro identifica los obviously wrong (score 1-2)
- Priority: los concepts con menos ejercicios approved (min 8 por concepto)
- Tags para track: pending → approved/rejected/needs_revision

---

*Versión: 1.0 | Fecha: 2026-04-18 | Para: Revision Pedagógica 212 Ejercicios*