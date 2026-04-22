import { useState, useMemo, useCallback, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGenealogy, searchPerson, getChildren, getRootPerson, Person, getAncestorChain, getPersonsByGeneration, getTreeRoots } from '@/lib/data';
import { refreshAllData } from '@/lib/store';
import { Search, ChevronLeft, ChevronRight, User, ArrowLeft, TreePine, AlertCircle } from 'lucide-react';
import TreeView from '@/components/TreeView';
import PersonDetail from '@/components/PersonDetail';
import FeedbackDialog from '@/components/FeedbackDialog';

export default function GenealogyPage() {
  const { id } = useParams<{ id: string }>();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    refreshAllData().then(() => setIsLoaded(true)).catch(() => setIsLoaded(true));
  }, []);

  const genealogy = getGenealogy(id || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [expandedGenerations, setExpandedGenerations] = useState<Set<number>>(new Set([1]));
  const [showFeedback, setShowFeedback] = useState(false);

  // Branch navigation: track the path of clicked descendants
  const [branchPath, setBranchPath] = useState<Person[]>([]);

  // Default to ancestor on mount
  useEffect(() => {
    if (genealogy && !selectedPerson) {
      const root = getRootPerson(genealogy.id);
      if (root) {
        setSelectedPerson(root);
        setBranchPath([root]);
      }
    }
  }, [genealogy, selectedPerson]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!genealogy) {
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

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      const results = searchPerson(genealogy.id, query);
      setSearchResults(results);
      setIsSearching(true);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [genealogy.id]);

  /**
   * When a person is selected (from search or tree click):
   * - Set as selected person
   * - Reset branch navigation to just this person
   * - Expand generations from minGen to selected person's generation
   */
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

  /**
   * Navigate deeper into a branch (click a child in branch detail)
   */
  const handleNavigateBranch = useCallback((person: Person) => {
    const newPath = [...branchPath, person];
    setBranchPath(newPath);
    setSelectedPerson(person);
  }, [branchPath]);

  /**
   * Go back one level in branch navigation
   */
  const handleBackBranch = useCallback(() => {
    if (branchPath.length > 1) {
      const newPath = branchPath.slice(0, -1);
      setBranchPath(newPath);
      const prevPerson = newPath[newPath.length - 1];
      setSelectedPerson(prevPerson);
    }
  }, [branchPath]);

  /**
   * Get children of the currently selected person (for branch detail)
   * Uses selectedPerson directly, NOT selectedBranch, to avoid stale state
   */
  const currentBranchChildren = useMemo(() => {
    if (!selectedPerson) return [];
    return getChildren(genealogy.id, selectedPerson.id);
  }, [genealogy.id, selectedPerson]);

  // Compute visible range: selected person's generation -3 to +2
  const visibleRange = useMemo(() => {
    if (!selectedPerson) return { minGen: 1, maxGen: 7 };
    return {
      minGen: Math.max(1, selectedPerson.generation - 3),
      maxGen: Math.min(15, selectedPerson.generation + 2),
    };
  }, [selectedPerson]);

  // Get tree root nodes at minGen (the ancestor at minGen and their siblings)
  const treeRoots = useMemo(() => {
    if (!selectedPerson) {
      const root = getRootPerson(genealogy.id);
      return root ? [root] : [];
    }
    return getTreeRoots(genealogy.id, selectedPerson, visibleRange.minGen, visibleRange.maxGen);
  }, [genealogy.id, selectedPerson, visibleRange.minGen, visibleRange.maxGen]);

  // Auto-expand generations within visible range
  useEffect(() => {
    setExpandedGenerations(prev => {
      const next = new Set(prev);
      for (let g = visibleRange.minGen; g <= visibleRange.maxGen; g++) {
        next.add(g);
      }
      return next;
    });
  }, [visibleRange]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="text-xl font-bold text-foreground">{genealogy.name}</h1>
                <p className="text-xs text-muted-foreground">始祖：{genealogy.ancestor.name} · {genealogy.foundingYear}年</p>
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
                    共 {Object.keys(genealogy.people).length} 人
                  </span>
                </div>
              </div>

              {/* Generation indicator - clickable */}
              {selectedPerson && (
                <div className="px-6 py-2 bg-secondary/30 border-b border-border flex items-center gap-2 overflow-x-auto">
                  {Array.from({ length: 15 }, (_, i) => i + 1).map(gen => {
                    const isActive = gen === selectedPerson.generation;
                    const isInRange = gen >= visibleRange.minGen && gen <= visibleRange.maxGen;
                    return (
                      <button
                        key={gen}
                        onClick={() => {
                          const chain = getAncestorChain(genealogy.id, selectedPerson.id);
                          const personAtGen = chain.find(p => p.generation === gen);
                          if (personAtGen) {
                            handleSelectPerson(personAtGen);
                          }
                        }}
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-md cursor-pointer'
                            : isInRange
                              ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80 cursor-pointer'
                              : 'text-muted-foreground/40 cursor-default'
                        }`}
                      >
                        {gen}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="p-6 overflow-x-auto">
                {treeRoots.length > 0 ? (
                  <div className="flex justify-center gap-6">
                    {treeRoots.map(root => (
                      <TreeView
                        key={root.id}
                        genealogyId={genealogy.id}
                        people={genealogy.people}
                        person={root}
                        expandedGenerations={expandedGenerations}
                        setExpandedGenerations={setExpandedGenerations}
                        onSelectPerson={handleSelectPerson}
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
                    <button
                      onClick={handleBackBranch}
                      className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      返回上级
                    </button>
                  )}
                </div>
                {currentBranchChildren.length > 0 ? (
                  <div className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedPerson.name} 的子嗣（共 {currentBranchChildren.length} 人）
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {currentBranchChildren.map(child => (
                        <button
                          key={child.id}
                          onClick={() => handleNavigateBranch(child)}
                          className="flex items-center gap-3 p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors text-left group"
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                            child.gender === 'male' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                          }`}>
                            {child.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {child.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              第{child.generation}世
                              {child.birthYear && ` · ${child.birthYear}-${child.deathYear || '？'}`}
                            </div>
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
                genealogyId={genealogy.id}
                onFeedback={() => setShowFeedback(true)}
              />
            ) : (
              <div className="bg-card border border-border rounded-xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">选择人物查看详情</h3>
                <p className="text-sm text-muted-foreground">
                  点击世系树图中的人物，或通过搜索查找
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Dialog */}
      {showFeedback && selectedPerson && (
        <FeedbackDialog
          genealogyId={genealogy.id}
          genealogyName={genealogy.name}
          personId={selectedPerson.id}
          personName={selectedPerson.name}
          onClose={() => setShowFeedback(false)}
        />
      )}
    </div>
  );
}
