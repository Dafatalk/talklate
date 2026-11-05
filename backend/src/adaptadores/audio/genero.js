// Adaptador del puerto DetectorGenero (ver puertos/index.js): estima el genero de quien habla por la
// AGUDEZA de su voz (frecuencia fundamental / pitch). Reemplaza al metodo anterior, que lo inferia del
// texto y fallaba sobre todo en ingles (pocas marcas de genero).
//
// Decodifica el audio (m4a/aac/webm/...) a PCM mono 16-bit con ffmpeg y estima el pitch por
// autocorrelacion. Es un apoyo para elegir la voz de salida, NO determina la identidad de la persona.
// Si ffmpeg no esta instalado, el audio es muy corto o el pitch cae en la banda ambigua, devuelve
// genero null y quien llama cae al metodo anterior (texto) o al default (ver conversaciones.js).
const { spawn } = require('node:child_process');
const { generoPorPitch } = require('../../dominio/prosodia');

const SAMPLE_RATE = 16000;

// Decodifica cualquier formato de audio a PCM mono 16-bit LE con ffmpeg (stdin -> stdout).
function decodificarPCM(audio, { ffmpegPath = 'ffmpeg', timeoutMs = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    const ff = spawn(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-i', 'pipe:0', '-f', 's16le', '-ac', '1', '-ar', String(SAMPLE_RATE), 'pipe:1']);
    const salida = [];
    let err = '';
    const temporizador = setTimeout(() => { ff.kill('SIGKILL'); reject(new Error('ffmpeg timeout')); }, timeoutMs);
    ff.stdout.on('data', (d) => salida.push(d));
    ff.stderr.on('data', (d) => { err += d.toString(); });
    ff.on('error', (e) => { clearTimeout(temporizador); reject(e); }); // ffmpeg no instalado
    ff.on('close', (code) => {
      clearTimeout(temporizador);
      if (code !== 0) return reject(new Error(`ffmpeg salio ${code}: ${err.slice(0, 200)}`));
      resolve(Buffer.concat(salida));
    });
    ff.stdin.on('error', () => {}); // EPIPE si ffmpeg cierra antes de leer todo
    ff.stdin.end(audio);
  });
}

// Estima la frecuencia fundamental (Hz) de un PCM mono 16-bit por autocorrelacion normalizada. Recorre
// la senal en cuadros, ignora silencios y cuadros sin un pico claro, y devuelve la MEDIANA de los
// cuadros con voz (robusta ante errores de octava). null si no hay suficiente voz confiable.
function estimarF0(pcm, sampleRate = SAMPLE_RATE, { fMin = 70, fMax = 400 } = {}) {
  const n = Math.floor(pcm.length / 2);
  if (n < sampleRate * 0.2) return null; // menos de 200 ms de audio
  const muestras = new Float64Array(n);
  let energiaTotal = 0;
  for (let i = 0; i < n; i++) { const s = pcm.readInt16LE(i * 2) / 32768; muestras[i] = s; energiaTotal += s * s; }
  if (Math.sqrt(energiaTotal / n) < 0.005) return null; // practicamente silencio
  const rmsGlobal = Math.sqrt(energiaTotal / n);

  const ventana = 2048;
  const salto = 1024;
  const lagMin = Math.floor(sampleRate / fMax);
  const lagMax = Math.min(Math.floor(sampleRate / fMin), ventana - 1);
  const f0s = [];
  for (let inicio = 0; inicio + ventana <= n; inicio += salto) {
    let energia = 0;
    for (let i = 0; i < ventana; i++) energia += muestras[inicio + i] * muestras[inicio + i];
    if (Math.sqrt(energia / ventana) < rmsGlobal * 0.5) continue; // cuadro sin voz

    let mejorLag = -1;
    let mejorValor = 0;
    for (let lag = lagMin; lag <= lagMax; lag++) {
      let suma = 0;
      for (let i = 0; i < ventana - lag; i++) suma += muestras[inicio + i] * muestras[inicio + i + lag];
      const norm = suma / (energia || 1); // normalizada contra la autocorrelacion en lag 0
      if (norm > mejorValor) { mejorValor = norm; mejorLag = lag; }
    }
    if (mejorLag > 0 && mejorValor > 0.3) f0s.push(sampleRate / mejorLag); // pico suficientemente claro
  }
  if (f0s.length < 5) return null; // poca voz: no arriesgar un genero
  f0s.sort((a, b) => a - b);
  return f0s[Math.floor(f0s.length / 2)]; // mediana
}

function crearDetectorGeneroPitch({ ffmpegPath = process.env.FFMPEG_PATH || 'ffmpeg', habilitado = true, timeoutMs } = {}) {
  return {
    nombre: 'pitch',
    disponible: () => !!habilitado,
    // { audio: Buffer } -> { genero: 'hombre'|'mujer'|null, f0: number|null }
    async detectar({ audio } = {}) {
      if (!habilitado || !audio || !audio.length) return { genero: null, f0: null };
      try {
        const pcm = await decodificarPCM(audio, { ffmpegPath, timeoutMs });
        const f0 = estimarF0(pcm);
        return { genero: generoPorPitch(f0), f0: f0 ? Number(f0.toFixed(1)) : null };
      } catch {
        return { genero: null, f0: null }; // ffmpeg ausente o fallo de decodificacion: cae al metodo anterior
      }
    },
  };
}

module.exports = { crearDetectorGeneroPitch, estimarF0, decodificarPCM };
