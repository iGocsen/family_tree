import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yoursupabase.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ===== Genealogies =====
export async function fetchGenealogies(): Promise<any[]> {
  const { data, error } = await supabase.from('genealogies').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch genealogies:', error); return []; }
  return data || [];
}

export async function saveGenealogyToCloud(g: any): Promise<void> {
  const { error } = await supabase.from('genealogies').upsert({
    id: g.id, name: g.name, description: g.description || '', origin: g.origin || '',
    founding_year: g.founding_year || '', is_base: g.is_base || false,
    created_at: g.created_at || new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) console.error('Failed to save genealogy:', error);
}

export async function deleteGenealogyFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('genealogies').delete().eq('id', id);
  if (error) console.error('Failed to delete genealogy:', error);
}

// ===== Genealogy Introductions (gnlogy_intru) =====
export async function fetchGenealogyIntroductions(genealogyId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('gnlogy_intru')
    .select('*')
    .eq('genealogy_id', genealogyId)
    .order('page_number', { ascending: true });
  if (error) { console.error('Failed to fetch introductions:', error); return []; }
  return data || [];
}

export async function fetchAllGenealogyIntroductions(): Promise<Record<string, any[]>> {
  // Fetch all introductions in one query instead of per-genealogy
  const { data, error } = await supabase
    .from('gnlogy_intru')
    .select('*')
    .order('page_number', { ascending: true });
  if (error) { console.error('Failed to fetch all introductions:', error); return {}; }
  // Group by genealogy_id
  const result: Record<string, any[]> = {};
  (data || []).forEach(item => {
    if (!result[item.genealogy_id]) result[item.genealogy_id] = [];
    result[item.genealogy_id].push(item);
  });
  return result;
}

