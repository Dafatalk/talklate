# Medicion de traduccion (DRV-01 y DRV-02)

> Medicion con el **motor de reglas** (sin Qwen ni Claude), solo como linea base: ese motor se construyo con estos modismos. Repetir con Qwen: `cd backend && npm run medir -- ../arquitectura/medicion_traduccion.md`.

Fecha: 2026-10-14T20:47:15.650Z · Cadena de motores: local

- **DRV-01 tiempo por traduccion:** p50 = 0 ms, p95 = 19 ms (objetivo: p95 <= 3000 ms en texto).
- **DRV-02 modismos adaptados:** 14 de 15 (93 %).

| Mensaje | Traduccion | Motor | ms | Cultural |
| --- | --- | --- | --- | --- |
| Hay que ponerse las pilas con el trabajo | We need to get cracking on the work | local | 19 | si |
| Parce, que chimba de plan | Parce, that's awesome of plan | local | 1 | si |
| Estoy mamado de tanto trabajo | I'm fed up of tanto work | local | 0 | si |
| No le des papaya a nadie en la calle | Not le des papaya to nobody in the street | local | 0 | no |
| Me estas tomando el pelo | You're pulling my leg | local | 0 | si |
| Ese carro cuesta un ojo de la cara | That car costs an arm and a leg | local | 0 | si |
| Esto es pan comido | This it's a piece of cake | local | 1 | si |
| Que pena con usted, me puede ayudar? | Sorry about that with you, me can ayudar? | local | 0 | si |
| Let's get cracking on the project | Pongámonos las pilas en el proyecto | local | 1 | si |
| It costs an arm and a leg | Eso cuesta un ojo de la cara | local | 0 | si |
| Break a leg tonight! | ¡Mucha suerte tonight! | local | 0 | si |
| It's raining cats and dogs | Está lloviendo a cántaros | local | 0 | si |
| Hey dude, that's so cool | Oye wey, that's so padre | local | 0 | si |
| I'm under the weather today | I'm maluco hoy | local | 0 | si |
| The ball is in your court | Te toca a ti | local | 1 | si |
