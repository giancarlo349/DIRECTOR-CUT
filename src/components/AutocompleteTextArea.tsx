import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';
import { cn } from '../lib/utils';
import { User, MapPin, Clock } from 'lucide-react';

interface AutocompleteTextAreaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  project: Project;
  id?: string;
}

interface SuggestionItem {
  id: string;
  name: string;
  type: 'character' | 'location' | 'time';
}

export const AutocompleteTextArea = ({
  value,
  onChange,
  placeholder,
  rows = 4,
  className,
  project,
  id
}: AutocompleteTextAreaProps) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [triggerRange, setTriggerRange] = useState<{ start: number; end: number } | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Parse the word under cursor to check for autocomplete triggers
  const checkAutocomplete = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursor);
    
    // Find last occurrence of '/' before cursor
    const lastSlashIdx = textBeforeCursor.lastIndexOf('/');
    if (lastSlashIdx === -1) {
      setShowDropdown(false);
      return;
    }

    // Ensure there is no space between '/' and the cursor, or it's a short command
    const typedAfterSlash = textBeforeCursor.substring(lastSlashIdx + 1);
    if (typedAfterSlash.includes(' ') || typedAfterSlash.includes('\n')) {
      setShowDropdown(false);
      return;
    }

    // Determine suggestion category
    let type: 'character' | 'location' | 'time' | null = null;
    let filterText = '';

    // Triggers:
    // /p or /personagem
    // /l or /local
    // /h or /horario
    if (typedAfterSlash.startsWith('personagem') || typedAfterSlash.startsWith('p')) {
      type = 'character';
      filterText = typedAfterSlash.startsWith('personagem') 
        ? typedAfterSlash.substring(10) 
        : typedAfterSlash.substring(1);
    } else if (typedAfterSlash.startsWith('local') || typedAfterSlash.startsWith('l')) {
      type = 'location';
      filterText = typedAfterSlash.startsWith('local') 
        ? typedAfterSlash.substring(5) 
        : typedAfterSlash.substring(1);
    } else if (typedAfterSlash.startsWith('horario') || typedAfterSlash.startsWith('h')) {
      type = 'time';
      filterText = typedAfterSlash.startsWith('horario') 
        ? typedAfterSlash.substring(7) 
        : typedAfterSlash.substring(1);
    } else if (typedAfterSlash === '') {
      // General help / list all triggers
      type = null;
    }

    let items: SuggestionItem[] = [];

    if (type === 'character') {
      const charList = project.characters || [];
      items = charList
        .filter(c => c.name.toLowerCase().includes(filterText.toLowerCase()))
        .map(c => ({ id: c.id, name: c.name, type: 'character' }));
    } else if (type === 'location') {
      const locList = project.locations || [];
      items = locList
        .filter(l => l.name.toLowerCase().includes(filterText.toLowerCase()))
        .map(l => ({ id: l.id, name: l.name, type: 'location' }));
    } else if (type === 'time') {
      const times = ['MANHÃ', 'TARDE', 'NOITE', 'AMANHECER', 'ANOITECER'];
      items = times
        .filter(t => t.toLowerCase().includes(filterText.toLowerCase()))
        .map(t => ({ id: t, name: t, type: 'time' }));
    } else {
      // Show commands help
      items = [
        { id: 'cmd-p', name: '/p [Personagem]', type: 'character' },
        { id: 'cmd-l', name: '/l [Local]', type: 'location' },
        { id: 'cmd-h', name: '/h [Horário]', type: 'time' }
      ];
    }

    if (items.length > 0) {
      setSuggestions(items);
      setTriggerRange({ start: lastSlashIdx, end: cursor });
      setShowDropdown(true);
      // Reset selected index to 0 if out of bounds
      setSelectedIndex(prev => Math.min(prev, items.length - 1));
    } else {
      setShowDropdown(false);
    }
  };

  const insertSuggestion = (item: SuggestionItem) => {
    const textarea = textareaRef.current;
    if (!textarea || !triggerRange) return;

    // Don't insert command helper titles
    if (item.id.startsWith('cmd-')) {
      // Just clear the slash or help type the command
      const cmdChar = item.id.replace('cmd-', '');
      const before = value.substring(0, triggerRange.start);
      const after = value.substring(triggerRange.end);
      const newValue = `${before}/${cmdChar}${after}`;
      onChange(newValue);
      
      // Keep dropdown open but trigger range updated
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(triggerRange.start + 2, triggerRange.start + 2);
        checkAutocomplete();
      }, 10);
      return;
    }

    const before = value.substring(0, triggerRange.start);
    const after = value.substring(triggerRange.end);
    const replacement = item.name;
    const newValue = `${before}${replacement}${after}`;
    
    onChange(newValue);
    setShowDropdown(false);
    setTriggerRange(null);

    // Reposition cursor right after the inserted text
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = triggerRange.start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedIndex]) {
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        break;
      case 'Tab':
        // Autocomplete with active item if typing command
        if (suggestions[selectedIndex]) {
          e.preventDefault();
          insertSuggestion(suggestions[selectedIndex]);
        }
        break;
      default:
        break;
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  return (
    <div className="relative w-full flex flex-col">
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          // Run check in next tick to let react update state first
          setTimeout(checkAutocomplete, 0);
        }}
        onKeyUp={(e) => {
          if (['ArrowLeft', 'ArrowRight', 'Backspace', 'Delete'].includes(e.key)) {
            checkAutocomplete();
          }
        }}
        onFocus={checkAutocomplete}
        placeholder={placeholder}
        rows={rows}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs font-sans text-zinc-200 focus:outline-none focus:border-magma/50 transition-all resize-y custom-scrollbar leading-relaxed",
          className
        )}
      />

      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-4 right-4 bottom-full mb-2 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl z-[150] overflow-hidden backdrop-blur-xl max-h-48 overflow-y-auto custom-scrollbar"
        >
          <div className="px-3 py-1.5 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between text-[8px] font-black tracking-widest text-zinc-500 uppercase">
            <span>Sugestões (Teclado: ↑ ↓ ↵)</span>
            <span>Atalhos: /p /l /h</span>
          </div>
          <div className="p-1.5 space-y-0.5">
            {suggestions.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => insertSuggestion(item)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-all",
                    isSelected 
                      ? "bg-magma text-white shadow-lg shadow-magma/10 font-medium" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span className="flex items-center gap-2">
                    {item.type === 'character' && <User className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-zinc-500")} />}
                    {item.type === 'location' && <MapPin className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-zinc-500")} />}
                    {item.type === 'time' && <Clock className={cn("w-3.5 h-3.5", isSelected ? "text-white" : "text-zinc-500")} />}
                    <span>{item.name}</span>
                  </span>
                  
                  <span className={cn(
                    "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                    isSelected 
                      ? "border-white/20 bg-white/10 text-white" 
                      : "border-white/5 bg-white/5 text-zinc-500"
                  )}>
                    {item.type === 'character' ? 'Pers' : item.type === 'location' ? 'Local' : 'Hora'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
