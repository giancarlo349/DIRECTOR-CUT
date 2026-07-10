import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  FileText, 
  Sparkles,
  Link2,
  Image as ImageIcon,
  ExternalLink,
  Edit3,
  Check,
  CheckSquare,
  Square,
  X,
  Save,
  Grid,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, NoteBlock, ReferenceItem } from '../types';
import { cn } from '../lib/utils';

interface NotesTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'materials', label: 'Materiais' },
  { id: 'crew', label: 'Equipe / Elenco' },
  { id: 'tasks', label: 'Tarefas' },
  { id: 'general', label: 'Geral' }
];

const CATEGORY_TAGS = {
  materials: { label: 'Materiais', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  crew: { label: 'Equipe', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  tasks: { label: 'Tarefas', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  general: { label: 'Geral', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
};

export const NotesTab = ({ project, onUpdate }: NotesTabProps) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeBoard, setActiveBoard] = useState<'blocks' | 'references'>('blocks');

  // New Block Form State
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockCategory, setNewBlockCategory] = useState<'materials' | 'crew' | 'tasks' | 'general'>('general');
  const [newBlockContent, setNewBlockContent] = useState('');

  // Editing Block State
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingTitle, setEditingTitle] = useState('');

  // New Reference Form State
  const [showAddRef, setShowAddRef] = useState(false);
  const [refType, setRefType] = useState<'link' | 'image'>('link');
  const [refTitle, setRefTitle] = useState('');
  const [refUrl, setRefUrl] = useState('');
  const [refDesc, setRefDesc] = useState('');

  // Note Blocks List
  const noteBlocks = project.noteBlocks || [];
  const filteredBlocks = selectedCategory === 'all' 
    ? noteBlocks 
    : noteBlocks.filter(b => b.category === selectedCategory);

  // References List
  const references = project.references || [];

  // Add Note Block
  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockTitle.trim()) return;

    const newBlock: NoteBlock = {
      id: Date.now().toString(),
      title: newBlockTitle,
      category: newBlockCategory,
      content: newBlockContent || '- [ ] Nova tarefa ou anotação'
    };

    onUpdate({
      noteBlocks: [...noteBlocks, newBlock]
    });

    // Reset Form
    setNewBlockTitle('');
    setNewBlockContent('');
    setShowAddBlock(false);
  };

  // Delete Note Block
  const handleDeleteBlock = (id: string) => {
    onUpdate({
      noteBlocks: noteBlocks.filter(b => b.id !== id)
    });
  };

  // Toggle Edit mode / Save Block
  const handleSaveBlock = (id: string) => {
    onUpdate({
      noteBlocks: noteBlocks.map(b => b.id === id ? { ...b, title: editingTitle, content: editingContent } : b)
    });
    setEditingBlockId(null);
  };

  // Interactive Checklist toggling directly on the parsed UI!
  const handleToggleTodo = (blockId: string, lineIndex: number) => {
    const block = noteBlocks.find(b => b.id === blockId);
    if (!block) return;

    const lines = block.content.split('\n');
    const targetLine = lines[lineIndex];

    // Toggle between [ ] and [x]
    if (targetLine.includes('[ ]')) {
      lines[lineIndex] = targetLine.replace('[ ]', '[x]');
    } else if (targetLine.includes('[x]')) {
      lines[lineIndex] = targetLine.replace('[x]', '[ ]');
    } else if (targetLine.includes('[X]')) {
      lines[lineIndex] = targetLine.replace('[X]', '[ ]');
    }

    onUpdate({
      noteBlocks: noteBlocks.map(b => b.id === blockId ? { ...b, content: lines.join('\n') } : b)
    });
  };

  // Add Reference Item
  const handleAddReference = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refTitle.trim() || !refUrl.trim()) return;

    const newRef: ReferenceItem = {
      id: Date.now().toString(),
      title: refTitle,
      type: refType,
      url: refUrl,
      description: refDesc,
      createdAt: Date.now()
    };

    onUpdate({
      references: [...references, newRef]
    });

    // Reset Form
    setRefTitle('');
    setRefUrl('');
    setRefDesc('');
    setShowAddRef(false);
  };

  // Image Upload for Creative references
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefUrl(reader.result as string);
        if (!refTitle) {
          setRefTitle(file.name.split('.')[0]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete Reference Item
  const handleDeleteReference = (id: string) => {
    onUpdate({
      references: references.filter(r => r.id !== id)
    });
  };

  // Simple, ultra-polished Markdown Renderer with support for checklist lines
  const renderMarkdown = (blockId: string, content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-1.5 text-xs text-zinc-300 leading-relaxed font-sans select-text">
        {lines.map((line, idx) => {
          // Headers
          if (line.startsWith('### ')) {
            return <h5 key={idx} className="font-bold text-white text-sm pt-2 tracking-tight">{line.slice(4)}</h5>;
          }
          if (line.startsWith('## ')) {
            return <h4 key={idx} className="font-bold text-white text-base pt-2 tracking-tight">{line.slice(3)}</h4>;
          }
          if (line.startsWith('# ')) {
            return <h3 key={idx} className="font-black text-white text-lg pt-2 tracking-tight">{line.slice(2)}</h3>;
          }

          // Checklist todo item [ ] or [x]
          const todoMatch = line.match(/^-\s*\[([ xX])\]\s*(.*)/);
          if (todoMatch) {
            const checked = todoMatch[1].toLowerCase() === 'x';
            const text = todoMatch[2];
            return (
              <div 
                key={idx} 
                onClick={() => handleToggleTodo(blockId, idx)}
                className="flex items-start gap-2.5 py-1 px-1.5 -mx-1.5 rounded-lg hover:bg-white/5 cursor-pointer group/todo transition-colors select-none"
              >
                <div className="mt-0.5 text-magma group-hover/todo:scale-110 transition-transform">
                  {checked ? (
                    <CheckSquare className="w-4 h-4 fill-magma/20" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
                <span className={cn(
                  "flex-1 font-medium select-text",
                  checked ? "line-through text-zinc-600 font-normal" : "text-zinc-300"
                )}>
                  {parseInlineFormatting(text)}
                </span>
              </div>
            );
          }

          // Bullet list items
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-magma select-none mt-1.5">•</span>
                <span className="flex-1">{parseInlineFormatting(line.slice(2))}</span>
              </div>
            );
          }

          // Empty line
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }

          // Normal line
          return (
            <p key={idx} className="pl-1">
              {parseInlineFormatting(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Helper to parse bold (**text**) and italic (*text*) inside markdown strings
  const parseInlineFormatting = (text: string) => {
    const parts = [];
    let currentIdx = 0;
    
    // Simple regex to parse double asterisks for bold
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      const precedingText = text.substring(currentIdx, match.index);
      if (precedingText) parts.push(precedingText);
      parts.push(<strong key={match.index} className="font-extrabold text-white">{match[1]}</strong>);
      currentIdx = boldRegex.lastIndex;
    }

    const remainingText = text.substring(currentIdx);
    if (remainingText) parts.push(remainingText);

    return parts.length > 0 ? parts : text;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-10"
    >
      {/* Header and Board Selection */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <span className="text-xs font-mono uppercase tracking-[6px] text-zinc-500">Espaço Criativo</span>
          <h3 className="cinematic-title text-5xl mt-1.5">Mural & Anotações</h3>
          <p className="text-zinc-400 font-medium italic mt-2 text-xs">Organize materiais, pessoas, tarefas e moodboards em um só local.</p>
        </div>

        {/* View Selection Tab Button */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-white/5 w-fit">
          <button 
            onClick={() => setActiveBoard('blocks')}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all",
              activeBoard === 'blocks'
                ? "bg-magma text-white shadow-lg shadow-magma/15"
                : "text-zinc-500 hover:text-white"
            )}
          >
            <FileText className="w-4 h-4" /> Blocos de Anotações
          </button>
          <button 
            onClick={() => setActiveBoard('references')}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-all",
              activeBoard === 'references'
                ? "bg-magma text-white shadow-lg shadow-magma/15"
                : "text-zinc-500 hover:text-white"
            )}
          >
            <Sparkles className="w-4 h-4" /> Quadro de Referências
          </button>
        </div>
      </div>

      {activeBoard === 'blocks' ? (
        <div className="space-y-8">
          {/* Categories chips and Add Block Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] uppercase tracking-widest border font-mono transition-all",
                    selectedCategory === cat.id
                      ? "bg-white text-black border-white font-extrabold"
                      : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <button 
              onClick={() => setShowAddBlock(true)}
              className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 transition-all font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Novo Bloco
            </button>
          </div>

          {/* Add Block Overlay Modal */}
          <AnimatePresence>
            {showAddBlock && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-obsidian border border-white/10 p-8 rounded-3xl w-full max-w-xl space-y-6 relative"
                >
                  <button 
                    onClick={() => setShowAddBlock(false)}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-magma">Criação</span>
                    <h3 className="cinematic-title text-2xl text-white">Adicionar Bloco</h3>
                  </div>

                  <form onSubmit={handleAddBlock} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Nome do Bloco</label>
                      <input 
                        type="text"
                        value={newBlockTitle}
                        onChange={(e) => setNewBlockTitle(e.target.value)}
                        placeholder="Ex: Lista de Elenco, Locações Pendentes..."
                        required
                        className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-magma/50 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Categoria</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['materials', 'crew', 'tasks', 'general'] as const).map((catId) => (
                          <button
                            key={catId}
                            type="button"
                            onClick={() => setNewBlockCategory(catId)}
                            className={cn(
                              "py-2 px-4 rounded-xl text-[10px] uppercase font-mono tracking-wider border text-center transition-all",
                              newBlockCategory === catId
                                ? "bg-magma border-magma text-white font-bold"
                                : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                            )}
                          >
                            {catId === 'materials' && '📦 Materiais'}
                            {catId === 'crew' && '👥 Equipe / Elenco'}
                            {catId === 'tasks' && '✅ Tarefas'}
                            {catId === 'general' && '📂 Geral'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Conteúdo (Suporta Markdown)</label>
                      <textarea
                        value={newBlockContent}
                        onChange={(e) => setNewBlockContent(e.target.value)}
                        placeholder="Insira notas livres ou checklists como:&#10;- [ ] Fazer algo&#10;- [x] Algo já feito&#10;### Subtitulo"
                        rows={6}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl px-4 py-3 text-xs text-zinc-300 placeholder:text-zinc-600 font-mono focus:outline-none focus:border-magma/50 transition-all leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddBlock(false)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 transition-colors rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Salvar Bloco
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Grid Blocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlocks.map((block) => {
              const isEditing = editingBlockId === block.id;
              const catInfo = CATEGORY_TAGS[block.category as keyof typeof CATEGORY_TAGS] || CATEGORY_TAGS.general;

              return (
                <motion.div
                  key={block.id}
                  layoutId={block.id}
                  className="glass-card p-6 flex flex-col justify-between border border-white/5 hover:border-white/10 transition-colors group relative h-fit"
                >
                  <div className="space-y-4">
                    {/* Block Header */}
                    <div className="flex items-start justify-between">
                      {isEditing ? (
                        <input 
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          className="bg-transparent border-b border-white/10 focus:border-magma focus:outline-none text-base font-bold text-white py-0.5"
                        />
                      ) : (
                        <div className="space-y-1">
                          <span className={cn("text-[8px] font-mono font-bold uppercase border px-2 py-0.5 rounded-full", catInfo.color)}>
                            {catInfo.label}
                          </span>
                          <h4 className="font-extrabold text-white text-base tracking-tight leading-snug">{block.title}</h4>
                        </div>
                      )}

                      {/* Top Action Controls */}
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isEditing ? (
                          <button 
                            onClick={() => handleSaveBlock(block.id)}
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              setEditingBlockId(block.id);
                              setEditingTitle(block.title);
                              setEditingContent(block.content);
                            }}
                            className="p-1.5 bg-white/5 border border-white/5 text-zinc-400 hover:text-white hover:border-magma/40 rounded-lg transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteBlock(block.id)}
                          className="p-1.5 bg-red-500/10 border border-red-500/20 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Block Content */}
                    <div className="border-t border-white/5 pt-4">
                      {isEditing ? (
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={6}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none leading-relaxed"
                        />
                      ) : (
                        renderMarkdown(block.id, block.content)
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {filteredBlocks.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-600 glass-card border-dashed">
                <FileText className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-mono text-[10px] uppercase tracking-[4px]">Nenhum bloco encontrado</p>
                <p className="text-sm mt-2">Crie blocos para organizar seus materiais e tarefas.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Header Controls for References Panel */}
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Inspirações e Mídias</h4>
            <button 
              onClick={() => setShowAddRef(true)}
              className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 transition-all font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-lg"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Nova Referência
            </button>
          </div>

          {/* Add Reference Dialog */}
          <AnimatePresence>
            {showAddRef && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-50">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="bg-obsidian border border-white/10 p-8 rounded-3xl w-full max-w-lg space-y-6 relative"
                >
                  <button 
                    onClick={() => setShowAddRef(false)}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-magma">Mural Criativo</span>
                    <h3 className="cinematic-title text-2xl text-white">Vincular Referência</h3>
                  </div>

                  <form onSubmit={handleAddReference} className="space-y-5">
                    {/* Type Choice */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Tipo de Mídia</label>
                      <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
                        <button 
                          type="button"
                          onClick={() => { setRefType('link'); setRefUrl(''); }}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all",
                            refType === 'link' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
                          )}
                        >
                          <Link2 className="w-4 h-4" /> Link Web
                        </button>
                        <button 
                          type="button"
                          onClick={() => { setRefType('image'); setRefUrl(''); }}
                          className={cn(
                            "flex-1 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all",
                            refType === 'image' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white"
                          )}
                        >
                          <ImageIcon className="w-4 h-4" /> Imagem / Frame
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Título / Apelido</label>
                      <input 
                        type="text"
                        value={refTitle}
                        onChange={(e) => setRefTitle(e.target.value)}
                        placeholder="Ex: Paleta de Cores Blade Runner, Lookbook..."
                        required
                        className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-magma/50"
                      />
                    </div>

                    {refType === 'link' ? (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">URL do Link</label>
                        <input 
                          type="url"
                          value={refUrl}
                          onChange={(e) => setRefUrl(e.target.value)}
                          placeholder="https://pinterest.com/pin/123..."
                          required={refType === 'link'}
                          className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-magma/50"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Enviar Arquivo</label>
                        <div 
                          className="border-2 border-dashed border-white/10 rounded-2xl h-36 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-magma/40 bg-white/5 transition-all relative overflow-hidden"
                          onClick={() => document.getElementById('ref-image-upload')?.click()}
                        >
                          {refUrl ? (
                            <img src={refUrl} className="w-full h-full object-cover" alt="Uploaded asset" />
                          ) : (
                            <>
                              <ImageIcon className="w-8 h-8 text-zinc-600" />
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Clique para escolher imagem</span>
                            </>
                          )}
                          <input 
                            id="ref-image-upload"
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload}
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Descrição / Anotação (Opcional)</label>
                      <input 
                        type="text"
                        value={refDesc}
                        onChange={(e) => setRefDesc(e.target.value)}
                        placeholder="Look visual marcante que quero reproduzir..."
                        className="w-full h-11 bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-magma/50"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button 
                        type="button" 
                        onClick={() => setShowAddRef(false)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 transition-colors rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        Vincular
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* References Grid list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {references.map((refItem) => (
              <motion.div
                key={refItem.id}
                layoutId={refItem.id}
                className="glass-card overflow-hidden flex flex-col justify-between border border-white/5 hover:border-magma/30 group transition-colors relative"
              >
                {/* Deletion button overlay */}
                <button 
                  onClick={() => handleDeleteReference(refItem.id)}
                  className="absolute top-3 right-3 p-1.5 bg-black/60 backdrop-blur-md text-zinc-500 hover:text-red-400 rounded-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <div className="flex flex-col h-full justify-between">
                  {refItem.type === 'image' ? (
                    <div className="space-y-3">
                      {/* Image Frame */}
                      <div className="aspect-video w-full overflow-hidden bg-black flex items-center justify-center border-b border-white/5">
                        <img src={refItem.url} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" alt={refItem.title} />
                      </div>
                      
                      {/* Metadata info */}
                      <div className="p-5 pt-2 space-y-1">
                        <h5 className="font-extrabold text-white text-sm tracking-tight leading-snug truncate">{refItem.title}</h5>
                        {refItem.description && (
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{refItem.description}</p>
                        )}
                        <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest block pt-2">🖼️ Frame de Referência</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Title and Favicon mimic */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 flex-shrink-0 group-hover:bg-magma/10 group-hover:text-magma transition-colors">
                            <Link2 className="w-4 h-4" />
                          </div>
                          <div className="space-y-0.5 truncate">
                            <h5 className="font-extrabold text-white text-sm tracking-tight leading-snug truncate">{refItem.title}</h5>
                            <span className="text-[9px] font-mono text-zinc-500 block truncate">{refItem.url}</span>
                          </div>
                        </div>

                        {/* Description */}
                        {refItem.description && (
                          <p className="text-[11px] text-zinc-400 leading-relaxed font-sans line-clamp-3">{refItem.description}</p>
                        )}
                      </div>

                      {/* Go to reference anchor link */}
                      <a 
                        href={refItem.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-magma hover:text-white uppercase tracking-wider flex items-center gap-1.5 pt-3 border-t border-white/5"
                      >
                        Acessar Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {references.length === 0 && (
              <div className="col-span-full py-24 flex flex-col items-center justify-center text-zinc-600 glass-card border-dashed">
                <Sparkles className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-mono text-[10px] uppercase tracking-[4px]">Nenhuma referência vinculada</p>
                <p className="text-sm mt-2">Guarde links de inspiração e faça upload de moodboards criativos.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
