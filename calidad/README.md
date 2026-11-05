# Calidad - TalkLate

Como se asegura la calidad y la seguridad de TalkLate.

| Documento | Contenido |
| --- | --- |
| [Piramide de pruebas](piramide_de_pruebas.md) | Los tres niveles de pruebas (unitarias, integracion y punta a punta), que cubre cada uno, como correrlos y como corren en el CI |
| [Seguridad con Trivy](seguridad_trivy.md) | Escaneo de dependencias, secretos y configuraciones; hallazgos corregidos, excepcion aceptada y que hacer cuando falla |

Archivos relacionados: `.github/workflows/ci.yml` (pruebas), `.github/workflows/seguridad.yml` (Trivy), `trivy.yaml`, `.trivyignore`, `e2e/` (Playwright).
