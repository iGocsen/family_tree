import { Person, setSupabaseCache, Genealogy } from '@/lib/data';
import { supabase, fetchGenealogies, saveGenealogyToCloud, deleteGenealogyFromCloud, fetchPeople, fetchAllPeople, savePersonToCloud, deletePersonFromCloud, fetchFeedbacks, saveFeedbackToCloud, deleteFeedbackFromCloud, fetchPersonEdits, saveEditToCloud, deleteEditFromCloud, fetchAdmins, saveAdminToCloud, deleteAdminFromCloud, seedBaseData, migrateToSupabase as migrateToSupabaseImpl, fetchGenealogyIntroductions, saveGenealogyIntroductions, deleteGenealogyIntroductions, fetchPersonAdditions, approvePersonAddition, rejectPersonAddition, savePersonAddition } from './supabase';

export { seedBaseData, migrateToSupabaseImpl as migrateToSupabase };

export interface FeedbackRecord {
  id: string; genealogyId: string; genealogyName: string; personId: string; personName: string;
  personGeneration: number; personBiography: string;
  feedbackType: 'info-error' | 'missing-info' | 'duplicate' | 'other';
  description: string; contact: string; status: 'pending' | 'resolved' | 'rejected';
  createdAt: string; resolvedAt?: string; adminNote?: string;
}

export interface PersonEdit {
  id: string; genealogyId: string; genealogyName: string; personId: string; personName: string;
  field: string; oldValue: string; newValue: string;
  status: 'pending' | 'approved' | 'rejected'; createdAt: string;
}

export interface NewPersonData {
  genealogyId: string; name: string; generation: number; birthYear: string; deathYear: string;
  gender: 'male' | 'female'; spouse: string; parentId: string; biography: string; achievements: string;
}

export interface CustomGenealogy {
  id: string; name: string; description: string; origin: string; foundingYear: string;
  people: Record<string, Person>; introductions?: string[];
}

export interface AdminUser {
  id: string; username: string; password: string; displayName: string;
  bio?: string; contact?: string; role: 'super' | 'manager' | 'editor';
  status: 'active' | 'disabled'; editableGenealogies: string[]; createdAt: string;
  createdBy?: string; // Track who created this admin (for manager permission scoping)
}

export interface PersonAddition {
  id: string; genealogyId: string; name: string; generation: number;
  birthYear: string; deathYear: string; gender: 'male' | 'female';
  spouse: string; parentId: string; biography: string; achievements: string;
  status: 'pending' | 'approved' | 'rejected'; createdAt: string;
}

// Cloud data caches
let genealogiesCache: CustomGenealogy[] = [];
let peopleCache: Record<string, Person[]> = {};
let feedbacksCache: FeedbackRecord[] = [];
let editsCache: PersonEdit[] = [];
let adminsCache: AdminUser[] = [];
let introductionsCache: Record<string, string[]> = {};
let personAdditionsCache: PersonAddition[] = [];
let isInitialized = false;

// ===== Auth =====
const AUTH_KEY = 'genealogy_admin_auth';

export async function login(username: string, password: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .eq('password_hash', password)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    if (username === 'admin' && password === 'password') {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, loginTime: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000, userId: 'default' }));
      return true;
    }
    return false;
  }

  localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, loginTime: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000, userId: data.id }));
  return true;
}

export function logout(): void { localStorage.removeItem(AUTH_KEY); }

export function isAuthenticated(): boolean {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return false;
    const auth = JSON.parse(data);
    if (!auth.loggedIn) return false;
    if (Date.now() > auth.expiresAt) { localStorage.removeItem(AUTH_KEY); return false; }
    return true;
  } catch { return false; }
}

export function getCurrentUserId(): string | null {
  try { const data = localStorage.getItem(AUTH_KEY); return data ? JSON.parse(data).userId || null : null; } catch { return null; }
}

