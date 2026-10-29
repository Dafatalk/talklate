-- Required by SurrealDB 3.x `surreal import` (must be the first statement).
OPTION IMPORT;

-- =============================================================================
-- TalkLate — Base seed data
-- Run AFTER talklate.surql
--
-- Scope (per request): only two regional contexts
--   - English  -> United States / Miami
--   - Spanish  -> Colombia / Antioquia
--
-- Data mirrors the simulation samples in arquitectura/modelo_datos.md and
-- respects the business rules (RN):
--   - user.email unique + valid email (Usuario-RN-1, RN-3)
--   - only password_hash stored, never plaintext (Usuario-RN-4)
--   - birth_date <= now, users are 13+ (Usuario-RN-2)
--   - region (name, country) unique composite
--   - language.name / language.code unique
--   - conversation_language (conversation, language) unique
--   - translated_message.delivery_status INSIDE the allowed enum
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Countries (ISO 3166-1 alpha-2)
-- ---------------------------------------------------------------------------
CREATE country:united_states SET name = 'United States', code = 'US';
CREATE country:colombia       SET name = 'Colombia',      code = 'CO';

-- ---------------------------------------------------------------------------
-- Regions (name + country is the unique composite)
-- ---------------------------------------------------------------------------
CREATE region:miami SET
	name = 'Miami',
	country = country:united_states;

CREATE region:antioquia SET
	name = 'Antioquia',
	country = country:colombia;

-- ---------------------------------------------------------------------------
-- Languages (ISO 639-1 codes; active = true so they are usable)
-- ---------------------------------------------------------------------------
CREATE language:en SET
	name = 'English',
	region = region:miami,
	code = 'en',
	active = true;

CREATE language:es SET
	name = 'Spanish',
	region = region:antioquia,
	code = 'es',
	active = true;

-- ---------------------------------------------------------------------------
-- Channels
-- ---------------------------------------------------------------------------
CREATE channel:text  SET name = 'Text';
CREATE channel:voice SET name = 'Voice';

-- ---------------------------------------------------------------------------
-- Tones
-- ---------------------------------------------------------------------------
CREATE tone:worried  SET name = 'Worried',  active = true;
CREATE tone:friendly SET name = 'Friendly', active = true;
CREATE tone:neutral  SET name = 'Neutral',  active = true;
CREATE tone:angry    SET name = 'Angry',    active = true;

-- ---------------------------------------------------------------------------
-- Users (password_hash shown as bcrypt-style placeholders; never plaintext)
-- ---------------------------------------------------------------------------
CREATE user:julian SET
	first_name = 'Julian David',
	last_name = 'Diaz Medina',
	email = 'diazjulian460@gmail.com',
	password_hash = '$2b$12$9Qk0m2eJ1xQ0p7aZ3hV5uuP8rT4nC6wB1dE2fG3hI4jK5lM6nO7',
	birth_date = d'2002-04-16T00:00:00Z';

CREATE user:diego SET
	first_name = 'Diego Alejandro',
	last_name = 'Franco Atehortua',
	email = 'dafa123.daf@gmail.com',
	password_hash = '$2b$12$7Zp3Lq8xR1kM0n9oA5b7q0uV3hJ8kZ1b2c3d4e5f6g7h8i9jK0lM',
	birth_date = d'2002-04-29T00:00:00Z';

-- =============================================================================
-- Conversation 1 — Julian (Spanish <-> English), mirrors the simulation sample
-- =============================================================================
CREATE conversation:conv1 SET
	name = 'Conversation 1',
	started_at = d'2026-10-07T14:30:00Z',
	user = user:julian;

CREATE conversation_language:lc1 SET
	label = 'LC1',
	conversation = conversation:conv1,
	language = language:es;

CREATE conversation_language:lc2 SET
	label = 'LC2',
	conversation = conversation:conv1,
	language = language:en;

-- Original messages
CREATE original_message:om1 SET
	content = 'Hay que ponerse las pilas con el trabajo',
	created_at = d'2026-10-07T14:31:00Z',
	conversation_language = conversation_language:lc1,
	channel = channel:voice,
	tone = tone:worried;

CREATE original_message:om2 SET
	content = "Let's start now",
	created_at = d'2026-10-07T14:32:00Z',
	conversation_language = conversation_language:lc2,
	channel = channel:voice,
	tone = tone:neutral;

-- Translated messages (culturally-aware, not literal)
CREATE translated_message:tm1 SET
	original_message = original_message:om1,
	translated_content = 'We need to get cracking on the work.',
	created_at = d'2026-10-07T14:31:05Z',
	delivery_status = 'Delivered',
	conversation_language = conversation_language:lc2;

CREATE translated_message:tm2 SET
	original_message = original_message:om2,
	translated_content = 'Empecemos de una vez.',
	created_at = d'2026-10-07T14:32:05Z',
	delivery_status = 'Delivered',
	conversation_language = conversation_language:lc1;

-- =============================================================================
-- Conversation 2 — Diego (English <-> Spanish), same two regional contexts
-- Shows Antioquia Spanish nuance ("parcero" -> "buddy")
-- =============================================================================
CREATE conversation:conv2 SET
	name = 'Conversation 2',
	started_at = d'2026-10-08T09:00:00Z',
	user = user:diego;

CREATE conversation_language:lc3 SET
	label = 'LC3',
	conversation = conversation:conv2,
	language = language:en;

CREATE conversation_language:lc4 SET
	label = 'LC4',
	conversation = conversation:conv2,
	language = language:es;

CREATE original_message:om3 SET
	content = 'Can we reschedule the meeting to tomorrow?',
	created_at = d'2026-10-08T09:01:00Z',
	conversation_language = conversation_language:lc3,
	channel = channel:text,
	tone = tone:friendly;

CREATE translated_message:tm3 SET
	original_message = original_message:om3,
	translated_content = '¿Podemos mover la reunión para mañana?',
	created_at = d'2026-10-08T09:01:04Z',
	delivery_status = 'Delivered',
	conversation_language = conversation_language:lc4;

CREATE original_message:om4 SET
	content = 'Dale, mañana a primera hora, parcero.',
	created_at = d'2026-10-08T09:02:00Z',
	conversation_language = conversation_language:lc4,
	channel = channel:text,
	tone = tone:friendly;

CREATE translated_message:tm4 SET
	original_message = original_message:om4,
	translated_content = 'Sure, first thing tomorrow, buddy.',
	created_at = d'2026-10-08T09:02:03Z',
	delivery_status = 'Delivered',
	conversation_language = conversation_language:lc3;

-- =============================================================================
-- End of base seed
-- =============================================================================
