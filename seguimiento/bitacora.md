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

## 2026-10-22 (2) - Julian (Claude / Opus)

- **Avances:** Instalada la skill **Archify** (diagramas HTML interactivos desde el repo) project-scoped en `.agents/skills/archify`, con symlink para Claude Code. Reinstalar con `npx skills add tt-a1i/archify`.
- **Decidi:** NO versionar los 17 MB de la skill. Se ignora `.agents/` y `.claude/skills/` en `.gitignore`; se versiona solo `skills-lock.json` para que el equipo reproduzca la misma version.
- **Handoff / pendiente:** Util para regenerar los diagramas de `arquitectura/` (c4, despliegue, secuencia) de forma interactiva. Falta probarla pidiendole al agente que mapee el repo.

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
