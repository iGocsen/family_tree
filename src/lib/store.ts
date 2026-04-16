import { Person, Genealogy } from '@/lib/data';

export interface FeedbackRecord {
  id: string;
  genealogyId: string;
  genealogyName: string;
  personId: string;
  personName: string;
  personGeneration: number;
  personBiography: string;
  feedbackType: 'info-error' | 'missing-info' | 'duplicate' | 'other';
  description: string;
  contact: string;
  status: 'pending' | 'resolved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  adminNote?: string;
}

export interface PersonEdit {
  id: string;
  genealogyId: string;
  genealogyName: string;
  personId: string;
  personName: string;
  field: string;
  oldValue: string;
  newValue: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface NewPersonData {
  genealogyId: string;
  name: string;
  generation: number;
  birthYear: string;
  deathYear: string;
  gender: 'male' | 'female';
  spouse: string;
  parentId: string;
  biography: string;
  achievements: string;
}

export interface CustomGenealogy {
  id: string;
  name: string;
  description: string;
  origin: string;
  foundingYear: string;
  people: Record<string, Person>;
  introductions?: string[]; // Extended introduction pages
}

export interface AdminUser {
  id: string;
  username: string;
  password: string;
  displayName: string;
  bio?: string;
  contact?: string;
  role: 'super' | 'admin';
  status: 'active' | 'disabled';
  editableGenealogies: string[]; // empty = all
  createdAt: string;
}

const FEEDBACKS_KEY = 'genealogy_feedbacks';
const EDITS_KEY = 'genealogy_edits';
const NEW_PERSONS_KEY = 'genealogy_new_persons';
const CUSTOM_GENEALOGIES_KEY = 'genealogy_custom';
const AUTH_KEY = 'genealogy_admin_auth';
const ADMINS_KEY = 'genealogy_admins';

// ===== Auth =====
export function login(username: string, password: string): boolean {
  // Check custom admins first
  const admins = getAdmins();
  const admin = admins.find(a => a.username === username && a.password === password);
  if (admin && admin.status === 'active') {
    const auth = { loggedIn: true, loginTime: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000, userId: admin.id };
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    return true;
  }
  // Fallback to default admin
  if (username === 'admin' && password === 'password') {
    const auth = { loggedIn: true, loginTime: Date.now(), expiresAt: Date.now() + 24 * 60 * 60 * 1000, userId: 'default' };
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
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
  try {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return null;
    return JSON.parse(data).userId || null;
  } catch { return null; }
}

// ===== Admin Management =====
function getDefaultAdmins(): AdminUser[] {
  return [{
    id: 'default', username: 'admin', password: 'password', displayName: '超级管理员',
    role: 'super', status: 'active', editableGenealogies: [], createdAt: new Date().toISOString(),
  }];
}

export function getAdmins(): AdminUser[] {
  try {
    const data = localStorage.getItem(ADMINS_KEY);
    const custom: AdminUser[] = data ? JSON.parse(data) : [];
    return [...getDefaultAdmins(), ...custom];
  } catch { return getDefaultAdmins(); }
}

export function saveAdmin(admin: Omit<AdminUser, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): AdminUser {
  const admins = getAdmins().filter(a => a.id !== 'default');
  const newAdmin: AdminUser = {
    ...admin,
    id: admin.id || `admin_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: admin.createdAt || new Date().toISOString(),
  };
  const idx = admins.findIndex(a => a.id === newAdmin.id);
  if (idx >= 0) { admins[idx] = newAdmin; } else { admins.push(newAdmin); }
  localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
  return newAdmin;
}

export function deleteAdmin(id: string): void {
  if (id === 'default') return;
  const admins = getAdmins().filter(a => a.id !== id);
  const custom = admins.filter(a => a.id !== 'default');
  localStorage.setItem(ADMINS_KEY, JSON.stringify(custom));
}

export function updateAdminStatus(id: string, status: 'active' | 'disabled'): void {
  if (id === 'default') return;
  const admins = getAdmins().filter(a => a.id !== 'default');
  const idx = admins.findIndex(a => a.id === id);
  if (idx >= 0) { admins[idx].status = status; localStorage.setItem(ADMINS_KEY, JSON.stringify(admins)); }
}

// ===== Custom Genealogies =====
export function getCustomGenealogies(): CustomGenealogy[] {
  try {
    const data = localStorage.getItem(CUSTOM_GENEALOGIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

export function saveCustomGenealogy(g: CustomGenealogy): void {
  const list = getCustomGenealogies();
  const idx = list.findIndex(x => x.id === g.id);
  if (idx >= 0) { list[idx] = g; } else { list.push(g); }
  localStorage.setItem(CUSTOM_GENEALOGIES_KEY, JSON.stringify(list));
}

export function deleteCustomGenealogy(id: string): void {
  const list = getCustomGenealogies().filter(g => g.id !== id);
  localStorage.setItem(CUSTOM_GENEALOGIES_KEY, JSON.stringify(list));
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
  // Also update base genealogies via a separate key
  const intros = getIntroductions();
  intros[id] = introductions;
  localStorage.setItem('genealogy_introductions', JSON.stringify(intros));
}

export function getIntroductions(): Record<string, string[]> {
  try {
    const data = localStorage.getItem('genealogy_introductions');
    return data ? JSON.parse(data) : {};
  } catch { return {}; }
}

export function getGenealogyIntroductions(id: string): string[] {
  const intros = getIntroductions();
  return intros[id] || [];
}

// ===== Feedback Store =====
export function saveFeedback(feedback: Omit<FeedbackRecord, 'id' | 'status' | 'createdAt'>): FeedbackRecord {
  const feedbacks = getFeedbacks();
  const newFeedback: FeedbackRecord = { ...feedback, id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, status: 'pending', createdAt: new Date().toISOString() };
  feedbacks.unshift(newFeedback);
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
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
