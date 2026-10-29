// Mide la voz natural con emocion (ADR-016): manda 10 frases (espanol e ingles, con distintos tonos)
// al motor configurado en .env, guarda cada audio y muestra cuanto tardo. Uso: npm run medir:voz
// Los audios quedan en backend/medicion-voz/ para escucharlos y juzgar si la emocion se nota.
process.env.TALKLATE_LOGS = process.env.TALKLATE_LOGS || 'silencio';
const fs = require('node:fs');
const path = require('node:path');
const { crearSintetizadores } = require('../src/composicion');

const FRASES = [
  ['es', 'Enojado', 'Te dije mil veces que no tocaras mis cosas, estoy cansado de lo mismo.'],
  ['es', 'Alegre', 'No lo puedo creer, pasamos el examen, vamos a celebrar esta noche.'],
  ['es', 'Preocupado', 'No se nada de mi hermano desde ayer y ya me estoy asustando.'],
  ['es', 'Amigable', 'Hola parce, que bueno verte, sientate y tomate un cafe conmigo.'],
  ['es', 'Formal', 'Buenos dias, quisiera confirmar mi reserva para el viernes, por favor.'],
  ['en', 'Enojado', 'I told you a thousand times not to touch my stuff, I am sick of this.'],
  ['en', 'Alegre', 'I cannot believe it, we passed the exam, let us celebrate tonight.'],
  ['en', 'Preocupado', 'I have not heard from my brother since yesterday and I am getting scared.'],
  ['en', 'Amigable', 'Hey buddy, great to see you, sit down and grab a coffee with me.'],
  ['en', 'Neutral', 'The train to the airport leaves every twenty minutes from platform two.'],
];

(async () => {
  const motores = crearSintetizadores(process.env).filter((s) => s.disponible());
  if (!motores.length) { console.error('No hay motor de voz configurado. Revisa VOZ_MOTOR y VOICESTUDIO_URL en .env'); process.exit(1); }
  const motor = motores[0];
  const salida = path.join(__dirname, '..', 'medicion-voz');
  fs.mkdirSync(salida, { recursive: true });
  console.log(`Motor: ${motor.nombre}\n`);
  const tiempos = [];
  for (const [i, [idioma, tono, texto]] of FRASES.entries()) {
    const inicio = Date.now();
    try {
      const r = await motor.sintetizar({ texto, idioma, pais: null, tono, ritmo: 1 });
      const ms = Date.now() - inicio;
      tiempos.push(ms);
      const archivo = `${String(i + 1).padStart(2, '0')}-${idioma}-${tono}.${r.tipo === 'audio/wav' ? 'wav' : 'mp3'}`;
      fs.writeFileSync(path.join(salida, archivo), r.audio);
      console.log(`${(ms / 1000).toFixed(1).padStart(5)} s  ${idioma} ${tono.padEnd(10)} -> ${archivo}`);
    } catch (e) {
      console.log(`  ERROR  ${idioma} ${tono.padEnd(10)} ${e.message}`);
    }
  }
  if (tiempos.length) {
    const orden = [...tiempos].sort((a, b) => a - b);
    const p = (q) => orden[Math.min(orden.length - 1, Math.floor(q * orden.length))] / 1000;
    console.log(`\nMediana ${p(0.5).toFixed(1)} s · p95 ${p(0.95).toFixed(1)} s · ${tiempos.length}/${FRASES.length} frases. Audios en ${salida}`);
  }
})();