// ===== Data Refresh =====
export async function refreshAllData(): Promise<void> {
  let genealogiesData: any[] = [];
  let allPeople: any[] = [];
  let feedbacks: any[] = [];
  let edits: any[] = [];
  let admins: any[] = [];
  let personAdditions: any[] = [];

  try {
    [genealogiesData, allPeople, feedbacks, edits, admins, personAdditions] = await Promise.all([
      fetchGenealogies(),
      fetchAllPeople(),
      fetchFeedbacks(),
      fetchPersonEdits(),
      fetchAdmins(),
      fetchPersonAdditions(),
    ]);
  } catch (err) {
    console.warn('Failed to fetch data from Supabase:', err);
  }

  genealogiesCache = genealogiesData.map(g => ({
    id: g.id, name: g.name, description: g.description || '', origin: g.origin || '',
    foundingYear: g.founding_year || '', people: {}, introductions: [],
  }));

  // Group people by genealogy
  peopleCache = {};
  const dataPeopleCache: Record<string, Record<string, Person>> = {};
  for (const p of allPeople) {
    if (!peopleCache[p.genealogy_id]) peopleCache[p.genealogy_id] = [];
    if (!dataPeopleCache[p.genealogy_id]) dataPeopleCache[p.genealogy_id] = {};
    
    const person: Person = {
      id: p.id, name: p.name, generation: p.generation,
      birthYear: p.birth_year || undefined, deathYear: p.death_year || undefined,
      gender: p.gender, spouse: p.spouse || undefined, parentId: p.parent_id || undefined,
      biography: p.biography || '',
      achievements: p.achievements ? p.achievements.split('\n').filter((a: string) => a.trim()) : undefined,
      status: p.status || 'approved',
    };
    
    peopleCache[p.genealogy_id].push(person);
    dataPeopleCache[p.genealogy_id][p.id] = person;
  }

  // Store person additions cache
  personAdditionsCache = personAdditions.map(pa => ({
    id: pa.id, genealogyId: pa.genealogy_id, name: pa.name, generation: pa.generation,
    birthYear: pa.birth_year || '', deathYear: pa.death_year || '', gender: pa.gender || 'male',
    spouse: pa.spouse || '', parentId: pa.parent_id || '', biography: pa.biography || '',
    achievements: pa.achievements || '', status: pa.status || 'pending', createdAt: pa.created_at,
  }));

  // Fetch introductions for each genealogy
  introductionsCache = {};
  for (const g of genealogiesData) {
    try {
      const intruPages = await fetchGenealogyIntroductions(g.id);
      introductionsCache[g.id] = intruPages.map((p: any) => p.content);
    } catch { /* ignore */ }
  }

  // Set the Supabase cache in data.ts
  const genealogiesForCache: Genealogy[] = genealogiesData.map(g => ({
    id: g.id, name: g.name, description: g.description || '', origin: g.origin || '',
    foundingYear: g.founding_year || '',
    ancestor: dataPeopleCache[g.id] ? Object.values(dataPeopleCache[g.id]).find(p => !p.parentId) || Object.values(dataPeopleCache[g.id]).find(p => p.generation === 1) || null : null,
    people: dataPeopleCache[g.id] || {},
  }));
  setSupabaseCache(genealogiesForCache, dataPeopleCache, introductionsCache);

  feedbacksCache = feedbacks.map(f => ({
    id: f.id, genealogyId: f.genealogy_id, genealogyName: f.genealogy_name,
    personId: f.person_id, personName: f.person_name, personGeneration: f.person_generation || 0,
    personBiography: f.person_biography || '', feedbackType: f.feedback_type,
    description: f.description, contact: f.contact || '', status: f.status,
    adminNote: f.admin_note, createdAt: f.created_at, resolvedAt: f.resolved_at,
  }));

  editsCache = edits.map(e => ({
    id: e.id, genealogyId: e.genealogy_id, genealogyName: e.genealogy_name,
    personId: e.person_id, personName: e.person_name, field: e.field,
    oldValue: e.old_value, newValue: e.new_value, status: e.status, createdAt: e.created_at,
  }));

  adminsCache = admins.map(a => ({
    id: a.id, username: a.username, password: a.password_hash,
    displayName: a.display_name, bio: a.bio, contact: a.contact,
    role: a.role, status: a.status, editableGenealogies: a.editable_genealogies || [],
    createdAt: a.created_at,
  }));

  isInitialized = true;
}

