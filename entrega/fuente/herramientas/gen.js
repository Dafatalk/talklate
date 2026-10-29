// Convierte los .md de entrega/ en documentos Word formales (uno por documento y uno consolidado).
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const sizeOf = (buf) => ({ w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }); // PNG
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType,
  ShadingType, BorderStyle, ImageRun, PageBreak, Header, Footer, PageNumber, TableOfContents, LevelFormat,
  ExternalHyperlink, TabStopType, VerticalAlign, LineRuleType,
} = require('docx');

const ENTREGA = path.resolve(__dirname, '..') + '/'; // entrega/fuente/
const IMG = path.resolve(__dirname, '../../diagramas/img');
const SALIDA = process.argv[2] || path.resolve(__dirname, '../../documentos');
fs.mkdirSync(SALIDA, { recursive: true });

const AZUL = '1F3864';
const AZUL_CLARO = 'D9E2F3';
const GRIS = 'BFBFBF';
const FUENTE = 'Calibri';
const ANCHO = 9360; // carta con margenes de 1 pulgada (DXA)

const DOCS = [
  ['01_vision_y_contexto', 'Vision y contexto'],
  ['02_mapa_de_impacto', 'Mapa de impacto'],
  ['03_historias_de_usuario', 'Historias de usuario'],
  ['04_criterios_de_aceptacion', 'Criterios de aceptacion'],
  ['05_requisitos_funcionales_y_no_funcionales', 'Requisitos funcionales y no funcionales'],
  ['06_drivers_de_arquitectura', 'Drivers de arquitectura'],
  ['07_arquitectura', 'Arquitectura'],
  ['08_stack_tecnologico', 'Stack tecnologico'],
  ['09_diagramas_c4', 'Diagramas C4'],
  ['10_componentes', 'Componentes de la API'],
  ['11_decisiones_de_arquitectura_ADR', 'Decisiones de arquitectura (ADR)'],
  ['12_modelo_de_datos', 'Modelo de datos'],
  ['13_especificacion_vistas_ui', 'Especificacion de vistas y UI'],
  ['14_planificacion_de_sprints', 'Planificacion de sprints'],
  ['15_plan_de_liberaciones', 'Plan de liberaciones'],
  ['16_matriz_sensibilidad_datos', 'Matriz de sensibilidad de datos'],
  ['17_politica_tratamiento_datos', 'Politica de tratamiento de datos personales'],
];
const NOMBRE = Object.fromEntries(DOCS.map(([f, t], i) => [f + '.md', `documento ${i + 1} (${t})`]));

// Referencias a archivos .md de la entrega -> nombre del documento
function limpiarTexto(t) {
  return t.replace(/`?(\d\d_[a-zA-Z0-9_]+\.md)`?/g, (m, f) => NOMBRE[f] || m);
}

// ---------- texto en linea ----------
function runs(tokens, base = {}) {
  const out = [];
  for (const t of tokens || []) {
    switch (t.type) {
      case 'strong': out.push(...runs(t.tokens, { ...base, bold: true })); break;
      case 'em': out.push(...runs(t.tokens, { ...base, italics: true })); break;
      case 'codespan': if (/^\d\d_[a-zA-Z0-9_]+\.md$/.test(t.text) && NOMBRE[t.text]) { out.push(new TextRun({ ...base, text: NOMBRE[t.text], italics: true })); break; }
      case 'codespan': out.push(new TextRun({ text: limpiarTexto(decode(t.text)), font: 'Consolas', size: (base.size || 21) - 2, color: '2F5496', bold: base.bold })); break;
      case 'link': {
        const hijos = runs(t.tokens, { ...base, color: '2F5496', underline: {} });
        if (/^https?:/.test(t.href)) out.push(new ExternalHyperlink({ link: t.href, children: hijos }));
        else out.push(...hijos);
        break;
      }
      case 'br': out.push(new TextRun({ text: '', break: 1 })); break;
      case 'del': out.push(...runs(t.tokens, { ...base, strike: true })); break;
      case 'text':
        if (t.tokens) out.push(...runs(t.tokens, base));
        else out.push(new TextRun({ ...base, text: limpiarTexto(decode(t.text)) }));
        break;
      case 'escape': out.push(new TextRun({ ...base, text: t.text })); break;
      case 'html': out.push(new TextRun({ ...base, text: decode(t.text.replace(/<br\s*\/?>/g, ' ').replace(/<[^>]+>/g, '')) })); break;
      default: out.push(new TextRun({ ...base, text: limpiarTexto(decode(t.raw || t.text || '')) }));
    }
  }
  return out;
}
function decode(s) {
  return String(s).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

// ---------- imagenes ----------
let figura = 0;
function imagen(archivo, titulo) {
  const buf = fs.readFileSync(archivo);
  const { w, h } = sizeOf(buf);
  const maxW = 624; // px a 96 dpi = 6.5 pulgadas
  const maxH = 760;
  let ancho = maxW;
  let alto = Math.round((h * ancho) / w);
  if (alto > maxH) { alto = maxH; ancho = Math.round((w * alto) / h); }
  figura += 1;
  return [
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true, children: [new ImageRun({ type: 'png', data: buf, transformation: { width: ancho, height: alto }, altText: { title: titulo, description: titulo, name: titulo } })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: `Figura ${figura}. `, bold: true, italics: true, size: 18, color: '404040' }), new TextRun({ text: titulo, italics: true, size: 18, color: '404040' })] }),
  ];
}

