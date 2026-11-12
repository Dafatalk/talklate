# Dataset de transcreacion Paisa <-> NYC

- `transcreacion_paisa_nyc.jsonl`: 1500 muestras (750 Paisa->NYC, 750 NYC->Paisa), formato chat con `system` fijo.
- `fuentes/*.txt`: pares fuente, una linea por par `texto_es ||| texto_en`. Son la fuente de verdad.
- `construir_dataset.py`: valida y genera el JSONL (semilla fija 42, el orden y la direccion son reproducibles).

## Uso

```bash
python3 datasets/construir_dataset.py --lint   # solo valida
python3 datasets/construir_dataset.py          # valida y escribe el JSONL
```

## Reglas que valida el script

- Sin lexico prohibido en espanol (guey, chido, cabron, chevere, tio, chaval, vaina, pana, parceiro, etc.).
- Sin lexico prohibido en ingles (hella, innit, bruv, howdy, wassup, dawg, finna, y'all, etc.).
- El ingles no lleva los signos de apertura de pregunta ni de exclamacion; el espanol si y bien pareados.
- Sin duplicados en ningun lado del par, columnas en el idioma correcto.

## Notas

- Hay 26 pares de sobra en las fuentes; el script toma 1500 despues de mezclar.
- Se intento guardar esto en engram pero esa herramienta no esta conectada en esta sesion.
