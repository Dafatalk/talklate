import test from 'node:test';
import assert from 'node:assert/strict';
import { edad, passwordSegura, validarRegistro, etiquetaConfig, idiomaDeEntrega } from '../lib/reglas.ts';

const hoy = new Date('2026-10-14T12:00:00');
const valido = { nombre: 'Ana', apellido: 'Gomez', correo: 'ana@correo.com', fecha: '2000-05-10', password: 'Clave123!', acepta: true };

test('edad cumplida el mismo dia', () => {
  assert.equal(edad('2013-10-14', hoy), 13);
  assert.equal(edad('2013-10-15', hoy), 12);
});

test('contrasena segura (Usuario-RN-4)', () => {
  assert.equal(passwordSegura('Clave123!'), true);
  assert.equal(passwordSegura('clave123!'), false);
  assert.equal(passwordSegura('Clave!!!!'), false);
  assert.equal(passwordSegura('Cl1!'), false);
});

test('registro valido y errores por campo', () => {
  assert.deepEqual(validarRegistro(valido, hoy), {});
  const e = validarRegistro({ ...valido, correo: 'malo', fecha: '2015-01-01', acepta: false }, hoy);
  assert.deepEqual(Object.keys(e).sort(), ['acepta', 'correo', 'fecha']);
  assert.match(e.fecha, /13 anos/);
  assert.equal(validarRegistro({ ...valido, fecha: '10/05/2000' }, hoy).fecha, 'Usa el formato AAAA-MM-DD');
});

test('etiqueta de la configuracion y idioma de entrega', () => {
  const config = { origen: null, destino: { idioma: 'Ingles', region: 'California' } };
  assert.equal(etiquetaConfig(config), 'Idioma por detectar → Ingles (California)');
  assert.equal(etiquetaConfig({ origen: { idioma: 'Espanol' }, destino: { idioma: 'Ingles', region: null } }), 'Espanol → Ingles');
  const c2 = { origen: { codigo: 'es' }, destino: { codigo: 'en' } };
  assert.equal(idiomaDeEntrega('usuario', c2)?.codigo, 'en');
  assert.equal(idiomaDeEntrega('interlocutor', c2)?.codigo, 'es');
});