// ---------- tablas ----------
function textoPlano(tokens) {
  return (tokens || []).map((t) => (t.tokens ? textoPlano(t.tokens) : t.text || t.raw || '')).join('');
}
function tabla(t) {
  const n = t.header.length;
  const tam = n >= 6 ? 15 : n >= 4 ? 17 : 19;
  const porChar = tam * 4.6; // DXA por caracter (aprox. Calibri)
  const columnas = t.header.map((h, i) => [textoPlano(h.tokens), ...t.rows.map((r) => textoPlano(r[i].tokens))]);
  // minimo: que la palabra mas larga de la columna quepa sin partirse
  const minimos = columnas.map((c) => Math.round(Math.max(...c.flatMap((x) => x.split(/\s+/)).map((w) => Math.min(w.length, 22))) * porChar + 200));
  const deseos = columnas.map((c) => c.reduce((a, x) => a + Math.min(x.length, 160), 0) / c.length);
  let anchos = minimos.slice();
  let resto = ANCHO - anchos.reduce((a, b) => a + b, 0);
  if (resto < 0) { const f = ANCHO / (ANCHO - resto); anchos = anchos.map((a) => Math.floor(a * f)); resto = ANCHO - anchos.reduce((a, b) => a + b, 0); }
  // el espacio que sobra va a las columnas con mas texto
  const extra = deseos.map((d, i) => Math.max(0, d * porChar - anchos[i]));
  const totalExtra = extra.reduce((a, b) => a + b, 0) || 1;
  anchos = anchos.map((a, i) => a + Math.floor((resto * extra[i]) / totalExtra));
  anchos[n - 1] += ANCHO - anchos.reduce((a, b) => a + b, 0);
  const borde = { style: BorderStyle.SINGLE, size: 4, color: GRIS };
  const bordes = { top: borde, bottom: borde, left: borde, right: borde };
  const celda = (tokens, i, encabezado, par) => new TableCell({
    width: { size: anchos[i], type: WidthType.DXA },
    borders: bordes,
    verticalAlign: VerticalAlign.CENTER,
    shading: encabezado ? { fill: AZUL, type: ShadingType.CLEAR, color: 'auto' } : par ? { fill: 'F2F5FB', type: ShadingType.CLEAR, color: 'auto' } : undefined,
    margins: { top: 50, bottom: 50, left: 80, right: 80 },
    children: [new Paragraph({ spacing: { before: 0, after: 0 }, children: runs(tokens, { size: tam, color: encabezado ? 'FFFFFF' : undefined, bold: encabezado || undefined }) })],
  });
  return new Table({
    width: { size: ANCHO, type: WidthType.DXA },
    columnWidths: anchos,
    rows: [
      new TableRow({ tableHeader: true, children: t.header.map((h, i) => celda(h.tokens, i, true)) }),
      ...t.rows.map((r, k) => new TableRow({ cantSplit: true, children: r.map((c, i) => celda(c.tokens, i, false, k % 2 === 1)) })),
    ],
  });
}

