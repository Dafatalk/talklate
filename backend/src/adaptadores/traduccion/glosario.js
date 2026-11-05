// Glosario cultural: modismos paisa (es-CO) e ingles neoyorquino (en-US) con su equivalente en la
// otra variedad. Cuando un modismo del glosario aparece en el mensaje, prompt.js lo inyecta al
// prompt para que el motor (Qwen/Claude) traduzca con contexto cultural en vez de palabra por palabra.
//
// Origen de los datos: investigacion con fuente por entrada (campo `source`). Cada entrada trae
// `native_validated: false` hasta que un hablante nativo la revise, y `sensitive` para cruzar con la
// matriz de sensibilidad del proyecto. El glosario es opcional: si el archivo falta o no hay
// coincidencias, el prompt funciona igual, solo sin las pistas culturales.
//
// MEJORA FUTURA: hoy el glosario vive en glosario.json (versionado y auditable). Si se quiere
// editar sin tocar codigo, migrarlo a una tabla SurrealDB `termino_cultural` (schemaless) con su
// puerto/repositorio en la arquitectura hexagonal; se indexa por el string de locale, asi que es
// independiente del catalogo de regiones.
const fs = require('node:fs');
const path = require('node:path');

let GLOSARIO = [];
try {
  GLOSARIO = JSON.parse(fs.readFileSync(path.join(__dirname, 'glosario.json'), 'utf8'));
} catch {
  GLOSARIO = [];
}

// El proyecto solo maneja espanol paisa e ingles neoyorquino. es -> es-CO (Antioquia), en -> en-US.
function localeDe(codigo) {
  if (codigo === 'es') return 'es-CO';
  if (codigo === 'en') return 'en-US';
  return null;
}

// Minusculas y sin acentos (\p{M} = marcas combinantes), para comparar sin importar tildes ni mayusculas.
function normalizar(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

// Un termino puede traer variantes separadas por "/" (ej. "parce / parcero") y aclaraciones entre
// parentesis que no son parte de la palabra buscada. Se descartan variantes de menos de 2 letras.
function variantesDe(term) {
  return String(term)
    .split('/')
    .map((v) => v.replace(/\(.*?\)/g, '').trim())
    .filter((v) => v.length >= 2);
}

function escaparRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Devuelve, del glosario del locale de origen, los terminos que aparecen como palabra/expresion
// completa en el texto. Prioriza las expresiones mas largas (mas especificas) y limita la cantidad
// para no inflar el prompt.
function buscarTerminos(texto, localeOrigen, { limite = 15 } = {}) {
  if (!localeOrigen || !texto) return [];
  const t = normalizar(texto);
  const encontrados = [];
  for (const e of GLOSARIO) {
    if (e.locale !== localeOrigen) continue;
    const coincidencia = variantesDe(e.term).find((v) => {
      const n = escaparRegex(normalizar(v));
      // (s|es)? captura el plural (pola -> polas, parcero -> parceros). No cubre conjugaciones
      // verbales (camellar -> camellando): esas quedan para la validacion/ampliacion con nativos.
      return new RegExp(`(^|[^\\p{L}])${n}(s|es)?([^\\p{L}]|$)`, 'u').test(t);
    });
    if (coincidencia) encontrados.push({ ...e, coincidencia });
  }
  encontrados.sort((a, b) => b.coincidencia.length - a.coincidencia.length);
  return encontrados.slice(0, limite);
}

module.exports = { buscarTerminos, localeDe, GLOSARIO };
