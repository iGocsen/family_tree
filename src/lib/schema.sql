# Supabase Database Schema for Genealogy System
-- Run this SQL in your Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- ===== New Persons Table =====
CREATE TABLE IF NOT EXISTS new_persons (
  id TEXT PRIMARY KEY,
  genealogy_id TEXT NOT NULL,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ
);

-- ===== Custom Genealogies Table =====
CREATE TABLE IF NOT EXISTS custom_genealogies (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  origin TEXT DEFAULT '',
  founding_year TEXT DEFAULT '',
  introductions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_feedbacks_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedbacks_genealogy ON feedbacks(genealogy_id);
CREATE INDEX IF NOT EXISTS idx_person_edits_status ON person_edits(status);
CREATE INDEX IF NOT EXISTS idx_new_persons_status ON new_persons(status);
CREATE INDEX IF NOT EXISTS idx_new_persons_genealogy ON new_persons(genealogy_id);
CREATE INDEX IF NOT EXISTS idx_admins_username ON admins(username);

-- ===== Row Level Security (RLS) =====
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE person_edits ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_genealogies ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Allow anonymous read access
CREATE POLICY "Allow anonymous read access to feedbacks" ON feedbacks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to person_edits" ON person_edits FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to new_persons" ON new_persons FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to custom_genealogies" ON custom_genealogies FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read access to admins" ON admins FOR SELECT USING (true);

-- Allow anonymous write access (for simplicity, can be restricted later with auth)
CREATE POLICY "Allow anonymous write access to feedbacks" ON feedbacks FOR ALL USING (true);
CREATE POLICY "Allow anonymous write access to person_edits" ON person_edits FOR ALL USING (true);
CREATE POLICY "Allow anonymous write access to new_persons" ON new_persons FOR ALL USING (true);
CREATE POLICY "Allow anonymous write access to custom_genealogies" ON custom_genealogies FOR ALL USING (true);
CREATE POLICY "Allow anonymous write access to admins" ON admins FOR ALL USING (true);

-- ===== Insert Default Admin =====
INSERT INTO admins (id, username, password_hash, display_name, role, status, editable_genealogies, created_at)
VALUES ('default', 'admin', 'password', '超级管理员', 'super', 'active', '[]'::jsonb, NOW())
ON CONFLICT (id) DO NOTHING;
