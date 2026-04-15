import { Person, getChildren } from '@/lib/data';
import { User, Calendar, Award, FileText, Users, Flag, MessageSquare } from 'lucide-react';

interface PersonDetailProps {
  person: Person;
  genealogyId: string;
  onFeedback: () => void;
}

export default function PersonDetail({ person, genealogyId, onFeedback }: PersonDetailProps) {
  const children = getChildren(genealogyId, person.id);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Profile Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 pb-8">
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${
              person.gender === 'male' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'
            }`}>
              {person.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground">{person.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  person.gender === 'male' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                }`}>
                  <User className="w-3 h-3" />
                  {person.gender === 'male' ? '男' : '女'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  第{person.generation}世
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 -mt-2">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            {(person.birthYear || person.deathYear) && (
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{person.birthYear || '？'} — {person.deathYear || '？'}</span>
              </div>
            )}
            {person.spouse && (
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">配偶：{person.spouse}</span>
              </div>
            )}
            {children.length > 0 && (
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">子嗣：{children.map(c => c.name).join('、')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biography */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">生平介绍</h3>
        </div>
        <div className="p-6">
          <p className="text-sm text-foreground leading-relaxed">{person.biography}</p>
        </div>
      </div>

      {/* Achievements */}
      {person.achievements && person.achievements.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Award className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-foreground">主要成就</h3>
          </div>
          <div className="p-6">
            <ul className="space-y-2">
              {person.achievements.map((achievement, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Flag className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Notes */}
      {person.notes && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold text-foreground">备注</h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-muted-foreground">{person.notes}</p>
          </div>
        </div>
      )}

      {/* Feedback Button */}
      <button
        onClick={onFeedback}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-colors text-sm font-medium"
      >
        <MessageSquare className="w-4 h-4" />
        发现错误？提交反馈
      </button>
    </div>
  );
}
