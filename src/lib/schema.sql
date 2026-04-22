-- Supabase Database Schema for Genealogy System
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===== Genealogies Table =====
CREATE TABLE IF NOT EXISTS genealogies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  origin TEXT DEFAULT '',
  founding_year TEXT DEFAULT '',
  is_base BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Genealogy Introductions Table =====
CREATE TABLE IF NOT EXISTS gnlogy_intru (
  id TEXT PRIMARY KEY,
  genealogy_id TEXT NOT NULL REFERENCES genealogies(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  page_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(genealogy_id, page_number)
);

-- ===== People Table =====
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  genealogy_id TEXT NOT NULL REFERENCES genealogies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generation INTEGER NOT NULL,
  birth_year TEXT DEFAULT '',
  death_year TEXT DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'male',
  spouse TEXT DEFAULT '',
  parent_id TEXT DEFAULT '',
  biography TEXT DEFAULT '',
  achievements TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'approved',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Person Additions Table (pending new persons) =====
CREATE TABLE IF NOT EXISTS person_add (
  id TEXT PRIMARY KEY,
  genealogy_id TEXT NOT NULL REFERENCES genealogies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generation INTEGER NOT NULL,
  birth_year TEXT DEFAULT '',
  death_year TEXT DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'male',
  spouse TEXT DEFAULT '',
  parent_id TEXT DEFAULT '',
  biography TEXT DEFAULT '',
  achievements TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Person Edits Table =====
CREATE TABLE IF NOT EXISTS person_edits (
  id TEXT PRIMARY KEY,
  genealogy_id TEXT NOT NULL,
  genealogy_name TEXT NOT NULL,
  person_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  field TEXT NOT NULL,
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Feedbacks Table =====
CREATE TABLE IF NOT EXISTS feedbacks (
  id TEXT PRIMARY KEY,
  genealogy_id TEXT NOT NULL,
  genealogy_name TEXT NOT NULL,
  person_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  person_generation INTEGER DEFAULT 0,
  person_biography TEXT DEFAULT '',
  feedback_type TEXT NOT NULL,
  description TEXT NOT NULL,
  contact TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- ===== Admins Table =====
CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT,
  contact TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL DEFAULT 'active',
  editable_genealogies JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== Indexes for Performance =====
CREATE INDEX IF NOT EXISTS idx_people_genealogy ON people(genealogy_id);
CREATE INDEX IF NOT EXISTS idx_people_generation ON people(generation);
CREATE INDEX IF NOT EXISTS idx_people_status ON people(status);
CREATE INDEX IF NOT EXISTS idx_gnlogy_intru_genealogy ON gnlogy_intru(genealogy_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_genealogy ON feedbacks(genealogy_id);
CREATE INDEX IF NOT EXISTS idx_person_edits_status ON person_edits(status);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- ===== Row Level Security (RLS) =====
ALTER TABLE genealogies ENABLE ROW LEVEL SECURITY;
ALTER TABLE gnlogy_intru ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access to all tables
CREATE POLICY "Allow anonymous read access to genealogies" ON genealogies FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to gnlogy_intru" ON gnlogy_intru FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to people" ON people FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to person_edits" ON person_edits FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to feedbacks" ON feedbacks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to admins" ON admins FOR SELECT USING (true);

-- Allow anonymous write access (for simplicity, can be restricted later with auth)
CREATE POLICY "Allow anonymous write access to genealogies" ON genealogies FOR ALL USING (true);
CREATE POLICY "Allow anonymous write access to gnlogy_intru" ON gnlogy_intru FOR ALL USING (true);
CREATE POLICY "Allow anonymous write access to people" ON people FOR ALL USING (true);
CREATE POLICY "Allow anonymous write access to person_edits" ON person_edits FOR ALL USING (true);
CREATE POLICY "Allow anonymous write access to feedbacks" ON feedbacks FOR ALL USING (true);
CREATE POLICY "Allow anonymous write access to admins" ON admins FOR ALL USING (true);

-- ===== Insert Default Admin =====
INSERT INTO admins (id, username, password_hash, display_name, role, status, editable_genealogies, created_at)
VALUES ('default', 'admin', 'password', '超级管理员', 'super', 'active', '[]'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;

-- ===== Insert Base Genealogies =====
INSERT INTO genealogies (id, name, description, origin, founding_year, is_base, created_at) VALUES
('li', '李氏族谱', '李氏一族自清康熙年间由福建漳州迁居广东潮州，以耕读传家，历经九代，枝繁叶茂。族中人才辈出，涵盖仕宦、教育、商业、医学等诸多领域。', '福建漳州 → 广东潮州', '1680', true, NOW()),
('zhang', '张氏族谱', '张氏一族自清康熙末年自江西迁居湖南长沙，以耕读为业。九代传承，族中涌现众多杰出人物，涵盖外交、科学、文学、艺术、医学等领域。', '江西 → 湖南长沙', '1690', true, NOW()),
('chen', '陈氏族谱', '陈氏一族自清康熙年间自河南迁居四川成都，以农桑为本。九代传承，族中人才辈出，涵盖农业、茶叶、林业、政治、金融等诸多领域。', '河南 → 四川成都', '1700', true, NOW())
ON CONFLICT (id) DO NOTHING;
