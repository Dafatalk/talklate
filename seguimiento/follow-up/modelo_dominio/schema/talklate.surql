-- Required by SurrealDB 3.x `surreal import` (must be the first statement).
OPTION IMPORT;

-- =============================================================================
-- TalkLate — SurrealDB Schema (SCHEMAFULL)
-- Source: Modelo de Dominio Enriquecido.xlsx
-- Generated: 2026-10-07 (America/Bogota)
-- English identifiers: 2026-10-14
--
-- Creation order (respects FKs):
--   1. country
--   2. region
--   3. language
--   4. user
--   5. channel, tone
--   6. conversation
--   7. conversation_language
--   8. original_message
--   9. translated_message
--
-- IDs: native record ids are used (table:uuid). Create with:
--   CREATE country CONTENT { ... }  -- Surreal assigns id
--   or CREATE country:rand::uuid() SET ...
-- No separate UUID `identifier` field is duplicated.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. country
-- ---------------------------------------------------------------------------
DEFINE TABLE country SCHEMAFULL
	COMMENT 'Country for geographic context and regional configuration';

DEFINE FIELD name ON TABLE country TYPE string
	ASSERT string::len($value) >= 1 AND string::len($value) <= 50
	COMMENT 'Country name';

DEFINE FIELD code ON TABLE country TYPE string
	ASSERT string::len($value) >= 2 AND string::len($value) <= 5
	COMMENT 'ISO 3166-1 alpha-2 code (CO, ES, MX, etc.)';

DEFINE INDEX idx_country_name ON TABLE country FIELDS name UNIQUE;
DEFINE INDEX idx_country_code ON TABLE country FIELDS code UNIQUE;

-- ---------------------------------------------------------------------------
-- 2. region
-- ---------------------------------------------------------------------------
DEFINE TABLE region SCHEMAFULL
	COMMENT 'Geographic region that drives dialectal and cultural variation';

DEFINE FIELD name ON TABLE region TYPE string
	ASSERT string::len($value) >= 2 AND string::len($value) <= 100
	COMMENT 'Geographic region name';

DEFINE FIELD country ON TABLE region TYPE record<country>
	COMMENT 'Country the region belongs to';

DEFINE INDEX idx_region_name_country ON TABLE region FIELDS name, country UNIQUE;

-- ---------------------------------------------------------------------------
-- 3. language
-- ---------------------------------------------------------------------------
DEFINE TABLE language SCHEMAFULL
	COMMENT 'Language available in the system for translation and communication';

DEFINE FIELD name ON TABLE language TYPE string
	ASSERT string::len($value) >= 1 AND string::len($value) <= 50
	COMMENT 'Language name';

DEFINE FIELD region ON TABLE language TYPE record<region>
	COMMENT 'Region associated with the language (dialectal variant)';

DEFINE FIELD code ON TABLE language TYPE string
	ASSERT string::len($value) >= 2 AND string::len($value) <= 5
	COMMENT 'ISO 639-1 / ISO 639-2 code (es, en, fr, etc.)';

DEFINE FIELD active ON TABLE language TYPE bool
	DEFAULT false
	COMMENT 'Whether the language is available for translation';

DEFINE INDEX idx_language_name ON TABLE language FIELDS name UNIQUE;
DEFINE INDEX idx_language_code ON TABLE language FIELDS code UNIQUE;

-- ---------------------------------------------------------------------------
-- 4. user
-- ---------------------------------------------------------------------------
DEFINE TABLE user SCHEMAFULL
	COMMENT 'User registered in TalkLate with personal and access data';

DEFINE FIELD first_name ON TABLE user TYPE string
	ASSERT string::len($value) >= 1 AND string::len($value) <= 50
	COMMENT 'User first name';

DEFINE FIELD last_name ON TABLE user TYPE string
	ASSERT string::len($value) >= 1 AND string::len($value) <= 50
	COMMENT 'User last name';

DEFINE FIELD email ON TABLE user TYPE string
	ASSERT string::len($value) >= 5 AND string::len($value) <= 320
		AND string::is_email($value)
	COMMENT 'Email address (unique business key; sensitive)';

-- Password hash only. Never store plaintext.
-- Plaintext password complexity lives in the application layer (RN-4);
-- only the hash is stored here.
DEFINE FIELD password_hash ON TABLE user TYPE string
	ASSERT string::len($value) >= 1
	COMMENT 'Password hash (never plaintext)';

DEFINE FIELD birth_date ON TABLE user TYPE datetime
	ASSERT $value <= time::now()
	COMMENT 'Birth date (age >= 13 is validated in the application, RN-2)';

DEFINE INDEX idx_user_email ON TABLE user FIELDS email UNIQUE;

-- ---------------------------------------------------------------------------
-- 5. channel
-- ---------------------------------------------------------------------------
DEFINE TABLE channel SCHEMAFULL
	COMMENT 'Message transmission medium (Text, Voice, etc.)';

DEFINE FIELD name ON TABLE channel TYPE string
	ASSERT string::len($value) >= 3 AND string::len($value) <= 50
	COMMENT 'Descriptive channel name';

