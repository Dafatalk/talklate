#!/usr/bin/env python3
"""Construye y valida el dataset JSONL de transcreacion Paisa <-> NYC.

Entrada : datasets/fuentes/*.txt  (una linea por par:  texto_es ||| texto_en)
Salida  : datasets/transcreacion_paisa_nyc.jsonl

Uso:
    python3 datasets/construir_dataset.py --lint     # solo revisa, no escribe
    python3 datasets/construir_dataset.py            # revisa y escribe (1500 muestras)
"""
import argparse
import glob
import json
import os
import random
import re
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
SYSTEM = "Traduce adaptando culturalmente entre Español Paisa (Medellín) y Urban NYC English."
OBJETIVO = 1500

# Prohibiciones duras del enunciado + lexico extra de otras regiones por seguridad.
PROHIBIDAS_ES = [
    "güey", "wey", "chido", "cabrón", "cabron", "chévere", "chevere", "tío", "tíos",
    "chaval", "vaina", "pana", "parceiro", "boludo", "che", "pibe", "carnal", "chamo",
    "guay", "mola", "padrísimo", "órale", "orale", "ándale", "andale",
]
PROHIBIDAS_EN = [
    "hella", "hecka", "innit", "bruv", "howdy", "wassup", "dawg", "mate", "lad",
    "quid", "proper", "finna", "y'all", "ya'll", "hella",
]


def contiene(texto, palabras):
    bajo = texto.lower()
    return [p for p in palabras if re.search(r"(?<!\w)" + re.escape(p) + r"(?!\w)", bajo)]


STOP_ES = set("el la los las un una que de en y es te se mi tu vos por con para lo al del qué como pero muy ya más".split())
STOP_EN = set("the an and is to of in it my you she we they that this for with at but not so be was are have just".split())


def puntaje(texto, conjunto):
    return sum(1 for w in re.findall(r"[a-záéíóúñü']+", texto.lower()) if w in conjunto)


def revisar(es, en):
    errores = []
    if puntaje(es, STOP_EN) > puntaje(es, STOP_ES) or puntaje(en, STOP_ES) > puntaje(en, STOP_EN):
        errores.append("idiomas invertidos o mezclados")
    for p in contiene(es, PROHIBIDAS_ES):
        errores.append(f"ES prohibida: {p}")
    for p in contiene(en, PROHIBIDAS_EN):
        errores.append(f"EN prohibida: {p}")
    if "¿" in en or "¡" in en:
        errores.append("EN contiene ¿ o ¡")
    if "?" in es and "¿" not in es:
        errores.append("ES tiene ? sin ¿")
    if "!" in es and "¡" not in es:
        errores.append("ES tiene ! sin ¡")
    if "¿" in es and "?" not in es:
        errores.append("ES tiene ¿ sin ?")
    if "¡" in es and "!" not in es:
        errores.append("ES tiene ¡ sin !")
    if len(es.strip()) < 8 or len(en.strip()) < 8:
        errores.append("muy corto")
    return errores


def cargar():
    pares, problemas = [], []
    for ruta in sorted(glob.glob(os.path.join(AQUI, "fuentes", "*.txt"))):
        nombre = os.path.basename(ruta)
        with open(ruta, encoding="utf-8") as f:
            for n, linea in enumerate(f, 1):
                linea = linea.strip()
                if not linea:
                    continue
                if linea.count("|||") != 1:
                    problemas.append(f"{nombre}:{n}: formato invalido")
                    continue
                es, en = (x.strip() for x in linea.split("|||"))
                # si el par viene con las columnas invertidas, se reorienta solo
                if puntaje(es, STOP_EN) > puntaje(es, STOP_ES) and puntaje(en, STOP_ES) > puntaje(en, STOP_EN):
                    es, en = en, es
                for e in revisar(es, en):
                    problemas.append(f"{nombre}:{n}: {e} :: {es[:60]}")
                pares.append((es, en, f"{nombre}:{n}"))
    return pares, problemas


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lint", action="store_true")
    args = ap.parse_args()

    pares, problemas = cargar()

    # duplicados (en cualquiera de los dos lados)
    vistos_es, vistos_en, unicos = set(), set(), []
    for es, en, origen in pares:
        k_es, k_en = es.lower(), en.lower()
        if k_es in vistos_es or k_en in vistos_en:
            problemas.append(f"{origen}: duplicado :: {es[:60]}")
            continue
        vistos_es.add(k_es)
        vistos_en.add(k_en)
        unicos.append((es, en, origen))

    print(f"pares leidos: {len(pares)} | unicos: {len(unicos)} | problemas: {len(problemas)}")
    for p in problemas:
        print("  -", p)
    if args.lint:
        return 1 if problemas else 0
    if problemas:
        print("Corrige los problemas antes de generar.")
        return 1
    if len(unicos) < OBJETIVO:
        print(f"Faltan pares: hay {len(unicos)} y se necesitan {OBJETIVO}.")
        return 1

    rnd = random.Random(42)
    rnd.shuffle(unicos)
    unicos = unicos[:OBJETIVO]

    salida = os.path.join(AQUI, "transcreacion_paisa_nyc.jsonl")
    with open(salida, "w", encoding="utf-8") as f:
        for i, (es, en, _) in enumerate(unicos):
            if i % 2 == 0:   # Paisa -> NYC
                user, asistente = es, en
            else:            # NYC -> Paisa
                user, asistente = en, es
            fila = {"messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": user},
                {"role": "assistant", "content": asistente},
            ]}
            f.write(json.dumps(fila, ensure_ascii=False) + "\n")
    print(f"escrito: {salida} ({OBJETIVO} lineas, 750 Paisa->NYC / 750 NYC->Paisa)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
