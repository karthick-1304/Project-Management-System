-- Project Management Tool — Postgres schema
-- Safe to re-run: drops and recreates everything.

-- Extensions -----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()

-- Clean slate (order respects FKs) -------------------------------------------
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_collaborators CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS collaborator_role CASCADE;
DROP TYPE IF EXISTS task_priority CASCADE;
DROP TYPE IF EXISTS task_status CASCADE;
DROP TYPE IF EXISTS log_action CASCADE;
DROP TYPE IF EXISTS theme_pref CASCADE;

-- Enums ----------------------------------------------------------------------
CREATE TYPE theme_pref        AS ENUM ('light', 'dark');
CREATE TYPE project_status    AS ENUM ('Active', 'OnHold', 'Completed');
CREATE TYPE collaborator_role AS ENUM ('owner', 'member');
CREATE TYPE task_priority     AS ENUM ('low', 'medium', 'high');
CREATE TYPE task_status       AS ENUM ('todo', 'inprogress', 'done');
CREATE TYPE log_action        AS ENUM (
  'PROJECT_CREATED', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_DELETED'
);

-- Users ----------------------------------------------------------------------
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  email            TEXT NOT NULL UNIQUE,
  password_hash    TEXT NOT NULL,
  theme_preference theme_pref NOT NULL DEFAULT 'light',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by       UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_users_email ON users (lower(email));

-- Password resets (OTP) ------------------------------------------------------
CREATE TABLE password_resets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash   TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_resets_user ON password_resets (user_id);

-- Projects -------------------------------------------------------------------
CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL UNIQUE,
  key              TEXT NOT NULL UNIQUE,
  description      TEXT,
  status           project_status NOT NULL DEFAULT 'Active',
  task_key_counter INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by       UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Project collaborators ------------------------------------------------------
CREATE TABLE project_collaborators (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       collaborator_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX idx_collab_user ON project_collaborators (user_id);

-- Tasks ----------------------------------------------------------------------
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_key     TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  description  TEXT,
  assignee     UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date     DATE,
  priority     task_priority NOT NULL DEFAULT 'medium',
  status       task_status NOT NULL DEFAULT 'todo',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by   UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_tasks_project ON tasks (project_id);
CREATE INDEX idx_tasks_assignee ON tasks (assignee);
CREATE INDEX idx_tasks_status ON tasks (status);

-- Comments -------------------------------------------------------------------
CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_comments_task ON comments (task_id);

-- Attachments ----------------------------------------------------------------
CREATE TABLE attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_name   TEXT,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attachments_comment ON attachments (comment_id);

-- Activity log ---------------------------------------------------------------
CREATE TABLE logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  task_id     UUID REFERENCES tasks(id) ON DELETE SET NULL,
  action_type log_action NOT NULL,
  message     TEXT,
  action_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  action_by   UUID REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_logs_project ON logs (project_id, action_at DESC);
CREATE INDEX idx_logs_task ON logs (task_id);

-- updated_at maintenance -----------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated   BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_tasks_updated   BEFORE UPDATE ON tasks    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Atomic task-key generation -------------------------------------------------
-- Increments the project counter and returns the next key, e.g. 'ENG-1'.
CREATE OR REPLACE FUNCTION next_task_key(p_project_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_key TEXT;
  v_num INTEGER;
BEGIN
  UPDATE projects
     SET task_key_counter = task_key_counter + 1
   WHERE id = p_project_id
   RETURNING key, task_key_counter INTO v_key, v_num;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'Project % not found', p_project_id;
  END IF;

  RETURN v_key || '-' || v_num;
END;
$$ LANGUAGE plpgsql;
