// scripts/seed-content-olas.mjs
// Seed combinado: Isla de las Palabras (Lengua) + Isla de las Ciencias + Isla Argentina (Ciudadanía).
// Todos grade_2 (mismo público de los ejercicios de matemática ya aprobados).
//
// Idempotente: upsert conceptos por code, soft-delete ejercicios previos.
// Uso: node scripts/seed-content-olas.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envRaw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
const env = Object.fromEntries(
  envRaw.split('\n').filter(l => l.includes('=')).map(l => {
    const i = l.indexOf('='); return [l.slice(0, i), l.slice(i + 1)];
  })
);
const svc = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const shuffle = (arr) => { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const mcq = (prompt, correct, distractors, explanation, difficulty='medium', extra={}) => ({
  exercise_type: 'multiple_choice', difficulty,
  title_es: prompt.slice(0, 60), prompt_es: prompt,
  content: { options: shuffle([correct, ...distractors]), explanation, ...extra },
  correct_answer: { value: correct },
  hints: [],
  estimated_time_seconds: 45,
  pedagogical_review_status: 'approved',
});
const readMcq = (passage, prompt, correct, distractors, explanation, difficulty='medium') =>
  mcq(prompt, correct, distractors, explanation, difficulty, { passage });

// ============================================================================
// CONTENIDOS
// ============================================================================

const CONCEPTS = [
  // ---------------------------- LENGUA (Palabras) --------------------------
  {
    code: 'L_ORTO_BV', grade: 'grade_2', primary_subject: 'language', display_order: 10,
    name_es: 'Ortografía: B o V', description_es: 'Aprendé cuándo usar B y cuándo usar V.',
    exercises: [
      mcq('¿Cuál palabra está bien escrita?', 'caballo', ['cavallo', 'kaballo', 'cabaio'],
        'Caballo se escribe con B. Una regla útil: después de M siempre va B (como en "bomba", "tambor"), pero "caballo" hay que aprenderla de memoria.', 'easy'),
      mcq('¿Cuál palabra lleva V?', 'uva', ['ugua', 'uba', 'ugva'],
        'Uva se escribe con V. Es una palabra corta y muy común, vale la pena recordarla.', 'easy'),
      mcq('¿Cómo se escribe el mes del año número 12?', 'diciembre', ['disiembre', 'dizembre', 'diciebre'],
        'Diciembre lleva CI (no SI ni Z). Los meses terminados en -iembre siempre van con CI.', 'medium'),
      mcq('¿Cómo se escribe el animal que hace "muu"?', 'vaca', ['baca', 'vaka', 'baka'],
        'Vaca se escribe con V. En castellano, muchas palabras que empiezan con "va-" llevan V (vaca, vaso, vino).', 'easy'),
      mcq('¿Cuál está bien escrita?', 'nuevo', ['nuebo', 'nuwebo', 'nueuo'],
        'Nuevo lleva V. Las palabras con "nuev-" siempre usan V.', 'medium'),
      mcq('El papá de tu papá es tu...', 'abuelo', ['avuelo', 'abwelo', 'auelo'],
        'Abuelo se escribe con B. Las palabras de familia (abuelo, abuela, hambre) llevan B después de la A inicial.', 'medium'),
      mcq('Después de la letra M, ¿qué se usa más: B o V?', 'B', ['V', 'Las dos', 'Ninguna'],
        'Después de M siempre va B: "bomba", "cambio", "tiempo". Nunca MV.', 'hard'),
      mcq('¿Cuál está bien escrita?', 'bicicleta', ['vicicleta', 'bisicleta', 'vizicleta'],
        'Bicicleta empieza con B y tiene CI en el medio. "Bi" viene del griego y significa "dos".', 'medium'),
      mcq('¿Cuál está bien escrita?', 'vivir', ['bivir', 'vibir', 'bibir'],
        'Vivir se escribe con V en los dos lugares. Todas las formas del verbo vivir llevan V.', 'hard'),
      mcq('¿Cuál está bien escrita?', 'árbol', ['árvol', 'harbol', 'árbo'],
        'Árbol lleva B y tilde en la A. Recordá que "árbol" lleva acento porque es palabra grave terminada en L.', 'medium'),
    ],
  },
  {
    code: 'L_SINON', grade: 'grade_2', primary_subject: 'language', display_order: 20,
    name_es: 'Sinónimos y antónimos', description_es: 'Palabras que quieren decir lo mismo o lo contrario.',
    exercises: [
      mcq('¿Cuál es un sinónimo de "grande"?', 'enorme', ['chico', 'pequeño', 'bajo'],
        'Enorme quiere decir lo mismo que grande. Los sinónimos son palabras distintas con significado parecido.', 'easy'),
      mcq('¿Cuál es un sinónimo de "rápido"?', 'veloz', ['lento', 'quieto', 'despacio'],
        'Veloz y rápido significan lo mismo. Un auto veloz es un auto rápido.', 'easy'),
      mcq('¿Cuál es el antónimo de "feliz"?', 'triste', ['contento', 'alegre', 'divertido'],
        'Triste es lo contrario de feliz. Los antónimos son palabras con significado opuesto.', 'easy'),
      mcq('¿Cuál es el antónimo de "caliente"?', 'frío', ['tibio', 'cálido', 'hirviendo'],
        'Frío es lo contrario de caliente. Son temperaturas opuestas.', 'easy'),
      mcq('¿Cuál es un sinónimo de "bonito"?', 'lindo', ['feo', 'malo', 'aburrido'],
        'Lindo y bonito significan lo mismo en el castellano de Argentina.', 'easy'),
      mcq('¿Cuál es el antónimo de "arriba"?', 'abajo', ['al lado', 'adelante', 'afuera'],
        'Abajo es lo contrario de arriba. Son dos direcciones opuestas.', 'easy'),
      mcq('¿Cuál es un sinónimo de "empezar"?', 'comenzar', ['terminar', 'parar', 'detener'],
        'Empezar y comenzar significan lo mismo. Ambos se refieren al inicio de algo.', 'medium'),
      mcq('¿Cuál es el antónimo de "fácil"?', 'difícil', ['simple', 'sencillo', 'claro'],
        'Difícil es lo contrario de fácil. Un ejercicio fácil lo resolvés rápido; uno difícil, lleva más tiempo.', 'medium'),
      mcq('¿Cuál palabra NO es sinónimo de "casa"?', 'escuela', ['hogar', 'vivienda', 'morada'],
        'Escuela NO es sinónimo de casa. Hogar, vivienda y morada sí lo son.', 'hard'),
      mcq('¿Cuál es el antónimo de "lleno"?', 'vacío', ['repleto', 'completo', 'colmado'],
        'Vacío es lo contrario de lleno. Un vaso lleno tiene mucha agua; uno vacío, nada.', 'medium'),
    ],
  },
  {
    code: 'L_COMPREN', grade: 'grade_2', primary_subject: 'language', display_order: 30,
    name_es: 'Comprensión lectora', description_es: 'Leé un texto corto y respondé las preguntas.',
    exercises: [
      readMcq(
        'Tomás tiene un perro llamado Bigote. Todas las mañanas lo lleva a pasear a la plaza. Bigote juega con otros perros y mueve la cola porque está feliz.',
        '¿Cómo se llama el perro de Tomás?', 'Bigote', ['Tomás', 'Plaza', 'Cola'],
        'El texto dice "un perro llamado Bigote". Los nombres propios suelen ir con mayúscula.', 'easy'),
      readMcq(
        'Tomás tiene un perro llamado Bigote. Todas las mañanas lo lleva a pasear a la plaza. Bigote juega con otros perros y mueve la cola porque está feliz.',
        '¿Adónde va Tomás con el perro?', 'A la plaza', ['A la escuela', 'Al cine', 'Al río'],
        'El texto dice que Tomás "lo lleva a pasear a la plaza". La plaza es el lugar donde van.', 'easy'),
      readMcq(
        'Tomás tiene un perro llamado Bigote. Todas las mañanas lo lleva a pasear a la plaza. Bigote juega con otros perros y mueve la cola porque está feliz.',
        '¿Por qué Bigote mueve la cola?', 'Porque está feliz', ['Porque tiene frío', 'Porque está enojado', 'Porque tiene hambre'],
        'El texto dice claramente "mueve la cola porque está feliz". Los perros mueven la cola cuando están contentos.', 'medium'),
      readMcq(
        'Lucía pidió prestado un libro de la biblioteca. El libro cuenta la historia de una niña que viaja a la luna. Lucía lo leyó en tres días.',
        '¿De dónde sacó Lucía el libro?', 'De la biblioteca', ['Lo compró', 'Se lo regalaron', 'Lo encontró'],
        'El texto dice que "pidió prestado un libro de la biblioteca". Pedir prestado es distinto de comprar.', 'easy'),
      readMcq(
        'Lucía pidió prestado un libro de la biblioteca. El libro cuenta la historia de una niña que viaja a la luna. Lucía lo leyó en tres días.',
        '¿De qué se trata el libro?', 'De una niña que viaja a la luna', ['De un perro', 'De la escuela', 'De una ciudad'],
        'El texto dice "la historia de una niña que viaja a la luna". Ese es el tema principal.', 'medium'),
      readMcq(
        'Lucía pidió prestado un libro de la biblioteca. El libro cuenta la historia de una niña que viaja a la luna. Lucía lo leyó en tres días.',
        '¿Cuánto tardó Lucía en leer el libro?', 'Tres días', ['Una hora', 'Una semana', 'Un mes'],
        'El texto dice "lo leyó en tres días". Hay que prestar atención a los números para no confundirse.', 'medium'),
      readMcq(
        'En el patio del colegio hay un mango de 10 metros de alto. Los chicos juntan los mangos que caen y los llevan al comedor.',
        '¿Qué hay en el patio del colegio?', 'Un mango (árbol)', ['Un auto', 'Una fuente', 'Una pelota'],
        'El texto dice "hay un mango de 10 metros de alto". En este caso, mango se refiere al árbol, no a la fruta.', 'medium'),
      readMcq(
        'En el patio del colegio hay un mango de 10 metros de alto. Los chicos juntan los mangos que caen y los llevan al comedor.',
        '¿Qué hacen los chicos con los mangos?', 'Los llevan al comedor', ['Los tiran', 'Los guardan', 'Los dibujan'],
        'El texto dice que los chicos "los llevan al comedor". Probablemente los usen de postre.', 'hard'),
      readMcq(
        'Los domingos, la familia de Nico va al parque. Nico y sus hermanas andan en bici. Los papás llevan un mate y unas tortas fritas.',
        '¿Qué día va la familia al parque?', 'Los domingos', ['Los lunes', 'Los sábados', 'Todos los días'],
        'El texto empieza con "Los domingos, la familia de Nico va al parque".', 'easy'),
      readMcq(
        'Los domingos, la familia de Nico va al parque. Nico y sus hermanas andan en bici. Los papás llevan un mate y unas tortas fritas.',
        '¿Qué llevan los papás?', 'Un mate y tortas fritas', ['Sándwiches', 'Un libro', 'Una pelota'],
        'El texto dice "Los papás llevan un mate y unas tortas fritas". Son dos cosas muy argentinas.', 'medium'),
    ],
  },

  // ------------------------------ CIENCIAS ----------------------------------
  {
    code: 'C_CUERPO', grade: 'grade_2', primary_subject: 'science', display_order: 10,
    name_es: 'El cuerpo humano', description_es: 'Partes del cuerpo y para qué sirven.',
    exercises: [
      mcq('¿Con qué parte del cuerpo vemos?', 'los ojos', ['las orejas', 'la nariz', 'la boca'],
        'Los ojos son los órganos de la vista. Nos permiten ver las formas y los colores.', 'easy'),
      mcq('¿Con qué parte del cuerpo escuchamos?', 'las orejas', ['los ojos', 'la boca', 'las manos'],
        'Las orejas son los órganos del oído. Captan los sonidos del entorno.', 'easy'),
      mcq('¿Qué órgano bombea la sangre por el cuerpo?', 'el corazón', ['los pulmones', 'el estómago', 'los riñones'],
        'El corazón late sin parar para empujar la sangre por todo el cuerpo. Los pulmones respiran, el estómago digiere.', 'medium'),
      mcq('¿Para qué sirven los pulmones?', 'para respirar', ['para pensar', 'para digerir', 'para caminar'],
        'Los pulmones toman el aire cuando inhalamos y lo sacan al exhalar. Sin ellos no podríamos respirar.', 'medium'),
      mcq('¿Cuántos dientes de leche tenemos los chicos aproximadamente?', '20', ['10', '32', '8'],
        'Los chicos tenemos 20 dientes de leche. A los adultos les crecen 32 dientes permanentes.', 'medium'),
      mcq('¿Qué hueso protege al cerebro?', 'el cráneo', ['la columna', 'las costillas', 'la pelvis'],
        'El cráneo es el hueso de la cabeza y funciona como un casco que protege al cerebro de los golpes.', 'medium'),
      mcq('¿Cuál es el órgano más grande del cuerpo?', 'la piel', ['el hígado', 'el corazón', 'el cerebro'],
        'La piel es el órgano más grande. Cubre todo el cuerpo y nos protege del sol, el frío y los microbios.', 'hard'),
      mcq('¿Cuántos sentidos tenemos?', '5', ['3', '7', '10'],
        'Tenemos 5 sentidos: vista, oído, olfato, gusto y tacto.', 'easy'),
      mcq('¿Cuál es el sentido que usamos cuando comemos algo rico?', 'el gusto', ['el oído', 'la vista', 'el olfato'],
        'El gusto es el sentido que está en la lengua. Nos dice si algo es dulce, salado, ácido o amargo.', 'easy'),
      mcq('¿Qué parte del cuerpo usa el cerebro para mandar señales?', 'los nervios', ['los huesos', 'los músculos', 'la sangre'],
        'Los nervios son como cables que llevan mensajes del cerebro a todo el cuerpo y vuelven.', 'hard'),
    ],
  },
  {
    code: 'C_ANIMALES_AR', grade: 'grade_2', primary_subject: 'science', display_order: 20,
    name_es: 'Animales argentinos', description_es: 'Conocé algunos animales de nuestro país.',
    exercises: [
      mcq('¿Cuál es el ave nacional de Argentina?', 'el hornero', ['el cóndor', 'el ñandú', 'el loro'],
        'El hornero fue declarado ave nacional en 1928. Construye nidos de barro que parecen hornitos.', 'medium'),
      mcq('¿Cómo se llama el animal parecido al avestruz que vive en la Patagonia?', 'el ñandú', ['el guanaco', 'la vicuña', 'el cóndor'],
        'El ñandú es el avestruz sudamericano. Vive en la Pampa y la Patagonia. No vuela pero corre muy rápido.', 'medium'),
      mcq('¿Qué animal vive en el mar del sur de Argentina y es muy grande?', 'la ballena franca', ['el hornero', 'el puma', 'el yaguareté'],
        'La ballena franca austral visita las costas de Península Valdés (Chubut) cada año para tener sus crías.', 'medium'),
      mcq('¿Cuál de estos animales es de la selva misionera?', 'el yaguareté', ['el pingüino', 'el ñandú', 'la vicuña'],
        'El yaguareté es el felino más grande de Argentina. Vive en las selvas del norte, como la de Misiones.', 'hard'),
      mcq('¿Cuál es un pariente de la llama que vive en el norte argentino?', 'la vicuña', ['el tigre', 'el zorro', 'el puma'],
        'La vicuña vive en el altiplano (Jujuy, Salta). Es pariente de la llama y su lana es una de las más finas del mundo.', 'medium'),
      mcq('¿Qué animal grande y con alas enormes vive en la cordillera?', 'el cóndor', ['el hornero', 'la gallina', 'la paloma'],
        'El cóndor andino es una de las aves voladoras más grandes del mundo. Sus alas abiertas miden hasta 3 metros.', 'medium'),
      mcq('¿Cuál de estos animales vive en las aguas dulces del Litoral?', 'el yacaré', ['el pingüino', 'la ballena', 'la vicuña'],
        'El yacaré es un reptil parecido al cocodrilo. Vive en ríos y esteros del Litoral (Corrientes, Formosa).', 'hard'),
      mcq('¿El pingüino argentino vive en...?', 'la Patagonia', ['el norte', 'Buenos Aires ciudad', 'la selva'],
        'Los pingüinos de Magallanes viven en las costas de la Patagonia argentina, sobre todo en Chubut y Santa Cruz.', 'easy'),
      mcq('¿Qué come principalmente la vaca?', 'pasto', ['carne', 'pescado', 'insectos'],
        'Las vacas son herbívoras: comen pasto. En la Pampa argentina hay millones porque tenemos muchísimo pasto.', 'easy'),
      mcq('¿Qué es un "tero"?', 'un pájaro del campo', ['un insecto', 'un pez', 'un árbol'],
        'El tero es un pájaro muy argentino. Hace mucho ruido cuando alguien se acerca a su nido. Por eso se dice "hacer el tero" a quien alarma sin parar.', 'hard'),
    ],
  },
  {
    code: 'C_PLANTAS', grade: 'grade_2', primary_subject: 'science', display_order: 30,
    name_es: 'Las plantas', description_es: 'Cómo crecen, qué necesitan y qué nos dan.',
    exercises: [
      mcq('¿Qué necesitan las plantas para crecer?', 'sol, agua y tierra', ['solo sol', 'solo agua', 'carne'],
        'Las plantas necesitan sol, agua y nutrientes de la tierra. También aire (dióxido de carbono).', 'easy'),
      mcq('¿Por dónde toman las plantas el agua?', 'por las raíces', ['por las hojas', 'por las flores', 'por los frutos'],
        'Las raíces están bajo tierra y absorben el agua y los nutrientes. Después suben por el tallo al resto de la planta.', 'easy'),
      mcq('¿Qué parte de la planta hace el alimento?', 'las hojas', ['las raíces', 'las flores', 'los frutos'],
        'Las hojas usan la luz del sol para fabricar alimento. Esto se llama fotosíntesis.', 'medium'),
      mcq('¿Para qué sirven las flores?', 'para reproducirse', ['para respirar', 'para dar sombra', 'para saludar'],
        'Las flores son el órgano reproductor de la planta. De ahí salen las semillas y los frutos.', 'medium'),
      mcq('De una manzana, ¿qué parte se puede plantar para que crezca otro árbol?', 'la semilla', ['la cáscara', 'el cabito', 'el jugo'],
        'Adentro de la manzana hay semillas. Si las plantás con paciencia, pueden crecer un nuevo manzano.', 'medium'),
      mcq('¿Qué gas le dan las plantas al aire que respiramos?', 'oxígeno', ['humo', 'vapor', 'nitrógeno'],
        'Las plantas liberan oxígeno durante el día. Por eso se dice que son los "pulmones" del planeta.', 'hard'),
      mcq('¿Cuál de estas plantas es típica de la Selva Misionera?', 'la yerba mate', ['el trigo', 'el cactus', 'el tulipán'],
        'La yerba mate es un árbol nativo de la selva paranaense (Misiones, nordeste de Corrientes). De sus hojas se hace el mate.', 'medium'),
      mcq('¿Cuál es un cereal muy cultivado en la Pampa argentina?', 'el trigo', ['el banano', 'el coco', 'el cacao'],
        'La Pampa argentina es una de las regiones más importantes del mundo para el trigo. Con su harina se hace el pan.', 'easy'),
      mcq('¿Qué pasa si una planta no recibe sol durante mucho tiempo?', 'se debilita', ['crece más', 'florece', 'se pone negra'],
        'Sin sol, la planta no puede hacer fotosíntesis (su alimento). Se pone amarilla, se debilita y puede morir.', 'hard'),
      mcq('El árbol nacional de Argentina es...', 'el ceibo', ['la palmera', 'el pino', 'el roble'],
        'El ceibo fue declarado árbol nacional por su flor roja (también flor nacional). Es típico del litoral y da flores en verano.', 'medium'),
    ],
  },

  // ------------------------- CIUDADANÍA (Argentina) -------------------------
  {
    code: 'U_SIMB_AR', grade: 'grade_2', primary_subject: 'social', display_order: 10,
    name_es: 'Símbolos patrios argentinos', description_es: 'Bandera, escudo, himno y escarapela.',
    exercises: [
      mcq('¿De qué colores es la bandera argentina?', 'celeste, blanca, celeste', ['roja, blanca, roja', 'verde, blanca, roja', 'azul, blanca, amarilla'],
        'La bandera argentina tiene 3 franjas horizontales: celeste, blanca y celeste. En el centro tiene el Sol de Mayo.', 'easy'),
      mcq('¿Quién creó la bandera argentina?', 'Manuel Belgrano', ['San Martín', 'Sarmiento', 'Güemes'],
        'Manuel Belgrano la creó y la izó por primera vez el 27 de febrero de 1812 en Rosario.', 'medium'),
      mcq('¿Qué fecha celebramos el Día de la Bandera?', 'el 20 de junio', ['el 9 de julio', 'el 25 de mayo', 'el 17 de agosto'],
        'El 20 de junio recordamos a Manuel Belgrano, que murió ese día en 1820. Por eso es el Día de la Bandera.', 'medium'),
      mcq('¿Qué celebramos el 25 de mayo?', 'la Revolución de Mayo', ['la Independencia', 'el Día de la Bandera', 'el Día del Himno'],
        'El 25 de mayo de 1810 se formó el Primer Gobierno Patrio en Buenos Aires. Fue el primer paso hacia la independencia.', 'easy'),
      mcq('¿Qué celebramos el 9 de julio?', 'el Día de la Independencia', ['el Día de la Bandera', 'la Revolución de Mayo', 'el Año Nuevo'],
        'El 9 de julio de 1816 en Tucumán declaramos la Independencia de España. Por eso es fiesta patria.', 'easy'),
      mcq('¿Qué es la escarapela?', 'un moño celeste y blanco', ['una bandera chica', 'una comida', 'una flor'],
        'La escarapela es un moño de color celeste y blanco que nos prendemos cerca del corazón en las fechas patrias.', 'easy'),
      mcq('¿Qué figura importante está en el centro de la bandera?', 'el Sol de Mayo', ['una luna', 'una estrella', 'un escudo'],
        'El Sol de Mayo es un sol con cara y 32 rayos. Representa al dios Inca Inti y la independencia.', 'medium'),
      mcq('El Himno Nacional Argentino arranca diciendo:', '"Oíd, mortales, el grito sagrado..."', ['"Aurora de la patria..."', '"Arriba argentinos..."', '"Los pueblos libres..."'],
        'Así empieza el Himno Nacional, escrito por Vicente López y Planes. La música es de Blas Parera.', 'medium'),
      mcq('¿Quién escribió la letra del Himno Nacional Argentino?', 'Vicente López y Planes', ['Manuel Belgrano', 'José de San Martín', 'Domingo Sarmiento'],
        'Vicente López y Planes escribió la letra en 1812. La música la compuso Blas Parera.', 'hard'),
      mcq('En el Congreso de Tucumán participaron representantes de varias provincias. ¿En qué año fue?', '1816', ['1810', '1820', '1853'],
        'El Congreso de Tucumán declaró la Independencia en 1816. Fue 6 años después de la Revolución de Mayo.', 'hard'),
    ],
  },
  {
    code: 'U_CONVIVENCIA', grade: 'grade_2', primary_subject: 'social', display_order: 20,
    name_es: 'Convivencia y derechos', description_es: 'Cómo vivir bien juntos en la escuela y en casa.',
    exercises: [
      mcq('Si un compañero se cae y se lastima, ¿qué hacés?', 'lo ayudo y aviso a un adulto', ['me río', 'me voy corriendo', 'le saco una foto'],
        'Ayudar y avisar a un adulto es lo correcto. La empatía (ponerse en el lugar del otro) es la base de la convivencia.', 'easy'),
      mcq('En la escuela, antes de hablar en clase conviene...', 'levantar la mano', ['gritar fuerte', 'empujar', 'salir corriendo'],
        'Levantar la mano es una forma de respeto: esperás tu turno para que todos puedan escuchar.', 'easy'),
      mcq('¿Todos los chicos tienen derecho a...?', 'ir a la escuela', ['trabajar', 'manejar un auto', 'votar'],
        'La educación es un derecho de todos los chicos y chicas. Está en la Ley 26.061 y en la Convención de Derechos del Niño.', 'medium'),
      mcq('Si alguien te está molestando en el recreo, lo mejor es...', 'avisar a una maestra o maestro', ['pegarle más fuerte', 'callarte y aguantártelo', 'insultarlo'],
        'Avisar a un adulto de confianza es lo más saludable. Nadie tiene que aguantarse el maltrato.', 'easy'),
      mcq('¿Qué es un derecho?', 'algo que me corresponde por ser persona', ['un juego', 'una comida', 'un día de la semana'],
        'Los derechos son cosas que le corresponden a todas las personas por el solo hecho de serlo: comer, aprender, jugar, ser cuidado.', 'medium'),
      mcq('¿Cuál de estos es un deber de los chicos?', 'respetar a los compañeros', ['ganar todos los juegos', 'tener siempre razón', 'no equivocarse nunca'],
        'Respetar a los demás es un deber. Equivocarse es normal; nadie tiene que ganar siempre.', 'medium'),
      mcq('Si ves que un compañero no tiene con quién jugar, ¿qué podés hacer?', 'invitarlo a jugar con vos', ['dejarlo solo', 'reírte', 'burlarte'],
        'Invitar al compañero es un acto de empatía. La convivencia se construye con pequeños gestos.', 'easy'),
      mcq('Si no estás de acuerdo con una regla, lo mejor es...', 'conversarlo con respeto', ['romperla sin avisar', 'gritar hasta que la cambien', 'pelearte'],
        'Dialogar con respeto es la forma democrática de cambiar las cosas. Las reglas se pueden discutir sin violencia.', 'medium'),
      mcq('¿Qué hacemos cuando alguien habla y no entendemos?', 'preguntamos con respeto', ['le gritamos', 'nos reímos', 'no decimos nada'],
        'Preguntar es parte de aprender. Nadie entiende todo la primera vez, y está bueno preguntar con respeto.', 'easy'),
      mcq('En un grupo donde todos opinan distinto, lo mejor es...', 'escucharnos y buscar un acuerdo', ['que gane quien grita más', 'que decida uno solo', 'no hacer nada'],
        'Escuchar y buscar acuerdos es lo que hacemos en democracia. Las decisiones compartidas son mejores que las impuestas.', 'hard'),
    ],
  },
  {
    code: 'U_GEO_AR', grade: 'grade_2', primary_subject: 'social', display_order: 30,
    name_es: 'Geografía argentina básica', description_es: 'Provincias, ciudades y regiones.',
    exercises: [
      mcq('¿Cuál es la capital de Argentina?', 'Buenos Aires', ['Córdoba', 'Mendoza', 'Rosario'],
        'La Ciudad Autónoma de Buenos Aires (CABA) es la capital desde 1880. Ahí funcionan el gobierno nacional y el Congreso.', 'easy'),
      mcq('¿Cuántas provincias tiene Argentina?', '23', ['10', '24', '50'],
        'Argentina tiene 23 provincias + la Ciudad Autónoma de Buenos Aires. Algunas personas dicen 24 contando CABA.', 'medium'),
      mcq('¿En qué provincia están las Cataratas del Iguazú?', 'Misiones', ['Jujuy', 'Córdoba', 'Buenos Aires'],
        'Las Cataratas del Iguazú están en Misiones, en la frontera con Brasil. Son una de las 7 maravillas naturales del mundo.', 'medium'),
      mcq('¿En qué región están los glaciares como el Perito Moreno?', 'en la Patagonia', ['en el Litoral', 'en el Noroeste', 'en la Pampa'],
        'El Perito Moreno está en Santa Cruz, Patagonia. Es uno de los pocos glaciares del mundo que todavía avanza.', 'medium'),
      mcq('¿Cuál es la montaña más alta de América?', 'el Aconcagua', ['el Everest', 'el Chimborazo', 'el Fitz Roy'],
        'El Aconcagua está en Mendoza y mide 6.961 metros. Es la montaña más alta de América y de todo el hemisferio sur.', 'hard'),
      mcq('¿Qué río pasa por Buenos Aires y desemboca en el mar?', 'el Río de la Plata', ['el Amazonas', 'el Paraná', 'el Nilo'],
        'El Río de la Plata es muy ancho (a veces no se ve la otra orilla). Separa Argentina de Uruguay y desemboca en el Atlántico.', 'medium'),
      mcq('¿Cuál de estas provincias está en la región del Noroeste (NOA)?', 'Salta', ['Buenos Aires', 'Santa Cruz', 'Corrientes'],
        'Salta, Jujuy, Tucumán, Santiago del Estero y Catamarca forman el Noroeste. Es una región montañosa y con culturas originarias muy vivas.', 'medium'),
      mcq('¿Cuál de estas ciudades está cerca de la cordillera de los Andes?', 'Mendoza', ['Rosario', 'Mar del Plata', 'La Plata'],
        'Mendoza está al pie de la cordillera. Por eso se hacen tantos vinos y hay centros de esquí cerca.', 'easy'),
      mcq('¿En qué parte del país están las playas más famosas?', 'en la costa bonaerense', ['en el noroeste', 'en la cordillera', 'en el centro'],
        'La costa atlántica bonaerense tiene Mar del Plata, Pinamar, Villa Gesell. Es donde muchas familias argentinas veranean.', 'easy'),
      mcq('¿Qué cordillera marca el límite con Chile?', 'los Andes', ['los Alpes', 'los Pirineos', 'el Himalaya'],
        'La cordillera de los Andes es la más larga del mundo. Cruza toda Argentina de norte a sur y nos separa de Chile.', 'medium'),
    ],
  },
];

// ============================================================================
// RUN
// ============================================================================

let total = 0;
for (const cfg of CONCEPTS) {
  // Upsert concept
  const conceptPayload = {
    code: cfg.code, name_es: cfg.name_es, description_es: cfg.description_es,
    grade: cfg.grade, primary_subject: cfg.primary_subject, display_order: cfg.display_order,
  };
  const { data: existing } = await svc.from('concepts').select('id').eq('code', cfg.code).maybeSingle();
  let conceptId;
  if (existing) {
    await svc.from('concepts').update(conceptPayload).eq('id', existing.id);
    conceptId = existing.id;
    // Soft-delete ejercicios previos
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
console.log(`\n🎉 Seed Olas complete. ${total} ejercicios.`);
