export interface Person {
  id: string; name: string; generation: number; birthYear?: string; deathYear?: string;
  gender: 'male' | 'female'; spouse?: string; children?: string[]; parentId?: string;
  biography: string; achievements?: string[]; notes?: string;
}

export interface Genealogy {
  id: string; name: string; description: string; origin: string; foundingYear: string;
  ancestor: Person; people: Record<string, Person>;
}

// ===== Base Genealogies (metadata only, people come from Supabase) =====
export const genealogies: Genealogy[] = [
  { id: 'li', name: '李氏族谱', description: '李氏一族自清康熙年间由福建漳州迁居广东潮州，以耕读传家，历经九代，枝繁叶茂。族中人才辈出，涵盖仕宦、教育、商业、医学等诸多领域。', origin: '福建漳州 → 广东潮州', foundingYear: '1680', ancestor: { id: 'li-1', name: '李明德', generation: 1, birthYear: '1680', deathYear: '1752', gender: 'male', biography: '李氏一世祖，字光远，号德庵。清康熙年间自福建漳州迁居广东潮州，以耕读传家，开创李氏一脉。' }, people: {} },
  { id: 'zhang', name: '张氏族谱', description: '张氏一族自清康熙末年自江西迁居湖南长沙，以耕读为业。九代传承，族中涌现众多杰出人物，涵盖外交、科学、文学、艺术、医学等领域。', origin: '江西 → 湖南长沙', foundingYear: '1690', ancestor: { id: 'zhang-1', name: '张文远', generation: 1, birthYear: '1690', deathYear: '1760', gender: 'male', biography: '张氏一世祖，字致远。清康熙末年自江西迁居湖南长沙，以耕读为业，开创张氏基业。' }, people: {} },
  { id: 'chen', name: '陈氏族谱', description: '陈氏一族自清康熙年间自河南迁居四川成都，以农桑为本。九代传承，族中人才辈出，涵盖农业、茶叶、林业、政治、金融等诸多领域。', origin: '河南 → 四川成都', foundingYear: '1700', ancestor: { id: 'chen-1', name: '陈德安', generation: 1, birthYear: '1700', deathYear: '1770', gender: 'male', biography: '陈氏一世祖，字安之。清康熙年间自河南迁居四川成都，以农桑为本，开创陈氏基业。' }, people: {} },
];

// ===== People cache (populated by store.ts from Supabase) =====
let _peopleCache: Record<string, Record<string, Person>> = {};

export function setPeopleCache(cache: Record<string, Record<string, Person>>): void {
  _peopleCache = cache;
}

function getPeopleForGenealogy(genealogyId: string): Record<string, Person> {
  return _peopleCache[genealogyId] || {};
}

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
  const base = genealogies.find(g => g.id === id);
  if (!base) return undefined;
  
  const people = getPeopleForGenealogy(id);
  const ancestor = Object.values(people).find(p => !p.parentId) || Object.values(people).find(p => p.generation === 1) || base.ancestor;
  
  return {
    ...base,
    people,
    ancestor: ancestor || base.ancestor,
  };
}
