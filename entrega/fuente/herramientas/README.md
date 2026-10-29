# Herramientas para generar los documentos de la entrega

Los documentos Word y PDF de `entrega/` se generan a partir de los textos de `entrega/fuente/`. Si se cambia un texto, se regeneran asi (desde esta carpeta):

1. Diagramas a imagen: `curl -o mermaid.min.js https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js` y luego `node render.js` (necesita `playwright-core` y Chromium; la ruta de Chromium va en la variable `CHROME`).
2. Word: `npm install docx@9 marked@12` y luego `node gen.js`. Escribe `entrega/documentos/*.docx` y `entrega/TalkLate_Documento_Completo.docx`.
3. Indice y PDF: `python3 actualizar.py ../../documentos/*.docx ../../TalkLate_Documento_Completo.docx` (necesita LibreOffice con Writer). Llena el indice con los numeros de pagina y guarda el `.pdf` al lado de cada `.docx`.
