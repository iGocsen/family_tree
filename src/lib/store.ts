import { Person, Genealogy } from '@/lib/data';
import { supabase, syncFeedbacksToCloud, syncPersonEditsToCloud, syncNewPersonsToCloud, syncCustomGenealogiesToCloud, syncAdminsToCloud, DbFeedback, DbPersonEdit, DbNewPerson, DbCustomGenealogy, DbAdmin } from './supabase';

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
  bio?: string; contact?: string; role: 'super' | 'admin';
  status: 'active' | 'disabled'; editableGenealogies: string[]; createdAt: string;
}

const FEEDBACKS_KEY = 'genealogy_feedbacks';
const EDITS_KEY = 'genealogy_edits';
const NEW_PERSONS_KEY = 'genealogy_new_persons';
const CUSTOM_GENEALOGIES_KEY = 'genealogy_custom';
const AUTH_KEY = 'genealogy_admin_auth';
const ADMINS_KEY = 'genealogy_admins';

// ===== Cloud Sync Flag =====
let cloudSyncEnabled = false;
export function enableCloudSync(enabled: boolean): void { cloudSyncEnabled = enabled; }
export function isCloudSyncEnabled(): boolean { return cloudSyncEnabled; }

// ===== Auth =====
export function login(username: string, password: string): boolean {
  const admins = getAdmins();
  const admin = admins.find(a => a.username === username && a.password === password);
  if (admin && admin.status === 'active') {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, loginTime: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000, userId: admin.id }));
    return true;
  }
  if (username === 'admin' && password === 'password') {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ loggedIn: true, loginTime: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000, userId: 'default' }));
    return true;
  }
  return false;
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

// ===== Admin Management =====
function getDefaultAdmins(): AdminUser[] {
  return [{ id: 'default', username: 'admin', password: 'password', displayName: '超级管理员', role: 'super', status: 'active', editableGenealogies: [], createdAt: new Date().toISOString() }];
}

export function getAdmins(): AdminUser[] {
  try {
    const data = localStorage.getItem(ADMINS_KEY);
    return [...getDefaultAdmins(), ...(data ? JSON.parse(data) : [])];
  } catch { return getDefaultAdmins(); }
}

