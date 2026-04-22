import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSupabaseGenealogies, getMaxGeneration, Genealogy } from '@/lib/data';
import { refreshAllData } from '@/lib/store';
import { BookOpen, ArrowRight, Users, Calendar, MapPin, Settings, FileText, Search } from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [allGenealogies, setAllGenealogies] = useState<Genealogy[]>([]);

  useEffect(() => {
    refreshAllData().then(() => {
      setAllGenealogies(getSupabaseGenealogies());
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, []);

  // Filter by search
  const filteredGenealogies = useMemo(() => {
    if (!searchQuery.trim()) return allGenealogies;
    const q = searchQuery.trim().toLowerCase();
    return allGenealogies.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.origin.toLowerCase().includes(q)
    );
  }, [allGenealogies, searchQuery]);

  // Responsive grid
  const count = filteredGenealogies.length;
  const gridClass = count <= 1
    ? 'grid-cols-1 max-w-md mx-auto'
    : count === 2 || count === 4 || count === 7
      ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto'
      : 'grid-cols-1 md:grid-cols-3';

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Database empty guide
  if (allGenealogies.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-foreground mb-3">数据库为空</h2>
          <p className="text-muted-foreground mb-8">
            请先登录管理后台，点击"迁移数据到 Supabase"并勾选"是否同步默认数据"来导入初始族谱和人物数据。
          </p>
          <Link to="/admin" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium">
            <Settings className="w-5 h-5" />
            前往管理后台
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <button
            onClick={() => setIsSearching(!isSearching)}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-6 animate-fade-in hover:bg-primary/20 transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>传承有序 · 源远流长</span>
          </button>

          {isSearching && (
            <div className="max-w-md mx-auto mb-6 animate-slide-up">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索族谱名称..."
                  className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  autoFocus
                />
              </div>
            </div>
          )}

          <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight mb-4 animate-slide-up">
            族谱查询系统
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            追溯家族根源，传承先辈精神。查阅族谱世系，了解先人生平。
          </p>
          <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent mx-auto animate-scale-in" style={{ animationDelay: '0.2s' }} />
        </div>
      </div>

      {/* Genealogy Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {isSearching && searchQuery && (
          <p className="text-sm text-muted-foreground mb-4">
            找到 {filteredGenealogies.length} 个匹配的族谱
          </p>
        )}
        <div className={`grid ${gridClass} gap-8`}>
          {filteredGenealogies.map((genealogy, index) => {
            const maxGen = getMaxGeneration(genealogy.id);
            const genLabel = maxGen > 0 ? `${['零','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五'][maxGen] || maxGen}世传承` : '传承';
            return (
              <div key={genealogy.id} className="group relative" style={{ animationDelay: `${index * 0.1}s` }}>
                <Link to={`/genealogy/${genealogy.id}`} className="block">
                  <div className="relative bg-card border border-border rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1 overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity">
                      <svg viewBox="0 0 80 80" className="w-full h-full">
                        <path d="M80 0 L80 80 L0 80" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary" />
                      </svg>
                    </div>
                    <div className="relative">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                        <Users className="w-3.5 h-3.5" />
                        <span>{genLabel}</span>
                      </div>
                      <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                        {genealogy.name}
                      </h2>
                      <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                        {genealogy.description}
                      </p>
                      <div className="space-y-2 mb-6">
                        {genealogy.origin && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4 text-accent" />
                            <span>{genealogy.origin}</span>
                          </div>
                        )}
                        {genealogy.foundingYear && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 text-accent" />
                            <span>始迁于 {genealogy.foundingYear} 年</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground">
                          始祖：{genealogy.ancestor?.name || '—'}
                        </span>
                        <ArrowRight className="w-5 h-5 text-primary transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
                <Link
                  to={`/introduction/${genealogy.id}`}
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary/70 hover:text-primary transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  查看介绍
                </Link>
              </div>
            );
          })}
        </div>
        {filteredGenealogies.length === 0 && isSearching && searchQuery && (
          <div className="text-center py-12 text-muted-foreground">
            <p>未找到匹配的族谱</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">慎终追远 · 民德归厚</p>
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="w-4 h-4" />
            管理后台
          </Link>
        </div>
      </div>
    </div>
  );
}
