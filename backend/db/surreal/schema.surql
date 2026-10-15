-- =============================================================================
-- TalkLate — Operational schema in SurrealDB (backend source of truth)
-- SCHEMAFULL. Mirrors the backend domain with native SurrealDB record links.
-- Applied idempotently on boot (src/repos/surreal.js -> inicializar()), hence
-- IF NOT EXISTS.
--
-- Language: table and field names are in ENGLISH. The API/domain use Spanish
-- keys; the repository adapter (src/repos/surreal.js) maps between them.
-- ENUM VALUES stay in Spanish (origen/destino, usuario/interlocutor,
-- Pendiente.., abierto..) because the business logic and API use them as-is.
--
-- Default namespace/database: talklate / app (SURREAL_NS / SURREAL_DB).
-- Dates (birth_date, created_at, started_at) are stored as ISO strings to match
-- the API contract exactly.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Geography and languages catalog
-- ---------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS country SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON country TYPE string ASSERT string::len($value) >= 1 AND string::len($value) <= 50;
DEFINE FIELD IF NOT EXISTS code ON country TYPE string ASSERT string::len($value) >= 2 AND string::len($value) <= 5;
DEFINE INDEX IF NOT EXISTS idx_country_name ON country FIELDS name UNIQUE;
DEFINE INDEX IF NOT EXISTS idx_country_code ON country FIELDS code UNIQUE;

DEFINE TABLE IF NOT EXISTS region SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON region TYPE string ASSERT string::len($value) >= 2 AND string::len($value) <= 100;
DEFINE FIELD IF NOT EXISTS country ON region TYPE record<country>;
DEFINE INDEX IF NOT EXISTS idx_region_name_country ON region FIELDS name, country UNIQUE;

DEFINE TABLE IF NOT EXISTS language SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON language TYPE string ASSERT string::len($value) >= 1 AND string::len($value) <= 50;
DEFINE FIELD IF NOT EXISTS code ON language TYPE string ASSERT string::len($value) >= 2 AND string::len($value) <= 5;
DEFINE FIELD IF NOT EXISTS active ON language TYPE bool DEFAULT false;
DEFINE INDEX IF NOT EXISTS idx_language_name ON language FIELDS name UNIQUE;
DEFINE INDEX IF NOT EXISTS idx_language_code ON language FIELDS code UNIQUE;

-- N:M bridge language <-> region (a region can serve several languages)
DEFINE TABLE IF NOT EXISTS language_region SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS language ON language_region TYPE record<language>;
DEFINE FIELD IF NOT EXISTS region ON language_region TYPE record<region>;
DEFINE INDEX IF NOT EXISTS idx_language_region ON language_region FIELDS language, region UNIQUE;

DEFINE TABLE IF NOT EXISTS channel SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON channel TYPE string ASSERT string::len($value) >= 3 AND string::len($value) <= 50;
DEFINE INDEX IF NOT EXISTS idx_channel_name ON channel FIELDS name UNIQUE;

DEFINE TABLE IF NOT EXISTS tone SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON tone TYPE string ASSERT string::len($value) >= 3 AND string::len($value) <= 30;
DEFINE FIELD IF NOT EXISTS active ON tone TYPE bool DEFAULT true;
DEFINE INDEX IF NOT EXISTS idx_tone_name ON tone FIELDS name UNIQUE;

-- ---------------------------------------------------------------------------
-- Users and authentication
-- ---------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS user SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS first_name ON user TYPE string ASSERT string::len($value) >= 1 AND string::len($value) <= 50;
DEFINE FIELD IF NOT EXISTS last_name ON user TYPE string ASSERT string::len($value) >= 1 AND string::len($value) <= 50;
DEFINE FIELD IF NOT EXISTS email ON user TYPE string ASSERT string::is_email($value);
DEFINE FIELD IF NOT EXISTS password_hash ON user TYPE string;
DEFINE FIELD IF NOT EXISTS birth_date ON user TYPE string;
DEFINE FIELD IF NOT EXISTS role ON user TYPE string DEFAULT 'cliente' ASSERT $value INSIDE ['cliente', 'admin'];
DEFINE FIELD IF NOT EXISTS data_consent ON user TYPE option<string>;
DEFINE FIELD IF NOT EXISTS created_at ON user TYPE string;
DEFINE INDEX IF NOT EXISTS idx_user_email ON user FIELDS email UNIQUE;

-- Refresh tokens: only the hash is stored; rotated and revoked
DEFINE TABLE IF NOT EXISTS refresh_token SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS user ON refresh_token TYPE record<user>;
DEFINE FIELD IF NOT EXISTS hash ON refresh_token TYPE string;
DEFINE FIELD IF NOT EXISTS expires_at ON refresh_token TYPE int;
DEFINE FIELD IF NOT EXISTS revoked ON refresh_token TYPE bool DEFAULT false;
DEFINE INDEX IF NOT EXISTS idx_refresh_token_hash ON refresh_token FIELDS hash UNIQUE;

-- Revoked JWT sessions (by jti, until they expire)
DEFINE TABLE IF NOT EXISTS revoked_session SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS jti ON revoked_session TYPE string;
DEFINE FIELD IF NOT EXISTS expires_at ON revoked_session TYPE int;
DEFINE INDEX IF NOT EXISTS idx_revoked_session_jti ON revoked_session FIELDS jti UNIQUE;

