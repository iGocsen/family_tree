import { useState, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getGenealogy, getPerson, searchPerson, getChildren, getRootPerson, Person } from '@/lib/data';
import { Search, ChevronLeft, ChevronRight, User, X, ArrowLeft, TreePine, AlertCircle } from 'lucide-react';
import TreeView from '@/components/TreeView';
import PersonDetail from '@/components/PersonDetail';
import FeedbackDialog from '@/components/FeedbackDialog';

export default function GenealogyPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const genealogy = getGenealogy(id || '');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [expandedGenerations, setExpandedGenerations] = useState<Set<number>>(new Set([1]));
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Breadcrumb state for branch navigation
  const [branchPath, setBranchPath] = useState<Person[]>([]);

  if (!genealogy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">未找到族谱</h2>
          <p className="text-muted-foreground mb-6">该族谱不存在或已被移除</p>
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>
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

  const handleSelectPerson = useCallback((person: Person) => {
    setSelectedPerson(person);
    setSearchResults([]);
    setIsSearching(false);
    setSearchQuery('');
  }, []);

  const handleBranchClick = useCallback((person: Person) => {
    setSelectedBranch(person.id);
    setSelectedPerson(person);
  }, []);

  const handleNavigateBranch = useCallback((person: Person) => {
    const newPath = [...branchPath, person];
    setBranchPath(newPath);
    setSelectedBranch(person.id);
    setSelectedPerson(person);
  }, [branchPath]);

  const handleBackBranch = useCallback(() => {
    if (branchPath.length > 1) {
      const newPath = branchPath.slice(0, -1);
      setBranchPath(newPath);
      const prevPerson = newPath[newPath.length - 1];
      setSelectedBranch(prevPerson.id);
      setSelectedPerson(prevPerson);
    } else {
      setBranchPath([]);
      setSelectedBranch(null);
      setSelectedPerson(null);
    }
  }, [branchPath]);

  const currentBranchChildren = useMemo(() => {
    if (!selectedBranch) return [];
    return getChildren(genealogy.id, selectedBranch);
  }, [genealogy.id, selectedBranch]);

  const rootPerson = getRootPerson(genealogy.id);

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
                <span className="text-xs text-muted-foreground">
                  共 {Object.keys(genealogy.people).length} 人
                </span>
              </div>
              <div className="p-6 overflow-x-auto">
                {rootPerson && (
                  <TreeView
                    genealogyId={genealogy.id}
                    person={rootPerson}
                    expandedGenerations={expandedGenerations}
                    setExpandedGenerations={setExpandedGenerations}
                    onSelectPerson={handleSelectPerson}
                    onBranchClick={handleBranchClick}
                    selectedPersonId={selectedPerson?.id || null}
                  />
                )}
              </div>
            </div>

            {/* Branch Navigation */}
            {selectedBranch && (
              <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden animate-scale-in">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">分支详情</h3>
                    {branchPath.length > 0 && (
                      <div className="flex items-center gap-1 ml-4">
                        {branchPath.map((p, i) => (
                          <span key={p.id} className="flex items-center gap-1 text-sm">
                            {i > 0 && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                            <button
                              onClick={() => {
                                const newPath = branchPath.slice(0, i + 1);
                                setBranchPath(newPath);
                                setSelectedPerson(p);
                                setSelectedBranch(p.id);
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
                  {branchPath.length > 0 && (
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
                      {selectedPerson?.name} 的子嗣（共 {currentBranchChildren.length} 人）
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
