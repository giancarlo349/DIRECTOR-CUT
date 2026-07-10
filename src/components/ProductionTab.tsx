import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Link2, 
  Image as ImageIcon, 
  FileText, 
  CheckSquare, 
  Square, 
  Edit3, 
  Eye, 
  ExternalLink,
  BookOpen,
  LayoutGrid,
  Sparkles,
  Users,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, NoteBlock, ReferenceItem } from '../types';
import { cn } from '../lib/utils';

interface ProductionTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

// Custom simple Markdown Parser with interactive checklist support
const renderMarkdown = (
  content: string, 
  onToggleCheck?: (checkIndex: number) => void
) => {
  if (!content) return <p className="text-zinc-500 italic text-sm">Sem conteúdo ainda. Clique em Editar para escrever...</p>;

  const lines = content.split('\n');
  let checkIndex = 0;

  return (
    <div className="space-y-3 font-sans text-sm text-zinc-300 leading-relaxed">
      {lines.map((line, idx) => {
        // Headers
        if (line.startsWith('# ')) {
          return <h1 key={idx} className="text-2xl font-bold text-white mt-4 mb-2 tracking-tight border-b border-white/5 pb-1">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={idx} className="text-xl font-bold text-white mt-3 mb-2 tracking-tight">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={idx} className="text-lg font-semibold text-white mt-2 mb-1">{line.slice(4)}</h3>;
        }

        // Checkboxes / Tasks
        const taskMatch = line.match(/^\s*-\s*\[([ xX])\]\s*(.*)/);
        if (taskMatch) {
          const isChecked = taskMatch[1].toLowerCase() === 'x';
          const taskText = taskMatch[2];
          const currentCheckIndex = checkIndex;
          checkIndex++;

          return (
            <div 
              key={idx} 
              className="flex items-start gap-3 group/task py-1 cursor-pointer"
              onClick={() => onToggleCheck?.(currentCheckIndex)}
            >
              {isChecked ? (
                <CheckSquare className="w-4 h-4 text-magma mt-0.5 flex-shrink-0" />
              ) : (
                <Square className="w-4 h-4 text-zinc-600 group-hover/task:text-zinc-400 mt-0.5 flex-shrink-0" />
              )}
              <span className={cn(
                "transition-colors text-sm",
                isChecked ? "line-through text-zinc-500 font-medium" : "text-zinc-200"
              )}>
                {parseInlineFormatting(taskText)}
              </span>
            </div>
          );
        }

        // Bullet Lists
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <ul key={idx} className="list-disc list-inside pl-2 space-y-1">
              <li className="text-zinc-300">{parseInlineFormatting(line.slice(2))}</li>
            </ul>
          );
        }

        // Blockquotes
        if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-2 border-magma bg-white/5 px-4 py-2 rounded-r-xl italic my-2 text-zinc-400">
              {parseInlineFormatting(line.slice(2))}
            </blockquote>
          );
        }

        // Empty lines
        if (line.trim() === '') {
          return <div key={idx} className="h-2" />;
        }

        // Normal paragraph
        return <p key={idx}>{parseInlineFormatting(line)}</p>;
      })}
    </div>
  );
};

// Simple inline bold and italic parsing
const parseInlineFormatting = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  let currentText = text;
  let keyIdx = 0;

  // Pattern for Bold (**text**) and Italic (*text* or _text_)
  // This is a simple tokenizer for render purposes
  const regex = /(\*\*.*?\*\*|\*.*?\*|__.*?__|__.*?_)/g;
  const tokens = currentText.split(regex);

  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i} className="font-extrabold text-white">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return <em key={i} className="italic text-zinc-100">{token.slice(1, -1)}</em>;
    }
    if (token.startsWith('__') && token.endsWith('__')) {
      return <strong key={i} className="font-extrabold text-white">{token.slice(2, -2)}</strong>;
    }
    return token;
  });
};

