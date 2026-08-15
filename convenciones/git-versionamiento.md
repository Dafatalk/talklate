# Convenciones — Git / GitHub / Versionamiento

**Fase 0 · Línea Base Institucional (SoftVerse)**

---

## Aplica a

Todo el equipo de desarrollo, todos los repositorios del proyecto TalkLate.

---

## 1. Estrategia de Branching

GitFlow simplificado:

```
main ──────────────────────────────────────────────────────────────►
  │                         │                            │
  └── release/1.0.0 ───────┘                            │
  │                                                      │
  └── develop ──────────────────────────────────────────►│
       │              │              │                   │
       └── feature/   └── fix/       └── feature/        │
           42-login       55-iva         63-guias         │
```

| Branch | Propósito | Deploy |
| --- | --- | --- |
| `main` | Producción estable | prod |
| `develop` | Integración de features | dev |
| `release/{version}` | Preparación de release | staging |
| `feature/{issue}-{descripcion}` | Desarrollo de feature | N/A |
| `fix/{issue}-{descripcion}` | Corrección de bug | N/A |
| `hotfix/{issue}-{descripcion}` | Fix urgente en producción | prod |

> **`{issue}`** es el número del issue de GitHub (ej: `feature/42-traductor-mensajes`).
> Esto establece trazabilidad directa: **Issue → Branch → Commits → PR → Cierre automático**.

## 2. Commits Convencionales

Formato: `{tipo}({scope}): {descripción} (#{issue})`

La referencia `(#{issue})` al final del mensaje es **obligatoria** cuando el commit resuelve o avanza un issue del backlog. GitHub crea automáticamente un enlace bidireccional entre el commit y el issue.

| Tipo | Uso |
| --- | --- |
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `style` | Formato (no cambia lógica) |
| `refactor` | Refactorización |
| `test` | Agregar o modificar tests |
| `chore` | Tareas de mantenimiento |
| `ci` | Cambios en CI/CD |
| `perf` | Mejora de rendimiento |

Ejemplos:
```
feat(traductor): agregar endpoint de traducción en tiempo real (#12)
fix(conversacion): corregir detección automática de idioma origen (#18)
docs(arquitectura): actualizar modelo de dominio con combinaciones únicas (#20)
```

### Keywords de cierre automático

Al incluir estas keywords en un commit o en la descripción de un PR, GitHub **cierra automáticamente** el issue al hacer merge a la branch por defecto:

| Keyword | Ejemplo |
| --- | --- |
| `Fixes #N` | `Fixes #42` |
| `Closes #N` | `Closes #42` |
| `Resolves #N` | `Resolves #42` |

Se pueden referenciar múltiples issues: `Closes #42, Closes #43`.

> **Recomendación:** Usar `Fixes #N` en commits de bugs y `Closes #N` en PRs de features.
> Si el issue no se debe cerrar aún (trabajo parcial), usar solo `#N` sin keyword.

## 3. Pull Requests

### Template de PR

```markdown
## Descripción
{Qué hace este PR y por qué}

## Issues que cierra este PR
Closes #{N}

## Tipo de cambio
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Docs
- [ ] Infra / CI

## Checklist
- [ ] Tests escritos y pasando
- [ ] Documentación actualizada
- [ ] Sin secretos en el código
- [ ] Convenciones SoftVerse respetadas
- [ ] Issue(s) vinculado(s) con `Closes #N`
- [ ] Revisado por al menos 1 persona

## Requerimientos relacionados
REQ-XXX-NNN

## Fase F relacionada
FX
```

### Reglas de merge

- Mínimo 1 aprobación para merge a `develop`.
- Mínimo 2 aprobaciones para merge a `main` (o revisión cruzada entre los integrantes del equipo si el equipo es pequeño).
- CI debe pasar (build + tests + lint), cuando exista pipeline configurado.
- Squash merge para features, merge commit para releases.
- Todo PR **debe** referenciar al menos un issue del backlog.

## 4. Versionamiento Semántico (SemVer)

```
MAJOR.MINOR.PATCH
```

| Incremento | Cuándo |
| --- | --- |
| MAJOR | Breaking changes |
| MINOR | Nueva funcionalidad retrocompatible |
| PATCH | Corrección de bug |

## 5. Tags y Releases

```bash
git tag -a v1.2.0 -m "Release 1.2.0: agregar módulo de traductor de mensajes"
git push origin v1.2.0
```

## 6. Gitignore

Archivos que NUNCA deben estar en el repositorio:

```gitignore
# Secretos
.env
*.pem
*.key
credentials.json

# Build
dist/
build/
node_modules/
*.jar

# IDE
.idea/
.vscode/settings.json
*.iml

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

## 7. Protección de Branches

| Branch | Protecciones |
| --- | --- |
| `main` | PR obligatorio, revisión cruzada, CI pasando (si existe), no force push |
| `develop` | PR obligatorio, revisión cruzada |
| `release/*` | PR obligatorio, revisión cruzada, CI pasando (si existe) |

## 8. Flujo de Trabajo Issue-First

Durante las fases de implementación (F6 a F10), todo desarrollo **comienza y termina** en un issue de GitHub. Este flujo garantiza trazabilidad completa desde la planificación hasta producción.

```
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. PLANEAR │───►│  2. BRANCH   │───►│  3. CÓDIGO   │───►│  4. PR       │
│  Revisar    │    │  feature/    │    │  Commits con │    │  Closes #N   │
│  issues     │    │  {N}-{desc}  │    │  refs (#N)   │    │  + Review    │
│  pendientes │    │  desde       │    │              │    │              │
│             │    │  develop     │    │              │    │              │
└─────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                  │
┌─────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  7. PRÓXIMO │◄───│  6. CERRADO  │◄───│  5. MERGE    │◄─────────┘
│  issue      │    │  Issue auto- │    │  Squash a    │
│             │    │  cerrado por │    │  develop     │
│             │    │  GitHub      │    │              │
└─────────────┘    └──────────────┘    └──────────────┘
```

### Paso a paso

1. **Revisar backlog** — Consultar issues abiertos del hito actual.
2. **Seleccionar issue** — Elegir el siguiente issue por prioridad.
3. **Crear branch** — `git checkout -b feature/{issue}-{descripcion-corta} develop`
4. **Desarrollar** — Commits frecuentes referenciando el issue: `feat(scope): descripcion (#N)`
5. **Pull Request** — Crear PR hacia `develop` con `Closes #N` en la descripción.
6. **Code Review** — Mínimo 1 aprobación.
7. **Merge** — Squash merge; GitHub cierra automáticamente el issue.
8. **Repetir** — Siguiente issue del backlog.

---

*Convención de la Fase 0 (Línea Base Institucional) de SoftVerse.*
