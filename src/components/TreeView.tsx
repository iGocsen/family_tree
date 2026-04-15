import { getChildren, Person } from '@/lib/data';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TreeViewProps {
  genealogyId: string;
  person: Person;
  expandedGenerations: Set<number>;
  setExpandedGenerations: React.Dispatch<React.SetStateAction<Set<number>>>;
  onSelectPerson: (person: Person) => void;
  onBranchClick: (person: Person) => void;
  selectedPersonId: string | null;
  visibleRange: { minGen: number; maxGen: number };
  depth?: number;
}

export default function TreeView({
  genealogyId,
  person,
  expandedGenerations,
  setExpandedGenerations,
  onSelectPerson,
  onBranchClick,
  selectedPersonId,
  visibleRange,
  depth = 0,
}: TreeViewProps) {
  const children = getChildren(genealogyId, person.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedGenerations.has(person.generation);
  const isSelected = selectedPersonId === person.id;
  const isInRange = person.generation >= visibleRange.minGen && person.generation <= visibleRange.maxGen;
  const isAtBottom = person.generation === visibleRange.maxGen;
  const isAtTop = person.generation === visibleRange.minGen && visibleRange.minGen > 1;

  // Don't render if outside visible range
  if (!isInRange) return null;

  const toggleGeneration = () => {
    setExpandedGenerations(prev => {
      const next = new Set(prev);
      if (next.has(person.generation)) {
        for (let g = person.generation; g <= 9; g++) next.delete(g);
      } else {
        for (let g = 1; g <= person.generation; g++) next.add(g);
      }
      return next;
    });
  };

  // Filter children to only those within visible range
  const visibleChildren = children.filter(c => c.generation <= visibleRange.maxGen);
  const hasMoreBelow = children.length > 0 && children.some(c => c.generation > visibleRange.maxGen);

  return (
    <div className="flex flex-col items-center">
      {/* Node */}
      <button
        onClick={() => {
          onSelectPerson(person);
          onBranchClick(person);
        }}
        className={`relative group flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all duration-200 min-w-[110px] ${
          isSelected
            ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 ring-2 ring-primary/20'
            : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
        }`}
      >
        {isSelected && (
          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background" />
        )}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold mb-1.5 ${
          person.gender === 'male'
            ? 'bg-primary/15 text-primary'
            : 'bg-accent/15 text-accent'
        }`}>
          {person.name.charAt(0)}
        </div>
        <span className="text-sm font-semibold text-foreground text-center leading-tight">
          {person.name}
        </span>
        <span className="text-xs text-muted-foreground mt-0.5">
          第{person.generation}世
        </span>
        {person.birthYear && (
          <span className="text-xs text-muted-foreground/70">
            {person.birthYear}-{person.deathYear || '?'}
          </span>
        )}
      </button>

      {/* More above indicator */}
      {isAtTop && (
        <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 bg-secondary/80 rounded-full">
          <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground">上方还有祖先</span>
        </div>
      )}

      {/* Children with connectors */}
      {hasChildren && (
        <>
          {/* Vertical line from parent */}
          <div className="w-px h-4 bg-border" />

          {isExpanded ? (
            <>
              {/* Horizontal connector bar */}
              {visibleChildren.length > 1 && (
                <div className="relative w-full flex justify-center">
                  <div
                    className="absolute top-0 h-px bg-border"
                    style={{
                      left: `${100 / (visibleChildren.length * 2)}%`,
                      right: `${100 / (visibleChildren.length * 2)}%`,
                    }}
                  />
                </div>
              )}

              {/* Children row */}
              <div className="flex justify-center gap-3 pt-0">
                {visibleChildren.map(child => (
                  <div key={child.id} className="flex flex-col items-center">
                    {/* Vertical line to child */}
                    <div className="w-px h-4 bg-border" />
                    <TreeView
                      genealogyId={genealogyId}
                      person={child}
                      expandedGenerations={expandedGenerations}
                      setExpandedGenerations={setExpandedGenerations}
                      onSelectPerson={onSelectPerson}
                      onBranchClick={onBranchClick}
                      selectedPersonId={selectedPersonId}
                      visibleRange={visibleRange}
                      depth={depth + 1}
                    />
                  </div>
                ))}
              </div>

              {/* More below indicator */}
              {hasMoreBelow && (
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-secondary/80 rounded-full">
                  <ChevronDown className="w-2.5 h-2.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">下方还有更多世系</span>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={toggleGeneration}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-secondary border border-border rounded-full text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
              展开 {visibleChildren.length} 位子嗣
            </button>
          )}
        </>
      )}

      {/* Collapse button for expanded */}
      {hasChildren && isExpanded && (
        <button
          onClick={toggleGeneration}
          className="mt-2 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-secondary/80 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
