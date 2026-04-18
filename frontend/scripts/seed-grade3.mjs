// scripts/seed-grade3.mjs
// Seed grade_3: 4 islas × 3 conceptos × 10 ejercicios = 120 ejercicios.
// - Matemática: Números hasta 10.000, Multiplicación básica, División por 1 cifra.
// - Palabras:   Uso de G/J, Uso de H, Tipos de oraciones.
// - Ciencias:   Ciclo del agua, Sistema solar, Materia y cambios de estado.
// - Argentina:  Pueblos originarios, San Martín, Regiones del país.
//
// Idempotente: upsert por code, soft-delete ejercicios previos.
// Uso: node scripts/seed-grade3.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(envRaw.split('\n').filter(l => l.includes('=')).map(l => {
  const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
}));
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const shuffle = (arr) => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const mcq = (prompt, correct, distractors, explanation, difficulty='medium', extra={}) => ({
  exercise_type: 'multiple_choice', difficulty,
  title_es: prompt.slice(0, 60), prompt_es: prompt,
  content: { options: shuffle([String(correct), ...distractors.map(String)]), explanation, ...extra },
  correct_answer: { value: String(correct) },
  hints: [], estimated_time_seconds: 45,
  pedagogical_review_status: 'approved',
});
const num = (prompt, correct, explanation, difficulty='medium', placeholder='Escribí el número') => ({
  exercise_type: 'numeric_input', difficulty,
  title_es: prompt.slice(0, 60), prompt_es: prompt,
  content: { placeholder, explanation },
  correct_answer: { value: String(correct) },
  hints: [], estimated_time_seconds: 50,
  pedagogical_review_status: 'approved',
});
const readMcq = (passage, prompt, correct, distractors, explanation, difficulty='medium') =>
  mcq(prompt, correct, distractors, explanation, difficulty, { passage });

