import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  User, 
  ChevronRight,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Volume2,
  Calendar,
  Clock,
  Film
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Project, Scene, Dialogue } from '../types';
import { AutocompleteTextArea } from './AutocompleteTextArea';
import { cn } from '../lib/utils';

interface DialogueTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export const DialogueTab = ({ project, onUpdate }: DialogueTabProps) => {
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(
    project.scenes && project.scenes.length > 0 ? project.scenes[0].id : null
  );

  const activeScene = (project.scenes || []).find(s => s.id === selectedSceneId);

  const addDialogue = () => {
    if (!activeScene) return;
    const dialogues = activeScene.dialogues ? [...activeScene.dialogues] : [];
    dialogues.push({
      id: Date.now().toString(),
      character: 'PERSONAGEM',
      text: '',
      parenthetical: ''
    });

    const updatedScenes = project.scenes.map(s => 
      s.id === activeScene.id ? { ...s, dialogues } : s
    );
    onUpdate({ scenes: updatedScenes });
  };

  const deleteDialogue = (dialogueId: string) => {
    if (!activeScene) return;
    const dialogues = (activeScene.dialogues || []).filter(d => d.id !== dialogueId);

    const updatedScenes = project.scenes.map(s => 
      s.id === activeScene.id ? { ...s, dialogues } : s
    );
    onUpdate({ scenes: updatedScenes });
  };

  const updateDialogue = (dialogueId: string, updates: Partial<Dialogue>) => {
    if (!activeScene) return;
    const dialogues = (activeScene.dialogues || []).map(d => 
      d.id === dialogueId ? { ...d, ...updates } : d
    );

    const updatedScenes = project.scenes.map(s => 
      s.id === activeScene.id ? { ...s, dialogues } : s
    );
    onUpdate({ scenes: updatedScenes });
  };

  const moveDialogue = (index: number, direction: 'up' | 'down') => {
    if (!activeScene) return;
    const dialogues = activeScene.dialogues ? [...activeScene.dialogues] : [];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIdx < 0 || targetIdx >= dialogues.length) return;
    
    const temp = dialogues[index];
    dialogues[index] = dialogues[targetIdx];
    dialogues[targetIdx] = temp;

