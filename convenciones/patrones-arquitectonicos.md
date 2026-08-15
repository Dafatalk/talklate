# Patrones Arquitectónicos — Catálogo Institucional

**Fase 0 · Estándares y Buenas Prácticas (SoftVerse)**

---

> Catálogo de patrones arquitectónicos de referencia. Cada patrón incluye cuándo usarlo, cuándo
> **no** usarlo, y los trade-offs que implica. Se selecciona el subconjunto aplicable en F3
> (Arquitectura de Software) una vez decidido el stack de TalkLate, y se documenta como decisión
> en `arquitectura/decisiones.md`.

---

## 1. Patrones de Descomposición

### 1.1 Database per Service

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Microservicios que requieren despliegue y escalado independiente |
| **Cuándo NO usar** | Aplicaciones monolíticas o con transacciones distribuidas frecuentes |
| **Trade-off** | Autonomía por complejidad en consultas cross-service |

### 1.2 Strangler Fig

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Migración gradual de monolito a microservicios |
| **Cuándo NO usar** | Proyectos greenfield sin sistema legado (como TalkLate hoy) |
| **Trade-off** | Reduce riesgo de migración big-bang pero mantiene dos sistemas en paralelo |

---

## 2. Patrones de Comunicación

### 2.1 API Gateway

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Múltiples clientes (móvil, futuro web) consumen múltiples servicios backend |
| **Cuándo NO usar** | Un solo cliente con un solo backend |
| **Trade-off** | Simplifica clientes pero introduce un single point of failure |

### 2.2 Backend for Frontend (BFF)

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Clientes con necesidades de datos muy diferentes |
| **Cuándo NO usar** | Un solo tipo de cliente (aplica hoy: solo app móvil) |
| **Trade-off** | Optimiza cada cliente pero multiplica servicios a mantener |

### 2.3 Request-Reply (REST síncrono)

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Traducción de mensaje bajo demanda con respuesta inmediata esperada por el usuario |
| **Cuándo NO usar** | Procesamiento en background sin necesidad de respuesta inmediata |
| **Trade-off** | Simplicidad pero acoplamiento temporal; para traducción en tiempo real puede requerir streaming/WebSocket en vez de REST puro |

---

## 3. Patrones de Datos

### 3.1 CQRS (Command Query Responsibility Segregation)

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Modelos de lectura y escritura con requisitos muy diferentes (ej. historial de conversaciones con búsqueda vs. escritura de mensajes en tiempo real) |
| **Cuándo NO usar** | CRUD simple donde leer y escribir usan el mismo modelo |
| **Trade-off** | Optimiza lectura y escritura por separado pero duplica modelos |

### 3.2 Event Sourcing

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Auditoría completa, reconstrucción de conversaciones históricas |
| **Cuándo NO usar** | Si no hay requisito de trazabilidad estricta |
| **Trade-off** | Trazabilidad total pero complejidad en queries y storage creciente |

---

## 4. Patrones de Infraestructura

### 4.1 Circuit Breaker

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Llamadas al motor de traducción/IA (posible servicio externo) que pueden fallar o degradarse |
| **Cuándo NO usar** | Operaciones locales sin dependencias remotas |
| **Trade-off** | Protege contra fallas en cascada pero requiere definir fallbacks (ej. traducción literal como degradación aceptable) |

### 4.2 Retry + Exponential Backoff

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Fallos transitorios al llamar al motor de traducción o a la BD |
| **Cuándo NO usar** | Errores de validación o de reglas de negocio |
| **Trade-off** | Recuperación automática pero puede amplificar carga si no se limita |

---

## 5. Patrones de Seguridad

### 5.1 Token-Based Authentication (JWT)

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | APIs stateless consumidas por la app móvil |
| **Cuándo NO usar** | Sesiones con estado en monolitos clásicos |
| **Trade-off** | Stateless y escalable pero tokens no revocables sin infraestructura adicional |

---

## 6. Patrones de Observabilidad

### 6.1 Structured Logging

| Aspecto | Detalle |
| --- | --- |
| **Cuándo usar** | Siempre (regla transversal obligatoria) |
| **Cuándo NO usar** | Nunca — siempre usar logs estructurados |
| **Trade-off** | Facilita búsqueda y alertas pero requiere disciplina en el equipo |

---

## Matriz de Decisión Rápida

| Escenario | Patrones Recomendados |
| --- | --- |
| MVP inicial, un solo cliente móvil | Request-Reply + JWT |
| Integración con motor de traducción externo | Circuit Breaker + Retry + Exponential Backoff |
| Historial de conversaciones con búsqueda | CQRS (opcional, evaluar según volumen real) |
| Escalado futuro a más idiomas/regiones | API Gateway + BFF (si aparecen más tipos de cliente) |

---

*Documento de la Fase 0 (Línea Base Institucional) de SoftVerse.*