-- Password recovery codes (hash only)
DEFINE TABLE IF NOT EXISTS password_reset SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS user ON password_reset TYPE record<user>;
DEFINE FIELD IF NOT EXISTS code_hash ON password_reset TYPE string;
DEFINE FIELD IF NOT EXISTS expires_at ON password_reset TYPE int;
DEFINE FIELD IF NOT EXISTS used ON password_reset TYPE bool DEFAULT false;

-- ---------------------------------------------------------------------------
-- Conversations and messages
-- ---------------------------------------------------------------------------
DEFINE TABLE IF NOT EXISTS conversation SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS name ON conversation TYPE string ASSERT string::len($value) >= 3 AND string::len($value) <= 80;
DEFINE FIELD IF NOT EXISTS started_at ON conversation TYPE string;
DEFINE FIELD IF NOT EXISTS user ON conversation TYPE record<user>;

DEFINE TABLE IF NOT EXISTS conversation_language SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS label ON conversation_language TYPE string;
DEFINE FIELD IF NOT EXISTS conversation ON conversation_language TYPE record<conversation>;
DEFINE FIELD IF NOT EXISTS language ON conversation_language TYPE record<language>;
DEFINE FIELD IF NOT EXISTS region ON conversation_language TYPE option<record<region>>;
DEFINE FIELD IF NOT EXISTS role ON conversation_language TYPE string ASSERT $value INSIDE ['origen', 'destino'];
DEFINE INDEX IF NOT EXISTS idx_cl_conversation_language ON conversation_language FIELDS conversation, language UNIQUE;

DEFINE TABLE IF NOT EXISTS original_message SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS conversation_language ON original_message TYPE record<conversation_language>;
DEFINE FIELD IF NOT EXISTS channel ON original_message TYPE record<channel>;
DEFINE FIELD IF NOT EXISTS tone ON original_message TYPE record<tone>;
DEFINE FIELD IF NOT EXISTS content ON original_message TYPE string;
DEFINE FIELD IF NOT EXISTS sender ON original_message TYPE string DEFAULT 'usuario' ASSERT $value INSIDE ['usuario', 'interlocutor'];
DEFINE FIELD IF NOT EXISTS created_at ON original_message TYPE string;

DEFINE TABLE IF NOT EXISTS translated_message SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS original_message ON translated_message TYPE record<original_message>;
DEFINE FIELD IF NOT EXISTS conversation_language ON translated_message TYPE record<conversation_language>;
DEFINE FIELD IF NOT EXISTS translated_content ON translated_message TYPE string;
DEFINE FIELD IF NOT EXISTS cultural_note ON translated_message TYPE option<string>;
DEFINE FIELD IF NOT EXISTS approximate ON translated_message TYPE bool DEFAULT false;
DEFINE FIELD IF NOT EXISTS engine ON translated_message TYPE string;
DEFINE FIELD IF NOT EXISTS delivery_status ON translated_message TYPE string DEFAULT 'Pendiente' ASSERT $value INSIDE ['Pendiente', 'Enviado', 'Entregado', 'Fallido'];
DEFINE FIELD IF NOT EXISTS created_at ON translated_message TYPE string;

DEFINE TABLE IF NOT EXISTS report SCHEMAFULL;
DEFINE FIELD IF NOT EXISTS translated_message ON report TYPE record<translated_message>;
DEFINE FIELD IF NOT EXISTS user ON report TYPE record<user>;
DEFINE FIELD IF NOT EXISTS reason ON report TYPE string;
DEFINE FIELD IF NOT EXISTS suggestion ON report TYPE option<string>;
DEFINE FIELD IF NOT EXISTS status ON report TYPE string DEFAULT 'abierto' ASSERT $value INSIDE ['abierto', 'revisado', 'descartado'];
DEFINE FIELD IF NOT EXISTS admin_note ON report TYPE option<string>;
DEFINE FIELD IF NOT EXISTS created_at ON report TYPE string;
DEFINE INDEX IF NOT EXISTS idx_report_tm_user ON report FIELDS translated_message, user UNIQUE;

-- ---------------------------------------------------------------------------
-- Link lookup indexes (avoid full-table scans on per-user/conversation/message
-- queries)
-- ---------------------------------------------------------------------------
DEFINE INDEX IF NOT EXISTS idx_language_region_region ON language_region FIELDS region;
DEFINE INDEX IF NOT EXISTS idx_refresh_token_user ON refresh_token FIELDS user;
DEFINE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset FIELDS user;
DEFINE INDEX IF NOT EXISTS idx_conversation_user ON conversation FIELDS user;
DEFINE INDEX IF NOT EXISTS idx_original_message_cl ON original_message FIELDS conversation_language;
DEFINE INDEX IF NOT EXISTS idx_translated_message_original ON translated_message FIELDS original_message;
DEFINE INDEX IF NOT EXISTS idx_translated_message_cl ON translated_message FIELDS conversation_language;
DEFINE INDEX IF NOT EXISTS idx_report_user ON report FIELDS user;

-- =============================================================================
-- End of TalkLate operational schema (SurrealDB)
-- =============================================================================