export async function refreshGenealogyPeople(genealogyId: string): Promise<void> {
  const people = await fetchPeople(genealogyId);
  peopleCache[genealogyId] = people.map(p => ({
    id: p.id, name: p.name, generation: p.generation,
    birthYear: p.birth_year || undefined, deathYear: p.death_year || undefined,
    gender: p.gender, spouse: p.spouse || undefined, parentId: p.parent_id || undefined,
    biography: p.biography || '',
    achievements: p.achievements ? p.achievements.split('\n').filter((a: string) => a.trim()) : undefined,
  }));
}

// ===== Genealogies =====
export function getCustomGenealogies(): CustomGenealogy[] {
  return genealogiesCache;
}

export async function saveCustomGenealogy(g: CustomGenealogy): Promise<void> {
  const idx = genealogiesCache.findIndex(x => x.id === g.id);
  const newGenealogy: CustomGenealogy = { ...g, people: idx >= 0 ? genealogiesCache[idx].people : {} };
  if (idx >= 0) genealogiesCache[idx] = newGenealogy; else genealogiesCache.push(newGenealogy);
  await saveGenealogyToCloud({
    id: g.id, name: g.name, description: g.description, origin: g.origin,
    founding_year: g.foundingYear, is_base: false, created_at: new Date().toISOString(),
  });
}

export async function deleteCustomGenealogy(id: string): Promise<void> {
  genealogiesCache = genealogiesCache.filter(g => g.id !== id);
  delete peopleCache[id];
  delete introductionsCache[id];
  await deleteGenealogyFromCloud(id);
  await deleteGenealogyIntroductions(id);
}

export function updateCustomGenealogy(id: string, updates: Partial<CustomGenealogy>): void {
  const idx = genealogiesCache.findIndex(g => g.id === id);
  if (idx >= 0) genealogiesCache[idx] = { ...genealogiesCache[idx], ...updates };
  saveGenealogyToCloud({
    id, name: genealogiesCache[idx]?.name || '', description: genealogiesCache[idx]?.description || '',
    origin: genealogiesCache[idx]?.origin || '', founding_year: genealogiesCache[idx]?.foundingYear || '',
    is_base: false, created_at: new Date().toISOString(),
  });
}

export function updateGenealogyIntroductions(id: string, introductions: string[]): void {
  const idx = genealogiesCache.findIndex(g => g.id === id);
  if (idx >= 0) genealogiesCache[idx].introductions = introductions;
  introductionsCache[id] = introductions;
  saveGenealogyIntroductions(id, introductions);
}

export function getGenealogyIntroductions(id: string): string[] {
  return introductionsCache[id] || [];
}

// Get genealogy data from cache (includes both base and custom genealogies)
export function getGenealogyData(id: string): Genealogy | undefined {
  return genealogiesCache.find(g => g.id === id);
}

// ===== People =====
export function getPeopleByGenealogy(genealogyId: string): Person[] {
  return peopleCache[genealogyId] || [];
}

export async function addPersonToGenealogy(person: Person & { genealogyId: string }): Promise<void> {
  if (!peopleCache[person.genealogyId]) peopleCache[person.genealogyId] = [];
  peopleCache[person.genealogyId].push(person);
  await savePersonToCloud({
    id: person.id, genealogy_id: person.genealogyId, name: person.name, generation: person.generation,
    birth_year: person.birthYear || '', death_year: person.deathYear || '', gender: person.gender,
    spouse: person.spouse || '', parent_id: person.parentId || '', biography: person.biography,
    achievements: person.achievements?.join('\n') || '', status: 'approved',
    created_at: new Date().toISOString(),
  });
}

export async function deletePersonFromGenealogy(genealogyId: string, personId: string): Promise<void> {
  if (peopleCache[genealogyId]) {
    peopleCache[genealogyId] = peopleCache[genealogyId].filter(p => p.id !== personId);
  }
  await deletePersonFromCloud(personId);
}

// ===== Feedbacks =====
export function getFeedbacks(): FeedbackRecord[] {
  return feedbacksCache;
}

export async function saveFeedback(feedback: Omit<FeedbackRecord, 'id' | 'status' | 'createdAt'>): Promise<FeedbackRecord> {
  const newFeedback: FeedbackRecord = { ...feedback, id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: 'pending', createdAt: new Date().toISOString() };
  feedbacksCache.unshift(newFeedback);
  await saveFeedbackToCloud({
    id: newFeedback.id, genealogy_id: newFeedback.genealogyId, genealogy_name: newFeedback.genealogyName,
    person_id: newFeedback.personId, person_name: newFeedback.personName, person_generation: newFeedback.personGeneration,
    person_biography: newFeedback.personBiography, feedback_type: newFeedback.feedbackType,
    description: newFeedback.description, contact: newFeedback.contact, status: newFeedback.status,
    admin_note: newFeedback.adminNote || null, created_at: newFeedback.createdAt, resolved_at: newFeedback.resolvedAt || null,
  });
  return newFeedback;
}