// ---------- bloques ----------
function bloques(tokens, ctx) {
  const out = [];
  for (const t of tokens) {
    switch (t.type) {
      case 'heading': {
        const nivel = Math.min(t.depth + ctx.desfase, 4);
        if (t.depth === 1) break; // el titulo del documento va en la portada o en el capitulo
        ctx.ultimoTitulo = textoPlano(t.tokens);
        out.push(new Paragraph({ heading: [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4][nivel - 1], keepNext: true, children: runs(t.tokens) }));
        break;
      }
      case 'paragraph': {
        const img = t.tokens && t.tokens.length === 1 && t.tokens[0].type === 'image' ? t.tokens[0] : null;
        if (img) {
          const archivo = path.join(IMG, path.basename(img.href));
          out.push(...imagen(fs.existsSync(archivo) ? archivo : path.join(ENTREGA, img.href), img.text));
        } else out.push(new Paragraph({ spacing: { after: 120 }, children: runs(t.tokens) }));
        break;
      }
      case 'list': out.push(...lista(t, 0, ctx)); break;
      case 'table': out.push(tabla(t), new Paragraph({ spacing: { after: 120 }, children: [] })); break;
      case 'blockquote':
        for (const b of t.tokens) {
          if (b.type === 'paragraph') out.push(new Paragraph({ indent: { left: 360 }, spacing: { after: 120 }, border: { left: { style: BorderStyle.SINGLE, size: 18, color: '8EAADB', space: 8 } }, children: runs(b.tokens, { italics: true, color: '404040' }) }));
          else out.push(...bloques([b], ctx));
        }
        break;
      case 'code': {
        if (t.lang === 'mermaid') {
          const archivo = path.join(IMG, `${ctx.doc}_m${ctx.mermaid++}.png`);
          out.push(...imagen(archivo, ctx.ultimoTitulo || 'Diagrama'));
        } else {
          for (const linea of t.text.split('\n')) out.push(new Paragraph({ spacing: { after: 0 }, shading: { fill: 'F2F2F2', type: ShadingType.CLEAR, color: 'auto' }, children: [new TextRun({ text: linea || ' ', font: 'Consolas', size: 17 })] }));
          out.push(new Paragraph({ children: [] }));
        }
        break;
      }
      case 'hr': case 'space': case 'html': break;
      default: if (t.raw && t.raw.trim()) out.push(new Paragraph({ children: [new TextRun(limpiarTexto(t.raw.trim()))] }));
    }
  }
  return out;
}
function lista(t, nivel, ctx) {
  const out = [];
  t.items.forEach((item) => {
    const ref = t.ordered ? `num${ctx.listaId}` : 'vineta';
    item.tokens.forEach((b, j) => {
      if (b.type === 'list') { out.push(...lista(b, nivel + 1, ctx)); return; }
      if (b.type === 'text' || b.type === 'paragraph') {
        const casilla = item.task ? [new TextRun({ text: item.checked ? '[x] ' : '[ ] ' })] : [];
        out.push(new Paragraph({ numbering: { reference: ref, level: nivel }, spacing: { after: 60 }, children: [...casilla, ...runs(b.tokens || [{ type: 'text', text: b.text }])] }));
      } else out.push(...bloques([b], ctx));
    });
  });
  if (t.ordered) ctx.listaId += 1;
  return out;
}

// ---------- documento ----------
function numeracion(maxListas) {
  const niveles = (fmt) => [0, 1, 2].map((l) => ({
    level: l, format: fmt === 'b' ? LevelFormat.BULLET : LevelFormat.DECIMAL,
    text: fmt === 'b' ? ['•', '◦', '▪'][l] : `%${l + 1}.`,
    alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720 + l * 360, hanging: 360 } } },
  }));
  const configs = [{ reference: 'vineta', levels: niveles('b') }];
  for (let i = 0; i < maxListas; i++) configs.push({ reference: `num${i}`, levels: niveles('n') });
  return { config: configs };
}
const estilos = {
  default: { document: { run: { font: FUENTE, size: 21 }, paragraph: { spacing: { line: 276, lineRule: LineRuleType.AUTO } } } },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, color: AZUL, font: FUENTE }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true, color: AZUL, font: FUENTE }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: '2F5496', font: FUENTE }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true, italics: true, color: '2F5496', font: FUENTE }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 3 } },
  ],
};
function portada(titulo, subtitulo) {
  const linea = (text, opts = {}) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: opts.after ?? 120 }, children: [new TextRun({ text, ...opts })] });
  return [
    new Paragraph({ spacing: { before: 2400 }, children: [] }),
    linea('TalkLate', { size: 64, bold: true, color: AZUL, after: 120 }),
    linea('Traduccion en tiempo real con conciencia cultural y emocional', { size: 24, italics: true, color: '595959', after: 600 }),
    new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 12, color: AZUL, space: 12 }, bottom: { style: BorderStyle.SINGLE, size: 12, color: AZUL, space: 12 } }, spacing: { after: 240, line: 240, lineRule: LineRuleType.AUTO }, children: [new TextRun({ text: titulo, size: 40, bold: true, color: AZUL })] }),
    ...(subtitulo ? [linea(subtitulo, { size: 22, color: '595959', after: 1600 })] : [new Paragraph({ spacing: { after: 1600 }, children: [] })]),
    linea('Trabajo de grado', { size: 22, bold: true }),
    linea('Julian David Diaz Medina', { size: 22 }),
    linea('Diego Alejandro Franco Atehortua', { size: 22, after: 360 }),
    linea('Director: Wider Farid Sanchez Garzon', { size: 22, after: 360 }),
    linea('Version 1.0 - Octubre de 2026', { size: 20, color: '595959' }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}
