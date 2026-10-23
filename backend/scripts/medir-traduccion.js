// Mide los drivers DRV-01 (tiempo por traduccion) y DRV-02 (modismos adaptados, no literales)
// con la cadena de motores configurada (por defecto: Qwen local -> Claude -> reglas).
//   npm run medir                 -> imprime el informe
//   npm run medir -- informe.md   -> ademas lo guarda en un archivo
process.env.TALKLATE_LOGS = process.env.TALKLATE_LOGS || 'silencio';
const fs = require('node:fs');
const traductor = require('../src/composicion').crearTraduccion();

const ES = { codigo: 'es', nombre: 'Espanol' };
const EN = { codigo: 'en', nombre: 'Ingles' };
const US = { nombre: 'California', paisCodigo: 'US' };
const CO = { nombre: 'Antioquia', paisCodigo: 'CO' };
const MX = { nombre: 'Ciudad de Mexico', paisCodigo: 'MX' };
const TONOS = ['Neutral', 'Amigable', 'Alegre', 'Preocupado', 'Enojado', 'Formal'];

// Glosario de prueba: cada caso dice que palabras indican una traduccion cultural y cuales una literal
const GLOSARIO = [
  { texto: 'Hay que ponerse las pilas con el trabajo', o: ES, d: EN, r: US, bien: ['cracking', 'hustle', 'get moving', 'step it up', 'get going', 'pick up the pace'], mal: ['batteries'] },
  { texto: 'Parce, que chimba de plan', o: ES, d: EN, r: US, bien: ['awesome', 'great', 'amazing', 'cool', 'dude', 'buddy', 'bro'], mal: ['chimba'] },
  { texto: 'Estoy mamado de tanto trabajo', o: ES, d: EN, r: US, bien: ['fed up', 'tired', 'exhausted', 'sick of', 'worn out'], mal: ['breastfed', 'sucked'] },
  { texto: 'No le des papaya a nadie en la calle', o: ES, d: EN, r: US, bien: ['careless', 'target', 'expose', 'vulnerable', 'easy', 'careful'], mal: ['papaya'] },
  { texto: 'Me estas tomando el pelo', o: ES, d: EN, r: US, bien: ['pulling my leg', 'kidding', 'joking'], mal: ['hair'] },
  { texto: 'Ese carro cuesta un ojo de la cara', o: ES, d: EN, r: US, bien: ['arm and a leg', 'fortune', 'expensive'], mal: ['eye'] },
  { texto: 'Esto es pan comido', o: ES, d: EN, r: US, bien: ['piece of cake', 'easy', 'breeze'], mal: ['eaten bread', 'bread'] },
  { texto: 'Que pena con usted, me puede ayudar?', o: ES, d: EN, r: US, bien: ['sorry', 'excuse me', 'pardon'], mal: ['shame', 'pity'] },
  { texto: "Let's get cracking on the project", o: EN, d: ES, r: CO, bien: ['pilas', 'manos a la obra', 'empecemos', 'pongamonos'], mal: ['agrietando', 'romper'] },
  { texto: 'It costs an arm and a leg', o: EN, d: ES, r: CO, bien: ['ojo de la cara', 'carisimo', 'muy caro', 'una fortuna'], mal: ['brazo', 'pierna'] },
  { texto: 'Break a leg tonight!', o: EN, d: ES, r: CO, bien: ['suerte', 'exito'], mal: ['rompe', 'pierna'] },
  { texto: "It's raining cats and dogs", o: EN, d: ES, r: CO, bien: ['cantaros', 'aguacero', 'muchisimo', 'fuerte'], mal: ['gatos', 'perros'] },
  { texto: "Hey dude, that's so cool", o: EN, d: ES, r: MX, bien: ['wey', 'guey', 'padre', 'chido', 'genial'], mal: ['frio', 'fresco'] },
  { texto: "I'm under the weather today", o: EN, d: ES, r: CO, bien: ['enfermo', 'maluco', 'mal', 'indispuesto'], mal: ['clima', 'tiempo'] },
  { texto: 'The ball is in your court', o: EN, d: ES, r: CO, bien: ['te toca', 'tu turno', 'depende de ti', 'tu decides'], mal: ['pelota', 'cancha', 'balon'] },
];

const sinTildes = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const percentil = (xs, p) => { const o = [...xs].sort((a, b) => a - b); return o[Math.min(o.length - 1, Math.ceil((p / 100) * o.length) - 1)]; };

(async () => {
  const filas = [];
  for (const c of GLOSARIO) {
    const inicio = Date.now();
    let r;
    try {
      r = await traductor.traducir({ texto: c.texto, origen: c.o, destino: c.d, regionDestino: c.r, tonos: TONOS });
    } catch (e) {
      r = { traduccion: `ERROR: ${e.message}`, motor: '-' };
    }
    const ms = Date.now() - inicio;
    const t = sinTildes(r.traduccion);
    const cultural = c.bien.some((p) => t.includes(sinTildes(p))) && !c.mal.some((p) => t.includes(sinTildes(p)));
    filas.push({ ...c, traduccion: r.traduccion, motor: r.motor, ms, cultural });
  }
  const tiempos = filas.map((f) => f.ms);
  const adaptados = filas.filter((f) => f.cultural).length;
  const lineas = [
    '# Medicion de traduccion (DRV-01 y DRV-02)', '',
    `Fecha: ${new Date().toISOString()} · Cadena de motores: ${traductor.cadena().join(' -> ')}`, '',
    `- **DRV-01 tiempo por traduccion:** p50 = ${percentil(tiempos, 50)} ms, p95 = ${percentil(tiempos, 95)} ms (objetivo: p95 <= 3000 ms en texto).`,
    `- **DRV-02 modismos adaptados:** ${adaptados} de ${filas.length} (${Math.round((adaptados / filas.length) * 100)} %).`, '',
    '| Mensaje | Traduccion | Motor | ms | Cultural |', '| --- | --- | --- | --- | --- |',
    ...filas.map((f) => `| ${f.texto} | ${f.traduccion.replace(/\|/g, '/')} | ${f.motor} | ${f.ms} | ${f.cultural ? 'si' : 'no'} |`),
  ];
  const informe = lineas.join('\n');
  console.log(informe);
  if (process.argv[2]) fs.writeFileSync(process.argv[2], informe + '\n');
})();
