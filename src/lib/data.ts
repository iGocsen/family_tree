export interface Person {
  id: string; name: string; generation: number; birthYear?: string; deathYear?: string;
  gender: 'male' | 'female'; spouse?: string; children?: string[]; parentId?: string;
  biography: string; achievements?: string[]; notes?: string;
}

export interface Genealogy {
  id: string; name: string; description: string; origin: string; foundingYear: string;
  ancestor: Person | null; people: Record<string, Person>;
}

// ===== Supabase-driven data cache =====
// All data comes from Supabase, populated by store.ts via setSupabaseCache()

let _genealogiesCache: Genealogy[] = [];
let _peopleCache: Record<string, Record<string, Person>> = {};
let _introductionsCache: Record<string, string[]> = {};

export function setSupabaseCache(
  genealogies: Genealogy[],
  peopleByGenealogy: Record<string, Record<string, Person>>,
  introductions: Record<string, string[]>
): void {
  _genealogiesCache = genealogies;
  _peopleCache = peopleByGenealogy;
  _introductionsCache = introductions;
}

export function getSupabaseGenealogies(): Genealogy[] {
  return _genealogiesCache;
}

function getPeopleForGenealogy(genealogyId: string): Record<string, Person> {
  return _peopleCache[genealogyId] || {};
}

export function getGenealogyIntroductionsFromCache(id: string): string[] {
  return _introductionsCache[id] || [];
}

// ===== Helper functions that work with Supabase cache =====

export function searchPerson(genealogyId: string, query: string): Person[] {
  const people = getPeopleForGenealogy(genealogyId);
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return Object.values(people).filter(p => p.name.toLowerCase().includes(q));
}

export function getPerson(genealogyId: string, personId: string): Person | undefined {
  const people = getPeopleForGenealogy(genealogyId);
  return people[personId];
}

export function getRootPerson(genealogyId: string): Person | undefined {
  const people = getPeopleForGenealogy(genealogyId);
  return Object.values(people).find(p => !p.parentId) || Object.values(people).find(p => p.generation === 1);
}

export function getChildren(genealogyId: string, parentId: string): Person[] {
  const people = getPeopleForGenealogy(genealogyId);
  return Object.values(people).filter(p => p.parentId === parentId);
}

export function getAncestorChain(genealogyId: string, personId: string): Person[] {
  const people = getPeopleForGenealogy(genealogyId);
  const chain: Person[] = [];
  let current = people[personId];
  while (current) {
    chain.unshift(current);
    if (!current.parentId) break;
    current = people[current.parentId];
  }
  return chain;
}

export function getDescendants(genealogyId: string, personId: string, maxDepth?: number, currentDepth: number = 0): Person[] {
  const children = getChildren(genealogyId, personId);
  if (maxDepth !== undefined && currentDepth >= maxDepth) return [];
  const result: Person[] = [];
  for (const child of children) {
    result.push(child);
    result.push(...getDescendants(genealogyId, child.id, maxDepth, currentDepth + 1));
  }
  return result;
}

export function getPersonsByGeneration(genealogyId: string, generation: number): Person[] {
  const people = getPeopleForGenealogy(genealogyId);
  return Object.values(people).filter(p => p.generation === generation);
}

export function getTreeRoots(genealogyId: string, selectedPerson: Person, minGen: number, maxGen: number): Person[] {
  const people = getPeopleForGenealogy(genealogyId);
  if (Object.keys(people).length === 0) return [];

  const chain = getAncestorChain(genealogyId, selectedPerson.id);
  const ancestorAtMinGen = chain.find(p => p.generation === minGen);
  if (!ancestorAtMinGen) return [];

  if (minGen === 1) return getPersonsByGeneration(genealogyId, 1);

  const ancestorParentId = ancestorAtMinGen.parentId;
  if (ancestorParentId) {
    return getPersonsByGeneration(genealogyId, minGen).filter(p => p.parentId === ancestorParentId);
  }
  return [ancestorAtMinGen];
}

export function getMaxGeneration(genealogyId: string): number {
  const people = getPeopleForGenealogy(genealogyId);
  if (Object.keys(people).length === 0) return 0;
  return Math.max(...Object.values(people).map(p => p.generation));
}

export function getGenealogy(id: string): Genealogy | undefined {
  return _genealogiesCache.find(g => g.id === id);
}