export function saveAdmin(admin: Omit<AdminUser, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): AdminUser {
  const admins = getAdmins().filter(a => a.id !== 'default');
  const newAdmin: AdminUser = { ...admin, id: admin.id || `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, createdAt: admin.createdAt || new Date().toISOString() };
  const idx = admins.findIndex(a => a.id === newAdmin.id);
  if (idx >= 0) admins[idx] = newAdmin; else admins.push(newAdmin);
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
  if (cloudSyncEnabled) {
    syncAdminsToCloud(admins.map(a => ({ id: a.id, username: a.username, password_hash: a.password, display_name: a.displayName, bio: a.bio || null, contact: a.contact || null, role: a.role, status: a.status, editable_genealogies: a.editableGenealogies, created_at: a.createdAt })));
  }
  return newAdmin;
}

export function deleteAdmin(id: string): void {
  if (id === 'default') return;
  const admins = getAdmins().filter(a => a.id !== id).filter(a => a.id !== 'default');
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
  if (cloudSyncEnabled) syncAdminsToCloud(admins.map(a => ({ id: a.id, username: a.username, password_hash: a.password, display_name: a.displayName, bio: a.bio || null, contact: a.contact || null, role: a.role, status: a.status, editable_genealogies: a.editableGenealogies, created_at: a.createdAt })));
}

export function updateAdminStatus(id: string, status: 'active' | 'disabled'): void {
  if (id === 'default') return;
  const admins = getAdmins().filter(a => a.id !== 'default');
  const idx = admins.findIndex(a => a.id === id);
  if (idx >= 0) { admins[idx].status = status; localStorage.setItem(ADMINS_KEY, JSON.stringify(admins)); }
}

// ===== Custom Genealogies =====
export function getCustomGenealogies(): CustomGenealogy[] {
  try { const data = localStorage.getItem(CUSTOM_GENEALOGIES_KEY); return data ? JSON.parse(data) : []; } catch { return []; }
}

export function saveCustomGenealogy(g: CustomGenealogy): void {
  const list = getCustomGenealogies();
  const idx = list.findIndex(x => x.id === g.id);
  if (idx >= 0) list[idx] = g; else list.push(g);
  localStorage.setItem(CUSTOM_GENEALOGIES_KEY, JSON.stringify(list));
  if (cloudSyncEnabled) syncCustomGenealogiesToCloud(list.map(cg => ({ id: cg.id, name: cg.name, description: cg.description, origin: cg.origin, founding_year: cg.foundingYear, introductions: cg.introductions || [], created_at: new Date().toISOString() })));
}

export function deleteCustomGenealogy(id: string): void {
  const list = getCustomGenealogies().filter(g => g.id !== id);
  localStorage.setItem(CUSTOM_GENEALOGIES_KEY, JSON.stringify(list));
  if (cloudSyncEnabled) syncCustomGenealogiesToCloud(list.map(cg => ({ id: cg.id, name: cg.name, description: cg.description, origin: cg.origin, founding_year: cg.foundingYear, introductions: cg.introductions || [], created_at: new Date().toISOString() })));
}

export function updateCustomGenealogy(id: string, updates: Partial<CustomGenealogy>): void {
  const list = getCustomGenealogies();
  const idx = list.findIndex(g => g.id === id);
  if (idx >= 0) { list[idx] = { ...list[idx], ...updates }; localStorage.setItem(CUSTOM_GENEALOGIES_KEY, JSON.stringify(list)); }
}

export function updateGenealogyIntroductions(id: string, introductions: string[]): void {
  const list = getCustomGenealogies();
  const idx = list.findIndex(g => g.id === id);
  if (idx >= 0) { list[idx].introductions = introductions; localStorage.setItem(CUSTOM_GENEALOGIES_KEY, JSON.stringify(list)); }
  const intros = getIntroductions();
  intros[id] = introductions;
  localStorage.setItem('genealogy_introductions', JSON.stringify(intros));
}

export function getIntroductions(): Record<string, string[]> {
  try { const data = localStorage.getItem('genealogy_introductions'); return data ? JSON.parse(data) : {}; } catch { return {}; }
}

export function getGenealogyIntroductions(id: string): string[] {
  return getIntroductions()[id] || [];
}

// ===== Feedback Store =====
export function saveFeedback(feedback: Omit<FeedbackRecord, 'id' | 'status' | 'createdAt'>): FeedbackRecord {
  const feedbacks = getFeedbacks();
  const newFeedback: FeedbackRecord = { ...feedback, id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: 'pending', createdAt: new Date().toISOString() };
  feedbacks.unshift(newFeedback);
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
  if (cloudSyncEnabled) syncFeedbacksToCloud(feedbacks.map(f => ({ id: f.id, genealogy_id: f.genealogyId, genealogy_name: f.genealogyName, person_id: f.personId, person_name: f.personName, person_generation: f.personGeneration, person_biography: f.personBiography, feedback_type: f.feedbackType, description: f.description, contact: f.contact, status: f.status, admin_note: f.adminNote || null, created_at: f.createdAt, resolved_at: f.resolvedAt || null })));
  return newFeedback;
}

export function getFeedbacks(): FeedbackRecord[] {
  try { const data = localStorage.getItem(FEEDBACKS_KEY); return data ? JSON.parse(data) : []; } catch { return []; }
}

export function updateFeedbackStatus(id: string, status: 'pending' | 'resolved' | 'rejected', adminNote?: string): void {
  const feedbacks = getFeedbacks();
  const idx = feedbacks.findIndex(f => f.id === id);
  if (idx !== -1) {
    feedbacks[idx].status = status;
    feedbacks[idx].adminNote = adminNote;
    if (status !== 'pending') feedbacks[idx].resolvedAt = new Date().toISOString();
    localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
  }
}

export function deleteFeedback(id: string): void {
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(getFeedbacks().filter(f => f.id !== id)));
}

// ===== Person Edit Store =====
export function savePersonEdit(edit: Omit<PersonEdit, 'id' | 'status' | 'createdAt'>): PersonEdit {
  const edits = getPersonEdits();
  const newEdit: PersonEdit = { ...edit, id: `edit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: 'pending', createdAt: new Date().toISOString() };
  edits.unshift(newEdit);
  localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
  if (cloudSyncEnabled) syncPersonEditsToCloud(edits.map(e => ({ id: e.id, genealogy_id: e.genealogyId, genealogy_name: e.genealogyName, person_id: e.personId, person_name: e.personName, field: e.field, old_value: e.oldValue, new_value: e.newValue, status: e.status, created_at: e.createdAt })));
  return newEdit;
}

