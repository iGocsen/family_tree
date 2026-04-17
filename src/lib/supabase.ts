import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yoursupabase.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== Database Types =====
export interface DbFeedback {
  id: string;
  genealogy_id: string;
  genealogy_name: string;
  person_id: string;
  person_name: string;
  person_generation: number;
  person_biography: string;
  feedback_type: string;
  description: string;
  contact: string;
  status: string;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DbPersonEdit {
  id: string;
  genealogy_id: string;
  genealogy_name: string;
  person_id: string;
  person_name: string;
  field: string;
  old_value: string;
  new_value: string;
  status: string;
  created_at: string;
}

export interface DbNewPerson {
  id: string;
  genealogy_id: string;
  name: string;
  generation: number;
  birth_year: string;
  death_year: string;
  gender: string;
  spouse: string;
  parent_id: string;
  biography: string;
  achievements: string;
  status: string;
  created_at: string;
  approved_at: string | null;
}

export interface DbCustomGenealogy {
  id: string;
  name: string;
  description: string;
  origin: string;
  founding_year: string;
  introductions: string[];
  created_at: string;
}

export interface DbAdmin {
  id: string;
  username: string;
  password_hash: string;
  display_name: string;
  bio: string | null;
  contact: string | null;
  role: string;
  status: string;
  editable_genealogies: string[];
  created_at: string;
}

// ===== Sync Functions =====
export async function syncFeedbacksToCloud(feedbacks: DbFeedback[]): Promise<void> {
  if (!supabaseAnonKey) return;
  for (const fb of feedbacks) {
    const { error } = await supabase.from('feedbacks').upsert(fb, { onConflict: 'id' });
    if (error) console.error('Failed to sync feedback:', error);
  }
}

export async function fetchFeedbacksFromCloud(): Promise<DbFeedback[]> {
  if (!supabaseAnonKey) return [];
  const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch feedbacks:', error); return []; }
  return data || [];
}

export async function syncPersonEditsToCloud(edits: DbPersonEdit[]): Promise<void> {
  if (!supabaseAnonKey) return;
  for (const edit of edits) {
    const { error } = await supabase.from('person_edits').upsert(edit, { onConflict: 'id' });
    if (error) console.error('Failed to sync edit:', error);
  }
}

export async function fetchPersonEditsFromCloud(): Promise<DbPersonEdit[]> {
  if (!supabaseAnonKey) return [];
  const { data, error } = await supabase.from('person_edits').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch edits:', error); return []; }
  return data || [];
}

export async function syncNewPersonsToCloud(persons: DbNewPerson[]): Promise<void> {
  if (!supabaseAnonKey) return;
  for (const p of persons) {
    const { error } = await supabase.from('new_persons').upsert(p, { onConflict: 'id' });
    if (error) console.error('Failed to sync person:', error);
  }
}

export async function fetchNewPersonsFromCloud(): Promise<DbNewPerson[]> {
  if (!supabaseAnonKey) return [];
  const { data, error } = await supabase.from('new_persons').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch persons:', error); return []; }
  return data || [];
}

export async function syncCustomGenealogiesToCloud(genealogies: DbCustomGenealogy[]): Promise<void> {
  if (!supabaseAnonKey) return;
  for (const g of genealogies) {
    const { error } = await supabase.from('custom_genealogies').upsert(g, { onConflict: 'id' });
    if (error) console.error('Failed to sync genealogy:', error);
  }
}

export async function fetchCustomGenealogiesFromCloud(): Promise<DbCustomGenealogy[]> {
  if (!supabaseAnonKey) return [];
  const { data, error } = await supabase.from('custom_genealogies').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch genealogies:', error); return []; }
  return data || [];
}

export async function syncAdminsToCloud(admins: DbAdmin[]): Promise<void> {
  if (!supabaseAnonKey) return;
  for (const a of admins) {
    const { error } = await supabase.from('admins').upsert(a, { onConflict: 'id' });
    if (error) console.error('Failed to sync admin:', error);
  }
}

export async function fetchAdminsFromCloud(): Promise<DbAdmin[]> {
  if (!supabaseAnonKey) return [];
  const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch admins:', error); return []; }
  return data || [];
}

// ===== Migration: LocalStorage → PostgreSQL =====
export async function migrateToPostgreSQL(): Promise<{ success: boolean; message: string }> {
  try {
    const feedbacks = JSON.parse(localStorage.getItem('genealogy_feedbacks') || '[]');
    const edits = JSON.parse(localStorage.getItem('genealogy_edits') || '[]');
    const newPersons = JSON.parse(localStorage.getItem('genealogy_new_persons') || '[]');
    const customGenealogies = JSON.parse(localStorage.getItem('genealogy_custom') || '[]');
    const admins = JSON.parse(localStorage.getItem('genealogy_admins') || '[]');

    const dbFeedbacks: DbFeedback[] = feedbacks.map((f: any) => ({
      id: f.id, genealogy_id: f.genealogyId, genealogy_name: f.genealogyName,
      person_id: f.personId, person_name: f.personName, person_generation: f.personGeneration || 0,
      person_biography: f.personBiography || '', feedback_type: f.feedbackType,
      description: f.description, contact: f.contact, status: f.status,
      admin_note: f.adminNote || null, created_at: f.createdAt, resolved_at: f.resolvedAt || null,
    }));

    const dbEdits: DbPersonEdit[] = edits.map((e: any) => ({
      id: e.id, genealogy_id: e.genealogyId, genealogy_name: e.genealogyName,
      person_id: e.personId, person_name: e.personName, field: e.field,
      old_value: e.oldValue, new_value: e.newValue, status: e.status, created_at: e.createdAt,
    }));

    const dbPersons: DbNewPerson[] = newPersons.map((p: any) => ({
      id: p.id, genealogy_id: p.genealogyId, name: p.name, generation: p.generation,
      birth_year: p.birthYear, death_year: p.deathYear, gender: p.gender,
      spouse: p.spouse, parent_id: p.parentId, biography: p.biography,
      achievements: p.achievements, status: p.status, created_at: p.createdAt,
      approved_at: p.approvedAt || null,
    }));

    const dbGenealogies: DbCustomGenealogy[] = customGenealogies.map((g: any) => ({
      id: g.id, name: g.name, description: g.description, origin: g.origin,
      founding_year: g.foundingYear, introductions: g.introductions || [],
      created_at: g.createdAt || new Date().toISOString(),
    }));

    const dbAdmins: DbAdmin[] = admins.map((a: any) => ({
      id: a.id, username: a.username, password_hash: a.password,
      display_name: a.displayName, bio: a.bio || null, contact: a.contact || null,
      role: a.role, status: a.status, editable_genealogies: a.editableGenealogies || [],
      created_at: a.createdAt,
    }));

    await Promise.all([
      syncFeedbacksToCloud(dbFeedbacks),
      syncPersonEditsToCloud(dbEdits),
      syncNewPersonsToCloud(dbPersons),
      syncCustomGenealogiesToCloud(dbGenealogies),
      syncAdminsToCloud(dbAdmins),
    ]);

    return { success: true, message: '数据已成功迁移到云端数据库' };
  } catch (err: any) {
    return { success: false, message: `迁移失败: ${err.message}` };
  }
}

// ===== Sync All Data (Cloud → Local) =====
export async function syncFromCloud(): Promise<void> {
  try {
    const [feedbacks, edits, newPersons, customGenealogies, admins] = await Promise.all([
      fetchFeedbacksFromCloud(), fetchPersonEditsFromCloud(), fetchNewPersonsFromCloud(),
      fetchCustomGenealogiesFromCloud(), fetchAdminsFromCloud(),
    ]);

    localStorage.setItem('genealogy_feedbacks', JSON.stringify(feedbacks.map(f => ({
      id: f.id, genealogyId: f.genealogy_id, genealogyName: f.genealogy_name,
      personId: f.person_id, personName: f.person_name, personGeneration: f.person_generation,
      personBiography: f.person_biography, feedbackType: f.feedback_type,
      description: f.description, contact: f.contact, status: f.status,
      adminNote: f.admin_note, createdAt: f.created_at, resolvedAt: f.resolved_at,
    }))));

    localStorage.setItem('genealogy_edits', JSON.stringify(edits.map(e => ({
      id: e.id, genealogyId: e.genealogy_id, genealogyName: e.genealogy_name,
      personId: e.person_id, personName: e.person_name, field: e.field,
      oldValue: e.old_value, newValue: e.new_value, status: e.status, createdAt: e.created_at,
    }))));

    localStorage.setItem('genealogy_new_persons', JSON.stringify(newPersons.map(p => ({
      id: p.id, genealogyId: p.genealogy_id, name: p.name, generation: p.generation,
      birthYear: p.birth_year, deathYear: p.death_year, gender: p.gender,
      spouse: p.spouse, parentId: p.parent_id, biography: p.biography,
      achievements: p.achievements, status: p.status, createdAt: p.created_at,
      approvedAt: p.approved_at,
    }))));

    localStorage.setItem('genealogy_custom', JSON.stringify(customGenealogies.map(g => ({
      id: g.id, name: g.name, description: g.description, origin: g.origin,
      foundingYear: g.founding_year, people: {}, introductions: g.introductions || [],
      createdAt: g.created_at,
    }))));

    localStorage.setItem('genealogy_admins', JSON.stringify(admins.map(a => ({
      id: a.id, username: a.username, password: a.password_hash,
      displayName: a.display_name, bio: a.bio, contact: a.contact,
      role: a.role, status: a.status, editableGenealogies: a.editable_genealogies,
      createdAt: a.created_at,
    }))));
  } catch (err) {
    console.error('Failed to sync from cloud:', err);
  }
}
