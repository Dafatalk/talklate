// Base de datos SQLite (node:sqlite, incluido en Node 22). Modelo basado en arquitectura/modelo_datos.md
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('node:crypto');

const ESQUEMA = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pais (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  codigo TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS region (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  pais_id TEXT NOT NULL REFERENCES pais(id),
  UNIQUE (nombre, pais_id)
);

CREATE TABLE IF NOT EXISTS lenguaje (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  codigo TEXT NOT NULL UNIQUE,
  activo INTEGER NOT NULL DEFAULT 0
);

-- Una region puede ser valida para varios lenguajes (Conversacion-RN-1)
CREATE TABLE IF NOT EXISTS lenguaje_region (
  lenguaje_id TEXT NOT NULL REFERENCES lenguaje(id),
  region_id TEXT NOT NULL REFERENCES region(id),
  PRIMARY KEY (lenguaje_id, region_id)
);

CREATE TABLE IF NOT EXISTS usuario (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  correo TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  fecha_nacimiento TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente','admin')),
  creado TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sesion_revocada (
  jti TEXT PRIMARY KEY,
  expira INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recuperacion (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuario(id),
  codigo_hash TEXT NOT NULL,
  expira INTEGER NOT NULL,
  usado INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS canal (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS entonacion (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS conversacion (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  fecha_inicio TEXT NOT NULL,
  usuario_id TEXT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE
);

-- Idioma de una conversacion: rol 'origen' o 'destino' (Conversacion-RN-2: el origen no cambia una vez detectado)
CREATE TABLE IF NOT EXISTS lenguaje_por_conversacion (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  conversacion_id TEXT NOT NULL REFERENCES conversacion(id) ON DELETE CASCADE,
  lenguaje_id TEXT NOT NULL REFERENCES lenguaje(id),
  region_id TEXT REFERENCES region(id),
  rol TEXT NOT NULL CHECK (rol IN ('origen','destino')),
  UNIQUE (conversacion_id, lenguaje_id)
);

CREATE TABLE IF NOT EXISTS mensaje_original (
  id TEXT PRIMARY KEY,
  lenguaje_conversacion_id TEXT NOT NULL REFERENCES lenguaje_por_conversacion(id) ON DELETE CASCADE,
  canal_id TEXT NOT NULL REFERENCES canal(id),
  entonacion_id TEXT NOT NULL REFERENCES entonacion(id),
  contenido TEXT NOT NULL,
  remitente TEXT NOT NULL DEFAULT 'usuario' CHECK (remitente IN ('usuario','interlocutor')),
  fecha_creacion TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mensaje_destino (
  id TEXT PRIMARY KEY,
  mensaje_original_id TEXT NOT NULL REFERENCES mensaje_original(id) ON DELETE CASCADE,
  lenguaje_conversacion_id TEXT NOT NULL REFERENCES lenguaje_por_conversacion(id) ON DELETE CASCADE,
  contenido_traducido TEXT NOT NULL,
  nota_cultural TEXT,
  aproximada INTEGER NOT NULL DEFAULT 0,
  motor TEXT NOT NULL,
  estado_entrega TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado_entrega IN ('Pendiente','Enviado','Entregado','Fallido')),
  fecha_creacion TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reporte (
  id TEXT PRIMARY KEY,
  mensaje_destino_id TEXT NOT NULL REFERENCES mensaje_destino(id) ON DELETE CASCADE,
  usuario_id TEXT NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  sugerencia TEXT,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto','revisado','descartado')),
  nota_admin TEXT,
  fecha TEXT NOT NULL,
  UNIQUE (mensaje_destino_id, usuario_id)
);
`;

// Catalogo inicial. Espanol e Ingles activos; Frances y Portugues existen pero inactivos (como en el modelo de dominio).
const PAISES = [
  ['Colombia', 'CO'], ['Estados Unidos', 'US'], ['Espana', 'ES'], ['Mexico', 'MX'],
  ['Argentina', 'AR'], ['Reino Unido', 'GB'], ['Francia', 'FR'], ['Brasil', 'BR'],
];
const REGIONES = [
  // [nombre, pais, lenguajes]
  ['Antioquia', 'Colombia', ['es']], ['Bogota', 'Colombia', ['es']],
  ['Madrid', 'Espana', ['es']], ['Ciudad de Mexico', 'Mexico', ['es']],
  ['Buenos Aires', 'Argentina', ['es']],
  ['California', 'Estados Unidos', ['en']], ['Texas', 'Estados Unidos', ['en', 'es']],
  ['Londres', 'Reino Unido', ['en']],
  ['Paris', 'Francia', ['fr']], ['Rio de Janeiro', 'Brasil', ['pt']],
];
const LENGUAJES = [['Espanol', 'es', 1], ['Ingles', 'en', 1], ['Frances', 'fr', 0], ['Portugues', 'pt', 0]];
const ENTONACIONES = ['Neutral', 'Amigable', 'Alegre', 'Preocupado', 'Enojado', 'Formal'];
const CANALES = ['Texto', 'Voz'];

function abrir(ruta = process.env.TALKLATE_DB || path.join(__dirname, '..', 'data', 'talklate.db')) {
  if (ruta !== ':memory:') fs.mkdirSync(path.dirname(ruta), { recursive: true });
  const db = new DatabaseSync(ruta);
  db.exec(ESQUEMA);
  sembrar(db);
  return db;
}

function sembrar(db) {
  const hay = db.prepare('SELECT COUNT(*) AS n FROM lenguaje').get().n;
  if (!hay) {
    const paisIds = {};
    for (const [nombre, codigo] of PAISES) {
      const id = randomUUID();
      paisIds[nombre] = id;
      db.prepare('INSERT INTO pais (id, nombre, codigo) VALUES (?,?,?)').run(id, nombre, codigo);
    }
    const lenIds = {};
    for (const [nombre, codigo, activo] of LENGUAJES) {
      const id = randomUUID();
      lenIds[codigo] = id;
      db.prepare('INSERT INTO lenguaje (id, nombre, codigo, activo) VALUES (?,?,?,?)').run(id, nombre, codigo, activo);
    }
    for (const [nombre, pais, langs] of REGIONES) {
      const id = randomUUID();
      db.prepare('INSERT INTO region (id, nombre, pais_id) VALUES (?,?,?)').run(id, nombre, paisIds[pais]);
      for (const l of langs) db.prepare('INSERT INTO lenguaje_region (lenguaje_id, region_id) VALUES (?,?)').run(lenIds[l], id);
    }
    for (const n of ENTONACIONES) db.prepare('INSERT INTO entonacion (id, nombre) VALUES (?,?)').run(randomUUID(), n);
    for (const n of CANALES) db.prepare('INSERT INTO canal (id, nombre) VALUES (?,?)').run(randomUUID(), n);
  }
  const correo = (process.env.ADMIN_CORREO || 'dafa123.daf@gmail.com').toLowerCase();
  const existe = db.prepare('SELECT id FROM usuario WHERE correo = ?').get(correo);
  if (!existe) {
    db.prepare(
      'INSERT INTO usuario (id, nombre, apellido, correo, password_hash, fecha_nacimiento, rol, creado) VALUES (?,?,?,?,?,?,?,?)'
    ).run(randomUUID(), 'Admin', 'TalkLate', correo, bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin123!', 10), '1990-01-01', 'admin', new Date().toISOString());
  }
}

// Ejecuta fn dentro de una transaccion
function transaccion(db, fn) {
  db.exec('BEGIN');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

module.exports = { abrir, transaccion };