export async function updateFeedbackStatus(id: string, status: 'pending' | 'resolved' | 'rejected', adminNote?: string): Promise<void> {
  const idx = feedbacksCache.findIndex(f => f.id === id);
  if (idx !== -1) {
    feedbacksCache[idx].status = status;
    feedbacksCache[idx].adminNote = adminNote;
    if (status !== 'pending') feedbacksCache[idx].resolvedAt = new Date().toISOString();
    await saveFeedbackToCloud({
      id, genealogy_id: feedbacksCache[idx].genealogyId, genealogy_name: feedbacksCache[idx].genealogyName,
      person_id: feedbacksCache[idx].personId, person_name: feedbacksCache[idx].personName,
      person_generation: feedbacksCache[idx].personGeneration, person_biography: feedbacksCache[idx].personBiography,
      feedback_type: feedbacksCache[idx].feedbackType, description: feedbacksCache[idx].description,
      contact: feedbacksCache[idx].contact, status, admin_note: adminNote || null,
      created_at: feedbacksCache[idx].createdAt, resolved_at: feedbacksCache[idx].resolvedAt || null,
    });
  }
}

export async function deleteFeedback(id: string): Promise<void> {
  feedbacksCache = feedbacksCache.filter(f => f.id !== id);
  await deleteFeedbackFromCloud(id);
}

// ===== Person Edits =====
export function getPersonEdits(): PersonEdit[] {
  return editsCache;
}