DEFINE INDEX idx_channel_name ON TABLE channel FIELDS name UNIQUE;

-- ---------------------------------------------------------------------------
-- 5b. tone
-- ---------------------------------------------------------------------------
DEFINE TABLE tone SCHEMAFULL
	COMMENT 'Communicative tone or style to apply to messages';

DEFINE FIELD name ON TABLE tone TYPE string
	ASSERT string::len($value) >= 3 AND string::len($value) <= 30
	COMMENT 'Tone name (Formal, Informal, Neutral, etc.)';

DEFINE FIELD active ON TABLE tone TYPE bool
	DEFAULT true
	COMMENT 'Whether the tone is available for use';

DEFINE INDEX idx_tone_name ON TABLE tone FIELDS name UNIQUE;

-- ---------------------------------------------------------------------------
-- 6. conversation
-- ---------------------------------------------------------------------------
-- Relationship with languages: 1:N via conversation_language.conversation.
-- A singular conversation_language is NOT defined here (the Excel contradicts
-- the data).
DEFINE TABLE conversation SCHEMAFULL
	COMMENT 'Communication session between users with messages over a channel';

DEFINE FIELD name ON TABLE conversation TYPE string
	DEFAULT 'New Conversation'
	ASSERT string::len($value) >= 3 AND string::len($value) <= 80
	COMMENT 'Conversation name (may repeat)';

DEFINE FIELD started_at ON TABLE conversation TYPE datetime
	VALUE $value OR time::now()
	DEFAULT time::now()
	COMMENT 'Conversation start date and time';

DEFINE FIELD user ON TABLE conversation TYPE record<user>
	COMMENT 'User who creates the conversation';

-- ---------------------------------------------------------------------------
-- 7. conversation_language (bridge Conversation <-> Language)
-- ---------------------------------------------------------------------------
DEFINE TABLE conversation_language SCHEMAFULL
	COMMENT 'Per-conversation language configuration (bridge entity)';

DEFINE FIELD label ON TABLE conversation_language TYPE string
	ASSERT string::len($value) >= 3 AND string::len($value) <= 5
	COMMENT 'Record label (e.g. LC1, LC2); auto-generated in the app';

DEFINE FIELD conversation ON TABLE conversation_language TYPE record<conversation>
	COMMENT 'Conversation this language configuration belongs to';

DEFINE FIELD language ON TABLE conversation_language TYPE record<language>
	COMMENT 'Language configured for the conversation';

DEFINE INDEX idx_cl_conversation_language ON TABLE conversation_language
	FIELDS conversation, language UNIQUE;

-- ---------------------------------------------------------------------------
-- 8. original_message
-- ---------------------------------------------------------------------------
DEFINE TABLE original_message SCHEMAFULL
	COMMENT 'Original message content before translation/processing';

DEFINE FIELD content ON TABLE original_message TYPE string
	ASSERT string::len(string::trim($value)) >= 1
		AND string::len($value) <= 5000
	COMMENT 'Textual content in the original language (sensitive)';

DEFINE FIELD created_at ON TABLE original_message TYPE datetime
	VALUE $value OR time::now()
	DEFAULT time::now()
	ASSERT $value <= time::now()
	COMMENT 'Message creation date and time';

DEFINE FIELD conversation_language ON TABLE original_message TYPE record<conversation_language>
	COMMENT 'Language configuration the message was expressed in';

DEFINE FIELD channel ON TABLE original_message TYPE record<channel>
	COMMENT 'Channel the message is transmitted over';

DEFINE FIELD tone ON TABLE original_message TYPE record<tone>
	COMMENT 'Tone detected or assigned to the message';

-- ---------------------------------------------------------------------------
-- 9. translated_message
-- ---------------------------------------------------------------------------
DEFINE TABLE translated_message SCHEMAFULL
	COMMENT 'Translated/processed message ready to deliver to the recipient';

-- Typed link to the original message (preferred over duplicating free text).
DEFINE FIELD original_message ON TABLE translated_message TYPE record<original_message>
	COMMENT 'Reference to the original message the translation comes from';

DEFINE FIELD translated_content ON TABLE translated_message TYPE string
	ASSERT string::len(string::trim($value)) >= 1
		AND string::len($value) <= 5000
	COMMENT 'Translated/processed message content';

DEFINE FIELD created_at ON TABLE translated_message TYPE datetime
	VALUE $value OR time::now()
	DEFAULT time::now()
	ASSERT $value <= time::now()
	COMMENT 'Translated message generation date and time';

DEFINE FIELD delivery_status ON TABLE translated_message TYPE string
	DEFAULT 'Pending'
	ASSERT $value INSIDE ['Pending', 'Sent', 'Delivered', 'Failed']
	COMMENT 'Delivery status: Pending | Sent | Delivered | Failed';

DEFINE FIELD conversation_language ON TABLE translated_message TYPE record<conversation_language>
	COMMENT 'Target language configuration of the translation';

-- =============================================================================
-- End of TalkLate schema
-- =============================================================================
