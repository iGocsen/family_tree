import { Person, Genealogy, genealogies } from '@/lib/data';

export interface FeedbackRecord {
  id: string;
  genealogyId: string;
  genealogyName: string;
  personId: string;
  personName: string;
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

export interface ApprovedPerson extends NewPersonData {
  id: string;
  status: 'approved';
  createdAt: string;
  approvedAt: string;
}

const FEEDBACKS_KEY = 'genealogy_feedbacks';
const EDITS_KEY = 'genealogy_edits';
const NEW_PERSONS_KEY = 'genealogy_new_persons';
const AUTH_KEY = 'genealogy_admin_auth';

// ===== Auth =====
export function login(username: string, password: string): boolean {
  if (username === 'admin' && password === 'password') {
    const auth = {
      loggedIn: true,
      loginTime: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    return true;
  }
  return false;
}

export function logout(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return false;
    const auth = JSON.parse(data);
    if (!auth.loggedIn) return false;
    if (Date.now() > auth.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// ===== Feedback Store =====
export function saveFeedback(feedback: Omit<FeedbackRecord, 'id' | 'status' | 'createdAt'>): FeedbackRecord {
  const feedbacks = getFeedbacks();
  const newFeedback: FeedbackRecord = {
    ...feedback,
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  feedbacks.unshift(newFeedback);
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
  return newFeedback;
}

export function getFeedbacks(): FeedbackRecord[] {
  try {
    const data = localStorage.getItem(FEEDBACKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function updateFeedbackStatus(id: string, status: 'pending' | 'resolved' | 'rejected', adminNote?: string): void {
  const feedbacks = getFeedbacks();
  const idx = feedbacks.findIndex(f => f.id === id);
  if (idx !== -1) {
    feedbacks[idx].status = status;
    feedbacks[idx].adminNote = adminNote;
    if (status !== 'pending') {
      feedbacks[idx].resolvedAt = new Date().toISOString();
    }
    localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
  }
}

export function deleteFeedback(id: string): void {
  const feedbacks = getFeedbacks().filter(f => f.id !== id);
  localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
}

// ===== Person Edit Store =====
export function savePersonEdit(edit: Omit<PersonEdit, 'id' | 'status' | 'createdAt'>): PersonEdit {
  const edits = getPersonEdits();
  const newEdit: PersonEdit = {
    ...edit,
    id: `edit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  edits.unshift(newEdit);
  localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
  return newEdit;
}

export function getPersonEdits(): PersonEdit[] {
  try {
    const data = localStorage.getItem(EDITS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function updateEditStatus(id: string, status: 'pending' | 'approved' | 'rejected'): void {
  const edits = getPersonEdits();
  const idx = edits.findIndex(e => e.id === id);
  if (idx !== -1) {
    edits[idx].status = status;
    localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
  }
}

export function deleteEdit(id: string): void {
  const edits = getPersonEdits().filter(e => e.id !== id);
  localStorage.setItem(EDITS_KEY, JSON.stringify(edits));
}

// ===== New Person Store =====
export function saveNewPerson(data: Omit<NewPersonData, 'id'> & { id?: string }): NewPersonData & { id: string; status: string; createdAt: string } {
  const persons = getNewPersons();
  const newPerson = {
    ...data,
    id: data.id || `new_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  persons.unshift(newPerson);
  localStorage.setItem(NEW_PERSONS_KEY, JSON.stringify(persons));
  return newPerson;
}

export function getNewPersons(): (NewPersonData & { id: string; status: string; createdAt: string })[] {
  try {
    const data = localStorage.getItem(NEW_PERSONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function updateNewPersonStatus(id: string, status: string): void {
  const persons = getNewPersons();
  const idx = persons.findIndex(p => p.id === id);
  if (idx !== -1) {
    persons[idx].status = status;
    if (status === 'approved') {
      (persons[idx] as any).approvedAt = new Date().toISOString();
    }
    localStorage.setItem(NEW_PERSONS_KEY, JSON.stringify(persons));
  }
}

export function modifyNewPerson(id: string, updates: Partial<NewPersonData>): void {
  const persons = getNewPersons();
  const idx = persons.findIndex(p => p.id === id);
  if (idx !== -1) {
    persons[idx] = { ...persons[idx], ...updates };
    localStorage.setItem(NEW_PERSONS_KEY, JSON.stringify(persons));
  }
}

export function deleteNewPerson(id: string): void {
  const persons = getNewPersons().filter(p => p.id !== id);
  localStorage.setItem(NEW_PERSONS_KEY, JSON.stringify(persons));
}

// ===== Get approved persons merged with genealogy =====
export function getGenealogyWithApprovedPersons(genealogyId: string): Genealogy | undefined {
  const base = genealogies.find(g => g.id === genealogyId);
  if (!base) return undefined;

  const approvedPersons = getNewPersons().filter(p => p.genealogyId === genealogyId && p.status === 'approved');
  if (approvedPersons.length === 0) return base;

  const mergedPeople = { ...base.people };
  for (const ap of approvedPersons) {
    const person: Person = {
      id: ap.id,
      name: ap.name,
      generation: ap.generation,
      birthYear: ap.birthYear || undefined,
      deathYear: ap.deathYear || undefined,
      gender: ap.gender,
      spouse: ap.spouse || undefined,
      parentId: ap.parentId || undefined,
      biography: ap.biography,
      achievements: ap.achievements ? ap.achievements.split('\n').filter(a => a.trim()) : undefined,
    };
    mergedPeople[ap.id] = person;
  }

  return {
    ...base,
    people: mergedPeople,
  };
}

// ===== Stats =====
export function getStats() {
  const feedbacks = getFeedbacks();
  const edits = getPersonEdits();
  const newPersons = getNewPersons();

  return {
    feedbacks: {
      total: feedbacks.length,
      pending: feedbacks.filter(f => f.status === 'pending').length,
      resolved: feedbacks.filter(f => f.status === 'resolved').length,
      rejected: feedbacks.filter(f => f.status === 'rejected').length,
    },
    edits: {
      total: edits.length,
      pending: edits.filter(e => e.status === 'pending').length,
      approved: edits.filter(e => e.status === 'approved').length,
      rejected: edits.filter(e => e.status === 'rejected').length,
    },
    newPersons: {
      total: newPersons.length,
      pending: newPersons.filter(p => p.status === 'pending').length,
      approved: newPersons.filter(p => p.status === 'approved').length,
    },
  };
}
