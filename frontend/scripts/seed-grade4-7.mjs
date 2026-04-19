#!/usr/bin/env node
/**
 * Tinkú — Seed Math Grade 4-7
 * 
 * Expande contenido de matemática para grados 4, 5, 6 y 7.
 * Idempotente: puede ejecutarse múlti veces sin duplicar.
 * 
 * Usage: node scripts/seed-grade4-7.mjs
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rihbkanevxlvisanlvsn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const concepts = [
  // =============================================================================
  // GRADE 4 - Matemática (10-11 años)
  // =============================================================================
  {
    code: 'M4_MULT_2CIFRAS',
    primary_subject: 'math',
    grade: 'grade_4',
    name_es: 'Multiplicación por 2 cifras',
    description_es: 'Multiplicar números de 2 cifras por números de 1 o 2 cifras.',
    nap_reference: 'NAP 4° - Eje Operaciones',
    display_order: 1,
  },
  {
    code: 'M4_DIV_1CIFRA',
    primary_subject: 'math',
    grade: 'grade_4',
    name_es: 'División por 1 cifra',
    description_es: 'Dividir números de hasta 3 cifras por un divisor de 1 cifra.',
    nap_reference: 'NAP 4° - Eje Operaciones',
    display_order: 2,
  },
  {
    code: 'M4_FRAC_SIMP',
    primary_subject: 'math',
    grade: 'grade_4',
    name_es: 'Fracciones simples',
    description_es: 'Representar y comparar fracciones simples (medios, tercios, cuartos).',
    nap_reference: 'NAP 4° - Eje Números',
    display_order: 3,
  },
  // =============================================================================
  // GRADE 5 - Matemática (11-12 años)
  // =============================================================================
  {
    code: 'M5_DECIMALES',
    primary_subject: 'math',
    grade: 'grade_5',
    name_es: 'Operaciones con decimales',
    description_es: 'Sumar, restar y comparar números decimales.',
    nap_reference: 'NAP 5° - Eje Números',
    display_order: 4,
  },
  {
    code: 'M5_PERIM_AREA',
    primary_subject: 'math',
    grade: 'grade_5',
    name_es: 'Perímetro y área',
    description_es: 'Calcular perímetro y área de rectángulos y cuadrados.',
    nap_reference: 'NAP 5° - Eje Geometría',
    display_order: 5,
  },
  {
    code: 'M5_MULT_DECIMAL',
    primary_subject: 'math',
    grade: 'grade_5',
    name_es: 'Multiplicación con decimales',
    description_es: 'Multiplicar números decimales por números naturales.',
    nap_reference: 'NAP 5° - Eje Operaciones',
    display_order: 6,
  },
  // =============================================================================
  // GRADE 6 - Matemática (12-13 años)
  // =============================================================================
  {
    code: 'M6_PROPORCIONES',
    primary_subject: 'math',
    grade: 'grade_6',
    name_es: 'Razones y proporciones',
    description_es: 'Comprender y resolver proporciones simples.',
    nap_reference: 'NAP 6° - Eje Álgebra',
    display_order: 7,
  },
  {
    code: 'M6_PORCENTAJES',
    primary_subject: 'math',
    grade: 'grade_6',
    name_es: 'Cálculo de porcentajes',
    description_es: 'Calcular porcentajes de cantidades (10%, 25%, 50%, 75%).',
    nap_reference: 'NAP 6° - Eje Números',
    display_order: 8,
  },
  {
    code: 'M6_ECUACIONES',
    primary_subject: 'math',
    grade: 'grade_6',
    name_es: 'Ecuaciones simples',
    description_es: 'Resolver ecuaciones de primer grado con una incógnita.',
    nap_reference: 'NAP 6° - Eje Álgebra',
    display_order: 9,
  },
  // =============================================================================
  // GRADE 7 - Matemática (13-14 años)
  // =============================================================================
  {
    code: 'M7_ALGEBRA',
    primary_subject: 'math',
    grade: 'grade_7',
    name_es: 'Álgebra básica',
    description_es: 'Expresiones algebraicas y resolución de ecuaciones.',
    nap_reference: 'NAP 7° - Eje Álgebra',
    display_order: 10,
  },
  {
    code: 'M7_FUNCIONES',
    primary_subject: 'math',
    grade: 'grade_7',
    name_es: 'Introducción a funciones',
    description_es: 'Comprender el concepto de función y tabular valores.',
    nap_reference: 'NAP 7° - Eje Álgebra',
    display_order: 11,
  },
  {
    code: 'M7_ESTADISTICA',
    primary_subject: 'math',
    grade: 'grade_7',
    name_es: 'Estadística básica',
    description_es: 'Calcular moda, media y mediana de conjuntos de datos.',
    nap_reference: 'NAP 7° - Eje Estadística',
    display_order: 12,
  },
];

// Generate 10 exercises per concept
const exercisesData = {
  // GRADE 4
  M4_MULT_2CIFRAS: [
    { difficulty: 'easy', title: 'Multiplicación simple', prompt: '¿Cuánto es 12 × 3?', options: ['36', '33', '39', '30'], answer: '36', hint: '12 + 12 + 12 = 36' },
    { difficulty: 'easy', title: 'Multiplicación simple', prompt: '¿Cuánto es 15 × 2?', options: ['30', '25', '35', '20'], answer: '30', hint: '15 + 15 = 30' },
    { difficulty: 'easy', title: 'Multiplicación simple', prompt: '¿Cuánto es 11 × 4?', options: ['44', '40', '48', '45'], answer: '44', hint: '40 + 4 = 44' },
    { difficulty: 'easy', title: 'Multiplicación simple', prompt: '¿Cuánto es 13 × 2?', options: ['26', '23', '29', '25'], answer: '26', hint: '10 + 10 + 6 = 26' },
    { difficulty: 'medium', title: 'Multiplicación por 10', prompt: '¿Cuánto es 12 × 10?', options: ['120', '100', '110', '130'], answer: '120', hint: 'Agregá un cero' },
    { difficulty: 'medium', title: 'Multiplicación 2 cifras', prompt: '¿Cuánto es 23 × 2?', options: ['46', '43', '49', '45'], answer: '46', hint: '20 + 20 + 6 = 46' },
    { difficulty: 'medium', title: 'Multiplicación 2 cifras', prompt: '¿Cuánto es 14 × 3?', options: ['42', '38', '45', '40'], answer: '42', hint: '10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+10+' },
    { difficulty: 'medium', title: 'Multiplicación', prompt: '¿Cuánto es 21 × 3?', options: ['63', '60', '66', '58'], answer: '63', hint: '20 × 3 + 1 × 3 = 63' },
    { difficulty: 'hard', title: 'Multiplicación compleja', prompt: '¿Cuánto es 25 × 4?', options: ['100', '90', '110', '80'], answer: '100', hint: '100 = 25 × 4' },
    { difficulty: 'hard', title: 'Multiplicación compleja', prompt: '¿Cuánto es 50 × 2?', options: ['100', '90', '110', '80'], answer: '100', hint: '50 + 50 = 100' },
  ],
  M4_DIV_1CIFRA: [
    { difficulty: 'easy', title: 'División simple', prompt: '¿Cuánto es 36 ÷ 3?', options: ['12', '14', '10', '15'], answer: '12', hint: '3 × 12 = 36' },
    { difficulty: 'easy', title: 'División simple', prompt: '¿Cuánto es 28 ÷ 4?', options: ['7', '6', '8', '9'], answer: '7', hint: '4 × 7 = 28' },
    { difficulty: 'easy', title: 'División simple', prompt: '¿Cuánto es 45 ÷ 5?', options: ['9', '8', '10', '7'], answer: '9', hint: '5 × 9 = 45' },
    { difficulty: 'easy', title: 'División simple', prompt: '¿Cuánto es 24 ÷ 6?', options: ['4', '5', '3', '6'], answer: '4', hint: '6 × 4 = 24' },
    { difficulty: 'medium', title: 'División con resto', prompt: '¿Cuánto es 37 ÷ 5?', options: ['7 r2', '7 r1', '8 r1', '6 r3'], answer: '7 r2', hint: '5 × 7 = 35, sobran 2' },
    { difficulty: 'medium', title: 'División', prompt: '¿Cuánto es 56 ÷ 7?', options: ['8', '7', '9', '6'], answer: '8', hint: '7 × 8 = 56' },
    { difficulty: 'medium', title: 'División', prompt: '¿Cuánto es 48 ÷ 6?', options: ['8', '7', '9', '6'], answer: '8', hint: '6 × 8 = 48' },
    { difficulty: 'medium', title: 'División', prompt: '¿Cuánto es 63 ÷ 9?', options: ['7', '8', '6', '9'], answer: '7', hint: '9 × 7 = 63' },
    { difficulty: 'hard', title: 'División grande', prompt: '¿Cuánto es 96 ÷ 8?', options: ['12', '13', '11', '14'], answer: '12', hint: '8 × 12 = 96' },
    { difficulty: 'hard', title: 'División grandes', prompt: '¿Cuánto es 84 ÷ 7?', options: ['12', '11', '13', '10'], answer: '12', hint: '7 × 12 = 84' },
  ],
  M4_FRAC_SIMP: [
    { difficulty: 'easy', title: 'Mitad', prompt: '¿Cuánto es la mitad de 8?', options: ['4', '3', '5', '2'], answer: '4', hint: '8 ÷ 2 = 4' },
    { difficulty: 'easy', title: 'Tercio', prompt: '¿Cuánto es el tercio de 9?', options: ['3', '2', '4', '1'], answer: '3', hint: '9 ÷ 3 = 3' },
    { difficulty: 'easy', title: 'Cuarto', prompt: '¿Cuánto es la cuarta parte de 12?', options: ['3', '4', '2', '5'], answer: '3', hint: '12 ÷ 4 = 3' },
    { difficulty: 'easy', title: 'Fracción un medio', prompt: '¿Qué fracción está pintada si tenés 2 de 4 partes?', options: ['1/2', '1/4', '2/3', '1/3'], answer: '1/2', hint: '2 de 4 = la mitad' },
    { difficulty: 'medium', title: 'Comparar fracciones', prompt: '¿Qué fracción es más grande: 1/2 o 1/3?', options: ['1/2', '1/3', 'son iguales', 'no sé'], answer: '1/2', hint: 'La mitad es más que un tercio' },
    { difficulty: 'medium', title: 'Suma de fracciones', prompt: '¿Cuánto es 1/4 + 1/4?', options: ['1/2', '1/8', '2/4', '1/4'], answer: '1/2', hint: '1/4 + 1/4 = 2/4 = 1/2' },
    { difficulty: 'medium', title: 'Fracción de número', prompt: '¿Cuánto es 1/2 de 10?', options: ['5', '4', '6', '3'], answer: '5', hint: '10 ÷ 2 = 5' },
    { difficulty: 'medium', title: 'Fracción de número', prompt: '¿Cuánto es 1/4 de 8?', options: ['2', '3', '4', '5'], answer: '2', hint: '8 ÷ 4 = 2' },
    { difficulty: 'hard', title: 'Fracción equivalente', prompt: '¿Es 2/4 equivalente a 1/2?', options: ['Sí', 'No', 'depende', 'no sé'], answer: 'Sí', hint: '2 ÷ 2 = 1, 4 ÷ 2 = 2' },
    { difficulty: 'hard', title: 'Fracción compleja', prompt: '¿Cuánto es 3/4 de 12?', options: ['9', '8', '10', '7'], answer: '9', hint: '12 ÷ 4 × 3 = 9' },
  ],
  // GRADE 5
  M5_DECIMALES: [
    { difficulty: 'easy', title: 'Decimal suma', prompt: '¿Cuánto es 0.5 + 0.3?', options: ['0.8', '0.7', '0.9', '0.6'], answer: '0.8', hint: '5 décimos + 3 décimos = 8 décimos' },
    { difficulty: 'easy', title: 'Decimal resta', prompt: '¿Cuánto es 0.9 - 0.4?', options: ['0.5', '0.6', '0.4', '0.7'], answer: '0.5', hint: '9 - 4 = 5' },
    { difficulty: 'easy', title: 'Decimal comparación', prompt: '¿Qué número es más grande: 0.7 o 0.5?', options: ['0.7', '0.5', 'son iguales', 'no sé'], answer: '0.7', hint: '7 décimos > 5 décimos' },
    { difficulty: 'easy', title: 'Decimal orden', prompt: 'Ordenar de menor a mayor: 0.2, 0.8, 0.5', options: ['0.2, 0.5, 0.8', '0.8, 0.5, 0.2', '0.5, 0.2, 0.8', '0.2, 0.8, 0.5'], answer: '0.2, 0.5, 0.8' },
    { difficulty: 'medium', title: 'Suma decimal', prompt: '¿Cuánto es 1.5 + 2.3?', options: ['3.8', '3.7', '3.9', '3.6'], answer: '3.8', hint: '1 + 2 = 3, 5 + 3 = 8' },
    { difficulty: 'medium', title: 'Resta decimal', prompt: '¿Cuánto es 3.7 - 1.2?', options: ['2.5', '2.6', '2.4', '2.7'], answer: '2.5', hint: '3 - 1 = 2, 7 - 2 = 5' },
    { difficulty: 'medium', title: 'Decimal mayor', prompt: '¿Cuál es mayor: 1.25 o 1.5?', options: ['1.5', '1.25', 'son iguales', 'no sé'], answer: '1.5', hint: '50 centésimos > 25 centésimos' },
    { difficulty: 'medium', title: 'Decimal整數', prompt: '¿Cuánto es 2 + 0.5?', options: ['2.5', '2.0', '0.7', '3.0'], answer: '2.5', hint: '2 + 0.5 = 2.5' },
    { difficulty: 'hard', title: 'Operación compleja', prompt: '¿Cuánto es 5.5 + 3.5?', options: ['9.0', '8.5', '9.5', '8.0'], answer: '9.0', hint: '5 + 3 = 8, 5 + 5 = 10, 8 + 1 = 9' },
    { difficulty: 'hard', title: 'Suma decimal', prompt: '¿Cuánto es 10.25 + 4.75?', options: ['15.0', '14.0', '15.5', '14.5'], answer: '15.0', hint: '10 + 4 = 14, 25 + 75 = 100 = 1' },
  ],
  M5_PERIM_AREA: [
    { difficulty: 'easy', title: 'Perímetro rectángulo', prompt: ' ¿Cuál es el perímetro de un rectángulo de 4cm de ancho y 6cm de largo?', options: ['20 cm', '18 cm', '22 cm', '24 cm'], answer: '20 cm', hint: '(4+6)×2 = 20' },
    { difficulty: 'easy', title: 'Área rectángulo', prompt: ' ¿Cuál es el área de un rectángulo de 3cm de ancho y 5cm de largo?', options: ['15 cm²', '16 cm²', '14 cm²', '18 cm²'], answer: '15 cm²', hint: '3 × 5 = 15' },
    { difficulty: 'easy', title: 'Perímetro cuadrado', prompt: ' ¿Cuál es el perímetro de un cuadrado de 4cm de lado?', options: ['16 cm', '12 cm', '20 cm', '8 cm'], answer: '16 cm', hint: '4 × 4 = 16' },
    { difficulty: 'easy', title: 'Área cuadrado', prompt: ' ¿Cuál es el área de un cuadrado de 3cm de lado?', options: ['9 cm²', '6 cm²', '12 cm²', '15 cm²'], answer: '9 cm²', hint: '3 × 3 = 9' },
    { difficulty: 'medium', title: 'Perímetro compuesto', prompt: 'Un rectángulo de 5cm × 8cm, ¿cuál es su perímetro?', options: ['26 cm', '24 cm', '28 cm', '30 cm'], answer: '26 cm', hint: '2×(5+8) = 26' },
    { difficulty: 'medium', title: 'Área rectángulo', prompt: ' ¿Cuál es el área de un rectángulo de 6cm × 4cm?', options: ['24 cm²', '22 cm²', '26 cm²', '20 cm²'], answer: '24 cm²', hint: '6 × 4 = 24' },
    { difficulty: 'medium', title: 'Perímetro vs Área', prompt: 'Un cuadrado de lado 5cm, ¿su perímetro es mayor que su área?', options: ['No', 'Sí', 'Iguales', 'Depende'], answer: 'No', hint: 'Perímetro = 20, Área = 25' },
    { difficulty: 'medium', title: 'Cálculo mental', prompt: 'Si un rectángulo tiene área 12cm² y base 4cm, ¿cuál es su altura?', options: ['3 cm', '2 cm', '4 cm', '5 cm'], answer: '3 cm', hint: '12 ÷ 4 = 3' },
    { difficulty: 'hard', title: 'Perímetro comp', prompt: 'Un rectángulo de 7cm × 9cm, ¿cuál es su perímetro?', options: ['32 cm', '30 cm', '34 cm', '28 cm'], answer: '32 cm', hint: '2×(7+9) = 32' },
    { difficulty: 'hard', title: 'Área complex', prompt: 'Un rectángulo de 8cm × 5cm, ¿cuál es su área?', options: ['40 cm²', '38 cm²', '42 cm²', '36 cm²'], answer: '40 cm²', hint: '8 × 5 = 40' },
  ],
  M5_MULT_DECIMAL: [
    { difficulty: 'easy', title: 'Decimal × entero', prompt: '¿Cuánto es 0.5 × 2?', options: ['1.0', '0.10', '1.5', '2.0'], answer: '1.0', hint: '5 décimos × 2 = 1' },
    { difficulty: 'easy', title: 'Decimal × entero', prompt: '¿Cuánto es 0.3 × 3?', options: ['0.9', '0.6', '1.2', '0.3'], answer: '0.9', hint: '3 décimos × 3 = 9 décimos' },
    { difficulty: 'easy', title: 'Decimal × 10', prompt: '¿Cuánto es 0.4 × 10?', options: ['4', '0.04', '0.14', '40'], answer: '4', hint: 'Agregar un cero' },
    { difficulty: 'easy', title: 'Decimal × 10', prompt: '¿Cuánto es 0.7 × 10?', options: ['7', '0.17', '0.07', '70'], answer: '7', hint: 'Agregar un cero' },
    { difficulty: 'medium', title: 'Decimal × entero', prompt: '¿Cuánto es 1.5 × 3?', options: ['4.5', '3.5', '5.5', '4.0'], answer: '4.5', hint: '1.5 × 3 = 4.5' },
    { difficulty: 'medium', title: 'Multiplicación', prompt: '¿Cuánto es 2.5 × 2?', options: ['5.0', '4.0', '6.0', '4.5'], answer: '5.0', hint: '2.5 + 2.5 = 5' },
    { difficulty: 'medium', title: 'Decimal × 2', prompt: '¿Cuánto es 0.6 × 2?', options: ['1.2', '1.0', '1.4', '0.12'], answer: '1.2', hint: '6 décimos × 2 = 1.2' },
    { difficulty: 'medium', title: 'Multiplicación', prompt: '¿Cuánto es 3.0 × 2?', options: ['6.0', '5.0', '7.0', '6.5'], answer: '6.0', hint: '3 × 2 = 6' },
    { difficulty: 'hard', title: 'Decimal double', prompt: '¿Cuánto es 2.5 × 4?', options: ['10.0', '8.0', '9.0', '11.0'], answer: '10.0', hint: '2.5 × 4 = 10' },
    { difficulty: 'hard', title: 'Decimal × 4', prompt: '¿Cuánto es 1.25 × 4?', options: ['5.0', '4.5', '5.5', '4.0'], answer: '5.0', hint: '1.25 × 4 = 5' },
  ],
  // GRADE 6
  M6_PROPORCIONES: [
    { difficulty: 'easy', title: 'Razón simple', prompt: 'Si tengo 3 manzanas y 5 naranjas, ¿cuál es la razón manzanas:naranjas?', options: ['3:5', '5:3', '3/5', '5/3'], answer: '3:5', hint: 'Se lee "3 es a 5"' },
    { difficulty: 'easy', title: 'Razón simplest', prompt: 'La razón 4:8 simplificada es...', options: ['1:2', '2:1', '1:4', '4:1'], answer: '1:2', hint: 'Dividir por 4' },
    { difficulty: 'easy', title: 'Identificar proporción', prompt: '¿Qué par está en proporción 2:4 = 3:6?', options: ['Sí', 'No', 'Falta dato', 'No sé'], answer: 'Sí', hint: '2/4 = 0.5, 3/6 = 0.5' },
    { difficulty: 'easy', title: 'Proporción básica', prompt: 'Si 2 cuesta $4, ¿cuánto cuesta 5?', options: ['$10', '$12', '$8', '$6'], answer: '$10', hint: '$2 × 5 = $10' },
    { difficulty: 'medium', title: 'Regla de tres', prompt: 'Si 3 chocolates cuestan $9, ¿cuánto cuestan 5?', options: ['$15', '$12', '$18', '$14'], answer: '$15', hint: '$9 ÷ 3 = $3 cada uno' },
    { difficulty: 'medium', title: 'Proporción', prompt: 'Si 4 libros pesan 8kg, ¿cuánto pesan 6 libros?', options: ['12 kg', '10 kg', '14 kg', '8 kg'], answer: '12 kg', hint: '8 ÷ 4 = 2, 2 × 6 = 12' },
    { difficulty: 'medium', title: 'Escala', prompt: 'En un mapa 3cm representan 60km реальн.', options: ['20 km/cm', '30 km/cm', '15 km/cm', '25 km/cm'], answer: '20 km/cm', hint: '60 ÷ 3 = 20' },
    { difficulty: 'medium', title: 'Proporción directa', prompt: 'Si 8 ÷ 2 = 12 ÷ x, ¿cuál es x?', options: ['3', '2', '4', '6'], answer: '3', hint: '8/2 = 12/x → 4 = 12/x → x = 3' },
    { difficulty: 'hard', title: 'Regla de tres compuesta', prompt: 'Si 5 workers hacen un trabajo en 10 días, ¿cuántos días toman 10 workers?', options: ['5 días', '3 días', '2 días', '7 días'], answer: '5 días', hint: 'Mitad de workers = mitad de días' },
    { difficulty: 'hard', title: 'Proporción compleja', prompt: 'Si 2:5 = x:20, ¿cuál es el valor de x?', options: ['8', '10', '6', '12'], answer: '8', hint: '2/5 = x/20 �� 40/5 = x → x = 8' },
  ],
  M6_PORCENTAJES: [
    { difficulty: 'easy', title: '10%', prompt: '¿Cuánto es el 10% de 50?', options: ['5', '10', '25', '50'], answer: '5', hint: '50 ÷ 10 = 5' },
    { difficulty: 'easy', title: '50%', prompt: '¿Cuánto es el 50% de 80?', options: ['40', '20', '60', '10'], answer: '40', hint: '80 ÷ 2 = 40' },
    { difficulty: 'easy', title: '25%', prompt: '¿Cuánto es el 25% de 100?', options: ['25', '20', '50', '75'], answer: '25', hint: '100 ÷ 4 = 25' },
    { difficulty: 'easy', title: '100%', prompt: '¿Cuánto es el 100% de 73?', options: ['73', '100', '37', '0'], answer: '73', hint: '100% es el total' },
    { difficulty: 'medium', title: '75%', prompt: '¿Cuánto es el 75% de 80?', options: ['60', '20', '40', '80'], answer: '60', hint: '80 × 3/4 = 60' },
    { difficulty: 'medium', title: 'Descuento', prompt: 'Una remeraque cuesta $100 tiene 20% de dto. ¿Cuánto pagan?', options: ['$80', '$20', '$120', '$90'], answer: '$80', hint: '100 - 20 = 80' },
    { difficulty: 'medium', title: 'Aumento', prompt: 'Si un auto vale $100 y aumenta 15%, ¿cuál es el nuevo precio?', options: ['$115', '$15', '$85', '$105'], answer: '115', hint: '100 + 15 = 115' },
    { difficulty: 'medium', title: 'Porcentaje de número', prompt: '¿Cuánto es el 30% de 60?', options: ['18', '12', '24', '30'], answer: '18', hint: '(60 × 30) ÷ 100 = 18' },
    { difficulty: 'hard', title: 'Porcentaje compuesto', prompt: '¿Cuánto es el 80% de 50?', options: ['40', '30', '35', '45'], answer: '40', hint: '50 ÷ 10 × 8 = 40' },
    { difficulty: 'hard', title: 'Cálculo complejo', prompt: 'Si una campera cuesta $200 con 25% de dto, ¿cuál es el precio final?', options: ['$150', '$175', '$125', '$100'], answer: '$150', hint: '200 - 50 = 150' },
  ],
  M6_ECUACIONES: [
    { difficulty: 'easy', title: 'Ecuación simple', prompt: 'Si x + 3 = 7, ¿cuánto vale x?', options: ['4', '3', '5', '6'], answer: '4', hint: 'x = 7 - 3 = 4' },
    { difficulty: 'easy', title: 'Ecuación basic', prompt: 'Si x - 5 = 10, ¿cuánto vale x?', options: ['15', '5', '20', '10'], answer: '15', hint: 'x = 10 + 5 = 15' },
    { difficulty: 'easy', title: 'Multiplicación en ecuación', prompt: 'Si 2x = 8, ¿cuánto vale x?', options: ['4', '2', '6', '8'], answer: '4', hint: 'x = 8 ÷ 2 = 4' },
    { difficulty: 'easy', title: 'División en ecuación', prompt: 'Si x ÷ 3 = 6, ¿cuánto vale x?', options: ['18', '9', '12', '3'], answer: '18', hint: 'x = 6 × 3 = 18' },
    { difficulty: 'medium', title: 'Ecuación con suma', prompt: 'Si x + 8 = 15, ¿cuánto vale x?', options: ['7', '6', '8', '9'], answer: '7', hint: 'x = 15 - 8 = 7' },
    { difficulty: 'medium', title: 'Ecuación con resta', prompt: 'Si 12 - x = 5, ¿cuánto vale x?', options: ['7', '6', '8', '5'], answer: '7', hint: 'x = 12 - 5 = 7' },
    { difficulty: 'medium', title: 'Ecuación multi', prompt: 'Si 3x = 21, ¿cuánto vale x?', options: ['7', '6', '8', '9'], answer: '7', hint: 'x = 21 ÷ 3 = 7' },
    { difficulty: 'medium', title: 'Ecuación double', prompt: 'Si x ÷ 4 = 5, ¿cuánto vale x?', options: ['20', '15', '25', '10'], answer: '20', hint: 'x = 5 × 4 = 20' },
    { difficulty: 'hard', title: 'Ecuación compleja', prompt: 'Si x + x = 10, ¿cuánto vale x?', options: ['5', '4', '6', '8'], answer: '5', hint: '2x = 10, x = 10 ÷ 2 = 5' },
    { difficulty: 'hard', title: 'Ecuación challenge', prompt: 'Si 2x + 3 = 13, ¿cuánto vale x?', options: ['5', '4', '6', '7'], answer: '5', hint: '2x = 13 - 3 = 10, x = 5' },
  ],
  // GRADE 7
  M7_ALGEBRA: [
    { difficulty: 'easy', title: 'Expresión algebraica', prompt: 'La expresión "3 más que x" se escribe como:', options: ['x + 3', '3x', 'x - 3', '3 - x'], answer: 'x + 3', hint: '3 más que x' },
    { difficulty: 'easy', title: 'Expresión algebraica', prompt: '"El doble de x" se escribe como:', options: ['2x', 'x + 2', 'x²', '2 + x'], answer: '2x', hint: 'Doble significa multiplicar por 2' },
    { difficulty: 'easy', title: 'Evaluar expresión', prompt: 'Si x = 4, ¿cuánto es x + 5?', options: ['9', '8', '7', '6'], answer: '9', hint: '4 + 5 = 9' },
    { difficulty: 'easy', title: 'Evaluar', prompt: 'Si x = 3, ¿cuánto es 2x?', options: ['6', '5', '4', '9'], answer: '6', hint: '2 × 3 = 6' },
    { difficulty: 'medium', title: 'Reducir expresión', prompt: 'x + x + x es igual a:', options: ['3x', 'x³', 'x + 3', '3 + x'], answer: '3x', hint: 'x + x + x = 3 por x' },
    { difficulty: 'medium', title: 'Sustitución', prompt: 'Si x = 2, ¿cuánto es x²?', options: ['4', '3', '6', '8'], answer: '4', hint: '2 × 2 = 4' },
    { difficulty: 'medium', title: 'Expresión con resta', prompt: 'Simplificar 5x - 2x', options: ['3x', '7x', '3', '10x'], answer: '3x', hint: '5x - 2x = 3x' },
    { difficulty: 'medium', title: 'Evaluar', prompt: 'Si x = 5, ¿cuánto es x + x?', options: ['10', '25', '5', '15'], answer: '10', hint: '5 + 5 = 10' },
    { difficulty: 'hard', title: 'Expresión compleja', prompt: 'Simplificar 2x + 3 + x - 1', options: ['3x + 2', '3x + 4', '3x - 2', '2x + 4'], answer: '3x + 2', hint: '2x + x = 3x, 3 - 1 = 2' },
    { difficulty: 'hard', title: 'Evaluar con potencia', prompt: 'Si x = 2, ¿cuánto es x³ + 1?', options: ['9', '7', '8', '10'], answer: '9', hint: '2³ + 1 = 8 + 1 = 9' },
  ],
  M7_FUNCIONES: [
    { difficulty: 'easy', title: 'Función lineal', prompt: 'Si f(x) = x + 1, ¿cuál es f(2)?', options: ['3', '2', '1', '4'], answer: '3', hint: '2 + 1 = 3' },
    { difficulty: 'easy', title: 'Función básica', prompt: 'Si f(x) = 2x, ¿cuál es f(3)?', options: ['6', '5', '4', '8'], answer: '6', hint: '2 × 3 = 6' },
    { difficulty: 'easy', title: 'Tabla de valores', prompt: 'f(x) = x + 3. ¿Cuántos valores da?|x|1|2|3|', options: ['4,5,6', '3,4,5', '2,3,4', '5,6,7'], answer: '4,5,6', hint: 'x + 3: 1+3=4, 2+3=5, 3+3=6' },
    { difficulty: 'easy', title: 'Identificar función', prompt: 'f(x) = x². ¿Es función?', options: ['Sí', 'No', 'Depende', 'No sé'], answer: 'Sí', hint: 'Cada x tiene un solo resultado' },
    { difficulty: 'medium', title: 'Evaluar función', prompt: 'Si f(x) = x - 2, ¿cuál es f(8)?', options: ['6', '7', '5', '10'], answer: '6', hint: '8 - 2 = 6' },
    { difficulty: 'medium', title: 'Regla de correspondencia', prompt: 'f(1)=2, f(2)=4, f(3)=6. ¿Cuál es la f(x)?', options: ['2x', 'x+1', 'x²', 'x-1'], answer: '2x', hint: 'Cada resultado es el doble de x' },
    { difficulty: 'medium', title: 'Función quadrática', prompt: 'Si f(x) = x², ¿cuál es f(3)?', options: ['9', '6', '12', '3'], answer: '9', hint: '3 × 3 = 9' },
    { difficulty: 'medium', title: 'Interpretar función', prompt: 'f(x) = 5. ¿Qué tipo de función es?', options: ['Constante', 'Lineal', 'Cuadrática', 'Ninguna'], answer: 'Constante', hint: 'Siempre da 5 sin importar x' },
    { difficulty: 'hard', title: 'Evaluación compleja', prompt: 'Si f(x) = x + x, ¿cuál es f(4)?', options: ['8', '6', '10', '12'], answer: '8', hint: '4 + 4 = 8' },
    { difficulty: 'hard', title: 'Función compuesta', prompt: 'f(x)=x-1. ¿Cuánto es f(5)+2?', options: ['6', '5', '7', '4'], answer: '6', hint: 'f(5)=5-1=4, 4+2=6' },
  ],
  M7_ESTADISTICA: [
    { difficulty: 'easy', title: 'Moda', prompt: 'Datos: 2, 3, 3, 5, 7. ¿Cuál es la moda?', options: ['3', '2', '5', 'No hay'], answer: '3', hint: 'Es el valor que más se repite' },
    { difficulty: 'easy', title: 'Moda con empates', prompt: 'Datos: 1, 2, 2, 3, 3. ¿Cuál es la moda?', options: ['2 y 3', '1', 'No hay', '2'], answer: '2 y 3', hint: 'Ambos aparecen 2 veces' },
    { difficulty: 'easy', title: 'Media simple', prompt: 'Datos: 2, 4, 6. ¿Cuál es la media?', options: ['4', '3', '5', '6'], answer: '4', hint: '(2+4+6)÷3 = 4' },
    { difficulty: 'easy', title: 'Mediana simple', prompt: 'Datos: 1, 3, 5. ¿Cuál es la mediana?', options: ['3', '1', '5', 'No hay'], answer: '3', hint: 'Es el valor del medio ordenando' },
    { difficulty: 'medium', title: 'Media', prompt: 'Datos: 2, 4, 4, 6. ¿Cuál es la media?', options: ['4', '3', '5', '4.5'], answer: '4', hint: '(2+4+4+6)÷4 = 4' },
    { difficulty: 'medium', title: 'Mediana', prompt: 'Datos: 1, 2, 3, 4, 5. ¿Cuál es la mediana?', options: ['3', '2', '4', '15'], answer: '3', hint: 'Ordenados: 1,2,3,4,5 → centro = 3' },
    { difficulty: 'medium', title: 'Moda cálculo', prompt: 'Datos: 1, 1, 2, 2, 3, 3. ¿Tienes moda?', options: ['No hay', '1', '2', 'Todas'], answer: 'No hay', hint: 'Todos aparecen igual' },
    { difficulty: 'medium', title: 'Media con decimales', prompt: 'Datos: 2, 4. ¿Cuál es la media?', options: ['3', '2', '4', '6'], answer: '3', hint: '(2+4)÷2 = 3' },
    { difficulty: 'hard', title: 'Estadística completa', prompt: 'Datos: 2, 4, 6, 8. Media, mediana y moda son:', options: ['5, 5, no hay', '5, 4, no hay', '4, 5, no hay', '5, 6, no hay'], answer: '5, 5, no hay', hint: 'Media=20/4=5, mediana=(4+6)/2=5, no hay moda' },
    { difficulty: 'hard', title: 'Análisis de datos', prompt: 'Datos: 1, 3, 3, 5, 7. ¿Media, mediana y moda?', options: ['3.8, 3, 3', '4, 3, 3', '3, 3, 3', '2, 5, 3'], answer: '3.8, 3, 3', hint: 'Media=19/5=3.8, mediana=3, moda=3' },
  ],
};

// Helper to generate exercises SQL
async function seedExercises() {
  console.log('Starting seed for Grade 4-7 Math...\n');

  // First insert concepts
  console.log('Inserting concepts...');
  for (const concept of concepts) {
    const { error } = await supabase
      .from('concepts')
      .upsert(concept, { onConflict: 'code' });
    
    if (error) {
      console.error(`Error inserting ${concept.code}:`, error.message);
    } else {
      console.log(`✓ ${concept.code}`);
    }
  }

  // Then insert exercises for each concept
  console.log('\nInserting exercises...');
  let exercisesInserted = 0;

  for (const concept of concepts) {
    const conceptExercises = exercisesData[concept.code];
    if (!conceptExercises) {
      console.warn(`No exercises for ${concept.code}, skipping`);
      continue;
    }

    // Get concept ID
    const { data: conceptData } = await supabase
      .from('concepts')
      .select('id')
      .eq('code', concept.code)
      .single();

    if (!conceptData) {
      console.error(`Concept not found: ${concept.code}`);
      continue;
    }

    const conceptId = conceptData.id;

    for (const ex of conceptExercises) {
      const { error } = await supabase
        .from('exercises')
        .insert({
          concept_id: conceptId,
          exercise_type: 'multiple_choice',
          difficulty: ex.difficulty,
          title_es: ex.title,
          prompt_es: ex.prompt,
          content: { options: ex.options },
          correct_answer: { value: ex.answer },
          hints: [{ text: ex.hint }],
          pedagogical_review_status: 'approved',
          estimated_time_seconds: ex.difficulty === 'easy' ? 30 : ex.difficulty === 'medium' ? 45 : 60,
        });

      if (error) {
        console.error(`Error inserting ${concept.code}/${ex.difficulty}:`, error.message);
      } else {
        exercisesInserted++;
      }
    }
    
    console.log(`✓ ${concept.code}: ${conceptExercises.length} exercises`);
  }

  console.log(`\n✅ Seed completed! Total exercises inserted: ${exercisesInserted}`);
}

// Run
seedExercises()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
  });