import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGenealogy, getRootPerson, Person, getAncestorChain, getPersonsByGeneration, getTreeRoots } from '@/lib/data';
import { refreshAllData, getPeopleByGenealogy } from '@/lib/store';
import { Search, ChevronLeft, ChevronRight, User, ArrowLeft, TreePine, AlertCircle, Settings } from 'lucide-react';
import TreeView from '@/components/TreeView';
import PersonDetail from '@/components/PersonDetail';
import FeedbackDialog from '@/components/FeedbackDialog';

export default function GenealogyPage() {
  const { id } = useParams<{ id: string }>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [people, setPeople] = useState<Record<string, Person>>({});
  const [genealogyInfo, setGenealogyInfo] = useState<ReturnType<typeof getGenealogy>>(null);

  useEffect(() => {
    refreshAllData().then(() => {
      const genealogy = getGenealogy(id || '');
      setGenealogyInfo(genealogy);
      if (genealogy) {
        setPeople(genealogy.people);
      }
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, [id]);

  // Helper functions that use local people state
  const getLocalChildren = useCallback((parentId: string): Person[] => {
    return Object.values(people).filter(p => p.parentId === parentId);
  }, [people]);

  const getLocalRootPerson = useCallback((): Person | undefined => {
    const allPeople = Object.values(people);
    return allPeople.find(p => !p.parentId) || allPeople.find(p => p.generation === 1);
  }, [people]);

  const getLocalPersonsByGeneration = useCallback((gen: number): Person[] => {
    return Object.values(people).filter(p => p.generation === gen);
  }, [people]);

  const getLocalTreeRoots = useCallback((selectedPerson: Person, minGen: number, maxGen: number): Person[] => {
    if (Object.keys(people).length === 0) return [];
    const chain = getAncestorChainForPerson(selectedPerson);
    const ancestorAtMinGen = chain.find(p => p.generation === minGen);
    
    if (ancestorAtMinGen) {
      // Found ancestor at minGen - return this ancestor and their siblings
      if (minGen === 1) return getLocalPersonsByGeneration(1);
      const ancestorParentId = ancestorAtMinGen.parentId;
      if (ancestorParentId) {
        return getLocalPersonsByGeneration(minGen).filter(p => p.parentId === ancestorParentId);
      }
      return [ancestorAtMinGen];
    }

    // No ancestor at minGen - the chain doesn't go back that far
    // Use the oldest ancestor in the chain as the root
    const oldestAncestor = chain[0];
    if (oldestAncestor) {
      // If the oldest ancestor has a parent, try to find their siblings
      if (oldestAncestor.parentId) {
        const siblings = getLocalPersonsByGeneration(oldestAncestor.generation).filter(p => p.parentId === oldestAncestor.parentId);
        if (siblings.length > 0) return siblings;
      }
      return [oldestAncestor];
    }

    return [];
  }, [people, getLocalPersonsByGeneration]);

  const getAncestorChainForPerson = useCallback((person: Person): Person[] => {
    const chain: Person[] = [];
    let current: Person | undefined = person;
    while (current) {
      chain.unshift(current);
      if (!current.parentId) break;
      current = people[current.parentId];
    }
    return chain;
  }, [people]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [expandedGenerations, setExpandedGenerations] = useState<Set<number>>(new Set([1]));
  const [showFeedback, setShowFeedback] = useState(false);
  const [branchPath, setBranchPath] = useState<Person[]>([]);

  // Default to ancestor on mount
  useEffect(() => {
    if (Object.keys(people).length > 0 && !selectedPerson) {
      const root = getLocalRootPerson();
      if (root) {
        setSelectedPerson(root);
        setBranchPath([root]);
      }
    }
  }, [people, selectedPerson, getLocalRootPerson]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      const results = Object.values(people).filter(p => p.name.toLowerCase().includes(q));
      setSearchResults(results);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [people]);

  const handleSelectPerson = useCallback((person: Person) => {
    setSelectedPerson(person);
    setBranchPath([person]);
    setExpandedGenerations(prev => {
      const next = new Set(prev);
      const minGen = Math.max(1, person.generation - 3);
      for (let g = minGen; g <= person.generation; g++) next.add(g);
      return next;
    });
    setSearchResults([]);
    setIsSearching(false);
    setSearchQuery('');
  }, []);

  const handleBranchClick = useCallback((person: Person) => {
    setSelectedPerson(person);
  }, []);

  const handleNavigateBranch = useCallback((person: Person) => {
    const newPath = [...branchPath, person];
    setBranchPath(newPath);
    setSelectedPerson(person);
  }, [branchPath]);

  const handleBackBranch = useCallback(() => {
    if (branchPath.length > 1) {
      const newPath = branchPath.slice(0, -1);
      setBranchPath(newPath);
      const prevPerson = newPath[newPath.length - 1];
      setSelectedPerson(prevPerson);
    }
  }, [branchPath]);

  const currentBranchChildren = useMemo(() => {
    if (!selectedPerson) return [];
    return getLocalChildren(selectedPerson.id);
  }, [selectedPerson, getLocalChildren]);

  const visibleRange = useMemo(() => {
    if (!selectedPerson) return { minGen: 1, maxGen: 7 };
    // Dynamically compute max generation from all people
    const allGens = Object.values(people).map(p => p.generation);
    const actualMaxGen = allGens.length > 0 ? Math.max(...allGens) : selectedPerson.generation;
    return {
      minGen: Math.max(1, selectedPerson.generation - 3),
      maxGen: Math.min(actualMaxGen, selectedPerson.generation + 2),
    };
  }, [selectedPerson, people]);

  const treeRoots = useMemo(() => {
    if (!selectedPerson) {
      const root = getLocalRootPerson();
      return root ? [root] : [];
    }
    return getLocalTreeRoots(selectedPerson, visibleRange.minGen, visibleRange.maxGen);
  }, [selectedPerson, visibleRange, getLocalRootPerson, getLocalTreeRoots]);

  useEffect(() => {
    setExpandedGenerations(prev => {
      const next = new Set(prev);
      for (let g = visibleRange.minGen; g <= visibleRange.maxGen; g++) next.add(g);
      return next;
    });
  }, [visibleRange]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!genealogyInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <TreePine className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-3">未找到族谱</h2>
          <p className="text-muted-foreground mb-8">
            数据库中暂无此族谱数据。请先登录管理后台，点击"迁移数据到 Supabase"并勾选"是否同步默认数据"来导入初始数据。
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />返回首页
            </Link>
            <Link to="/admin" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Settings className="w-4 h-4" />管理后台
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link to="/" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
                <ArrowLeft className="w-4 h-4" />返回
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold text-foreground">{genealogyInfo.name}</h1>
                <p className="text-xs text-muted-foreground">始祖：{genealogyInfo.ancestor?.name || '—'} · {genealogyInfo.foundingYear}年</p>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索人物姓名..."
                className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {isSearching && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                  {searchResults.map(person => (
                    <button
                      key={person.id}
                      onClick={() => handleSelectPerson(person)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-border last:border-b-0"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="text-sm font-medium text-foreground">{person.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">第{person.generation}世</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {isSearching && searchResults.length === 0 && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-xl p-4 text-center z-50">
                  <p className="text-sm text-muted-foreground">未找到匹配的人物</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Tree View */}
          <div className="lg:col-span-2">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">世系树图</h2>
                </div>
                <div className="flex items-center gap-3">
                  {selectedPerson && (
                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                      显示：第{visibleRange.minGen}世 — 第{visibleRange.maxGen}世
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    共 {Object.keys(people).length} 人
                  </span>
                </div>
              </div>

              {/* Generation indicator */}
              {selectedPerson && (() => {
                // Dynamically compute actual min/max generations from people data
                const allGens = Object.values(people).map(p => p.generation);
                const actualMinGen = allGens.length > 0 ? Math.min(...allGens) : 1;
                const actualMaxGen = allGens.length > 0 ? Math.max(...allGens) : 15;
                const displayMinGen = Math.max(actualMinGen, visibleRange.minGen - 2);
                const displayMaxGen = Math.min(actualMaxGen, visibleRange.maxGen + 2);
                const generations = Array.from({ length: displayMaxGen - displayMinGen + 1 }, (_, i) => displayMinGen + i);

                return (
                  <div className="px-6 py-2 bg-secondary/30 border-b border-border flex items-center gap-2 overflow-x-auto">
                    {generations.map(gen => {
                      const isActive = gen === selectedPerson.generation;
                      const isInRange = gen >= visibleRange.minGen && gen <= visibleRange.maxGen;
                      return (
                        <button
                          key={gen}
                          onClick={() => {
                            const chain = getAncestorChainForPerson(selectedPerson);
                            const personAtGen = chain.find(p => p.generation === gen);
                            if (personAtGen) handleSelectPerson(personAtGen);
                          }}
                          className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                            isActive ? 'bg-primary text-primary-foreground shadow-md cursor-pointer'
                              : isInRange ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer'
                              : 'text-muted-foreground/40 cursor-default'
                          }`}
                        >
                          {gen}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="p-6 overflow-x-auto">
                {treeRoots.length > 0 ? (
                  <div className="flex justify-center gap-6">
                    {treeRoots.map(root => (
                      <TreeView
                        key={root.id}
                        genealogyId={genealogyInfo.id}
                        people={people}
                        person={root}
                        expandedGenerations={expandedGenerations}
                        setExpandedGenerations={setExpandedGenerations}
                        onSelectPerson={handleSelectPerson}
                        onBranchClick={handleBranchClick}
                        selectedPersonId={selectedPerson?.id || null}
                        visibleRange={visibleRange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <p>暂无世系数据</p>
                  </div>
                )}
              </div>
            </div>

            {/* Branch Navigation */}
            {selectedPerson && (
              <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden animate-scale-in">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">分支详情</h3>
                    {branchPath.length > 1 && (
                      <div className="flex items-center gap-1 ml-4">
                        {branchPath.map((p, i) => (
                          <span key={p.id} className="flex items-center gap-1 text-sm">
                            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                            <button
                              onClick={() => {
                                const newPath = branchPath.slice(0, i + 1);
                                setBranchPath(newPath);
                                setSelectedPerson(p);
                              }}
                              className={`hover:text-primary transition-colors ${i === branchPath.length - 1 ? 'text-primary font-medium' : 'text-muted-foreground'}`}
                            >
                              {p.name}
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {branchPath.length > 1 && (
                    <button onClick={handleBackBranch} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronLeft className="w-4 h-4" />返回上级
                    </button>
                  )}
                </div>
                {currentBranchChildren.length > 0 ? (
                  <div className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">{selectedPerson.name} 的子嗣（共 {currentBranchChildren.length} 人）</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {currentBranchChildren.map(child => (
                        <button
                          key={child.id}
                          onClick={() => handleNavigateBranch(child)}
                          className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left group"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${child.gender === 'male' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
                            {child.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{child.name}</div>
                            <div className="text-xs text-muted-foreground">第{child.generation}世{child.birthYear && ` · ${child.birthYear}-${child.deathYear || '？'}`}</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">该分支暂无更多子嗣记录</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Person Info */}
          <div className="lg:col-span-1">
            {selectedPerson ? (
              <PersonDetail
                person={selectedPerson}
                genealogyId={genealogyInfo.id}
                onFeedback={() => setShowFeedback(true)}
              />
            ) : (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">选择人物查看详情</h3>
                <p className="text-sm text-muted-foreground">点击世系树图中的人物，或通过搜索查找</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Dialog */}
      {showFeedback && selectedPerson && (
        <FeedbackDialog
          genealogyId={genealogyInfo.id}
          genealogyName={genealogyInfo.name}
          personId={selectedPerson.id}
          personName={selectedPerson.name}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
