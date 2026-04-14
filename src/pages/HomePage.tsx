import { Link } from 'react-router-dom';
import { genealogies } from '@/lib/data';
import { BookOpen, ArrowRight, Users, Calendar, MapPin } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm mb-6 animate-fade-in">
            <BookOpen className="w-4 h-4" />
            <span>传承有序 · 源远流长</span>
          </div>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {genealogies.map((genealogy, index) => (
            <Link
              key={genealogy.id}
              to={`/genealogy/${genealogy.id}`}
              className="group relative block"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative bg-card border border-border rounded-xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-1 overflow-hidden">
                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg viewBox="0 0 80 80" className="w-full h-full">
                    <path d="M80 0 L80 80 L0 80" fill="none" stroke="currentColor" strokeWidth="1" className="text-primary" />
                  </svg>
                </div>

                <div className="relative">
                  {/* Generation badge */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
                    <Users className="w-3.5 h-3.5" />
                    <span>九世传承</span>
                  </div>

                  <h2 className="text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {genealogy.name}
                  </h2>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-6 line-clamp-3">
                    {genealogy.description}
                  </p>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span>{genealogy.origin}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 text-accent" />
                      <span>始迁于 {genealogy.foundingYear} 年</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      始祖：{genealogy.ancestor.name}
                    </span>
                    <ArrowRight className="w-5 h-5 text-primary transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">
          慎终追远 · 民德归厚
        </p>
      </div>
    </div>
  );
}
