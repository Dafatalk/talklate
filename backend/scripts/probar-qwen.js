// Prueba el motor de traduccion Qwen (Ollama) de forma aislada, sin HTTP ni DB.
// Uso: node scripts/probar-qwen.js  (otro modelo: QWEN_MODEL=qwen3:30b-a3b node scripts/probar-qwen.js)
process.env.TRADUCTOR = 'qwen';
process.env.QWEN_MODEL = process.env.QWEN_MODEL || 'qwen2.5:7b'; // el mismo modelo por defecto del backend
process.env.QWEN_TIMEOUT_MS = process.env.QWEN_TIMEOUT_MS || '180000';
process.env.TALKLATE_LOGS = process.env.TALKLATE_LOGS || 'silencio';

const traductor = require('../src/lib/traductor');
const TONOS = ['Neutral', 'Amigable', 'Alegre', 'Preocupado', 'Enojado', 'Formal'];

const casos = [
  { texto: 'Parce, hay que ponerse las pilas con el trabajo', origen: { codigo: 'es', nombre: 'Espanol' }, destino: { codigo: 'en', nombre: 'Ingles' }, regionDestino: { nombre: 'California', paisCodigo: 'US' }, tonos: TONOS },
  { texto: "Let's get this done, buddy! No worries.", origen: { codigo: 'en', nombre: 'Ingles' }, destino: { codigo: 'es', nombre: 'Espanol' }, regionDestino: { nombre: 'Antioquia', paisCodigo: 'CO' }, tonos: TONOS },
];

async function main() {
  console.log(`Motor: qwen (modelo ${process.env.QWEN_MODEL}) via Ollama\n`);
  for (const caso of casos) {
    const inicio = Date.now();
    const out = await traductor.traducir(caso);
    console.log(`[${caso.origen.codigo} -> ${caso.destino.codigo}] "${caso.texto}"`);
    console.log(`   => "${out.traduccion}"`);
    console.log(`   motor=${out.motor} | tono=${out.tono} | nota=${out.nota || '-'} | region_origen=${out.regionOrigen || '-'} | ${Date.now() - inicio}ms\n`);
  }
  console.log('OK — el motor Qwen tradujo correctamente.');
}

main().catch((e) => { console.error('FALLO:', e.message); process.exit(1); });