function cabeceraPie(titulo) {
  return {
    headers: { default: new Header({ children: [new Paragraph({ border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GRIS, space: 4 } }, tabStops: [{ type: TabStopType.RIGHT, position: ANCHO }], children: [new TextRun({ text: 'TalkLate', bold: true, color: AZUL, size: 16 }), new TextRun({ text: `\t${titulo}`, color: '7F7F7F', size: 16 })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Pagina ', size: 16, color: '7F7F7F' }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '7F7F7F' }), new TextRun({ text: ' de ', size: 16, color: '7F7F7F' }), new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: '7F7F7F' })] })] }) },
  };
}
const pagina = { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } };

function leer(doc) {
  return fs.readFileSync(path.join(ENTREGA, doc + '.md'), 'utf8');
}
function cuerpo(doc, desfase, ctx) {
  ctx.doc = doc; ctx.mermaid = 0;
  return bloques(marked.lexer(leer(doc)), { ...ctx, desfase, get listaId() { return ctx.listaId; }, set listaId(v) { ctx.listaId = v; } });
}

async function guardar(nombre, d) {
  fs.writeFileSync(path.join(SALIDA, nombre), await Packer.toBuffer(d));
}

(async () => {
  // Un documento por archivo
  for (const [i, [doc, titulo]] of DOCS.entries()) {
    figura = 0;
    const ctx = { listaId: 0, mermaid: 0 };
    const hijos = cuerpo(doc, -1, ctx);
    const d = new Document({
      creator: 'Equipo TalkLate', title: `TalkLate - ${titulo}`, styles: estilos, numbering: numeracion(ctx.listaId + 1),
      features: { updateFields: true },
      sections: [
        { properties: pagina, children: portada(`${i + 1}. ${titulo}`) },
        { properties: pagina, ...cabeceraPie(titulo), children: hijos },
      ],
    });
    await guardar(`${String(i + 1).padStart(2, '0')}_${titulo.replace(/[^A-Za-z0-9]+/g, '_').replace(/_+$/, '')}.docx`, d);
  }
  // Documento consolidado
  figura = 0;
  const ctx = { listaId: 0, mermaid: 0 };
  const capitulos = [];
  DOCS.forEach(([doc, titulo], i) => {
    capitulos.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: i > 0, children: [new TextRun(`${i + 1}. ${titulo}`)] }));
    capitulos.push(...cuerpo(doc, 0, ctx));
  });
  const d = new Document({
    creator: 'Equipo TalkLate', title: 'TalkLate - Documento de analisis, requisitos y arquitectura', styles: estilos, numbering: numeracion(ctx.listaId + 1),
    features: { updateFields: true },
    sections: [
      { properties: pagina, children: portada('Documento de analisis, requisitos y arquitectura', 'Vision, mapa de impacto, historias, requisitos, drivers, arquitectura, decisiones, datos y planificacion') },
      { properties: pagina, ...cabeceraPie('Documento de analisis, requisitos y arquitectura'), children: [
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('Contenido')] }),
        new TableOfContents('Contenido', { hyperlink: true, headingStyleRange: '1-2' }),
        new Paragraph({ children: [new PageBreak()] }),
        ...capitulos,
      ] },
    ],
  });
  fs.writeFileSync(path.resolve(SALIDA, '..', 'TalkLate_Documento_Completo.docx'), await Packer.toBuffer(d));
  console.log('ok');
})();
