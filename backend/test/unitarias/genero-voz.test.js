const test = require('node:test');
const assert = require('node:assert/strict');
const { generoPorPitch } = require('../../src/dominio/prosodia');
const { estimarF0, crearDetectorGeneroPitch } = require('../../src/adaptadores/audio/genero');

// Genera un PCM mono 16-bit LE de un tono senoidal (para probar la estimacion de pitch sin audio real).
function tono(freq, { segundos = 1, sampleRate = 16000, amp = 0.5 } = {}) {
  const n = Math.floor(sampleRate * segundos);
  const buf = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) buf.writeInt16LE(Math.round(Math.sin((2 * Math.PI * freq * i) / sampleRate) * amp * 32767), i * 2);
  return buf;
}

test('generoPorPitch: grave=hombre, agudo=mujer, banda ambigua y basura=null', () => {
  assert.equal(generoPorPitch(120), 'hombre');
  assert.equal(generoPorPitch(210), 'mujer');
  assert.equal(generoPorPitch(170), null); // banda muerta 160-180
  assert.equal(generoPorPitch(0), null);
  assert.equal(generoPorPitch(null), null);
  assert.equal(generoPorPitch(NaN), null);
});

test('estimarF0: reconoce la frecuencia de un tono senoidal', () => {
  assert.ok(Math.abs(estimarF0(tono(120)) - 120) < 8, 'voz grave ~120 Hz');
  assert.ok(Math.abs(estimarF0(tono(220)) - 220) < 10, 'voz aguda ~220 Hz');
});

test('estimarF0: silencio o audio muy corto devuelve null', () => {
  assert.equal(estimarF0(Buffer.alloc(16000 * 2)), null); // 1 s de silencio
  assert.equal(estimarF0(tono(120, { segundos: 0.1 })), null); // menos de 200 ms
});

test('estimarF0 + generoPorPitch en cadena deciden el genero', () => {
  assert.equal(generoPorPitch(estimarF0(tono(115))), 'hombre');
  assert.equal(generoPorPitch(estimarF0(tono(215))), 'mujer');
});

test('detector deshabilitado no analiza y devuelve genero null', async () => {
  const det = crearDetectorGeneroPitch({ habilitado: false });
  assert.equal(det.disponible(), false);
  assert.deepEqual(await det.detectar({ audio: tono(120) }), { genero: null, f0: null });
});

test('detector con ffmpeg inexistente cae a null sin lanzar', async () => {
  const det = crearDetectorGeneroPitch({ ffmpegPath: '/no/existe/ffmpeg' });
  assert.equal(det.disponible(), true);
  assert.deepEqual(await det.detectar({ audio: tono(120) }), { genero: null, f0: null });
});
