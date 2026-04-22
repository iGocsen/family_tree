import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGenealogy, getMaxGeneration, getGenealogyIntroductionsFromCache, getSupabaseGenealogies } from '@/lib/data';
import { refreshAllData } from '@/lib/store';
import { ArrowLeft, MapPin, Calendar, Users, BookOpen, Award, ChevronLeft, ChevronRight, FileText } from 'lucide-react';

export default function IntroductionPage() {
  const { id } = useParams<{ id: string }>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [genealogy, setGenealogy] = useState<ReturnType<typeof getGenealogy>>(null);
  const [introductions, setIntroductions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    refreshAllData().then(() => {
      const g = getGenealogy(id || '');
      setGenealogy(g);
      setIntroductions(getGenealogyIntroductionsFromCache(id || ''));
      setIsLoaded(true);
    }).catch(() => setIsLoaded(true));
  }, [id]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!genealogy) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">未找到族谱</h2>
          <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mt-4">
            <ArrowLeft className="w-4 h-4" />返回首页
          </Link>
        </div>
      </div>
    );
  }

  const maxGen = getMaxGeneration(genealogy.id);
  const genLabel = maxGen > 0 ? `${['零','一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五'][maxGen] || maxGen}世传承` : '传承';
  const allPeople = Object.values(genealogy.people);

  // Group by generation
  const byGeneration: Record<number, typeof allPeople> = {};
  for (const p of allPeople) {
    if (!byGeneration[p.generation]) byGeneration[p.generation] = [];
    byGeneration[p.generation].push(p);
  }

  const totalPages = introductions.length > 0 ? introductions.length + 1 : 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary">
              <ArrowLeft className="w-4 h-4" />返回
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-bold text-foreground">{genealogy.name} · 族谱介绍</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {currentPage === 0 ? (
          <>
            {/* Hero */}
            <div className="relative bg-gradient-to-br from-primary/5 via-transparent to-accent/5 border border-border rounded-2xl p-8 md:p-12 mb-12">
              <div className="absolute top-4 right-4 opacity-10">
                <BookOpen className="w-24 h-24 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{genealogy.name}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">{genealogy.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{allPeople.length}</div>
                <div className="text-xs text-muted-foreground">总人数</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <Award className="w-6 h-6 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{genLabel}</div>
                <div className="text-xs text-muted-foreground">传承代数</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-sm font-bold text-foreground">{genealogy.origin || '—'}</div>
                <div className="text-xs text-muted-foreground">迁徙路线</div>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 text-center">
                <Calendar className="w-6 h-6 text-accent mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">{genealogy.foundingYear || '—'}</div>
                <div className="text-xs text-muted-foreground">始迁年份</div>
              </div>
            </div>

            {/* Ancestor */}
            {genealogy.ancestor && (
              <div className="bg-card border border-border rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold text-foreground mb-4">始祖信息</h3>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-xl font-bold text-primary">
                    {genealogy.ancestor.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-foreground">{genealogy.ancestor.name}</div>
                    <div className="text-sm text-muted-foreground">
                      第{genealogy.ancestor.generation}世 · {genealogy.ancestor.birthYear}-{genealogy.ancestor.deathYear || '？'}
                    </div>
                    <p className="text-sm text-foreground mt-2 leading-relaxed">{genealogy.ancestor.biography}</p>
                    {genealogy.ancestor.achievements && genealogy.ancestor.achievements.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {genealogy.ancestor.achievements.map((a, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-full">{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Generation breakdown */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">各世系人数</h3>
              </div>
              <div className="divide-y divide-border">
                {Object.entries(byGeneration).sort(([a], [b]) => Number(a) - Number(b)).map(([gen, people]) => (
                  <div key={gen} className="px-6 py-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">第{gen}世</span>
                    <span className="text-sm text-muted-foreground">{people.length} 人</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Extended introduction pages */
          <div className="bg-card border border-border rounded-2xl p-8 md:p-12 min-h-[60vh]">
            <div className="prose prose-stone dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap text-foreground leading-relaxed text-base md:text-lg">
                {introductions[currentPage - 1]}
              </div>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />上一页
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    currentPage === i
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {i === 0 ? '概览' : i}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              下一页<ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center flex items-center justify-center gap-4">
          <Link
            to={`/genealogy/${genealogy.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-medium"
          >
            <BookOpen className="w-5 h-5" />
            查看世系树图
          </Link>
          {introductions.length > 0 && (
            <button
              onClick={() => setCurrentPage(currentPage === 0 ? 1 : 0)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-colors font-medium"
            >
              <FileText className="w-5 h-5" />
              {currentPage === 0 ? '查看更多介绍' : '返回概览'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