    const updatedScenes = project.scenes.map(s => 
      s.id === activeScene.id ? { ...s, dialogues } : s
    );
    onUpdate({ scenes: updatedScenes });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div>
        <h3 className="cinematic-title text-5xl">Foco em Fala</h3>
        <p className="text-zinc-500 font-medium italic mt-2">Gerenciador de diálogos e falas com autocomplete inteligente.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Side: Scenes list */}
        <div className="lg:col-span-1 space-y-4">
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-2">Selecione a Cena</h4>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
            {(project.scenes || []).map((scene) => {
              const isSelected = scene.id === selectedSceneId;
              const dialogueCount = scene.dialogues ? scene.dialogues.length : 0;
              
              return (
                <button
                  key={scene.id}
                  onClick={() => setSelectedSceneId(scene.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group",
                    isSelected 
                      ? "bg-magma text-white border-magma shadow-lg shadow-magma/10" 
                      : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "font-mono text-sm font-bold opacity-30",
                      isSelected ? "text-white" : "text-zinc-500"
                    )}>
                      #{scene.number}
                    </span>
                    <span className="font-semibold text-xs truncate max-w-[150px]">
                      {scene.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border",
                      isSelected 
                        ? "border-white/20 bg-white/10 text-white" 
                        : "border-white/5 bg-white/5 text-zinc-500"
                    )}>
                      <MessageSquare className="w-2.5 h-2.5" />
                      {dialogueCount}
                    </span>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-transform",
                      isSelected ? "translate-x-0.5 text-white" : "text-zinc-600 group-hover:text-white"
                    )} />
                  </div>
                </button>
              );
            })}

            {(!project.scenes || project.scenes.length === 0) && (
              <p className="text-xs text-zinc-600 italic p-4 text-center">Nenhuma cena criada no roteiro ainda.</p>
            )}
          </div>
        </div>

        {/* Right Side: Dialogue Editor Desk */}
        <div className="lg:col-span-3 space-y-6">
          {activeScene ? (
            <div className="glass-card p-6 md:p-8 space-y-6">
              
              {/* Scene Info and Action Header */}
              <div className="border-b border-white/5 pb-6 space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] font-black tracking-widest text-magma uppercase">CENA #{activeScene.number}</span>
                    <h4 className="cinematic-title text-2xl text-white mt-1">{activeScene.title}</h4>
                  </div>
                  
                  {/* Miniature Slate display */}
                  <div className="flex items-center gap-3 bg-zinc-950 px-3 py-1.5 rounded-xl border border-white/5 font-mono text-[9px] uppercase text-zinc-400">
                    <span className="text-[7px] text-zinc-600 font-bold">SLATE:</span>
                    <span>ROLL: <strong className="text-white">{activeScene.roll || '--'}</strong></span>
                    <span className="text-zinc-800">|</span>
                    <span>SCENE: <strong className="text-white">{activeScene.slateScene || activeScene.number}</strong></span>
                    <span className="text-zinc-800">|</span>
                    <span>TAKE: <strong className="text-white">{activeScene.take || '--'}</strong></span>
                  </div>
                </div>

                {/* Inline Action/Script reference block */}
                {activeScene.script ? (
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-xs text-zinc-400 space-y-1">
                    <p className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Ação / Contexto da Cena</p>
                    <p className="italic leading-relaxed">{activeScene.script}</p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 italic">Sem descrição de ação para esta cena no roteiro.</p>
                )}
              </div>

              {/* Dialogue Cards */}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto custom-scrollbar pr-2">
                {(activeScene.dialogues || []).map((dialogue, idx) => (
                  <motion.div 
                    key={dialogue.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl transition-all space-y-4 relative group/dialogue"
                  >
                    {/* Controls overlay */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover/dialogue:opacity-100 transition-opacity">
                      <button 
                        onClick={() => moveDialogue(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 bg-obsidian border border-white/10 text-zinc-400 hover:text-white hover:border-magma/50 rounded-lg disabled:opacity-30 disabled:hover:border-white/10"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => moveDialogue(idx, 'down')}
                        disabled={idx === (activeScene.dialogues || []).length - 1}
                        className="p-1.5 bg-obsidian border border-white/10 text-zinc-400 hover:text-white hover:border-magma/50 rounded-lg disabled:opacity-30 disabled:hover:border-white/10"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteDialogue(dialogue.id)}
                        className="p-1.5 bg-obsidian border border-white/10 text-zinc-400 hover:text-red-500 hover:border-red-500/30 rounded-lg ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Character Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-magma" /> Personagem
                        </label>
                        <AutocompleteTextArea 
                          value={dialogue.character}
                          onChange={(val) => updateDialogue(dialogue.id, { character: val })}
                          placeholder="Nome do personagem..."
                          rows={1}
                          project={project}
                          className="h-9 px-3 py-2 bg-obsidian border border-white/5 font-bold uppercase tracking-wider text-white"
                        />
                      </div>

                      {/* Parenthetical / Entonação */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                          <Volume2 className="w-3 h-3" /> Parênteses (Entonação / Direção)
                        </label>
                        <input 
                          type="text"
                          value={dialogue.parenthetical || ''}
                          onChange={(e) => updateDialogue(dialogue.id, { parenthetical: e.target.value })}
                          placeholder="Ex: irritado, sussurrando, rindo..."
                          className="w-full h-9 bg-white/5 border border-white/5 rounded-2xl px-4 py-2 focus:outline-none focus:border-magma/50 transition-all text-xs text-zinc-400 italic"
                        />
                      </div>
                    </div>

                    {/* Speech Speech Text */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                        Fala / Diálogo (Dica: digite /p, /l ou /h)
                      </label>
                      <AutocompleteTextArea 
                        value={dialogue.text}
                        onChange={(val) => updateDialogue(dialogue.id, { text: val })}
                        placeholder="Digite a fala aqui... use /p para personagens, /l para locais ou /h para horários."
                        rows={2}
                        project={project}
                        className="bg-obsidian border border-white/5"
                      />
                    </div>
                  </motion.div>
                ))}

                {(!activeScene.dialogues || activeScene.dialogues.length === 0) && (
                  <div className="py-16 flex flex-col items-center justify-center text-zinc-600 glass-card border-dashed">
                    <MessageSquare className="w-12 h-12 mb-4 opacity-10" />
                    <p className="font-mono text-[10px] uppercase tracking-[4px]">Sem Diálogos</p>
                    <p className="text-sm mt-2 text-center max-w-xs">Clique no botão abaixo para adicionar a primeira fala deste personagem nesta cena!</p>
                  </div>
                )}
              </div>

              {/* Add Dialogue Button */}
              <button 
                onClick={addDialogue}
                className="w-full py-4 border border-dashed border-white/10 hover:border-magma/30 rounded-2xl text-zinc-500 hover:text-white transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-4 h-4" /> Adicionar Diálogo / Fala
              </button>

            </div>
          ) : (
            <div className="py-24 flex flex-col items-center justify-center text-zinc-600 glass-card border-dashed">
              <Sparkles className="w-12 h-12 mb-4 opacity-10" />
              <p className="font-mono text-[10px] uppercase tracking-[4px]">Selecione uma Cena</p>
              <p className="text-sm mt-2">Clique em alguma cena na barra lateral para carregar a mesa de falas.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
