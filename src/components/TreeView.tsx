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
  depth = 0,
}: TreeViewProps) {
  const children = getChildren(genealogyId, person.id);
  const hasChildren = children.length > 0;
  const isExpanded = expandedGenerations.has(person.generation);
  const isSelected = selectedPersonId === person.id;

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

      {/* Children with connectors */}
      {hasChildren && (
        <>
          {/* Vertical line from parent */}
          <div className="w-px h-4 bg-border" />

          {isExpanded ? (
            <>
              {/* Horizontal connector bar */}
              <div className="relative w-full flex justify-center">
                <div
                  className="absolute top-0 h-px bg-border"
                  style={{
                    left: children.length === 1 ? '50%' : `${100 / (children.length * 2)}%`,
                    right: children.length === 1 ? '50%' : `${100 / (children.length * 2)}%`,
                  }}
                />
              </div>

              {/* Children row */}
              <div className="flex justify-center gap-3 pt-0">
                {children.map(child => (
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
                      depth={depth + 1}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <button
              onClick={toggleGeneration}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-secondary border border-border rounded-full text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
              展开 {children.length} 位子嗣
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