export async function savePersonEdit(edit: Omit<PersonEdit, 'id' | 'status' | 'createdAt'>): Promise<PersonEdit> {
  const newEdit: PersonEdit = { ...edit, id: `edit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: 'pending', createdAt: new Date().toISOString() };
  // Don't add to cache here - refreshData will fetch from Supabase
  await saveEditToCloud({
    id: newEdit.id, genealogy_id: newEdit.genealogyId, genealogy_name: newEdit.genealogyName,
    person_id: newEdit.personId, person_name: newEdit.personName, field: newEdit.field,
    old_value: newEdit.oldValue, new_value: newEdit.newValue, status: newEdit.status,
    created_at: newEdit.createdAt,
  });
  return newEdit;
}

export async function updateEditStatus(id: string, status: 'pending' | 'approved' | 'rejected'): Promise<void> {
  const idx = editsCache.findIndex(e => e.id === id);
  if (idx !== -1) { editsCache[idx].status = status; }
  await saveEditToCloud({
    id, genealogy_id: editsCache[idx]?.genealogyId || '', genealogy_name: editsCache[idx]?.genealogyName || '',
    person_id: editsCache[idx]?.personId || '', person_name: editsCache[idx]?.personName || '',
    field: editsCache[idx]?.field || '', old_value: editsCache[idx]?.oldValue || '',
    new_value: editsCache[idx]?.newValue || '', status, created_at: editsCache[idx]?.createdAt || '',
  });
}

export async function modifyEdit(id: string, updates: Partial<PersonEdit>): Promise<void> {
  const idx = editsCache.findIndex(e => e.id === id);
  if (idx !== -1) { editsCache[idx] = { ...editsCache[idx], ...updates }; }
  await saveEditToCloud({
    id, genealogy_id: editsCache[idx]?.genealogyId || '', genealogy_name: editsCache[idx]?.genealogyName || '',
    person_id: editsCache[idx]?.personId || '', person_name: editsCache[idx]?.personName || '',
    field: editsCache[idx]?.field || '', old_value: editsCache[idx]?.oldValue || '',
    new_value: editsCache[idx]?.newValue || '', status: editsCache[idx]?.status || '',
    created_at: editsCache[idx]?.createdAt || '',
  });
}

export async function deleteEdit(id: string): Promise<void> {
  editsCache = editsCache.filter(e => e.id !== id);
  await deleteEditFromCloud(id);
}

// ===== Person Additions (person_add table) =====
export function getNewPersons(): (NewPersonData & { id: string; status: string; createdAt: string })[] {
  return personAdditionsCache.map(pa => ({
    id: pa.id, genealogyId: pa.genealogyId, name: pa.name, generation: pa.generation,
    birthYear: pa.birthYear, deathYear: pa.deathYear,
    gender: pa.gender, spouse: pa.spouse, parentId: pa.parentId,
    biography: pa.biography, achievements: pa.achievements,
    status: pa.status, createdAt: pa.createdAt,
  }));
}

export async function saveNewPerson(data: Omit<NewPersonData, 'id'> & { id?: string }): Promise<NewPersonData & { id: string; status: string; createdAt: string }> {
  const newAddition: PersonAddition = {
    ...data,
    id: data.id || `add_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  personAdditionsCache.unshift(newAddition);
  await savePersonAddition({
    id: newAddition.id, genealogy_id: data.genealogyId, name: data.name, generation: data.generation,
    birth_year: data.birthYear, death_year: data.deathYear, gender: data.gender,
    spouse: data.spouse, parent_id: data.parentId, biography: data.biography,
    achievements: data.achievements, status: 'pending', created_at: newAddition.createdAt,
  });
  return { ...data, id: newAddition.id, status: 'pending', createdAt: newAddition.createdAt };
}

export async function updateNewPersonStatus(id: string, action: string): Promise<void> {
  const idx = personAdditionsCache.findIndex(p => p.id === id);
  if (idx === -1) return;

  if (action === 'approved') {
    const pa = personAdditionsCache[idx];
    // Approve: copy to people table, update person_add status
    await approvePersonAddition(id, {
      id: pa.id, genealogy_id: pa.genealogyId, name: pa.name, generation: pa.generation,
      birth_year: pa.birthYear, death_year: pa.deathYear, gender: pa.gender,
      spouse: pa.spouse, parent_id: pa.parentId, biography: pa.biography,
      achievements: pa.achievements,
    });
    personAdditionsCache[idx].status = 'approved';
    
    // Update the local people cache
    if (!peopleCache[pa.genealogyId]) peopleCache[pa.genealogyId] = [];
    const newPerson: Person = {
      id: pa.id, name: pa.name, generation: pa.generation,
      birthYear: pa.birthYear || undefined, deathYear: pa.deathYear || undefined,
      gender: pa.gender as 'male' | 'female', spouse: pa.spouse || undefined,
      parentId: pa.parentId || undefined, biography: pa.biography,
      achievements: pa.achievements ? pa.achievements.split('\n').filter(a => a.trim()) : undefined,
      status: 'approved',
    };
    peopleCache[pa.genealogyId].push(newPerson);

    // Also update the genealogiesCache people
    const gIdx = genealogiesCache.findIndex(g => g.id === pa.genealogyId);
    if (gIdx >= 0) {
      genealogiesCache[gIdx].people[pa.id] = newPerson;
    }

    // Update the Supabase cache in data.ts
    setSupabaseCache(genealogiesCache.map(g => ({
      id: g.id, name: g.name, description: g.description || '', origin: g.origin || '',
      foundingYear: g.foundingYear || '',
      ancestor: Object.values(g.people).find(p => !p.parentId) || Object.values(g.people).find(p => p.generation === 1) || null,
      people: g.people,
    })), peopleCache, introductionsCache);
  } else if (action === 'rejected') {
    await rejectPersonAddition(id);
    personAdditionsCache[idx].status = 'rejected';
  }
}

export async function modifyNewPerson(id: string, updates: Partial<NewPersonData>): Promise<void> {
  const idx = personAdditionsCache.findIndex(p => p.id === id);
  if (idx === -1) return;
  personAdditionsCache[idx] = { ...personAdditionsCache[idx], ...updates };
  await savePersonAddition({
    id, genealogy_id: updates.genealogyId || personAdditionsCache[idx].genealogyId,
    name: updates.name || personAdditionsCache[idx].name,
    generation: updates.generation || personAdditionsCache[idx].generation,
    birth_year: updates.birthYear ?? personAdditionsCache[idx].birthYear,
    death_year: updates.deathYear ?? personAdditionsCache[idx].deathYear,
    gender: updates.gender || personAdditionsCache[idx].gender,
    spouse: updates.spouse ?? personAdditionsCache[idx].spouse,
    parent_id: updates.parentId ?? personAdditionsCache[idx].parentId,
    biography: updates.biography ?? personAdditionsCache[idx].biography,
    achievements: updates.achievements ?? personAdditionsCache[idx].achievements,
    status: personAdditionsCache[idx].status,
    created_at: personAdditionsCache[idx].createdAt,
  });
}

export async function deleteNewPerson(id: string): Promise<void> {
  personAdditionsCache = personAdditionsCache.filter(p => p.id !== id);
  await deletePersonFromCloud(id);
}

// ===== Helpers =====
export function getApprovedPersonsByGenealogy(genealogyId: string): (NewPersonData & { id: string; status: string; createdAt: string })[] {
  const people = peopleCache[genealogyId] || [];
  return people.filter(p => (p as any).status === 'approved').map(p => ({
    id: p.id, genealogyId, name: p.name, generation: p.generation,
    birthYear: p.birthYear || '', deathYear: p.deathYear || '',
    gender: p.gender, spouse: p.spouse || '', parentId: p.parentId || '',
    biography: p.biography, achievements: p.achievements?.join('\n') || '',
    status: 'approved', createdAt: (p as any).createdAt || '',
  }));
}

export function getStats() {
  const feedbacks = getFeedbacks();
  const edits = getPersonEdits();
  const newPersons = getNewPersons();
  return {
    feedbacks: { total: feedbacks.length, pending: feedbacks.filter(f => f.status === 'pending').length, resolved: feedbacks.filter(f => f.status === 'resolved').length, rejected: feedbacks.filter(f => f.status === 'rejected').length },
    edits: { total: edits.length, pending: edits.filter(e => e.status === 'pending').length, approved: edits.filter(e => e.status === 'approved').length, rejected: edits.filter(e => e.status === 'rejected').length },
    newPersons: { total: newPersons.length, pending: newPersons.filter(p => p.status === 'pending').length, approved: newPersons.filter(p => p.status === 'approved').length },
  };
}

// ===== Admin Management =====
function getDefaultAdmins(): AdminUser[] {
  return [{ id: 'default', username: 'admin', password: 'password', displayName: '超级管理员', role: 'super', status: 'active', editableGenealogies: [], createdAt: new Date().toISOString() }];
}

export function getAdmins(): AdminUser[] {
  return [...getDefaultAdmins(), ...adminsCache.filter(a => a.id !== 'default')];
}

export async function saveAdmin(admin: Omit<AdminUser, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<AdminUser> {
  const newAdmin: AdminUser = { ...admin, id: admin.id || `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, createdAt: admin.createdAt || new Date().toISOString() };
  const idx = adminsCache.findIndex(a => a.id === newAdmin.id);
  if (idx >= 0) adminsCache[idx] = newAdmin; else adminsCache.push(newAdmin);
  await saveAdminToCloud({
    id: newAdmin.id, username: newAdmin.username, password_hash: newAdmin.password,
    display_name: newAdmin.displayName, bio: newAdmin.bio || null, contact: newAdmin.contact || null,
    role: newAdmin.role, status: newAdmin.status, editable_genealogies: newAdmin.editableGenealogies,
    created_at: newAdmin.createdAt,
  });
  return newAdmin;
}

export async function deleteAdmin(id: string): Promise<void> {
  if (id === 'default') return;
  adminsCache = adminsCache.filter(a => a.id !== id);
  await deleteAdminFromCloud(id);
}

export async function updateAdminStatus(id: string, status: 'active' | 'disabled'): Promise<void> {
  if (id === 'default') return;
  const idx = adminsCache.findIndex(a => a.id === id);
  if (idx >= 0) { adminsCache[idx].status = status; }
  await saveAdminToCloud({
    id, username: adminsCache[idx]?.username || '', password_hash: adminsCache[idx]?.password || '',
    display_name: adminsCache[idx]?.displayName || '', bio: adminsCache[idx]?.bio || null,
    contact: adminsCache[idx]?.contact || null, role: adminsCache[idx]?.role || 'admin',
    status, editable_genealogies: adminsCache[idx]?.editableGenealogies || [],
    created_at: adminsCache[idx]?.createdAt || '',
  });
}