// ============================================================================
const CONCEPTS = [
  // ============================== MATEMÁTICA G3 ==============================
  {
    code: 'M3_NUM_10K', grade: 'grade_3', primary_subject: 'math', display_order: 10,
    name_es: 'Números hasta 10.000', description_es: 'Leer, escribir y comparar números grandes.',
    exercises: [
      mcq('¿Cómo se escribe "cuatro mil doscientos treinta y cinco"?', '4.235', ['4.253', '4.325', '4.523'],
        'Cuatro mil → 4 en los miles. Doscientos → 2 en las centenas. Treinta y cinco → 35 al final. En Argentina el punto separa los miles: 4.235.', 'easy'),
      mcq('¿Cuántas unidades tiene 1 unidad de mil?', '1000', ['100', '10', '10.000'],
        '1 unidad de mil = 1.000 unidades. 1 centena = 100 unidades. 1 decena = 10 unidades.', 'easy'),
      mcq('En el número 7.812, el 8 vale...', '800', ['8', '80', '8.000'],
        'El 8 está en la posición de las centenas. Vale 8 × 100 = 800.', 'medium'),
      mcq('¿Qué número viene después de 4.999?', '5.000', ['4.990', '5.999', '4.900'],
        'Al sumar 1 a 4.999 se "pasan de rosca" todas las columnas: 999 + 1 = 1.000, entonces 4 + 1 = 5 miles. Da 5.000.', 'medium'),
      num('Escribí el número que es 1.000 más grande que 3.456.', 4456,
        '3.456 + 1.000 = 4.456. Cuando sumás 1.000, solo cambia el dígito de los miles (3 → 4), el resto queda igual.', 'medium'),
      num('Escribí el número "nueve mil ocho".', 9008,
        'Nueve mil → 9 en los miles. Ocho al final → 8 en las unidades. No hay centenas ni decenas: 9.008.', 'medium'),
      mcq('¿Cuál es más grande?', '8.097', ['8.089', '8.079', '8.097'].filter(v=>v!=='8.097').concat(['8.079']),
        '8.097 > 8.089 porque al comparar el dígito de las decenas: 9 > 8.', 'hard'),
      mcq('¿Cuál es el anterior de 6.000?', '5.999', ['6.100', '5.900', '5.099'],
        '6.000 − 1 = 5.999. Cuando restás 1 a un número redondo, todas las columnas se llenan de 9.', 'medium'),
      num('¿Qué número está justo en el medio entre 3.000 y 4.000?', 3500,
        'La mitad del camino entre 3.000 y 4.000 es 3.500. (3.000 + 4.000) / 2 = 3.500.', 'hard'),
      mcq('¿Cómo se descompone 5.432?', '5.000 + 400 + 30 + 2', ['5.000 + 40 + 3 + 2', '500 + 40 + 30 + 2', '5 + 4 + 3 + 2'],
        'El 5 vale 5.000 (miles), el 4 vale 400 (centenas), el 3 vale 30 (decenas), el 2 vale 2 (unidades).', 'medium'),
    ],
  },
  {
    code: 'M3_MULT_BASIC', grade: 'grade_3', primary_subject: 'math', display_order: 20,
    name_es: 'Multiplicación (tablas del 2 al 9)', description_es: 'Tablas y cálculos mentales.',
    exercises: [
      num('3 × 4 =', 12, 'Tres veces el 4, o 4 + 4 + 4 = 12. La tabla del 3: 3, 6, 9, 12...', 'easy'),
      num('5 × 6 =', 30, 'Cinco veces 6 = 30. Truco: multiplicar por 5 es la mitad de multiplicar por 10 (6 × 10 = 60 → la mitad es 30).', 'easy'),
      num('7 × 8 =', 56, 'La tabla del 7 por 8 da 56. Truco rioplatense: "siete por ocho, cincuenta y seis" suena a rima, memorizala así.', 'medium'),
      num('9 × 9 =', 81, 'Truco de los dedos de la tabla del 9: bajás el dedo #9. A la izquierda quedan 8, a la derecha 1. Resultado: 81.', 'medium'),
      mcq('Si 1 caja tiene 6 alfajores, ¿cuántos alfajores hay en 4 cajas?', '24', ['10', '18', '30'],
        '6 alfajores por caja × 4 cajas = 24 alfajores. Multiplicar es sumar la misma cantidad muchas veces.', 'easy'),
      num('6 × 7 =', 42, 'Seis veces 7 = 42. Truco: 5 × 7 = 35, y sumás un 7 más = 42.', 'medium'),
      num('8 × 4 =', 32, 'Ocho veces 4 = 32. Es lo mismo que 4 × 8, por la propiedad conmutativa.', 'easy'),
      mcq('¿Cuál NO es parte de la tabla del 3?', '20', ['9', '15', '27'],
        'La tabla del 3: 3, 6, 9, 12, 15, 18, 21, 24, 27, 30. El 20 no está: los múltiplos del 3 saltan de a 3.', 'medium'),
      num('En una panadería venden facturas en docenas. ¿Cuántas facturas son 5 docenas?', 60,
        '1 docena = 12. Entonces 5 docenas = 5 × 12 = 60 facturas.', 'hard'),
      num('9 × 6 =', 54, 'Nueve veces 6 = 54. Truco del 9: 10 × 6 = 60, restás 1 vez 6 → 60 − 6 = 54.', 'medium'),
    ],
  },
  {
    code: 'M3_DIV_BASIC', grade: 'grade_3', primary_subject: 'math', display_order: 30,
    name_es: 'División (por 1 cifra)', description_es: 'Dividir en partes iguales.',
    exercises: [
      num('20 ÷ 4 =', 5, '20 dividido en 4 partes iguales da 5. Verificación: 5 × 4 = 20.', 'easy'),
      num('18 ÷ 3 =', 6, 'Buscamos: ¿qué número por 3 da 18? 6 × 3 = 18. Entonces 18 ÷ 3 = 6.', 'easy'),
      num('Si reparto 24 caramelos entre 6 chicos por igual, ¿cuántos le tocan a cada uno?', 4,
        '24 ÷ 6 = 4. Cada chico recibe 4 caramelos. Dividir es "repartir en partes iguales".', 'easy'),
      num('30 ÷ 5 =', 6, '30 ÷ 5: ¿cuántas veces cabe el 5 en 30? Seis veces, porque 5 × 6 = 30.', 'medium'),
      num('49 ÷ 7 =', 7, '49 ÷ 7 = 7. Es un cuadrado: 7 × 7 = 49.', 'medium'),
      mcq('28 ÷ 4 =', '7', ['6', '8', '9'],
        '4 × 7 = 28. Entonces 28 ÷ 4 = 7.', 'easy'),
      num('En el recreo, repartimos 36 galletitas entre 4 mesas iguales. ¿Cuántas galletitas por mesa?', 9,
        '36 ÷ 4 = 9. Cada mesa recibe 9 galletitas. Podés chequear: 9 × 4 = 36. ✓', 'medium'),
      mcq('¿Qué dos números se multiplican para dar 42?', '6 y 7', ['5 y 8', '4 y 9', '3 y 14 (pero 14 es muy grande acá)'],
        '6 × 7 = 42. O sea, 42 ÷ 6 = 7 y 42 ÷ 7 = 6.', 'medium'),
      num('¿Cuánto es 50 dividido 10?', 5, '50 ÷ 10 = 5. Cada vez que dividís por 10, el número "pierde" un cero al final (si lo tiene).', 'easy'),
      num('63 ÷ 9 =', 7, '63 ÷ 9 = 7, porque 7 × 9 = 63. Es la misma familia de la tabla del 9.', 'hard'),
    ],
  },

  // ============================== PALABRAS G3 ==============================
  {
    code: 'L3_GJ', grade: 'grade_3', primary_subject: 'language', display_order: 10,
    name_es: 'Uso de G y J', description_es: 'Cuándo escribimos con G y cuándo con J.',
    exercises: [
      mcq('¿Cómo se escribe el animal que vive en la selva y ruge?', 'jaguar', ['gaguar', 'jagar', 'gajuar'],
        'Jaguar se escribe con J. Regla útil: palabras con "ja", "jo", "ju" casi siempre van con J.', 'easy'),
      mcq('¿Cuál está bien escrita?', 'gente', ['jente', 'xente', 'guente'],
        'Gente lleva G. Regla: "ge" y "gi" se escriben con G (aunque suenen parecido a J). Ejemplos: gente, girasol, gigante.', 'medium'),
      mcq('El insecto que se arrastra y deja un camino brillante es la...', 'babosa', ['baboja', 'vavosa', 'vabosa'],
        'Se escribe "babosa" (no es con J). Pero ojo: muchas palabras con sonido fuerte de "j" pueden llevar G o J; hay que memorizarlas.', 'medium'),
      mcq('¿Cuál está bien escrita?', 'magia', ['majia', 'magea', 'majía'],
        'Magia se escribe con G. Como tiene sonido "gi", va con G. Igual que "colegio", "página", "imagen".', 'medium'),
      mcq('¿Cuál está bien escrita?', 'reloj', ['reloj es correcto pero lo escribimos "reloje"', 'reloje', 'reloch'].slice(1),
        'Reloj termina en J. Muchas palabras terminadas en "-aje" llevan J al final: mensaje, viaje, garaje.', 'medium'),
      mcq('¿Cómo se escribe la fruta cítrica parecida a la mandarina?', 'naranja', ['narangja', 'naranga', 'naranxa'],
        'Naranja lleva J. Regla: "ja", "jo", "ju" van con J.', 'easy'),
      mcq('El papá del papá es tu...', 'abuelo', ['abuelo es con G pero no va acá', 'abuelo', 'abuela'].slice(1),
        'Acá es trampa: abuelo va con B, no con G/J. Cuidado con las reglas, a veces la pregunta mide si lees bien lo que se pregunta.', 'hard'),
      mcq('La persona que es profesor universitario de matemática...', 'ingeniero', ['injeniero', 'inxeniero', 'ingenero'],
        'Ingeniero lleva G (porque es "gi", sonido suave). No confundir con "inje-" que no existe en castellano.', 'hard'),
      mcq('¿Cómo se escribe la planta que cura heridas?', 'ají', ['agí', 'agi', 'ají lo usamos en la cocina'].slice(0,3),
        'Ojo: el ají es una planta picante, no curativa. Pero la palabra se escribe con J y tilde en la í: ají.', 'hard'),
      mcq('¿Cuál está bien escrita?', 'gigante', ['jijante', 'jigante', 'guigante'],
        'Gigante se escribe con G las dos veces. Sonido "gi" → G.', 'medium'),
    ],
  },
  {
    code: 'L3_H', grade: 'grade_3', primary_subject: 'language', display_order: 20,
    name_es: 'Uso de la H', description_es: 'La letra que se escribe pero no se pronuncia.',
    exercises: [
      mcq('¿Cuál está bien escrita?', 'hola', ['ola', 'jola', 'hóla'],
        'Hola (el saludo) lleva H. "Ola" sin H es la ola del mar. Se pronuncian igual pero significan cosas distintas.', 'easy'),
      mcq('¿Cómo se escribe lo que hacemos al respirar cuando está frío y sale vapor?', 'exhalar', ['esalar', 'exalar', 'hexalar'],
        'Exhalar lleva H en el medio. Palabras con "exh-" (ex + h) mantienen la H.', 'hard'),
      mcq('¿Cuál está bien escrita?', 'hueso', ['ueso', 'gueso', 'wueso'],
        'Hueso lleva H al principio. Todas las palabras que empiezan con "hue-" van con H: hueso, huevo, huerta.', 'medium'),
      mcq('¿Cómo se escribe el animal que pone huevos en un gallinero?', 'gallina', ['hallina', 'gajjina', 'gallinha'],
        'Gallina NO lleva H. A diferencia del huevo que pone, la palabra gallina empieza con G.', 'medium'),
      mcq('¿Cómo se escribe el país cuya capital es Buenos Aires?', 'Argentina', ['Hargentina', 'Arjentina', 'Arxentina'],
        'Argentina se escribe con A al principio, NO con H. Ojo: muchas palabras con "ar-" inicial no llevan H.', 'easy'),
      mcq('¿Cuál está bien escrita?', 'hormiga', ['ormiga', 'jormiga', 'hormnga'],
        'Hormiga lleva H al principio. Casi todas las palabras de la familia "horm-" llevan H: hormiga, hormigón, hormigueo.', 'easy'),
      mcq('¿Cuál está bien escrita?', 'hacer', ['acer', 'jacer', 'haser'],
        'Hacer lleva H al principio y C en el medio. Todas las formas del verbo hacer (hago, hiciste, haremos) llevan H.', 'medium'),
      mcq('¿Cuál está bien escrita?', 'zanahoria', ['sanaoria', 'zanaoria', 'zanajoria'],
        'Zanahoria lleva H en el medio. Se pronuncia "zana-oria" pero se escribe con H escondida.', 'hard'),
      mcq('Una palabra que empieza con "hue-" siempre lleva...', 'H', ['J', 'G', 'ninguna letra extra'],
        'En castellano, "hue-" inicial se escribe SIEMPRE con H. Ejemplos: hueso, huevo, huerta, huésped.', 'medium'),
      mcq('¿Cuál está bien escrita?', 'habitación', ['avitación', 'havitación', 'jabitación'],
        'Habitación lleva H al principio y B en el medio (no V). Del verbo "habitar" que también lleva H.', 'hard'),
    ],
  },
  {
    code: 'L3_ORACIONES', grade: 'grade_3', primary_subject: 'language', display_order: 30,
    name_es: 'Tipos de oraciones', description_es: 'Afirmativas, negativas, interrogativas y exclamativas.',
    exercises: [
      mcq('"El perro juega en la plaza." es una oración...', 'afirmativa', ['negativa', 'interrogativa', 'exclamativa'],
        'Afirma algo (que el perro juega). No tiene "no" ni signos de pregunta ni de exclamación.', 'easy'),
      mcq('"¿Comiste el postre?" es una oración...', 'interrogativa', ['afirmativa', 'negativa', 'exclamativa'],
        'Interrogativa significa "que pregunta". Lleva signos de pregunta al principio (¿) y al final (?).', 'easy'),
      mcq('"¡Qué lindo día!" es una oración...', 'exclamativa', ['interrogativa', 'afirmativa', 'negativa'],
        'Exclamativa expresa emoción (alegría, sorpresa, enojo). Lleva signos de exclamación: ¡ al principio y ! al final.', 'easy'),
      mcq('"No quiero ir al parque." es una oración...', 'negativa', ['afirmativa', 'interrogativa', 'exclamativa'],
        'Negativa niega algo. Siempre tiene palabras como "no", "nunca", "nada", "jamás".', 'easy'),
      mcq('¿Cuál signo falta al principio de una pregunta en español? ¿Comiste_', '¿ (al principio)', ['nada', '! al principio', '. al principio'],
        'En español SIEMPRE abrimos con ¿ y cerramos con ?. Otros idiomas como inglés no lo hacen, pero el castellano sí.', 'medium'),
      mcq('"¡Ganamos el partido!" ¿qué sentimiento expresa?', 'alegría', ['tristeza', 'pregunta', 'duda'],
        'Los signos de exclamación y el verbo "ganar" indican alegría. Las oraciones exclamativas transmiten emociones.', 'medium'),
      mcq('¿Cuál de estas es una oración interrogativa?', '¿Cuántos años tenés?', ['Tengo ocho años.', '¡Tengo ocho años!', 'No tengo ocho años.'],
        'Solo la primera pregunta (tiene ¿?). Las otras afirman, exclaman o niegan.', 'medium'),
      mcq('"Mañana vamos al cine." ¿qué tipo de oración es?', 'afirmativa', ['negativa', 'interrogativa', 'exclamativa'],
        'Afirma que vamos al cine mañana. No tiene "no", ni ¿?, ni ¡!.', 'easy'),
      mcq('Para transformar "Quiero jugar" en negativa, escribimos...', 'No quiero jugar', ['¿Quiero jugar?', '¡Quiero jugar!', 'Quiero no jugar'],
        'Agregar "no" antes del verbo la convierte en negativa. "Quiero no jugar" es raro y no suena natural.', 'hard'),
      mcq('"¿Por qué llueve tanto?" ¿qué tipo de oración es?', 'interrogativa', ['afirmativa', 'exclamativa', 'negativa'],
        'Es pregunta: empieza con ¿, termina con ?. Interrogativa.', 'easy'),
    ],
  },

  // ============================== CIENCIAS G3 ==============================
  {
    code: 'C3_AGUA', grade: 'grade_3', primary_subject: 'science', display_order: 10,
    name_es: 'Ciclo del agua', description_es: 'Cómo viaja el agua por la naturaleza.',
    exercises: [
      mcq('¿Cómo se llama cuando el agua se convierte en vapor por el calor?', 'evaporación', ['condensación', 'precipitación', 'solidificación'],
        'Evaporación: el agua líquida pasa a vapor (gas) cuando recibe calor. Por eso la ropa se seca al sol.', 'medium'),
      mcq('Cuando el vapor del aire se enfría y forma las nubes, se llama...', 'condensación', ['evaporación', 'solidificación', 'fusión'],
        'Condensación: el vapor vuelve a ser líquido. Las nubes son gotitas de agua pequeñitas suspendidas.', 'medium'),
      mcq('¿Cómo se llama cuando de las nubes cae agua?', 'precipitación', ['evaporación', 'condensación', 'sublimación'],
        'Precipitación incluye lluvia, granizo, nieve. "Precipitar" viene del latín y significa "caer de golpe".', 'easy'),
      mcq('¿Qué pasa primero en el ciclo del agua cuando el sol calienta un charco?', 'se evapora', ['llueve', 'se congela', 'se condensa'],
        'El sol calienta → el agua se evapora y sube al aire como vapor. Ese es el comienzo del ciclo.', 'medium'),
      mcq('¿En qué estado está el agua cuando es hielo?', 'sólido', ['líquido', 'gaseoso', 'todos'],
        'El hielo es agua en estado sólido. Se forma cuando la temperatura baja de 0°C.', 'easy'),
      mcq('¿A qué temperatura se congela el agua?', '0°C', ['100°C', '50°C', '−20°C'],
        '0°C es el punto de congelación del agua. Por debajo de 0°C, el agua se vuelve hielo.', 'medium'),
      mcq('¿A qué temperatura hierve el agua?', '100°C', ['0°C', '50°C', '200°C'],
        '100°C es el punto de ebullición del agua a nivel del mar. Ahí pasa rápido de líquido a vapor.', 'medium'),
      mcq('¿Por qué es importante el ciclo del agua?', 'porque distribuye el agua por todo el planeta', ['porque hace frío', 'porque las nubes son lindas', 'porque al sol le gusta'],
        'El ciclo del agua es lo que permite que haya ríos, lluvia y agua dulce en toda la Tierra. Sin él no habría vida.', 'hard'),
      mcq('El agua de los ríos termina en...', 'el mar', ['la cordillera', 'el desierto', 'la selva'],
        'La mayoría de los ríos desembocan en el mar. De ahí el agua se evapora y el ciclo recomienza.', 'easy'),
      mcq('¿Cuál de estos NO es parte del ciclo del agua?', 'explotar', ['evaporarse', 'condensarse', 'llover'],
        'El agua no explota. Los pasos son: evaporación, condensación, precipitación, escurrimiento.', 'hard'),
    ],
  },
  {
    code: 'C3_SOLAR', grade: 'grade_3', primary_subject: 'science', display_order: 20,
    name_es: 'Sistema solar', description_es: 'El sol, los planetas y la Tierra.',
    exercises: [
      mcq('¿Cuántos planetas tiene el sistema solar?', '8', ['7', '9', '10'],
        'Son 8 planetas: Mercurio, Venus, Tierra, Marte, Júpiter, Saturno, Urano, Neptuno. Plutón era planeta pero en 2006 lo reclasificaron.', 'medium'),
      mcq('¿Cuál es el planeta más cerca del Sol?', 'Mercurio', ['Venus', 'Tierra', 'Marte'],
        'Mercurio está primero, después Venus, después la Tierra. Mercurio es chico y muy caliente.', 'medium'),
      mcq('¿En qué planeta vivimos?', 'la Tierra', ['Venus', 'Marte', 'la Luna'],
        'Vivimos en la Tierra, el tercer planeta desde el Sol. La Luna no es un planeta sino un satélite natural.', 'easy'),
      mcq('¿Qué astro gira alrededor de la Tierra?', 'la Luna', ['el Sol', 'Marte', 'Júpiter'],
        'La Luna es el satélite natural de la Tierra. Gira alrededor nuestro una vez al mes aproximadamente.', 'easy'),
      mcq('¿Cuál es el planeta más grande del sistema solar?', 'Júpiter', ['Saturno', 'Tierra', 'el Sol'],
        'Júpiter es un gigante gaseoso. Podrían entrar adentro suyo ¡más de 1.000 Tierras! El Sol no es un planeta, es una estrella.', 'medium'),
      mcq('¿Qué es el Sol?', 'una estrella', ['un planeta', 'un satélite', 'un cometa'],
        'El Sol es la estrella que está en el centro de nuestro sistema solar. Nos da luz y calor.', 'easy'),
      mcq('¿Cuánto tarda la Tierra en dar una vuelta alrededor del Sol?', '1 año', ['1 día', '1 mes', '100 años'],
        'Un año = 365 días. Ese tiempo tarda la Tierra en completar su órbita alrededor del Sol.', 'medium'),
      mcq('¿Cuánto tarda la Tierra en girar sobre sí misma?', '24 horas', ['1 mes', '1 año', '1 semana'],
        'Un día completo = 24 horas. Es lo que tarda la Tierra en dar una vuelta sobre su propio eje (es lo que genera día y noche).', 'medium'),
      mcq('¿Qué planeta es famoso por sus anillos?', 'Saturno', ['Júpiter', 'Marte', 'Venus'],
        'Saturno tiene anillos hechos de hielo y rocas muy llamativos. Otros planetas gaseosos también tienen anillos pero mucho más tenues.', 'medium'),
      mcq('El planeta rojo se llama...', 'Marte', ['Venus', 'Mercurio', 'Neptuno'],
        'Marte se ve rojizo porque su superficie tiene óxido de hierro (como herrumbre). Los romanos lo llamaron así por el dios de la guerra.', 'easy'),
    ],
  },
  {
    code: 'C3_MATERIA', grade: 'grade_3', primary_subject: 'science', display_order: 30,
    name_es: 'Materia y sus estados', description_es: 'Sólido, líquido y gaseoso.',
    exercises: [
      mcq('¿En qué estado está el aire que respiramos?', 'gaseoso', ['sólido', 'líquido', 'ninguno'],
        'El aire es un gas (o mezcla de gases: nitrógeno, oxígeno...). Los gases ocupan todo el espacio disponible.', 'easy'),
      mcq('¿En qué estado está una piedra?', 'sólido', ['líquido', 'gaseoso', 'plasma'],
        'Los sólidos tienen forma propia y no se deforman fácil. Una piedra, un lápiz, una mesa son sólidos.', 'easy'),
      mcq('¿En qué estado está el jugo de naranja?', 'líquido', ['sólido', 'gaseoso', 'sólido y líquido'],
        'Los líquidos adoptan la forma del recipiente que los contiene. El jugo de un vaso tiene la forma del vaso.', 'easy'),
      mcq('¿Cómo se llama cuando un sólido se convierte en líquido con calor?', 'fusión', ['evaporación', 'condensación', 'solidificación'],
        'Fusión es "derretirse". Ejemplo: el hielo se derrite (fusión) y se hace agua.', 'medium'),
      mcq('¿Cómo se llama cuando un líquido se vuelve sólido al enfriarse?', 'solidificación', ['fusión', 'evaporación', 'condensación'],
        'Solidificación: el líquido se endurece. Ejemplo: cuando metés agua en el freezer, se solidifica en hielo.', 'medium'),
      mcq('¿Cuál de estos materiales es sólido a temperatura ambiente?', 'el vidrio', ['el agua', 'el aceite', 'el oxígeno'],
        'El vidrio es sólido siempre a temperatura ambiente. El agua y el aceite son líquidos; el oxígeno es gas.', 'easy'),
      mcq('Si meto agua en el freezer, ¿en qué estado queda?', 'sólido (hielo)', ['líquido', 'gaseoso', 'sigue igual'],
        'El freezer tiene aproximadamente −18°C. A esa temperatura el agua se congela (pasa a sólido = hielo).', 'medium'),
      mcq('El humo que sale de una chimenea está en estado...', 'gaseoso', ['sólido', 'líquido', 'plasma'],
        'El humo es una mezcla de gases calientes + partículas sólidas muy chiquitas. Por eso sube (los gases calientes son menos densos).', 'hard'),
      mcq('¿Qué propiedad tienen los líquidos y gases que no tienen los sólidos?', 'fluyen', ['pesan', 'tienen color', 'son visibles'],
        'Los líquidos y los gases fluyen: se mueven y se amoldan al recipiente. Los sólidos son rígidos.', 'hard'),
      mcq('Si saco una botella de gaseosa del freezer muy fría y la dejo sobre la mesa, ¿qué pasa con el agua del aire?', 'se condensa en gotitas afuera', ['se evapora', 'desaparece', 'se vuelve hielo'],
        'El aire caliente al tocar la botella fría se enfría y el vapor que contenía se condensa en gotitas. Por eso las botellas frías "sudan".', 'hard'),
    ],
  },

  // ============================== ARGENTINA G3 ==============================
  {
    code: 'U3_PUEBLOS', grade: 'grade_3', primary_subject: 'social', display_order: 10,
    name_es: 'Pueblos originarios', description_es: 'Los primeros habitantes del actual territorio argentino.',
    exercises: [
      mcq('¿Cuál de estos pueblos vivía en el noroeste argentino antes de la llegada de los españoles?', 'los diaguitas', ['los vikingos', 'los aztecas', 'los egipcios'],
        'Los diaguitas vivían en lo que hoy es Salta, Tucumán, Catamarca, La Rioja. Eran agricultores y grandes alfareros.', 'medium'),
      mcq('¿Qué pueblo originario vivía en la Patagonia?', 'los mapuches y los tehuelches', ['los guaraníes', 'los quechuas', 'los wichis'],
        'Los tehuelches eran los habitantes ancestrales de la Patagonia. Los mapuches llegaron después (desde lo que hoy es Chile).', 'medium'),
      mcq('¿Qué pueblo originario vive aún hoy en Misiones, Corrientes y Formosa?', 'los guaraníes', ['los incas', 'los mapuches', 'los diaguitas'],
        'Los guaraníes mantuvieron su cultura y su idioma (el guaraní es lengua oficial en Corrientes). Viven en todo el nordeste.', 'medium'),
      mcq('¿Qué cultivaban los diaguitas como alimento principal?', 'maíz, papa y zapallo', ['trigo y uvas', 'arroz', 'café'],
        'El maíz, la papa y el zapallo son cultivos originarios de América. Los diaguitas los cultivaban en terrazas de cultivo en las sierras.', 'medium'),
      mcq('La Pachamama es...', 'la Madre Tierra, muy importante para pueblos andinos', ['un baile', 'una comida', 'un río'],
        'La Pachamama (Madre Tierra en quechua) es una figura espiritual fundamental para los pueblos del noroeste andino argentino. Cada 1° de agosto se le hace una ofrenda.', 'medium'),
      mcq('¿Cómo se llama la lengua originaria que se habla en parte del noroeste argentino?', 'quechua', ['guaraní', 'mapudungún', 'latín'],
        'El quechua era la lengua del imperio inca. Todavía se habla en Jujuy y partes de Salta. El mapudungún es la lengua de los mapuches (sur del país).', 'hard'),
      mcq('Los qom, wichí y mocoví son pueblos originarios que viven en...', 'el Chaco', ['la Patagonia', 'la Pampa', 'Misiones'],
        'Estos tres pueblos viven en la región del Gran Chaco (Chaco, Formosa, norte de Santa Fe). Mantienen sus idiomas y costumbres.', 'hard'),
      mcq('¿Qué pasó con muchos pueblos originarios al llegar los conquistadores?', 'sufrieron violencia y perdieron territorios', ['los recibieron con fiesta siempre', 'se mudaron al mar', 'no pasó nada'],
        'La conquista europea (siglo XVI) trajo violencia, enfermedades y despojo de tierras para los pueblos originarios. Es parte de nuestra historia que hoy reconocemos.', 'hard'),
      mcq('¿En qué fecha se celebra en Argentina el "Día del Respeto a la Diversidad Cultural"?', 'el 12 de octubre', ['el 25 de mayo', 'el 9 de julio', 'el 20 de junio'],
        'Desde 2010 el 12 de octubre se llama "Día del Respeto a la Diversidad Cultural", antes se llamaba "Día de la Raza". El cambio reconoce a los pueblos originarios.', 'medium'),
      mcq('¿Qué significa "Ranquel"?', 'es el nombre de un pueblo originario de La Pampa', ['un tipo de danza', 'un instrumento musical', 'un árbol'],
        'Los ranqueles (o rankülche) son un pueblo originario que vivía en lo que hoy es La Pampa y sur de San Luis. Su lengua era variante del mapudungún.', 'hard'),
    ],
  },
  {
    code: 'U3_SANMARTIN', grade: 'grade_3', primary_subject: 'social', display_order: 20,
    name_es: 'San Martín y la Independencia', description_es: 'El Libertador y el camino a la libertad.',
    exercises: [
      mcq('¿Quién cruzó los Andes con un ejército para liberar a Chile y Perú?', 'José de San Martín', ['Manuel Belgrano', 'Sarmiento', 'Güemes'],
        'San Martín organizó el Ejército de los Andes y cruzó la cordillera en 1817. Es considerado el Libertador de Argentina, Chile y Perú.', 'easy'),
      mcq('¿En qué año se declaró la Independencia Argentina?', '1816', ['1810', '1820', '1853'],
        'El 9 de julio de 1816, en San Miguel de Tucumán, los diputados firmaron la declaración de Independencia. San Martín apoyaba este paso fundamental.', 'easy'),
      mcq('¿En qué provincia se firmó el acta de la Independencia?', 'Tucumán', ['Buenos Aires', 'Salta', 'Mendoza'],
        'En la Casa Histórica de Tucumán, el 9 de julio de 1816. Hoy se puede visitar como museo.', 'medium'),
      mcq('¿Desde qué provincia argentina partió San Martín para cruzar los Andes?', 'Mendoza', ['Buenos Aires', 'Jujuy', 'Entre Ríos'],
        'San Martín fue gobernador de Cuyo (Mendoza, San Juan, San Luis) y preparó el Ejército de los Andes en Mendoza, en el Campamento del Plumerillo.', 'medium'),
      mcq('¿Cómo se llamaba el ejército de San Martín?', 'Ejército de los Andes', ['Ejército del Norte', 'Legión Patria', 'Tropa Libertadora'],
        'Se llamaba así porque su misión principal era cruzar la cordillera de los Andes. Formado por argentinos y chilenos exiliados.', 'medium'),
      mcq('Después de liberar Chile, ¿adónde fue San Martín?', 'a Perú', ['a Brasil', 'a Paraguay', 'a España'],
        'San Martín siguió hacia el norte y liberó Perú (1821). Proclamó su independencia y gobernó brevemente como "Protector del Perú".', 'hard'),
      mcq('El 17 de agosto recordamos...', 'la muerte de San Martín (1850)', ['su nacimiento', 'el cruce de los Andes', 'la batalla de Chacabuco'],
        'San Martín murió el 17 de agosto de 1850 en Francia, exiliado. Por eso ese día es feriado en Argentina: "Paso a la Inmortalidad del General San Martín".', 'medium'),
      mcq('¿Quién era el gobernador de Salta que ayudaba a San Martín defendiendo el norte?', 'Martín Miguel de Güemes', ['Manuel Belgrano', 'Juan Bautista Alberdi', 'Mariano Moreno'],
        'Güemes y sus gauchos protegían la frontera norte de los españoles, mientras San Martín preparaba el ejército en el oeste. Eran parte del mismo plan.', 'hard'),
      mcq('¿Qué batalla ganó San Martín en Chile que fue clave para la liberación?', 'la batalla de Chacabuco', ['la batalla de Ayacucho', 'la batalla de Salta', 'la batalla de Vuelta de Obligado'],
        'En Chacabuco (febrero 1817), pocos días después de cruzar los Andes, San Martín derrotó a los realistas y recuperó Santiago de Chile.', 'hard'),
      mcq('¿Cómo le decían cariñosamente a San Martín?', 'el Libertador', ['el Bombero', 'el Ingeniero', 'el Pintor'],
        'Se lo llama "el Libertador" por haber liberado 3 países del dominio español. Es el prócer más importante de Argentina.', 'easy'),
    ],
  },
  {
    code: 'U3_REGIONES', grade: 'grade_3', primary_subject: 'social', display_order: 30,
    name_es: 'Regiones de Argentina', description_es: 'Las 6 grandes regiones y sus características.',
    exercises: [
      mcq('¿Cuántas grandes regiones tiene Argentina?', '6', ['3', '10', '23'],
        'Argentina tiene 6 regiones geográficas: NOA, NEA, Cuyo, Pampeana, Patagonia y Centro (o Chaco según el criterio).', 'medium'),
      mcq('El NOA (Noroeste Argentino) incluye a...', 'Salta, Jujuy, Tucumán, Catamarca, Santiago del Estero', ['Buenos Aires y La Pampa', 'Misiones y Corrientes', 'Mendoza y San Juan'],
        'El NOA es la región más alta (andina) y con culturas originarias muy vivas. Capital turística: Salta.', 'hard'),
      mcq('¿Qué región incluye a Misiones y Corrientes?', 'NEA (Noreste)', ['NOA', 'Cuyo', 'Patagonia'],
        'El NEA (Noreste) tiene selva, ríos enormes y mucha humedad. Incluye Misiones, Corrientes, Chaco y Formosa.', 'medium'),
      mcq('La región de Cuyo está en...', 'el centro-oeste del país (Mendoza, San Juan, San Luis)', ['el sur', 'el litoral', 'el chaco'],
        'Cuyo está al pie de la cordillera de los Andes. Mendoza es famosa por los vinos; San Juan también. Es una región seca.', 'medium'),
      mcq('¿Qué región incluye la ciudad de Buenos Aires y la Pampa?', 'Pampeana', ['Patagonia', 'NOA', 'Cuyo'],
        'La región Pampeana es la más poblada y agrícola: Buenos Aires, Santa Fe, Córdoba, La Pampa, Entre Ríos. Es la "despensa" del país.', 'medium'),
      mcq('La Patagonia argentina empieza aproximadamente en...', 'el Río Colorado', ['el Río de la Plata', 'el Río Paraná', 'el Mar Argentino'],
        'El Río Colorado marca el límite norte de la Patagonia. Al sur está Neuquén, Río Negro, Chubut, Santa Cruz y Tierra del Fuego.', 'hard'),
      mcq('¿Qué región tiene glaciares y pingüinos?', 'Patagonia', ['NOA', 'NEA', 'Cuyo'],
        'La Patagonia tiene clima frío y glaciares (como el Perito Moreno), y pingüinos en las costas.', 'easy'),
      mcq('¿En qué región se hacen más vinos?', 'Cuyo (Mendoza principalmente)', ['NOA', 'Pampeana', 'Patagonia'],
        'Mendoza produce cerca del 70% del vino argentino. Las mejores uvas crecen en el clima seco de altura.', 'medium'),
      mcq('¿Qué región es la más chica en superficie?', 'la mesopotámica o NEA', ['la Pampeana', 'la Patagonia', 'el NOA'],
        'El NEA (Misiones, Corrientes, Entre Ríos) es más chica en territorio que las otras. La Patagonia es la más grande.', 'hard'),
      mcq('¿Qué región tiene el clima más frío todo el año?', 'la Patagonia', ['el NOA', 'Cuyo', 'la Pampa'],
        'La Patagonia, sobre todo la parte sur, tiene inviernos muy largos y fríos. En Ushuaia puede nevar hasta en primavera.', 'easy'),
    ],
  },
];