export async function saveGenealogyIntroductions(genealogyId: string, pages: string[]): Promise<void> {
  // Delete existing pages first
  await supabase.from('gnlogy_intru').delete().eq('genealogy_id', genealogyId);
  
  // Insert new pages
  if (pages.length > 0) {
    const records = pages.map((content, idx) => ({
      id: `intru_${genealogyId}_${idx}_${Date.now()}`,
      genealogy_id: genealogyId,
      content,
      page_number: idx + 1,
      created_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('gnlogy_intru').insert(records);
    if (error) console.error('Failed to save introductions:', error);
  }
}

export async function deleteGenealogyIntroductions(genealogyId: string): Promise<void> {
  const { error } = await supabase.from('gnlogy_intru').delete().eq('genealogy_id', genealogyId);
  if (error) console.error('Failed to delete introductions:', error);
}

// ===== People =====
export async function fetchPeople(genealogyId?: string): Promise<any[]> {
  let query = supabase.from('people').select('*');
  if (genealogyId) query = query.eq('genealogy_id', genealogyId);
  const { data, error } = await query;
  if (error) { console.error('Failed to fetch people:', error); return []; }
  return data || [];
}

export async function fetchAllPeople(): Promise<any[]> {
  // Use pagination to handle large datasets efficiently
  let allData: any[] = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('status', 'approved')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) { console.error('Failed to fetch people page:', error); break; }
    if (!data || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < PAGE_SIZE) break;
    page++;
  }
  return allData;
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

// ===== Person Additions (person_add table) =====
export async function fetchPersonAdditions(): Promise<any[]> {
  const { data, error } = await supabase.from('person_add').select('*').order('created_at', { ascending: false });
  if (error) { console.error('Failed to fetch person additions:', error); return []; }
  return data || [];
}

export async function savePersonAddition(p: any): Promise<void> {
  const { error } = await supabase.from('person_add').upsert({
    id: p.id, genealogy_id: p.genealogy_id, name: p.name, generation: p.generation,
    birth_year: p.birth_year || '', death_year: p.death_year || '', gender: p.gender || 'male',
    spouse: p.spouse || '', parent_id: p.parent_id || '', biography: p.biography || '',
    achievements: p.achievements || '', status: p.status || 'pending',
    created_at: p.created_at || new Date().toISOString(),
  }, { onConflict: 'id' });
  if (error) console.error('Failed to save person addition:', error);
}

export async function approvePersonAddition(id: string, personData: any): Promise<void> {
  // Insert into people table
  await supabase.from('people').upsert({
    id: personData.id, genealogy_id: personData.genealogy_id, name: personData.name, generation: personData.generation,
    birth_year: personData.birth_year || '', death_year: personData.death_year || '', gender: personData.gender || 'male',
    spouse: personData.spouse || '', parent_id: personData.parent_id || '', biography: personData.biography || '',
    achievements: personData.achievements || '', status: 'approved',
    created_at: personData.created_at || new Date().toISOString(),
  }, { onConflict: 'id' });
  // Update person_add status to 'approved' (don't delete)
  await supabase.from('person_add').update({ status: 'approved' }).eq('id', id);
}

export async function rejectPersonAddition(id: string): Promise<void> {
  await supabase.from('person_add').update({ status: 'rejected' }).eq('id', id);
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
  // Try saving with created_by first
  const { error } = await supabase.from('admins').upsert({
    id: admin.id, username: admin.username, password_hash: admin.password_hash,
    display_name: admin.display_name, bio: admin.bio || null, contact: admin.contact || null,
    role: admin.role, status: admin.status, editable_genealogies: admin.editable_genealogies || [],
    created_at: admin.created_at, created_by: admin.created_by || null,
  }, { onConflict: 'id' });
  
  // If created_by column doesn't exist, retry without it
  if (error && error.code === 'PGRST204') {
    const { error: retryError } = await supabase.from('admins').upsert({
      id: admin.id, username: admin.username, password_hash: admin.password_hash,
      display_name: admin.display_name, bio: admin.bio || null, contact: admin.contact || null,
      role: admin.role, status: admin.status, editable_genealogies: admin.editable_genealogies || [],
      created_at: admin.created_at,
    }, { onConflict: 'id' });
    if (retryError) console.error('Failed to save admin:', retryError);
    return;
  }
  if (error) console.error('Failed to save admin:', error);
}

export async function deleteAdminFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('admins').delete().eq('id', id);
  if (error) console.error('Failed to delete admin:', error);
}

// ===== Seed Base Data =====
export async function seedBaseData(): Promise<{ success: boolean; message: string }> {
  try {
    const results: string[] = [];

    const existing = await fetchGenealogies();
    const existingIds = existing.map(g => g.id);

    const baseGenealogies = [
      { id: 'li', name: '李氏族谱', description: '李氏一族自清康熙年间由福建漳州迁居广东潮州，以耕读传家，历经九代，枝繁叶茂。族中人才辈出，涵盖仕宦、教育、商业、医学等诸多领域。', origin: '福建漳州 → 广东潮州', founding_year: '1680' },
      { id: 'zhang', name: '张氏族谱', description: '张氏一族自清康熙末年自江西迁居湖南长沙，以耕读为业。九代传承，族中涌现众多杰出人物，涵盖外交、科学、文学、艺术、医学等领域。', origin: '江西 → 湖南长沙', founding_year: '1690' },
      { id: 'chen', name: '陈氏族谱', description: '陈氏一族自清康熙年间自河南迁居四川成都，以农桑为本。九代传承，族中人才辈出，涵盖农业、茶叶、林业、政治、金融等诸多领域。', origin: '河南 → 四川成都', founding_year: '1700' },
    ];

    for (const g of baseGenealogies) {
      if (!existingIds.includes(g.id)) {
        await saveGenealogyToCloud({ ...g, is_base: true, created_at: new Date().toISOString() });
        results.push(`已创建族谱: ${g.name}`);
      }
    }

    const existingPeople = await fetchAllPeople();
    const existingPersonIds = existingPeople.map(p => p.id);

    const { liPeople, zhangPeople, chenPeople } = await import('@/lib/base-data');

    const allBasePeople = [
      ...Object.values(liPeople).map(p => ({ ...p, genealogy_id: 'li' })),
      ...Object.values(zhangPeople).map(p => ({ ...p, genealogy_id: 'zhang' })),
      ...Object.values(chenPeople).map(p => ({ ...p, genealogy_id: 'chen' })),
    ];

    let peopleAdded = 0;
    const peopleToInsert = allBasePeople.filter(p => !existingPersonIds.includes(p.id));
    
    if (peopleToInsert.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < peopleToInsert.length; i += batchSize) {
        const batch = peopleToInsert.slice(i, i + batchSize);
        const records = batch.map(p => ({
          id: p.id, genealogy_id: p.genealogy_id, name: p.name, generation: p.generation,
          birth_year: p.birthYear || '', death_year: p.deathYear || '', gender: p.gender,
          spouse: p.spouse || '', parent_id: p.parentId || '', biography: p.biography,
          achievements: p.achievements?.join('\n') || '', status: 'approved',
          created_at: new Date().toISOString(),
        }));
        
        const { error } = await supabase.from('people').insert(records);
        if (error) console.error('Failed to batch insert people:', error);
        else peopleAdded += batch.length;
      }
    }
    
    if (peopleAdded > 0) results.push(`已迁移 ${peopleAdded} 个人物`);

    const existingAdmins = await fetchAdmins();
    if (!existingAdmins.find(a => a.id === 'default')) {
      await saveAdminToCloud({
        id: 'default', username: 'admin', password_hash: 'password',
        display_name: '超级管理员', bio: null, contact: null,
        role: 'super', status: 'active', editable_genealogies: [],
        created_at: new Date().toISOString(),
      });
      results.push('已创建默认管理员');
    }

    return { success: true, message: results.length > 0 ? `初始化完成：${results.join('；')}` : '数据已是最新' };
  } catch (err: any) {
    return { success: false, message: `初始化失败: ${err.message}` };
  }
}

