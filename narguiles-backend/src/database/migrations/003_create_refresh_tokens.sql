-- Up Migration
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(64) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent  TEXT,
  ip_address  INET
);

CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);

-- Down Migration
DROP TABLE IF EXISTS refresh_tokens;
