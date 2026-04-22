import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yoursupabase.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== Cloud Data Manager =====
// All data is now read from and written to Supabase

// ===== Genealogies =====
export async function fetchCustomGenealogies(): Promise<any[]> {
  const { data, error } = await supabase.from('genealogies').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch genealogies:', error); return []; }
  return data || [];
}

export async function saveGenealogyToCloud(g: any): Promise<void> {
  const { error } = await supabase.from('genealogies').upsert({
    id: g.id, name: g.name, description: g.description || '', origin: g.origin || '',
    founding_year: g.founding_year || '', introductions: g.introductions || [],
    is_base: g.is_base || false, created_at: g.created_at || new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) console.error('Failed to save genealogy:', error);
}

export async function deleteGenealogyFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('genealogies').delete().eq('id', id);
  if (error) console.error('Failed to delete genealogy:', error);
}

// ===== People =====
export async function fetchPeople(genealogyId: string): Promise<any[]> {
  const { data, error } = await supabase.from('people').select('*').eq('genealogy_id', genealogyId);
  if (error) { console.error('Failed to fetch people:', error); return []; }
  return data || [];
}

export async function savePersonToCloud(p: any): Promise<void> {
  const { error } = await supabase.from('people').upsert({
    id: p.id, genealogy_id: p.genealogy_id, name: p.name, generation: p.generation,
    birth_year: p.birth_year || '', death_year: p.death_year || '', gender: p.gender || 'male',
    spouse: p.spouse || '', parent_id: p.parent_id || '', biography: p.biography || '',
    achievements: p.achievements || '', status: p.status || 'approved',
    created_at: p.created_at || new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) console.error('Failed to save person:', error);
}

export async function deletePersonFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('people').delete().eq('id', id);
  if (error) console.error('Failed to delete person:', error);
}

// ===== Feedbacks =====
export async function fetchFeedbacks(): Promise<any[]> {
  const { data, error } = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch feedbacks:', error); return []; }
  return data || [];
}

export async function saveFeedbackToCloud(fb: any): Promise<void> {
  const { error } = await supabase.from('feedbacks').upsert({
    id: fb.id, genealogy_id: fb.genealogy_id, genealogy_name: fb.genealogy_name,
    person_id: fb.person_id, person_name: fb.person_name, person_generation: fb.person_generation || 0,
    person_biography: fb.person_biography || '', feedback_type: fb.feedback_type,
    description: fb.description, contact: fb.contact || '', status: fb.status,
    admin_note: fb.admin_note || null, created_at: fb.created_at, resolved_at: fb.resolved_at || null,
  }, { onConflict: 'id' });
  if (error) console.error('Failed to save feedback:', error);
}

export async function deleteFeedbackFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('feedbacks').delete().eq('id', id);
  if (error) console.error('Failed to delete feedback:', error);
}

// ===== Person Edits =====
export async function fetchPersonEdits(): Promise<any[]> {
  const { data, error } = await supabase.from('person_edits').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch edits:', error); return []; }
  return data || [];
}

export async function saveEditToCloud(edit: any): Promise<void> {
  const { error } = await supabase.from('person_edits').upsert({
    id: edit.id, genealogy_id: edit.genealogy_id, genealogy_name: edit.genealogy_name,
    person_id: edit.person_id, person_name: edit.person_name, field: edit.field,
    old_value: edit.old_value, new_value: edit.new_value, status: edit.status,
    created_at: edit.created_at,
  }, { onConflict: 'id' });
  if (error) console.error('Failed to save edit:', error);
}

export async function deleteEditFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('person_edits').delete().eq('id', id);
  if (error) console.error('Failed to delete edit:', error);
}

// ===== Admins =====
export async function fetchAdmins(): Promise<any[]> {
  const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch admins:', error); return []; }
  return data || [];
}

export async function saveAdminToCloud(admin: any): Promise<void> {
  const { error } = await supabase.from('admins').upsert({
    id: admin.id, username: admin.username, password_hash: admin.password_hash,
    display_name: admin.display_name, bio: admin.bio || null, contact: admin.contact || null,
    role: admin.role, status: admin.status, editable_genealogies: admin.editable_genealogies || [],
    created_at: admin.created_at,
  }, { onConflict: 'id' });
  if (error) console.error('Failed to save admin:', error);
}

export async function deleteAdminFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('admins').delete().eq('id', id);
  if (error) console.error('Failed to delete admin:', error);
}

// ===== Migration: LocalStorage → Supabase =====
export async function migrateToSupabase(): Promise<{ success: boolean; message: string }> {
  try {
    // Migrate genealogies
    const customGenealogies = JSON.parse(localStorage.getItem('genealogy_custom') || '[]');
    for (const g of customGenealogies) {
      await saveGenealogyToCloud({
        id: g.id, name: g.name, description: g.description, origin: g.origin,
        founding_year: g.foundingYear, introductions: g.introductions || [],
        is_base: false, created_at: g.createdAt || new Date().toISOString(),
      });
    }

    // Migrate people (from approved new_persons)
    const newPersons = JSON.parse(localStorage.getItem('genealogy_new_persons') || '[]');
    const approvedPersons = newPersons.filter((p: any) => p.status === 'approved');
    for (const p of approvedPersons) {
      await savePersonToCloud({
        id: p.id, genealogy_id: p.genealogyId, name: p.name, generation: p.generation,
        birth_year: p.birthYear, death_year: p.deathYear, gender: p.gender,
        spouse: p.spouse, parent_id: p.parentId, biography: p.biography,
        achievements: p.achievements, status: 'approved',
        created_at: p.createdAt,
      });
    }

    // Migrate feedbacks
    const feedbacks = JSON.parse(localStorage.getItem('genealogy_feedbacks') || '[]');
    for (const fb of feedbacks) {
      await saveFeedbackToCloud({
        id: fb.id, genealogy_id: fb.genealogyId, genealogy_name: fb.genealogyName,
        person_id: fb.personId, person_name: fb.personName, person_generation: fb.personGeneration || 0,
        person_biography: fb.personBiography || '', feedback_type: fb.feedbackType,
        description: fb.description, contact: fb.contact || '', status: fb.status,
        admin_note: fb.adminNote || null, created_at: fb.createdAt, resolved_at: fb.resolvedAt || null,
      });
    }

    // Migrate edits
    const edits = JSON.parse(localStorage.getItem('genealogy_edits') || '[]');
    for (const e of edits) {
      await saveEditToCloud({
        id: e.id, genealogy_id: e.genealogyId, genealogy_name: e.genealogyName,
        person_id: e.personId, person_name: e.personName, field: e.field,
        old_value: e.oldValue, new_value: e.newValue, status: e.status, created_at: e.createdAt,
      });
    }

    // Migrate admins
    const admins = JSON.parse(localStorage.getItem('genealogy_admins') || '[]');
    for (const a of admins) {
      await saveAdminToCloud({
        id: a.id, username: a.username, password_hash: a.password,
        display_name: a.displayName, bio: a.bio || null, contact: a.contact || null,
        role: a.role, status: a.status, editable_genealogies: a.editableGenealogies || [],
        created_at: a.createdAt,
      });
    }

    return { success: true, message: '数据已成功迁移到 Supabase' };
  } catch (err: any) {
    return { success: false, message: `迁移失败: ${err.message}` };
  }
}
