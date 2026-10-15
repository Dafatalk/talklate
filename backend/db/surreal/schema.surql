-- =============================================================================
-- TalkLate — Esquema operativo en SurrealDB (fuente de verdad del backend)
-- SCHEMAFULL. Espeja el dominio del backend (antes en SQLite, src/db.js) con
-- record links nativos de SurrealDB. Se aplica de forma idempotente al arrancar
-- (ver src/repos/surreal.js -> inicializar()), por eso usa IF NOT EXISTS.
--
-- Namespace/base por defecto: talklate / app (configurable con SURREAL_NS/SURREAL_DB).
-- Fechas (fecha_nacimiento, creado, fecha_inicio, fecha_creacion, fecha) se
-- guardan como string ISO para reflejar exactamente el contrato del API.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Catalogo geografico y de idiomas
-- ---------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS pais SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS nombre ON pais TYPE string ASSERT string::len($value) >= 1 AND string::len($value) <= 50;
DEFINE FIELD IF NOT EXISTS codigo ON pais TYPE string ASSERT string::len($value) >= 2 AND string::len($value) <= 5;
DEFINE INDEX IF NOT EXISTS idx_pais_nombre ON pais FIELDS nombre UNIQUE;
DEFINE INDEX IF NOT EXISTS idx_pais_codigo ON pais FIELDS codigo UNIQUE;

DEFINE TABLE IF NOT EXISTS region SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS nombre ON region TYPE string ASSERT string::len($value) >= 2 AND string::len($value) <= 100;
DEFINE FIELD IF NOT EXISTS pais ON region TYPE record<pais>;
DEFINE INDEX IF NOT EXISTS idx_region_nombre_pais ON region FIELDS nombre, pais UNIQUE;

DEFINE TABLE IF NOT EXISTS lenguaje SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS nombre ON lenguaje TYPE string ASSERT string::len($value) >= 1 AND string::len($value) <= 50;
DEFINE FIELD IF NOT EXISTS codigo ON lenguaje TYPE string ASSERT string::len($value) >= 2 AND string::len($value) <= 5;
DEFINE FIELD IF NOT EXISTS activo ON lenguaje TYPE bool DEFAULT false;
DEFINE INDEX IF NOT EXISTS idx_lenguaje_nombre ON lenguaje FIELDS nombre UNIQUE;
DEFINE INDEX IF NOT EXISTS idx_lenguaje_codigo ON lenguaje FIELDS codigo UNIQUE;

-- Puente N:M lenguaje <-> region (una region puede servir a varios lenguajes)
DEFINE TABLE IF NOT EXISTS lenguaje_region SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS lenguaje ON lenguaje_region TYPE record<lenguaje>;
DEFINE FIELD IF NOT EXISTS region ON lenguaje_region TYPE record<region>;
DEFINE INDEX IF NOT EXISTS idx_lenguaje_region ON lenguaje_region FIELDS lenguaje, region UNIQUE;

DEFINE TABLE IF NOT EXISTS canal SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS nombre ON canal TYPE string ASSERT string::len($value) >= 3 AND string::len($value) <= 50;
DEFINE INDEX IF NOT EXISTS idx_canal_nombre ON canal FIELDS nombre UNIQUE;

DEFINE TABLE IF NOT EXISTS entonacion SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS nombre ON entonacion TYPE string ASSERT string::len($value) >= 3 AND string::len($value) <= 30;
DEFINE FIELD IF NOT EXISTS activo ON entonacion TYPE bool DEFAULT true;
DEFINE INDEX IF NOT EXISTS idx_entonacion_nombre ON entonacion FIELDS nombre UNIQUE;

