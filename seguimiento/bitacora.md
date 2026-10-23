# Bitacora de avances y decisiones - TalkLate

> Contexto compartido entre Julian, Diego y las sesiones de IA. Cada IA **lee esto al empezar**
> y **agrega una entrada al terminar**, para que una sesion sepa que hizo la otra (avances +
> decisiones + que queda pendiente).
>
> Reglas para que se mantenga rapida aunque crezca:
> - **Entradas nuevas arriba** (orden inverso: lo mas reciente primero).
> - Corta y concreta. Si algo necesita detalle, enlaza al doc (no lo copies aca).
> - Una decision = que se decidio + por que (una linea cada cosa).
> - Lo que quedo abierto va en **Handoff**, para que la siguiente sesion lo retome.
>
> Plantilla (copiar y rellenar):
> ```
> ## AAAA-MM-DD - <autor> (<IA o persona>)
> - **Avances:** ...
> - **Decidi:** ... (por que)
> - **Handoff / pendiente:** ...
> ```

---

## 2026-10-23 - Dafatalk (Claude / Opus)

- **Avances:**
  - Revise el commit de Julian del 22/10 (documento maestro, C4 nivel 3, diagramas, bitacora): coincide con el codigo; se actualizaron sus rutas de archivos a la nueva estructura.
  - **Arquitectura hexagonal implementada** en `backend/src` (frente 4 de la revision): `dominio/`, `aplicacion/` (un caso de uso por epica), `puertos/` (Repositorio, MotorTraduccion, Notificador, Cifrador), `adaptadores/` (http, persistencia, traduccion, correo, cifrado) y `composicion.js`. El contrato de la API no cambio.
  - Pruebas: 34 con SQLite (cobertura ~97 %), 16 de la API contra SurrealDB 3.0.4, `verificar-surreal.js` 12/12 y `smoke-http.js` OK. El Circuit Breaker ahora se prueba con motores falsos.
  - Docs: ADR-013 en `decisiones.md`, `componentes.md` rehecho por capas (C01-C27), `arquitectura.md`, `tech_stack.md`, `convenciones/backend-node.md` (regla de dependencias), READMEs, `drivers.md`, `modelo_datos.md` y matriz de sensibilidad.
  - Analisis de las demas recomendaciones en `arquitectura/revision_recomendaciones.md`.
- **Decidi:**
  - Hexagonal dentro del monolito y no microservicios: limites claros sin costo distribuido (ADR-013).
  - Solo `composicion.js` conoce adaptadores concretos; los casos de uso solo importan dominio y puertos.
  - No migrar a PostgreSQL todavia: con la arquitectura hexagonal cuesta un adaptador (talla L), pero hay que decidirlo con Farid al validar ADR-012.
- **Hallazgos:** el tiempo de espera de Qwen (60 s) incumple DRV-01 cuando Ollama falla; el glosario de `npm run medir` esta dentro del motor de reglas (la linea base de 14/15 no es evidencia) y usa regiones fuera del alcance (California, Ciudad de Mexico); la clave de cifrado no tiene politica de rotacion ni exige fuerza en produccion.
- **Handoff / pendiente (orden propuesto):**
  1. Medicion real con Qwen con un glosario aparte de unos 40 modismos (ES-CO / EN-US), 3 repeticiones y el equipo registrado.
  2. Acotar el tiempo de espera de Qwen y Claude; politica de claves y rotacion (`enc:v2:<id>`).
  3. Decidir SurrealDB o PostgreSQL con Farid.
  4. Metricas (`/metrics`) y despliegue (Docker, F10).

## 2026-10-22 - Julian (Claude / Opus)

- **Avances:** Documentacion de la arquitectura actual.
  - `arquitectura/arquitectura.md` (NUEVO): documento maestro que amarra todas las vistas y justifica cada decision contra su ADR + driver. Incluye matriz driver->ADR->mecanismo->evidencia, vista dinamica (secuencia) y vista de despliegue (nuevas).
  - `arquitectura/componentes.md` (NUEVO): C4 Nivel 3 de la API (20 componentes C01-C20) + Nivel 3 de la App movil.
  - `arquitectura/diagramas/despliegue.drawio` y `secuencia_traduccion.drawio` (NUEVOS): fuentes editables.
  - `arquitectura/c4.md`: enlazado al doc maestro.
- **Decidi:**
  - Documentar solo el C4 L3 tomando del framework SOFIA el catalogo de componentes + trazabilidad; se rechazo el resto (mingrammer, formato ADR de SOFIA, FinOps). Se mantiene Mermaid + drawio como convencion propia.
  - El **monolito modular se mantiene**: justificado por trade-offs contra RNF-001 (latencia), RNF-007 (una base de codigo) y RNF-008 (testing), no por "sube complejidad". Microservicios pierde en los tres.
- **Handoff / pendiente:** Revision critica de arquitectura abierta. Hay 4 frentes sobre la mesa y falta que Julian elija por cual arrancar:
  1. **Medir con Qwen** latencia (DRV-01) y calidad con glosario held-out (DRV-02). La tesis del proyecto esta sin validar; la medicion actual (motor de reglas) no cuenta.
  2. **Reconsiderar SurrealDB -> PostgreSQL**: el dominio es relacional puro y el patron Repository ya aisla la base, el cambio seria barato. ADR-012 ya esta marcado "validar con el mentor".
  3. **Desplegar API + Ollama + metricas** (F10). Hoy nada corre en servidor.
  4. **Formalizar limites hexagonales** del subsistema de traduccion (port + adapters) para robustez sin microservicios.
  - Pendientes de repo: `seguimiento/follow-up/modelo_dominio/schema/` esta sin commitear (confirmar con Diego antes de subir). Servicio de correo de recuperacion sigue pendiente (ADR-006).