export function getPersonEdits(): PersonEdit[] {
  try { const data = localStorage.getItem(EDITS_KEY); return data ? JSON.parse(data) : []; } catch { return []; }
}

export function updateEditStatus(id: string, status: 'pending' | 'approved' | 'rejected'): void {
  const edits = getPersonEdits();
  const idx = edits.findIndex(e => e.id === id);
  if (idx !== -1) { edits[idx].status = status; localStorage.setItem(EDITS_KEY, JSON.stringify(edits)); }
}

export function modifyEdit(id: string, updates: Partial<PersonEdit>): void {
  const edits = getPersonEdits();
  const idx = edits.findIndex(e => e.id === id);
  if (idx !== -1) { edits[idx] = { ...edits[idx], ...updates }; localStorage.setItem(EDITS_KEY, JSON.stringify(edits)); }
}

export function deleteEdit(id: string): void {
  localStorage.setItem(EDITS_KEY, JSON.stringify(getPersonEdits().filter(e => e.id !== id)));
}

// ===== New Person Store =====
export function saveNewPerson(data: Omit<NewPersonData, 'id'> & { id?: string }): NewPersonData & { id: string; status: string; createdAt: string } {
  const persons = getNewPersons();
  const newPerson = { ...data, id: data.id || `new_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: 'pending', createdAt: new Date().toISOString() };
  persons.unshift(newPerson);
  localStorage.setItem(NEW_PERSONS_KEY, JSON.stringify(persons));
  if (cloudSyncEnabled) syncNewPersonsToCloud(persons.map(p => ({ id: p.id, genealogy_id: p.genealogyId, name: p.name, generation: p.generation, birth_year: p.birthYear, death_year: p.deathYear, gender: p.gender, spouse: p.spouse, parent_id: p.parentId, biography: p.biography, achievements: p.achievements, status: p.status, created_at: p.createdAt, approved_at: (p as any).approvedAt || null })));
  return newPerson;
}

export function getNewPersons(): (NewPersonData & { id: string; status: string; createdAt: string })[] {
  try { const data = localStorage.getItem(NEW_PERSONS_KEY); return data ? JSON.parse(data) : []; } catch { return []; }
}

export function updateNewPersonStatus(id: string, status: string): void {
  const persons = getNewPersons();
  const idx = persons.findIndex(p => p.id === id);
  if (idx !== -1) {
    persons[idx].status = status;
    if (status === 'approved') (persons[idx] as any).approvedAt = new Date().toISOString();
    localStorage.setItem(NEW_PERSONS_KEY, JSON.stringify(persons));
  }
}

export function modifyNewPerson(id: string, updates: Partial<NewPersonData>): void {
  const persons = getNewPersons();
  const idx = persons.findIndex(p => p.id === id);
  if (idx !== -1) { persons[idx] = { ...persons[idx], ...updates }; localStorage.setItem(NEW_PERSONS_KEY, JSON.stringify(persons)); }
}

export function deleteNewPerson(id: string): void {
  localStorage.setItem(NEW_PERSONS_KEY, JSON.stringify(getNewPersons().filter(p => p.id !== id)));
}

// ===== Helpers =====
export function getApprovedPersonsByGenealogy(genealogyId: string): (NewPersonData & { id: string; status: string; createdAt: string })[] {
  return getNewPersons().filter(p => p.genealogyId === genealogyId && p.status === 'approved');
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