-- ---------------------------------------------------------------------------
-- Usuarios y autenticacion
-- ---------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS usuario SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS nombre ON usuario TYPE string ASSERT string::len($value) >= 1 AND string::len($value) <= 50;
DEFINE FIELD IF NOT EXISTS apellido ON usuario TYPE string ASSERT string::len($value) >= 1 AND string::len($value) <= 50;
DEFINE FIELD IF NOT EXISTS correo ON usuario TYPE string ASSERT string::is_email($value);
DEFINE FIELD IF NOT EXISTS password_hash ON usuario TYPE string;
DEFINE FIELD IF NOT EXISTS fecha_nacimiento ON usuario TYPE string;
DEFINE FIELD IF NOT EXISTS rol ON usuario TYPE string DEFAULT 'cliente' ASSERT $value INSIDE ['cliente', 'admin'];
DEFINE FIELD IF NOT EXISTS consentimiento_datos ON usuario TYPE option<string>;
DEFINE FIELD IF NOT EXISTS creado ON usuario TYPE string;
DEFINE INDEX IF NOT EXISTS idx_usuario_correo ON usuario FIELDS correo UNIQUE;

-- Tokens de refresco: solo se guarda el hash; se rotan y revocan
DEFINE TABLE IF NOT EXISTS token_refresco SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS usuario ON token_refresco TYPE record<usuario>;
DEFINE FIELD IF NOT EXISTS hash ON token_refresco TYPE string;
DEFINE FIELD IF NOT EXISTS expira ON token_refresco TYPE int;
DEFINE FIELD IF NOT EXISTS revocado ON token_refresco TYPE bool DEFAULT false;
DEFINE INDEX IF NOT EXISTS idx_token_refresco_hash ON token_refresco FIELDS hash UNIQUE;

-- Sesiones (JWT) revocadas por jti hasta que expiran
DEFINE TABLE IF NOT EXISTS sesion_revocada SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS jti ON sesion_revocada TYPE string;
DEFINE FIELD IF NOT EXISTS expira ON sesion_revocada TYPE int;
DEFINE INDEX IF NOT EXISTS idx_sesion_revocada_jti ON sesion_revocada FIELDS jti UNIQUE;

-- Codigos de recuperacion de contrasena (solo hash)
DEFINE TABLE IF NOT EXISTS recuperacion SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS usuario ON recuperacion TYPE record<usuario>;
DEFINE FIELD IF NOT EXISTS codigo_hash ON recuperacion TYPE string;
DEFINE FIELD IF NOT EXISTS expira ON recuperacion TYPE int;
DEFINE FIELD IF NOT EXISTS usado ON recuperacion TYPE bool DEFAULT false;

-- ---------------------------------------------------------------------------
-- Conversaciones y mensajes
-- ---------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS conversacion SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS nombre ON conversacion TYPE string ASSERT string::len($value) >= 3 AND string::len($value) <= 80;
DEFINE FIELD IF NOT EXISTS fecha_inicio ON conversacion TYPE string;
DEFINE FIELD IF NOT EXISTS usuario ON conversacion TYPE record<usuario>;

DEFINE TABLE IF NOT EXISTS lenguaje_por_conversacion SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS nombre ON lenguaje_por_conversacion TYPE string;
DEFINE FIELD IF NOT EXISTS conversacion ON lenguaje_por_conversacion TYPE record<conversacion>;
DEFINE FIELD IF NOT EXISTS lenguaje ON lenguaje_por_conversacion TYPE record<lenguaje>;
DEFINE FIELD IF NOT EXISTS region ON lenguaje_por_conversacion TYPE option<record<region>>;
DEFINE FIELD IF NOT EXISTS rol ON lenguaje_por_conversacion TYPE string ASSERT $value INSIDE ['origen', 'destino'];
DEFINE INDEX IF NOT EXISTS idx_lpc_conversacion_lenguaje ON lenguaje_por_conversacion FIELDS conversacion, lenguaje UNIQUE;