// ===== Migration: LocalStorage → Supabase =====
export async function migrateToSupabase(options: { includeBaseData?: boolean } = {}): Promise<{ success: boolean; message: string }> {
  try {
    const results: string[] = [];

    // Optionally seed base genealogies and people
    if (options.includeBaseData) {
      const existing = await fetchGenealogies();
      const existingIds = existing.map(g => g.id);

      const baseGenealogies = [
        { id: 'li', name: '李氏族谱', description: '李氏一族自清康熙年间由福建漳州迁居广东潮州，以耕读传家，历经九代，枝繁叶茂。族中人才辈出，涵盖仕宦、教育、商业、医学等诸多领域。', origin: '福建漳州 → 广东潮州', founding_year: '1680' },
        { id: 'zhang', name: '张氏族谱', description: '张氏一族自清康熙末年自江西迁居湖南长沙，以耕读为业。九代传承，族中涌现众多杰出人物，涵盖外交、科学、文学、艺术、医学等领域。', origin: '江西 → 湖南长沙', founding_year: '1690' },
        { id: 'chen', name: '陈氏族谱', description: '陈氏一族自清康熙年间自河南迁居四川成都，以农桑为本。九代传承，族中人才辈出，涵盖农业、茶叶、林业、政治、金融等诸多领域。', origin: '河南 → 四川成都', founding_year: '1700' },
      ];

      for (const g of baseGenealogies) {
        if (!existingIds.includes(g.id)) {
          await saveGenealogyToCloud({ ...g, is_base: true, created_at: new Date().toISOString() });
          results.push(`已创建族谱: ${g.name}`);
        }
      }

      const existingPeople = await fetchAllPeople();
      const existingPersonIds = existingPeople.map(p => p.id);

      const { liPeople, zhangPeople, chenPeople } = await import('@/lib/base-data');

      const allBasePeople = [
        ...Object.values(liPeople).map(p => ({ ...p, genealogy_id: 'li' })),
        ...Object.values(zhangPeople).map(p => ({ ...p, genealogy_id: 'zhang' })),
        ...Object.values(chenPeople).map(p => ({ ...p, genealogy_id: 'chen' })),
      ];

      let peopleAdded = 0;
      const peopleToInsert = allBasePeople.filter(p => !existingPersonIds.includes(p.id));
      
      if (peopleToInsert.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < peopleToInsert.length; i += batchSize) {
          const batch = peopleToInsert.slice(i, i + batchSize);
          const records = batch.map(p => ({
            id: p.id, genealogy_id: p.genealogy_id, name: p.name, generation: p.generation,
            birth_year: p.birthYear || '', death_year: p.deathYear || '', gender: p.gender,
            spouse: p.spouse || '', parent_id: p.parentId || '', biography: p.biography,
            achievements: p.achievements?.join('\n') || '', status: 'approved',
            created_at: new Date().toISOString(),
          }));
          
          const { error } = await supabase.from('people').insert(records);
          if (error) console.error('Failed to batch insert people:', error);
          else peopleAdded += batch.length;
        }
      }
      
      if (peopleAdded > 0) results.push(`已迁移 ${peopleAdded} 个基础人物`);

      const existingAdmins = await fetchAdmins();
      if (!existingAdmins.find(a => a.id === 'default')) {
        await saveAdminToCloud({
          id: 'default', username: 'admin', password_hash: 'password',
          display_name: '超级管理员', bio: null, contact: null,
          role: 'super', status: 'active', editable_genealogies: [],
          created_at: new Date().toISOString(),
        });
        results.push('已创建默认管理员');
      }
    }

    // Migrate custom genealogies from localStorage
    const customGenealogies = JSON.parse(localStorage.getItem('genealogy_custom') || '[]');
    for (const g of customGenealogies) {
      await saveGenealogyToCloud({
        id: g.id, name: g.name, description: g.description, origin: g.origin,
        founding_year: g.foundingYear, is_base: false, created_at: g.createdAt || new Date().toISOString(),
      });
    }
    if (customGenealogies.length > 0) results.push(`已迁移 ${customGenealogies.length} 个自定义族谱`);

    // Migrate introductions from localStorage
    const intros = JSON.parse(localStorage.getItem('genealogy_introductions') || '{}');
    for (const [genealogyId, pages] of Object.entries(intros)) {
      if (Array.isArray(pages) && pages.length > 0) {
        await saveGenealogyIntroductions(genealogyId, pages as string[]);
        results.push(`已迁移 ${genealogyId} 的 ${pages.length} 页介绍`);
      }
    }

    // Migrate new persons
    const newPersons = JSON.parse(localStorage.getItem('genealogy_new_persons') || '[]');
    for (const p of newPersons) {
      await savePersonToCloud({
        id: p.id, genealogy_id: p.genealogyId, name: p.name, generation: p.generation,
        birth_year: p.birthYear, death_year: p.deathYear, gender: p.gender,
        spouse: p.spouse, parent_id: p.parentId, biography: p.biography,
        achievements: p.achievements, status: p.status,
        created_at: p.createdAt,
      });
    }
    if (newPersons.length > 0) results.push(`已迁移 ${newPersons.length} 个人物`);

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
    if (feedbacks.length > 0) results.push(`已迁移 ${feedbacks.length} 条反馈`);

    // Migrate edits
    const edits = JSON.parse(localStorage.getItem('genealogy_edits') || '[]');
    for (const e of edits) {
      await saveEditToCloud({
        id: e.id, genealogy_id: e.genealogyId, genealogy_name: e.genealogyName,
        person_id: e.personId, person_name: e.personName, field: e.field,
        old_value: e.oldValue, new_value: e.newValue, status: e.status, created_at: e.createdAt,
      });
    }
    if (edits.length > 0) results.push(`已迁移 ${edits.length} 条修改记录`);

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
    if (admins.length > 0) results.push(`已迁移 ${admins.length} 个管理员`);

    return { success: true, message: results.length > 0 ? `迁移完成：${results.join('；')}` : '数据已是最新' };
  } catch (err: any) {
    return { success: false, message: `迁移失败: ${err.message}` };
  }
}
