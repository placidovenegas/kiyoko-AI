'use client';

import { useRef } from 'react';
import { Check, ChevronRight, Film, Clapperboard, User, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectableEntity {
  id: string;
  label: string;
  sublabel?: string;
  badge?: string;
}

export interface EntitySelectorProps {
  entityType: 'scene' | 'video' | 'character' | 'background' | string;
  entities: SelectableEntity[];
  onSelect: (entity: SelectableEntity) => void;
  selected?: string;
}

// ---------------------------------------------------------------------------
// Entity type config
// ---------------------------------------------------------------------------

interface EntityTypeConfig {
  labelEs: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function getEntityConfig(entityType: string): EntityTypeConfig {
  switch (entityType) {
    case 'scene':
      return {
        labelEs: 'escena',
        icon: <Clapperboard size={12} />,
        iconBg: 'bg-blue-500/15 dark:bg-blue-500/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
      };
    case 'video':
      return {
        labelEs: 'video',
        icon: <Film size={12} />,
        iconBg: 'bg-purple-500/15 dark:bg-purple-500/20',
        iconColor: 'text-purple-600 dark:text-purple-400',
      };
    case 'character':
      return {
        labelEs: 'personaje',
        icon: <User size={12} />,
        iconBg: 'bg-amber-500/15 dark:bg-amber-500/20',
        iconColor: 'text-amber-600 dark:text-amber-400',
      };
    case 'background':
      return {
        labelEs: 'fondo',
        icon: <ImageIcon size={12} />,
        iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      };
    default:
      return {
        labelEs: entityType,
        icon: <Clapperboard size={12} />,
        iconBg: 'bg-muted',
        iconColor: 'text-muted-foreground',
      };
  }
}

// Capitalize first letter for the header
function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------------------
// EntityRow
// ---------------------------------------------------------------------------

interface EntityRowProps {
  entity: SelectableEntity;
  isSelected: boolean;
  onSelect: (entity: SelectableEntity) => void;
  config: EntityTypeConfig;
}

function EntityRow({ entity, isSelected, onSelect, config }: EntityRowProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entity)}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
        isSelected
          ? 'bg-primary/10 dark:bg-primary/12'
          : 'hover:bg-muted dark:hover:bg-white/4',
      )}
      aria-pressed={isSelected}
    >
      {/* Entity type icon */}
      <div
        className={cn(
          'flex items-center justify-center size-7 rounded-lg shrink-0',
          isSelected
            ? 'bg-primary/20 dark:bg-primary/25'
            : config.iconBg,
        )}
      >
        <span className={cn(isSelected ? 'text-primary dark:text-primary' : config.iconColor)}>
          {config.icon}
        </span>
      </div>

      {/* Label + sublabel */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-xs font-semibold truncate leading-snug',
            isSelected
              ? 'text-primary'
              : 'text-foreground',
          )}
        >
          {entity.label}
        </p>
        {entity.sublabel && (
          <p className="text-[11px] text-muted-foreground truncate leading-snug mt-0.5">
            {entity.sublabel}
          </p>
        )}
      </div>

      {/* Right: badge + indicator */}
      <div className="flex items-center gap-1.5 shrink-0">
        {entity.badge && !isSelected && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {entity.badge}
          </span>
        )}
        {isSelected ? (
          <div className="flex items-center justify-center size-5 rounded-full bg-primary">
            <Check size={10} className="text-white" />
          </div>
        ) : (
          <ChevronRight size={14} className="text-muted-foreground" />
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// EntitySelector
// ---------------------------------------------------------------------------

const MAX_VISIBLE = 8;

export function EntitySelector({ entityType, entities, onSelect, selected }: EntitySelectorProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const config = getEntityConfig(entityType);
  const labelEs = config.labelEs;

  return (
    <div className="rounded-xl border border-border bg-muted overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-card">
        <div className={cn('flex items-center justify-center size-5 rounded-md', config.iconBg)}>
          <span className={config.iconColor}>{config.icon}</span>
        </div>
        <span className="text-sm font-semibold text-foreground">
          Selecciona {labelEs}:
        </span>
        {entities.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {entities.length} disponible{entities.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Entity list or empty state */}
      {entities.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <p className="text-xs text-muted-foreground">
            No hay {labelEs}{labelEs === 'personaje' ? 's' : labelEs === 'escena' ? 's' : 's'} disponibles
          </p>
        </div>
      ) : (
        <div
          ref={listRef}
          className={cn(
            'divide-y divide-border',
            entities.length > MAX_VISIBLE && 'overflow-y-auto',
          )}
          style={entities.length > MAX_VISIBLE ? { maxHeight: `${MAX_VISIBLE * 52}px` } : undefined}
        >
          {entities.map((entity) => (
            <EntityRow
              key={entity.id}
              entity={entity}
              isSelected={selected === entity.id}
              onSelect={onSelect}
              config={config}
            />
          ))}
        </div>
      )}

      {/* Selection summary footer */}
      {selected && (
        <div className="px-4 py-2 border-t border-border bg-primary/5">
          <p className="text-[11px] text-primary font-medium">
            {capitalize(labelEs)} seleccionad{labelEs === 'fondo' || labelEs === 'video' ? 'o' : 'a'}
          </p>
        </div>
      )}
    </div>
  );
}