DEFINE TABLE IF NOT EXISTS mensaje_original SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS lenguaje_conversacion ON mensaje_original TYPE record<lenguaje_por_conversacion>;
DEFINE FIELD IF NOT EXISTS canal ON mensaje_original TYPE record<canal>;
DEFINE FIELD IF NOT EXISTS entonacion ON mensaje_original TYPE record<entonacion>;
DEFINE FIELD IF NOT EXISTS contenido ON mensaje_original TYPE string;
DEFINE FIELD IF NOT EXISTS remitente ON mensaje_original TYPE string DEFAULT 'usuario' ASSERT $value INSIDE ['usuario', 'interlocutor'];
DEFINE FIELD IF NOT EXISTS fecha_creacion ON mensaje_original TYPE string;

DEFINE TABLE IF NOT EXISTS mensaje_destino SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS mensaje_original ON mensaje_destino TYPE record<mensaje_original>;
DEFINE FIELD IF NOT EXISTS lenguaje_conversacion ON mensaje_destino TYPE record<lenguaje_por_conversacion>;
DEFINE FIELD IF NOT EXISTS contenido_traducido ON mensaje_destino TYPE string;
DEFINE FIELD IF NOT EXISTS nota_cultural ON mensaje_destino TYPE option<string>;
DEFINE FIELD IF NOT EXISTS aproximada ON mensaje_destino TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS motor ON mensaje_destino TYPE string;
DEFINE FIELD IF NOT EXISTS estado_entrega ON mensaje_destino TYPE string DEFAULT 'Pendiente' ASSERT $value INSIDE ['Pendiente', 'Enviado', 'Entregado', 'Fallido'];
DEFINE FIELD IF NOT EXISTS fecha_creacion ON mensaje_destino TYPE string;

DEFINE TABLE IF NOT EXISTS reporte SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS mensaje_destino ON reporte TYPE record<mensaje_destino>;
DEFINE FIELD IF NOT EXISTS usuario ON reporte TYPE record<usuario>;
DEFINE FIELD IF NOT EXISTS motivo ON reporte TYPE string;
DEFINE FIELD IF NOT EXISTS sugerencia ON reporte TYPE option<string>;
DEFINE FIELD IF NOT EXISTS estado ON reporte TYPE string DEFAULT 'abierto' ASSERT $value INSIDE ['abierto', 'revisado', 'descartado'];
DEFINE FIELD IF NOT EXISTS nota_admin ON reporte TYPE option<string>;
DEFINE FIELD IF NOT EXISTS fecha ON reporte TYPE string;
DEFINE INDEX IF NOT EXISTS idx_reporte_md_usuario ON reporte FIELDS mensaje_destino, usuario UNIQUE;

-- ---------------------------------------------------------------------------
-- Indices de busqueda por enlace (evitan recorrer toda la tabla en las
-- consultas por usuario, conversacion o mensaje)
-- ---------------------------------------------------------------------------
DEFINE INDEX IF NOT EXISTS idx_lenguaje_region_region ON lenguaje_region FIELDS region;
DEFINE INDEX IF NOT EXISTS idx_token_refresco_usuario ON token_refresco FIELDS usuario;
DEFINE INDEX IF NOT EXISTS idx_recuperacion_usuario ON recuperacion FIELDS usuario;
DEFINE INDEX IF NOT EXISTS idx_conversacion_usuario ON conversacion FIELDS usuario;
DEFINE INDEX IF NOT EXISTS idx_mensaje_original_lpc ON mensaje_original FIELDS lenguaje_conversacion;
DEFINE INDEX IF NOT EXISTS idx_mensaje_destino_original ON mensaje_destino FIELDS mensaje_original;
DEFINE INDEX IF NOT EXISTS idx_mensaje_destino_lpc ON mensaje_destino FIELDS lenguaje_conversacion;
DEFINE INDEX IF NOT EXISTS idx_reporte_usuario ON reporte FIELDS usuario;

-- =============================================================================
-- Fin del esquema operativo TalkLate (SurrealDB)
-- =============================================================================
