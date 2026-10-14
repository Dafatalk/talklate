# Drivers Arquitectonicos - TalkLate

**Fase 3 - Arquitectura**

**Estado:** propuesta para validar con el equipo y el mentor. Los umbrales son objetivos de trabajo, todavia no medidos.

Un driver es un requisito que obliga a tomar decisiones de arquitectura. Cada ADR de `decisiones.md` dice a cual driver responde.

| ID | Driver | Objetivo (por validar) | Origen |
| --- | --- | --- | --- |
| DRV-01 | Tiempo de respuesta de la traduccion | Un mensaje de texto se traduce en 3 segundos o menos (percentil 95); uno de voz en 5 segundos o menos, contando el audio | RNF-002 |
| DRV-02 | Calidad cultural | Los modismos de un glosario de prueba se cambian por su equivalente cultural y no se traducen literal | Vision, REQ-IA-004 |
| DRV-03 | Privacidad de los datos | Mensajes, correo y fecha de nacimiento solo los ve su dueno; contrasenas con hash; trafico cifrado en produccion | RNF-001, `convenciones/seguridad.md` |
| DRV-04 | Crecimiento de idiomas | Agregar un idioma o region sin cambiar codigo (el catalogo esta en la base de datos) | Impacto del Administrador, REQ-IDIOMA |
| DRV-05 | Continuidad ante fallas del motor de IA | Si Qwen o Claude fallan, el servicio sigue con un motor de reglas reducido | Riesgo del motor de IA |
| DRV-06 | Costo por uso | Qwen local no cuesta por mensaje; si se usa Claude el costo es predecible porque el contexto es acotado | Respaldo con Claude de pago por uso |
| DRV-07 | Un solo desarrollo para varias plataformas | Misma base de codigo para iOS, Android y web | Equipo de 2 personas |
| DRV-08 | Facilidad de prueba | Las reglas de negocio se prueban sin internet ni claves | Calidad de codigo |

## Como se responde cada driver

| Driver | Decision | Como se comprueba hoy |
| --- | --- | --- |
| DRV-01 | ADR-004 (motores en cadena) | Pendiente: medir con Qwen local y datos de prueba |
| DRV-02 | ADR-004 (prompt de equivalencia cultural y glosario local) | `backend/test/motores.test.js`: modismos con variantes por pais |
| DRV-03 | ADR-006 (JWT con revocacion, bcrypt) | `backend/test/api.test.js`: una persona no ve conversaciones de otra, logout invalida el token |
| DRV-04 | ADR-003 y ADR-008 (catalogo en base de datos) | Prueba del administrador que activa un idioma y agrega una region |
| DRV-05 | ADR-004 (cadena de respaldo) | `backend/test/motores.test.js`: si Qwen falla pasa a Claude y luego a reglas |
| DRV-06 | ADR-004 | Qwen local sin costo; pendiente enviar solo los ultimos mensajes como contexto |
| DRV-07 | ADR-001 | La app compila para web y se prueba en navegador; falta probar en celular fisico |
| DRV-08 | ADR-002, ADR-003 | 19 pruebas del backend con base en memoria |