export const ProductionTab = ({ project, onUpdate }: ProductionTabProps) => {
  const [subTab, setSubTab] = useState<'notes' | 'moodboard'>('notes');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Note block creation states
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [newBlockCategory, setNewBlockCategory] = useState('Geral');
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  // Reference creation states
  const [newRefTitle, setNewRefTitle] = useState('');
  const [newRefType, setNewRefType] = useState<'link' | 'image'>('link');
  const [newRefUrl, setNewRefUrl] = useState('');
  const [newRefDesc, setNewRefDesc] = useState('');
  const [isAddingRef, setIsAddingRef] = useState(false);

  const categories = ['Geral', 'Materiais', 'Equipe', 'Tarefas', 'Produção'];

  // Notes management
  const addNoteBlock = () => {
    if (!newBlockTitle.trim()) return;
    const blocks = project.noteBlocks ? [...project.noteBlocks] : [];
    const newBlock: NoteBlock = {
      id: Date.now().toString(),
      title: newBlockTitle.trim(),
      category: newBlockCategory,
      content: `# ${newBlockTitle}\n\n- [ ] Exemplo de tarefa\n- [ ] Outro item necessário`
    };
    blocks.push(newBlock);
    onUpdate({ noteBlocks: blocks });
    setNewBlockTitle('');
    setIsAddingBlock(false);
    setEditingBlockId(newBlock.id);
  };

  const deleteNoteBlock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const blocks = (project.noteBlocks || []).filter(b => b.id !== id);
    onUpdate({ noteBlocks: blocks });
    if (editingBlockId === id) setEditingBlockId(null);
  };

  const updateBlockContent = (id: string, content: string) => {
    const blocks = (project.noteBlocks || []).map(b => b.id === id ? { ...b, content } : b);
    onUpdate({ noteBlocks: blocks });
  };

  const toggleCheckbox = (blockId: string, checkIndex: number) => {
    const block = (project.noteBlocks || []).find(b => b.id === blockId);
    if (!block) return;

    let count = 0;
    const newContent = block.content.split('\n').map(line => {
      if (line.match(/^\s*-\s*\[([ xX])\]/)) {
        if (count === checkIndex) {
          const isChecked = line.includes('[x]') || line.includes('[X]');
          const newLine = line.replace(/\[([ xX])\]/, isChecked ? '[ ]' : '[x]');
          count++;
          return newLine;
        }
        count++;
      }
      return line;
    }).join('\n');

    updateBlockContent(blockId, newContent);
  };

  // References management
  const addReference = () => {
    if (!newRefTitle.trim() || !newRefUrl.trim()) return;
    const refs = project.references ? [...project.references] : [];
    const newItem: ReferenceItem = {
      id: Date.now().toString(),
      title: newRefTitle.trim(),
      type: newRefType,
      url: newRefUrl.trim(),
      description: newRefDesc.trim(),
      createdAt: Date.now()
    };
    refs.push(newItem);
    onUpdate({ references: refs });
    setNewRefTitle('');
    setNewRefUrl('');
    setNewRefDesc('');
    setIsAddingRef(false);
  };

  const deleteReference = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const refs = (project.references || []).filter(r => r.id !== id);
    onUpdate({ references: refs });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewRefUrl(reader.result as string);
        setNewRefType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="cinematic-title text-5xl">Produção & Refs</h3>
          <p className="text-zinc-500 font-medium italic mt-2">Central criativa e organização prática para seu filme.</p>
        </div>
        
        {/* Toggle Panel buttons */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
          <button
            onClick={() => setSubTab('notes')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
              subTab === 'notes' 
                ? "bg-magma text-white shadow-lg" 
                : "text-zinc-400 hover:text-white"
            )}
          >
            <BookOpen className="w-4 h-4" /> Caderno
          </button>
          <button
            onClick={() => setSubTab('moodboard')}
            className={cn(
              "px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
              subTab === 'moodboard' 
                ? "bg-magma text-white shadow-lg" 
                : "text-zinc-400 hover:text-white"
            )}
          >
            <LayoutGrid className="w-4 h-4" /> Moodboard
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'notes' ? (
          <motion.div 
            key="notes"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Left/Middle Column - Note Blocks list */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="cinematic-title text-xl text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-5 h-5 text-magma" /> Blocos de Organização
                </h4>
                
                {isAddingBlock ? (
                  <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/5">
                    <input 
                      autoFocus
                      placeholder="Título do Bloco..."
                      value={newBlockTitle}
                      onChange={(e) => setNewBlockTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addNoteBlock()}
                      className="text-xs px-3 py-1.5 bg-obsidian border border-white/5 rounded-xl focus:outline-none focus:border-magma/50 text-white w-44"
                    />
                    <select
                      value={newBlockCategory}
                      onChange={(e) => setNewBlockCategory(e.target.value)}
                      className="text-xs bg-obsidian text-zinc-300 border border-white/5 rounded-xl px-2 py-1.5 focus:outline-none"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Button size="sm" variant="helios" onClick={addNoteBlock} className="rounded-xl h-8 px-4 text-xs">Add</Button>
                    <button onClick={() => setIsAddingBlock(false)} className="text-zinc-500 hover:text-white text-xs px-1">✕</button>
                  </div>
                ) : (
                  <Button onClick={() => setIsAddingBlock(true)} variant="outline" size="sm" className="gap-2 rounded-full px-4 border-white/10">
                    <Plus className="w-3.5 h-3.5" /> Adicionar Bloco
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(project.noteBlocks || []).map((block) => {
                  const isEditing = editingBlockId === block.id;
                  return (
                    <div 
                      key={block.id} 
                      className={cn(
                        "glass-card p-6 flex flex-col justify-between group transition-all relative overflow-hidden h-96",
                        isEditing ? "border-magma/40 ring-1 ring-magma/20" : "hover:border-white/10"
                      )}
                    >
                      {/* Decorative corner tag for category */}
                      <span className="absolute top-0 right-0 px-3 py-1 text-[8px] font-bold uppercase tracking-widest bg-white/5 border-l border-b border-white/5 rounded-bl-xl text-zinc-500">
                        {block.category}
                      </span>

                      <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
                        <div className="flex justify-between items-start">
                          <h5 className="font-bold text-lg text-white tracking-tight">{block.title}</h5>
                        </div>

                        {isEditing ? (
                          <textarea
                            value={block.content}
                            onChange={(e) => updateBlockContent(block.id, e.target.value)}
                            className="w-full h-64 bg-obsidian/60 border border-white/5 rounded-xl p-4 font-mono text-xs text-zinc-200 focus:outline-none focus:border-magma/50 resize-none custom-scrollbar leading-relaxed"
                            placeholder="# Título\n\n- [ ] Tarefa 1\n- [ ] Tarefa 2"
                          />
                        ) : (
                          <div className="prose prose-invert max-w-none">
                            {renderMarkdown(block.content, (idx) => toggleCheckbox(block.id, idx))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/5">
                        <button 
                          onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                          className="text-[10px] font-black uppercase tracking-widest text-magma hover:text-white transition-colors flex items-center gap-1.5"
                        >
                          {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                          {isEditing ? 'Visualizar' : 'Editar'}
                        </button>
                        <button 
                          onClick={(e) => deleteNoteBlock(block.id, e)}
                          className="text-zinc-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {(!project.noteBlocks || project.noteBlocks.length === 0) && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-600 glass-card border-dashed">
                    <Briefcase className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-mono text-[10px] uppercase tracking-[4px]">Sem blocos de notas</p>
                    <p className="text-sm mt-2 text-center max-w-sm">Crie blocos customizados para organizar Materiais, Quantidade de Pessoas, Orçamentos, Roteiros de Viagem ou Tarefas do Set!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Help Card on Markdown & Slate */}
            <div className="space-y-6">
              <div className="glass-card p-6 bg-magma/5 border-magma/10 space-y-4">
                <h5 className="font-bold text-sm text-white flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-magma" /> Cheat Sheet Markdown
                </h5>
                <p className="text-xs text-zinc-400">Escreva nos blocos de notas usando a sintaxe básica de markdown para formatar instantaneamente:</p>
                <div className="space-y-3 font-mono text-[10px] bg-obsidian/50 p-4 rounded-xl text-zinc-400 border border-white/5">
                  <div>
                    <span className="text-white"># Título</span>
                    <p className="text-[9px] text-zinc-500">Renderiza cabeçalho principal</p>
                  </div>
                  <div>
                    <span className="text-white">## Subtítulo</span>
                    <p className="text-[9px] text-zinc-500">Renderiza cabeçalho secundário</p>
                  </div>
                  <div>
                    <span className="text-white">- [ ] Fazer tarefa</span>
                    <p className="text-[9px] text-zinc-500">Cria checklist totalmente interativo (clicável!)</p>
                  </div>
                  <div>
                    <span className="text-white">- Item comum</span>
                    <p className="text-[9px] text-zinc-500">Cria lista com marcadores</p>
                  </div>
                  <div>
                    <span className="text-white">**Texto Negrito**</span>
                    <p className="text-[9px] text-zinc-500">Destaque forte para prazos ou avisos</p>
                  </div>
                  <div>
                    <span className="text-white">&gt; Citação importante</span>
                    <p className="text-[9px] text-zinc-500">Cria destaque lateral</p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 space-y-4">
                <h5 className="font-bold text-sm text-white flex items-center gap-2 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-magma" /> Coordenação de Set
                </h5>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Para produções eficientes, utilize os blocos de notas para criar a lista de contratação de equipe, as autorizações de locação, os links de alimentação e os cronogramas de cada dia de filmagem.
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="moodboard"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            {/* Header Moodboard */}
            <div className="flex items-center justify-between">
              <h4 className="cinematic-title text-xl text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-magma" /> Quadro de Referências & Inspirações
              </h4>
              
              {isAddingRef ? (
                <div className="flex flex-wrap items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5 max-w-2xl">
                  <input 
                    autoFocus
                    placeholder="Título da Referência..."
                    value={newRefTitle}
                    onChange={(e) => setNewRefTitle(e.target.value)}
                    className="text-xs px-3 py-1.5 bg-obsidian border border-white/5 rounded-xl focus:outline-none focus:border-magma/50 text-white w-40"
                  />
                  <select
                    value={newRefType}
                    onChange={(e) => setNewRefType(e.target.value as any)}
                    className="text-xs bg-obsidian text-zinc-300 border border-white/5 rounded-xl px-2 py-1.5 focus:outline-none"
                  >
                    <option value="link">Link da Web</option>
                    <option value="image">Imagem</option>
                  </select>
                  
                  {newRefType === 'image' ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        id="ref-img-upload"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => document.getElementById('ref-img-upload')?.click()}
                        className="h-8 rounded-xl text-xs gap-1.5 border-white/10"
                      >
                        <Plus className="w-3.5 h-3.5" /> Upload Foto
                      </Button>
                      {newRefUrl.startsWith('data:') && (
                        <span className="text-[10px] text-zinc-500 font-mono italic">Foto Carregada!</span>
                      )}
                    </div>
                  ) : (
                    <input 
                      placeholder="Cole o Link (URL)..."
                      value={newRefUrl}
                      onChange={(e) => setNewRefUrl(e.target.value)}
                      className="text-xs px-3 py-1.5 bg-obsidian border border-white/5 rounded-xl focus:outline-none focus:border-magma/50 text-white w-48"
                    />
                  )}

                  <input 
                    placeholder="Descrição sutil (opcional)..."
                    value={newRefDesc}
                    onChange={(e) => setNewRefDesc(e.target.value)}
                    className="text-xs px-3 py-1.5 bg-obsidian border border-white/5 rounded-xl focus:outline-none focus:border-magma/50 text-white w-44"
                  />

                  <Button size="sm" variant="helios" onClick={addReference} className="rounded-xl h-8 px-4 text-xs">Salvar</Button>
                  <button onClick={() => setIsAddingRef(false)} className="text-zinc-500 hover:text-white text-xs px-1">✕</button>
                </div>
              ) : (
                <div className="flex gap-4">
                  <Button onClick={() => { setIsAddingRef(true); setNewRefType('link'); }} variant="outline" size="sm" className="gap-2 rounded-full px-4 border-white/10">
                    <Link2 className="w-3.5 h-3.5" /> Adicionar Link
                  </Button>
                  <Button onClick={() => { setIsAddingRef(true); setNewRefType('image'); }} variant="outline" size="sm" className="gap-2 rounded-full px-4 border-white/10">
                    <ImageIcon className="w-3.5 h-3.5" /> Adicionar Imagem
                  </Button>
                </div>
              )}
            </div>

            {/* Moodboard Creative Masonry/Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {(project.references || []).map((ref) => (
                <div 
                  key={ref.id} 
                  className="glass-card group/card overflow-hidden relative flex flex-col justify-between bg-obsidian/30 border border-white/5 hover:border-magma/20 transition-all h-80"
                >
                  <button 
                    onClick={(e) => deleteReference(ref.id, e)}
                    className="absolute top-3 right-3 bg-obsidian/80 border border-white/10 rounded-full p-2 opacity-0 group-hover/card:opacity-100 transition-opacity hover:text-magma hover:bg-obsidian z-30 shadow-lg"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-500" />
                  </button>

                  <div className="flex-1 overflow-hidden flex flex-col">
                    {ref.type === 'image' ? (
                      <div 
                        className="w-full h-48 bg-obsidian/60 relative overflow-hidden cursor-pointer flex items-center justify-center"
                        onClick={() => setSelectedImage(ref.url)}
                      >
                        <img 
                          src={ref.url} 
                          alt={ref.title} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-60" />
                        <Eye className="absolute bottom-3 right-3 w-4 h-4 text-white opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-white/5 border-b border-white/5 flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-magma/10 flex items-center justify-center text-magma">
                          <Link2 className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-mono">Link de Referência</p>
                          <a 
                            href={ref.url.startsWith('http') ? ref.url : `https://${ref.url}`}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-magma hover:underline flex items-center justify-center gap-1.5 font-semibold mt-1"
                          >
                            Ir para o site <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <h5 className="font-bold text-sm text-white tracking-tight line-clamp-1">{ref.title}</h5>
                        {ref.description && (
                          <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{ref.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {(!project.references || project.references.length === 0) && (
                <div className="col-span-full py-32 flex flex-col items-center justify-center text-zinc-600 glass-card border-dashed">
                  <LayoutGrid className="w-16 h-16 mb-6 opacity-10" />
                  <p className="font-mono text-[10px] uppercase tracking-[4px]">Moodboard Vazio</p>
                  <p className="text-sm mt-2 text-center max-w-sm">Insira referências visuais, paletas externas, frames inspiradores de outros filmes ou links de vídeos (YouTube/Vimeo) para alimentar o processo de criação.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal for large preview */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-obsidian/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-5xl w-full max-h-[85vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl z-10 flex items-center justify-center bg-obsidian"
            >
              <img src={selectedImage} alt="Referência" className="w-full h-full object-contain max-h-[85vh]" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-obsidian/80 border border-white/10 rounded-full flex items-center justify-center hover:text-magma hover:border-magma transition-all"
              >
                ✕
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Internal minimal button component matching App design
const Button = ({ 
  children, 
  variant = 'helios', 
  size = 'md', 
  className, 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { 
  variant?: 'helios' | 'outline' | 'ghost'; 
  size?: 'sm' | 'md' | 'lg' 
}) => {
  return (
    <button
      className={cn(
        "font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center text-[10px]",
        variant === 'helios' && "bg-magma text-white hover:bg-orange-600 shadow-[0_4px_15px_rgba(255,77,0,0.25)]",
        variant === 'outline' && "bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white",
        variant === 'ghost' && "text-zinc-500 hover:text-white hover:bg-white/5",
        size === 'sm' && "px-4 py-2 rounded-xl h-9",
        size === 'md' && "px-6 py-3.5 rounded-2xl h-12",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