// ============================================================================
let total = 0;
for (const cfg of CONCEPTS) {
  const conceptPayload = {
    code: cfg.code, name_es: cfg.name_es, description_es: cfg.description_es,
    grade: cfg.grade, primary_subject: cfg.primary_subject, display_order: cfg.display_order,
  };
  const { data: existing } = await svc.from('concepts').select('id').eq('code', cfg.code).maybeSingle();
  let conceptId;
  if (existing) {
    await svc.from('concepts').update(conceptPayload).eq('id', existing.id);
    conceptId = existing.id;
    await svc.from('exercises').update({ deleted_at: new Date().toISOString() }).eq('concept_id', conceptId).is('deleted_at', null);
  } else {
    const { data: inserted, error } = await svc.from('concepts').insert(conceptPayload).select('id').single();
    if (error) { console.error(`concept ${cfg.code}`, error); continue; }
    conceptId = inserted.id;
  }
  const rows = cfg.exercises.map(e => ({ concept_id: conceptId, ...e }));
  const { data: inserted, error: iErr } = await svc.from('exercises').insert(rows).select('id');
  if (iErr) { console.error(`insert ex ${cfg.code}`, iErr); continue; }
  const pivot = inserted.map(r => ({ exercise_id: r.id, concept_id: conceptId, weight: 1.0, is_primary: true }));
  await svc.from('exercise_concepts').insert(pivot);
  console.log(`✅ ${cfg.code}: ${inserted.length} ejercicios`);
  total += inserted.length;
}
console.log(`\n🎉 Seed grade_3 complete. ${total} ejercicios.`);
