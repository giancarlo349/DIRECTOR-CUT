import React, { useState, useEffect, useRef, Component } from 'react';
import { 
  Plus, 
  Film, 
  FileText, 
  Wand2, 
  Download, 
  Trash2, 
  ChevronRight, 
  ChevronLeft,
  Save, 
  ArrowLeft,
  User,
  MapPin,
  MessageSquare,
  Camera,
  Layers,
  Palette,
  Clock,
  Target,
  Sparkles,
  Edit3,
  AlertCircle,
  Mail,
  Lock,
  PenTool,
  BookOpen,
  Home,
  Layout,
  LayoutGrid,
  Code,
  Volume2,
  VolumeX,
  Maximize2,
  GripVertical,
  GripHorizontal,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { auth, googleProvider, db } from './firebase';
import { ref, set, onValue, push, remove, update } from 'firebase/database';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { cn } from './lib/utils';
import { Project, Scene, Character, Location, VFXNote, ProjectIdea, Dialogue, TimelineMarker, ProjectTimeline } from './types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// --- Background & Effects ---

const Background = () => (
  <>
    <div className="fluid-canvas">
      <div className="blob" style={{ top: '10%', left: '10%' }}></div>
      <div className="blob" style={{ bottom: '10%', right: '10%', animationDelay: '-5s', background: 'linear-gradient(45deg, #4400ff, #ff4d00)' }}></div>
    </div>

    <svg className="svg-fluid">
      <filter id="grainy">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" />
        <feColorMatrix type="saturate" values="0" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.1" />
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" filter="url(#grainy)" />
    </svg>
  </>
);

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Use requestAnimationFrame for smoother movement
        requestAnimationFrame(() => {
          if (cursorRef.current) {
            cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
          }
        });
      }
    };

    const handleMouseDown = () => {
      if (innerRef.current) innerRef.current.style.transform = 'translate(-50%, -50%) scale(0.8)';
    };

    const handleMouseUp = () => {
      if (innerRef.current) innerRef.current.style.transform = 'translate(-50%, -50%) scale(1)';
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div 
      ref={cursorRef}
      id="cursor"
      className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
    >
      <div 
        ref={innerRef}
        className="w-5 h-5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ease-out"
      />
    </div>
  );
};

// --- UI Components ---

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<any, any> {
  state: any;
  props: any;
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Algo deu errado</h2>
            <p className="text-zinc-500 mb-6">Ocorreu um erro inesperado. Por favor, recarregue a página.</p>
            <div className="bg-zinc-50 p-4 rounded-xl text-left mb-6 overflow-auto max-h-40">
              <code className="text-xs text-red-500">{this.state.error?.message}</code>
            </div>
            <Button onClick={() => window.location.reload()} className="w-full">Recarregar</Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function handleDatabaseError(error: any, operation: string, path: string) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operation,
    path,
    timestamp: Date.now()
  };
  console.error('Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className,
  disabled = false,
  type = 'button'
}: { 
  children: React.ReactNode; 
  onClick?: (e: React.MouseEvent) => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'helios' | 'action';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}) => {
  const variants = {
    primary: 'bg-white text-black hover:bg-magma hover:text-white border-transparent',
    secondary: 'bg-glass text-white hover:bg-white/10 border-border',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20',
    ghost: 'bg-transparent text-zinc-400 hover:text-white border-transparent',
    outline: 'bg-transparent text-white hover:bg-white/5 border-border',
    helios: 'bg-magma text-white hover:bg-lava-glow border-transparent shadow-[0_0_20px_rgba(255,77,0,0.3)]',
    action: 'action-btn w-full'
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-3 text-xs',
    lg: 'px-10 py-5 text-sm'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full font-extrabold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none border uppercase tracking-[2px]',
        variant === 'action' ? variants.action : cn(variants[variant], sizes[size]),
        className
      )}
    >
      {children}
    </button>
  );
};

const Input = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = 'text',
  className
}: { 
  label?: string; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
  type?: string;
  className?: string;
}) => (
  <div className={cn("flex flex-col gap-2 w-full", className)}>
    {label && <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-6 py-4 bg-glass border border-border rounded-2xl focus:outline-none focus:border-magma/50 transition-all placeholder:text-zinc-700 text-white font-medium"
    />
  </div>
);

const TextArea = ({ 
  label, 
  value, 
  onChange, 
  placeholder,
  rows = 3,
  className,
  inputClassName
}: { 
  label?: string; 
  value: string; 
  onChange: (val: string) => void; 
  placeholder?: string;
  rows?: number;
  className?: string;
  inputClassName?: string;
}) => (
  <div className={cn("flex flex-col gap-2 w-full", className)}>
    {label && <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">{label}</label>}
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cn(
        "w-full px-6 py-4 bg-glass border border-border rounded-2xl focus:outline-none focus:border-magma/50 transition-all placeholder:text-zinc-700 font-medium resize-none",
        !inputClassName?.includes('text-') && "text-white",
        inputClassName
      )}
    />
  </div>
);
const Writing = ({ project, onUpdate }: { project: Project, onUpdate: (updates: Partial<Project>) => void }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const audioPool = useRef<HTMLAudioElement[]>([]);
  const poolIndex = useRef(0);

  useEffect(() => {
    // Pre-load a pool of audio objects to prevent lag - Soft Pop style
    // Using a more stable URL for the pop sound
    const SOUND_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-simple-soft-click-1116.mp3';
    
    const sounds = Array.from({ length: 15 }, () => {
      const audio = new Audio(SOUND_URL);
      audio.volume = 0.05;
      // Pre-load the audio
      audio.load();
      return audio;
    });
    audioPool.current = sounds;
  }, []);

  const playTypewriterSound = () => {
    if (isAudioOn && audioPool.current.length > 0) {
      const audio = audioPool.current[poolIndex.current];
      
      // Only play if the audio is ready or at least not in an error state
      if (audio.readyState >= 2) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Silent catch to avoid console noise if browser blocks auto-play
        });
      }
      
      poolIndex.current = (poolIndex.current + 1) % audioPool.current.length;
    }
  };

  const writing = {
    story: project.writing?.story || '',
    structure: {
      beginning: project.writing?.structure?.beginning || '',
      middle: project.writing?.structure?.middle || '',
      end: project.writing?.structure?.end || '',
      plotPoints: project.writing?.structure?.plotPoints || []
    }
  };

  const updateWriting = (newWriting: any) => {
    onUpdate({ writing: newWriting });
  };

  const wordCount = writing.story.trim().split(/\s+/).filter(Boolean).length;
  const charCount = writing.story.length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "grid gap-8 transition-all duration-700",
        isFocusMode ? "fixed inset-0 z-[500] bg-[#0a0a0a] p-0 overflow-hidden" : "grid-cols-1 lg:grid-cols-3"
      )}
    >
      {isFocusMode ? (
        <div className="h-full flex flex-col relative">
          {/* Focus Mode Header */}
          <header className="p-12 flex items-start justify-between z-10">
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.4em]">UNTITLED MANUSCRIPT</p>
              <h2 className="text-sm font-mono font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-3">
                PROJECT: <span className="text-white">{project.title || 'GRAPHITE_01'}</span>
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest">
                  MODO FOCO ATIVO
                </span>
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsFocusMode(false);
                }}
                className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all z-[600]"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Focus Mode Content */}
          <main className="flex-1 flex flex-col items-center justify-center px-12 max-w-5xl mx-auto w-full">
            <div className="w-full relative group">
              <TextArea 
                value={writing.story}
                onChange={(val) => {
                  updateWriting({ ...writing, story: val });
                  playTypewriterSound();
                }}
                placeholder="Em um dia suave..."
                rows={15}
                className="bg-transparent border-none p-0"
                inputClassName="bg-transparent border-none p-0 text-2xl md:text-3xl font-light leading-relaxed text-zinc-200 placeholder:text-zinc-800 focus:ring-0 selection:bg-white/10 caret-white text-center"
              />
              
              {/* Centered Dot Indicator */}
              <div className="flex justify-center mt-12">
                <div className="w-2 h-2 bg-white rounded-full opacity-80 shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </div>
            </div>
          </main>

          {/* Focus Mode Footer Stats */}
          <footer className="p-12 space-y-8">
            <div className="h-[1px] w-full bg-white/5" />
            <div className="flex items-center gap-12 text-[10px] font-mono tracking-[0.2em]">
              <div className="flex items-center gap-3">
                <span className="text-zinc-600 uppercase">WORDS</span>
                <span className="text-white">{wordCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-600 uppercase">CHARACTERS</span>
                <span className="text-white">{charCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-zinc-600 uppercase">READ TIME</span>
                <span className="text-white">{readTime}m</span>
              </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="flex items-center justify-end">
              <button 
                onClick={() => setIsAudioOn(!isAudioOn)}
                className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2"
              >
                {isAudioOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                AUDIO: {isAudioOn ? 'ON' : 'OFF'}
              </button>
            </div>
          </footer>
        </div>
      ) : (
        <>
          <div className="lg:col-span-2 space-y-8">
            <div className="glass-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="cinematic-title text-3xl">A História</h3>
                <button 
                  onClick={() => setIsFocusMode(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full border bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 transition-all uppercase text-[10px] font-bold tracking-widest"
                >
                  <Maximize2 className="w-3 h-3" />
                  Modo Foco
                </button>
              </div>
              
              <TextArea 
                value={writing.story}
                onChange={(val) => updateWriting({ ...writing, story: val })}
                placeholder="Comece a escrever sua história aqui..."
                rows={25}
                inputClassName="text-base text-zinc-300"
              />
            </div>
          </div>

          <div className="space-y-8">
            <div className="glass-card p-8 space-y-6">
              <h4 className="cinematic-title text-xl">Estrutura Narrativa</h4>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-helios-orange" /> Início / Setup
                  </label>
                  <TextArea 
                    value={writing.structure.beginning}
                    onChange={(val) => updateWriting({ ...writing, structure: { ...writing.structure, beginning: val } })}
                    placeholder="Como tudo começa?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-helios-orange" /> Meio / Confronto
                  </label>
                  <TextArea 
                    value={writing.structure.middle}
                    onChange={(val) => updateWriting({ ...writing, structure: { ...writing.structure, middle: val } })}
                    placeholder="Qual o grande desafio?"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-helios-orange" /> Fim / Resolução
                  </label>
                  <TextArea 
                    value={writing.structure.end}
                    onChange={(val) => updateWriting({ ...writing, structure: { ...writing.structure, end: val } })}
                    placeholder="Como termina?"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="glass-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="cinematic-title text-xl">Pontos de Trama</h4>
                <Button variant="ghost" size="sm" onClick={() => {
                  const plotPoints = [...(writing.structure.plotPoints || []), ''];
                  updateWriting({ ...writing, structure: { ...writing.structure, plotPoints } });
                }}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {writing.structure.plotPoints.map((point, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={point}
                      onChange={(e) => {
                        const plotPoints = [...writing.structure.plotPoints];
                        plotPoints[idx] = e.target.value;
                        updateWriting({ ...writing, structure: { ...writing.structure, plotPoints } });
                      }}
                      placeholder={`Ponto ${idx + 1}`}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-helios-orange/30"
                    />
                    <button onClick={() => {
                      const plotPoints = writing.structure.plotPoints.filter((_, i) => i !== idx);
                      updateWriting({ ...writing, structure: { ...writing.structure, plotPoints } });
                    }}>
                      <Trash2 className="w-4 h-4 text-zinc-600 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

// --- Timeline Component ---

const Timeline = ({ project, onUpdate }: { project: Project, onUpdate: (updates: Partial<Project>) => void }) => {
  const timelines = project.timelines || [];
  const activeTimelineId = project.activeTimelineId || (timelines.length > 0 ? timelines[0].id : null);
  const activeTimeline = timelines.find(t => t.id === activeTimelineId) || (timelines.length > 0 ? timelines[0] : null);

  // Initialize if no timelines exist
  useEffect(() => {
    if (timelines.length === 0) {
      const initialTimeline: ProjectTimeline = {
        id: 'default',
        name: 'Timeline Principal',
        totalDurationSeconds: project.idea.totalDurationSeconds || 90,
        markers: project.markers || [],
        sceneIds: project.scenes.map(s => s.id)
      };
      onUpdate({ 
        timelines: [initialTimeline], 
        activeTimelineId: 'default' 
      });
    }
  }, [timelines.length]);

  const totalSeconds = activeTimeline?.totalDurationSeconds || 90;
  const activeScenes = (activeTimeline?.sceneIds || [])
    .map(id => project.scenes.find(s => s.id === id))
    .filter((s): s is Scene => !!s);
  const markers = Array.isArray(activeTimeline?.markers) ? activeTimeline.markers : [];
  
  const [hoveredSceneId, setHoveredSceneId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isAddingMarker, setIsAddingMarker] = useState(false);
  const [newMarkerLabel, setNewMarkerLabel] = useState('');
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [newTimelineName, setNewTimelineName] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineTrackRef = useRef<HTMLDivElement>(null);
  const markersTrackRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (timelineTrackRef.current) {
      const rect = timelineTrackRef.current.getBoundingClientRect();
      setHoverPosition({ 
        x: e.clientX - rect.left, 
        y: e.clientY - rect.top 
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const addTimeline = () => {
    if (newTimelineName.trim()) {
      const newTimeline: ProjectTimeline = {
        id: Date.now().toString(),
        name: newTimelineName.trim(),
        totalDurationSeconds: 90,
        markers: [],
        sceneIds: []
      };
      onUpdate({ 
        timelines: [...timelines, newTimeline],
        activeTimelineId: newTimeline.id
      });
      setNewTimelineName('');
      setIsAddingTimeline(false);
    }
  };

  const deleteTimeline = (id: string) => {
    const newTimelines = timelines.filter(t => t.id !== id);
    onUpdate({ 
      timelines: newTimelines,
      activeTimelineId: activeTimelineId === id ? (newTimelines[0]?.id || null) : activeTimelineId
    });
  };

  const addMarker = () => {
    if (newMarkerLabel.trim() && activeTimeline) {
      const newMarker: TimelineMarker = {
        id: Date.now().toString(),
        time: 0,
        label: newMarkerLabel.trim(),
        color: '#f27d26'
      };
      const currentMarkers = Array.isArray(activeTimeline.markers) ? activeTimeline.markers : [];
      const updatedTimeline = { ...activeTimeline, markers: [...currentMarkers, newMarker] };
      onUpdate({ timelines: timelines.map(t => t.id === activeTimelineId ? updatedTimeline : t) });
      setNewMarkerLabel('');
      setIsAddingMarker(false);
    }
  };

  const updateMarker = (id: string, time: number) => {
    if (!activeTimeline) return;
    const newMarkers = markers.map(m => m.id === id ? { ...m, time: Math.max(0, Math.min(totalSeconds, time)) } : m);
    const updatedTimeline = { ...activeTimeline, markers: newMarkers };
    onUpdate({ timelines: timelines.map(t => t.id === activeTimelineId ? updatedTimeline : t) });
  };

  const deleteMarker = (id: string) => {
    if (!activeTimeline) return;
    const updatedTimeline = { ...activeTimeline, markers: markers.filter(m => m.id !== id) };
    onUpdate({ timelines: timelines.map(t => t.id === activeTimelineId ? updatedTimeline : t) });
  };

  const updateSceneDuration = (sceneId: string, duration: number) => {
    const newScenes = project.scenes.map(s => s.id === sceneId ? { ...s, duration: Math.max(1, duration) } : s);
    onUpdate({ scenes: newScenes });
  };

  const handleReorder = (newOrder: Scene[]) => {
    if (!activeTimeline) return;
    const updatedTimeline = { ...activeTimeline, sceneIds: newOrder.map(s => s.id) };
    onUpdate({ timelines: timelines.map(t => t.id === activeTimelineId ? updatedTimeline : t) });
  };

  const toggleSceneInTimeline = (sceneId: string) => {
    if (!activeTimeline) return;
    const currentSceneIds = Array.isArray(activeTimeline.sceneIds) ? activeTimeline.sceneIds : [];
    const sceneIds = currentSceneIds.includes(sceneId)
      ? currentSceneIds.filter(id => id !== sceneId)
      : [...currentSceneIds, sceneId];
    const updatedTimeline = { ...activeTimeline, sceneIds };
    onUpdate({ timelines: timelines.map(t => t.id === activeTimelineId ? updatedTimeline : t) });
  };

  const usedSeconds = activeScenes.reduce((acc, s) => acc + (s.duration || 0), 0);
  const remainingSeconds = totalSeconds - usedSeconds;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="cinematic-title text-4xl">Timeline</h3>
          <p className="text-zinc-500 font-medium italic">Sincronização e ritmo da narrativa.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest mb-1">Duração Total</p>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                value={totalSeconds}
                onChange={(e) => {
                  if (activeTimeline) {
                    const updatedTimeline = { ...activeTimeline, totalDurationSeconds: parseInt(e.target.value) || 0 };
                    onUpdate({ timelines: timelines.map(t => t.id === activeTimelineId ? updatedTimeline : t) });
                  }
                }}
                className="text-3xl font-display bg-transparent border-none focus:outline-none text-right w-24 text-helios-orange"
              />
              <span className="text-sm font-bold text-zinc-500">SEC</span>
            </div>
          </div>
          {isAddingMarker ? (
            <div className="flex items-center gap-2 bg-helios-black border border-white/10 rounded-full p-1.5 shadow-2xl">
              <input 
                autoFocus
                placeholder="Nome do ponto..."
                value={newMarkerLabel}
                onChange={(e) => setNewMarkerLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addMarker();
                  if (e.key === 'Escape') setIsAddingMarker(false);
                }}
                className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-transparent focus:outline-none w-40 text-white"
              />
              <Button size="sm" variant="helios" onClick={addMarker} className="rounded-full px-4">Add</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsAddingMarker(false)} className="text-zinc-500 hover:text-white">×</Button>
            </div>
          ) : (
            <Button onClick={() => setIsAddingMarker(true)} variant="outline" className="gap-3 rounded-full px-6 border-white/10 hover:bg-white/5">
              <Plus className="w-4 h-4" /> Ponto Chave
            </Button>
          )}
        </div>
      </div>

      {/* Timeline Tabs */}
      <div className="flex items-center gap-3 p-2 bg-white/5 rounded-3xl border border-white/10 w-fit mb-8">
        {timelines.map(t => (
          <div key={t.id} className="flex items-center gap-1">
            <button
              onClick={() => onUpdate({ activeTimelineId: t.id })}
              className={cn(
                "px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTimelineId === t.id 
                  ? "bg-magma text-white shadow-[0_10px_20px_rgba(255,77,0,0.2)]" 
                  : "text-zinc-500 hover:text-white hover:bg-white/5"
              )}
            >
              {t.name}
            </button>
            {timelines.length > 1 && (
              <button 
                onClick={() => deleteTimeline(t.id)}
                className="w-8 h-8 rounded-xl text-zinc-600 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
        <div className="w-[1px] h-6 bg-white/10 mx-2" />
        {isAddingTimeline ? (
          <div className="flex items-center gap-2 pr-2">
            <input 
              autoFocus
              placeholder="Nova Timeline..."
              value={newTimelineName}
              onChange={(e) => setNewTimelineName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addTimeline();
                if (e.key === 'Escape') setIsAddingTimeline(false);
              }}
              className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-transparent focus:outline-none w-32 text-white border-b border-magma/50"
            />
            <Button size="sm" variant="helios" onClick={addTimeline} className="rounded-xl h-8 px-3 text-[9px]">Add</Button>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingTimeline(true)}
            className="px-4 py-2.5 rounded-2xl text-[10px] font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> NOVA
          </button>
        )}
      </div>

      {/* Visual Timeline */}
      <div ref={timelineTrackRef} className="glass-card p-10 overflow-visible relative">
        {/* Time Rulers */}
        <div className="flex justify-between mb-6 px-2">
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <div key={p} className="flex flex-col items-center gap-2">
              <div className="w-[1px] h-2 bg-white/20" />
              <span className="text-[10px] font-mono text-zinc-500 tracking-tighter">{formatTime(totalSeconds * p)}</span>
            </div>
          ))}
        </div>

        {/* Timeline Track */}
        <div className="relative h-32 bg-white/5 rounded-2xl border border-white/5 flex overflow-visible">
          <Reorder.Group 
            axis="x" 
            values={activeScenes} 
            onReorder={handleReorder}
            className="flex h-full w-full"
          >
            {activeScenes.map((scene, i) => (
              <Reorder.Item 
                key={scene.id}
                value={scene}
                style={{ width: `${((scene.duration || 10) / totalSeconds) * 100}%` }}
                className={cn(
                  "h-full border-r border-white/10 flex flex-col items-center justify-center p-2 group relative cursor-grab active:cursor-grabbing overflow-hidden",
                  !scene.color && (i % 2 === 0 ? "bg-zinc-800" : "bg-zinc-900")
                )}
                onMouseEnter={(e) => {
                  setHoveredSceneId(scene.id);
                  handleMouseMove(e);
                }}
                onMouseLeave={() => setHoveredSceneId(null)}
                onMouseMove={handleMouseMove}
              >
                {/* Custom Color Background */}
                {scene.color && (
                  <div 
                    className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity"
                    style={{ backgroundColor: scene.color }}
                  />
                )}

                <div className="relative z-10 flex flex-col items-center">
                  <span className="text-[10px] font-black opacity-30 truncate w-full text-center uppercase tracking-widest">#{scene.number}</span>
                  <span className="text-xs font-bold truncate w-full text-center mt-1">{scene.title}</span>
                  <span className="text-[10px] font-mono opacity-40 mt-1">{scene.duration || 0}s</span>
                </div>
                
                {/* Resize Handle */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-helios-orange/50 z-20 transition-colors"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const startX = e.clientX;
                    const startDuration = scene.duration || 10;
                    const trackWidth = (e.currentTarget.parentElement!.parentElement! as HTMLElement).offsetWidth;
                    
                    const onMouseMove = (moveEvent: MouseEvent) => {
                      const deltaX = moveEvent.clientX - startX;
                      const deltaSeconds = (deltaX / trackWidth) * totalSeconds;
                      updateSceneDuration(scene.id, Math.max(1, startDuration + deltaSeconds));
                    };
                    
                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);
                    };
                    
                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  }}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
          {remainingSeconds > 0 && (
            <div 
              style={{ width: `${(remainingSeconds / totalSeconds) * 100}%` }}
              className="h-full bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center text-zinc-600"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest italic">Vazio ({remainingSeconds}s)</span>
            </div>
          )}
        </div>

        {/* Hover Preview Card */}
        <AnimatePresence>
          {hoveredSceneId && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{ 
                position: 'absolute',
                left: hoverPosition.x,
                top: hoverPosition.y - 20,
                zIndex: 100,
                transform: 'translate(-50%, -100%)'
              }}
              className="w-72 glass-card p-6 pointer-events-none shadow-2xl border-magma/30 bg-obsidian/90 backdrop-blur-3xl"
            >
              {(() => {
                const scene = project.scenes.find(s => s.id === hoveredSceneId);
                if (!scene) return null;
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-helios-orange uppercase tracking-[0.2em]">Cena #{scene.number}</span>
                      <span className="text-[10px] font-mono bg-white/10 px-3 py-1 rounded-full text-white">{scene.duration}s</span>
                    </div>
                    <h4 className="cinematic-title text-xl leading-tight">{scene.title}</h4>
                    {scene.visualPreview ? (
                      <div className="aspect-video bg-white/5 rounded-xl overflow-hidden border border-white/10">
                        <img src={scene.visualPreview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : null}
                    {scene.script && (
                      <p className="text-xs text-zinc-400 line-clamp-3 italic leading-relaxed">"{scene.script}"</p>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Markers Track */}
        <div 
          ref={markersTrackRef} 
          className="relative h-12 mt-8 bg-white/5 rounded-2xl border border-dashed border-white/10 cursor-crosshair group/track"
          onClick={(e) => {
            if (e.target === markersTrackRef.current && activeTimeline) {
              const rect = markersTrackRef.current.getBoundingClientRect();
              const relativeX = e.clientX - rect.left;
              const time = (relativeX / rect.width) * totalSeconds;
              
              const newMarker: TimelineMarker = {
                id: Date.now().toString(),
                time: Math.max(0, Math.min(totalSeconds, time)),
                label: `Ponto ${markers.length + 1}`,
                color: '#f27d26'
              };
              const updatedTimeline = { ...activeTimeline, markers: [...activeTimeline.markers, newMarker] };
              onUpdate({ timelines: timelines.map(t => t.id === activeTimelineId ? updatedTimeline : t) });
            }
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/track:opacity-100 transition-opacity pointer-events-none">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Clique para adicionar ponto chave</p>
          </div>
          {markers.map((marker) => (
            <motion.div 
              key={marker.id}
              drag="x"
              dragConstraints={markersTrackRef}
              dragElastic={0}
              dragMomentum={false}
              onDragEnd={(e, info) => {
                if (!markersTrackRef.current) return;
                const rect = markersTrackRef.current.getBoundingClientRect();
                const relativeX = info.point.x - rect.left;
                const newTime = (relativeX / rect.width) * totalSeconds;
                updateMarker(marker.id, newTime);
              }}
              style={{ left: `${(marker.time / totalSeconds) * 100}%` }}
              className="absolute top-0 flex flex-col items-center group cursor-grab active:cursor-grabbing z-20 -translate-x-1/2"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-1 h-6 bg-helios-orange rounded-full shadow-lg shadow-helios-orange/20" />
              <div className="bg-helios-orange text-helios-black text-[10px] font-black px-3 py-1 rounded-full whitespace-nowrap shadow-xl translate-y-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all border border-white/20">
                {marker.label} ({formatTime(marker.time)})
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMarker(marker.id);
                }}
                className="absolute -top-10 bg-helios-black border border-white/10 rounded-full p-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all shadow-2xl hover:bg-red-500 group/trash"
              >
                <Trash2 className="w-3 h-3 text-red-500 group-hover/trash:text-white" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8">
          <h4 className="cinematic-title text-xl mb-6 flex items-center gap-3">
            <Layers className="w-5 h-5 text-helios-orange" /> Gerenciar Cenas nesta Timeline
          </h4>
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {project.scenes.map((scene) => (
              <div 
                key={scene.id} 
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                  activeTimeline?.sceneIds.includes(scene.id)
                    ? "bg-magma/10 border-magma/30"
                    : "bg-white/5 border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100"
                )}
                onClick={() => toggleSceneInTimeline(scene.id)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black opacity-20">#{scene.number}</span>
                  <p className="text-sm font-bold text-white">{scene.title}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-zinc-500">{scene.duration || 0}s</span>
                  <div className={cn(
                    "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                    activeTimeline?.sceneIds.includes(scene.id)
                      ? "bg-magma border-magma text-white"
                      : "border-white/20"
                  )}>
                    {activeTimeline?.sceneIds.includes(scene.id) && <Plus className="w-3 h-3 rotate-45" />}
                  </div>
                </div>
              </div>
            ))}
            {project.scenes.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-600">
                <Edit3 className="w-10 h-10 mb-3 opacity-10" />
                <p className="text-sm italic">Adicione cenas no roteiro para vê-las aqui.</p>
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-8">
          <h4 className="cinematic-title text-xl mb-6 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-helios-orange" /> Pontos Chaves (Markers)
          </h4>
          <div className="space-y-4">
            {markers.map((marker) => (
              <div key={marker.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-helios-orange/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-helios-orange shadow-[0_0_10px_rgba(242,125,38,0.5)]" />
                  <input 
                    value={marker.label}
                    onChange={(e) => {
                      const newMarkers = markers.map(m => m.id === marker.id ? { ...m, label: e.target.value } : m);
                      const updatedTimeline = { ...activeTimeline!, markers: newMarkers };
                      onUpdate({ timelines: timelines.map(t => t.id === activeTimelineId ? updatedTimeline : t) });
                    }}
                    className="bg-transparent border-none focus:outline-none text-sm font-bold text-white w-full"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-mono text-helios-orange">{formatTime(marker.time)}</span>
                  <button onClick={() => deleteMarker(marker.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {markers.length === 0 && (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-600">
                <Target className="w-10 h-10 mb-3 opacity-10" />
                <p className="text-sm italic">Nenhum ponto chave definido.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-8">
        <h4 className="cinematic-title text-xl mb-6 flex items-center gap-3">
          <Clock className="w-5 h-5 text-helios-orange" /> Resumo de Tempo
        </h4>
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tempo Utilizado</span>
              <p className="text-3xl font-display text-white">{formatTime(usedSeconds)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tempo Restante</span>
              <p className={cn("text-3xl font-display", remainingSeconds < 0 ? "text-red-500" : "text-helios-orange")}>
                {formatTime(remainingSeconds)}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (usedSeconds / totalSeconds) * 100)}%` }}
                className={cn("h-full transition-all", usedSeconds > totalSeconds ? "bg-red-500" : "bg-helios-orange")}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              <span>0:00</span>
              <span>{formatTime(totalSeconds)}</span>
            </div>
          </div>

          {remainingSeconds < 0 && (
            <div className="flex items-center gap-4 bg-red-500/10 border border-red-500/20 p-5 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <p className="text-xs text-red-200 font-medium leading-relaxed">
                Atenção: A duração das cenas excede o tempo total do projeto em {Math.abs(remainingSeconds)}s.
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const IdeaTab = ({ project, onUpdate }: { project: Project, onUpdate: (updates: Partial<Project>) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2 space-y-8">
        <section className="glass-card p-8">
          <h3 className="cinematic-title text-2xl mb-8 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-magma" /> Conceito Geral
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Input 
              label="Tema / Premissa" 
              value={project.idea.theme || ''} 
              onChange={(val) => onUpdate({ idea: { ...project.idea, theme: val } })}
              placeholder="Sobre o que é a história?"
            />
            <Input 
              label="Público Alvo" 
              value={project.idea.targetAudience || ''} 
              onChange={(val) => onUpdate({ idea: { ...project.idea, targetAudience: val } })}
              placeholder="Quem vai assistir?"
            />
            <Input 
              label="Duração Estimada" 
              value={project.idea.duration || ''} 
              onChange={(val) => onUpdate({ idea: { ...project.idea, duration: val } })}
              placeholder="Ex: 5 min"
            />
            <div className="flex flex-col gap-2 w-full">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] ml-1">Duração em Segundos (Timeline)</label>
              <input 
                type="number"
                value={project.idea.totalDurationSeconds || 90}
                onChange={(e) => onUpdate({ idea: { ...project.idea, totalDurationSeconds: parseInt(e.target.value) || 0 } })}
                className="w-full px-6 py-4 bg-glass border border-border rounded-2xl focus:outline-none focus:border-magma/50 transition-all placeholder:text-zinc-700 text-white font-medium"
              />
            </div>
            <Input 
              label="Vibe / Atmosfera" 
              value={project.idea.vibe || ''} 
              onChange={(val) => onUpdate({ idea: { ...project.idea, vibe: val } })}
              placeholder="Ex: Sombrio, Melancólico, Energético"
            />
          </div>
          <div className="mt-8">
            <TextArea 
              label="Notas de Direção" 
              value={project.idea.notes || ''} 
              onChange={(val) => onUpdate({ idea: { ...project.idea, notes: val } })}
              placeholder="Visão geral, estilo de câmera, referências..."
              rows={6}
            />
          </div>
        </section>

        <section className="glass-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="cinematic-title text-2xl flex items-center gap-3">
              <Palette className="w-6 h-6 text-magma" /> Paleta de Cores
            </h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const color = '#000000';
                const colors = [...(project.idea.colors || []), color];
                onUpdate({ idea: { ...project.idea, colors } });
              }}
            >
              Adicionar Cor
            </Button>
          </div>
          <div className="flex flex-wrap gap-6">
            {(project.idea?.colors || []).map((color, i) => (
              <div key={i} className="group relative">
                <input 
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const colors = project.idea.colors.map((c, idx) => idx === i ? e.target.value : c);
                    onUpdate({ idea: { ...project.idea, colors } });
                  }}
                  className="w-20 h-20 rounded-2xl border border-white/10 shadow-inner cursor-pointer overflow-hidden p-0 bg-transparent"
                />
                <button 
                  onClick={() => {
                    const colors = project.idea.colors.filter((_, idx) => idx !== i);
                    onUpdate({ idea: { ...project.idea, colors } });
                  }}
                  className="absolute -top-2 -right-2 bg-helios-black border border-white/10 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-xl"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
                <p className="text-[10px] font-mono mt-2 text-center text-zinc-500 uppercase tracking-tighter">{color}</p>
              </div>
            ))}
            {project.idea.colors.length === 0 && (
              <p className="text-sm text-zinc-500 italic">Nenhuma cor definida ainda.</p>
            )}
          </div>
        </section>
      </div>

      <div className="space-y-8">
        <section className="glass-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="cinematic-title text-xl flex items-center gap-3">
              <User className="w-5 h-5 text-magma" /> Personagens
            </h3>
            <Button variant="ghost" size="sm" onClick={() => {
              const characters = [...(project.characters || []), { id: Date.now().toString(), name: 'Novo Personagem', traits: '', description: '' }];
              onUpdate({ characters });
            }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {(project.characters || []).map((char) => (
              <div key={char.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 group relative">
                <div className="flex justify-between items-center mb-2">
                  <input 
                    value={char.name}
                    onChange={(e) => {
                      const characters = project.characters.map(c => c.id === char.id ? { ...c, name: e.target.value } : c);
                      onUpdate({ characters });
                    }}
                    className="font-bold text-sm bg-transparent border-none focus:outline-none w-full text-white"
                    placeholder="Nome"
                  />
                  <button onClick={() => {
                    const characters = project.characters.filter(c => c.id !== char.id);
                    onUpdate({ characters });
                  }}>
                    <Trash2 className="w-3 h-3 text-zinc-600 hover:text-magma" />
                  </button>
                </div>
                <input 
                  placeholder="Traços (ex: Tímido, Corajoso)"
                  value={char.traits}
                  onChange={(e) => {
                    const characters = project.characters.map(c => c.id === char.id ? { ...c, traits: e.target.value } : c);
                    onUpdate({ characters });
                  }}
                  className="text-xs bg-transparent border-none focus:outline-none w-full text-zinc-500 italic"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="glass-card p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="cinematic-title text-xl flex items-center gap-3">
              <MapPin className="w-5 h-5 text-magma" /> Locais
            </h3>
            <Button variant="ghost" size="sm" onClick={() => {
              const locations = [...(project.locations || []), { id: Date.now().toString(), name: 'Novo Local', description: '' }];
              onUpdate({ locations });
            }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {(project.locations || []).map((loc) => (
              <div key={loc.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 group relative">
                <div className="flex justify-between items-center mb-2">
                  <input 
                    value={loc.name}
                    onChange={(e) => {
                      const locations = project.locations.map(l => l.id === loc.id ? { ...l, name: e.target.value } : l);
                      onUpdate({ locations });
                    }}
                    className="font-bold text-sm bg-transparent border-none focus:outline-none w-full text-white"
                    placeholder="Nome do Local"
                  />
                  <button onClick={() => {
                    const locations = project.locations.filter(l => l.id !== loc.id);
                    onUpdate({ locations });
                  }}>
                    <Trash2 className="w-3 h-3 text-zinc-600 hover:text-magma" />
                  </button>
                </div>
                <input 
                  placeholder="Descrição breve..."
                  value={loc.description}
                  onChange={(e) => {
                    const locations = project.locations.map(l => l.id === loc.id ? { ...l, description: e.target.value } : l);
                    onUpdate({ locations });
                  }}
                  className="text-xs bg-transparent border-none focus:outline-none w-full text-zinc-500 italic"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </motion.div>
  );
};

const ScriptTab = ({ project, onUpdate, handleReorderScenes }: { project: Project, onUpdate: (updates: Partial<Project>) => void, handleReorderScenes: (newScenes: Scene[]) => void }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 500;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // Handle wheel scroll to horizontal
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      const onWheel = (e: WheelEvent) => {
        if (e.deltaY === 0) return;
        e.preventDefault();
        el.scrollBy({
          left: e.deltaY * 2,
          behavior: 'auto'
        });
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => el.removeEventListener('wheel', onWheel);
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="cinematic-title text-5xl">Roteiro</h3>
          <p className="text-zinc-500 font-medium italic mt-2">A alma visual e narrativa do seu filme.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/5">
            <Button 
              onClick={() => scroll('left')} 
              variant="ghost" 
              size="sm" 
              className="rounded-full hover:bg-white/10 text-zinc-400 hover:text-white w-10 h-10 p-0 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button 
              onClick={() => scroll('right')} 
              variant="ghost" 
              size="sm" 
              className="rounded-full hover:bg-white/10 text-zinc-400 hover:text-white w-10 h-10 p-0 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <Button onClick={() => {
            const scenes = [...(project.scenes || [])];
            scenes.push({
              id: Date.now().toString(),
              number: scenes.length + 1,
              title: `Cena ${scenes.length + 1}`,
              visualPreview: '',
              cameraPerspective: '',
              script: '',
              dialogues: [],
              duration: 10,
              order: scenes.length,
              color: '#151515'
            });
            onUpdate({ scenes });
          }} variant="helios" className="gap-3 h-14 px-8">
            <Plus className="w-5 h-5" /> Adicionar Cena
          </Button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="w-full overflow-x-auto custom-scrollbar pb-10 -mx-4 px-4"
      >
        <Reorder.Group 
          axis="x" 
          values={project.scenes || []} 
          onReorder={handleReorderScenes}
          className="flex gap-8 pb-8 snap-x min-w-max items-start"
        >
          {(project.scenes || []).map((scene, index) => (
            <Reorder.Item 
              key={scene.id} 
              value={scene}
              className="glass-card overflow-hidden relative group/scene h-fit min-w-[450px] w-[450px] snap-center flex-shrink-0 cursor-grab active:cursor-grabbing hover:border-magma/30 transition-colors"
            >
            <div className="absolute top-0 left-0 w-full h-1.5 transition-colors" style={{ backgroundColor: scene.color || '#F27D26' }} />
            
            <div className="bg-white/5 px-6 py-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-4">
                <GripHorizontal className="w-4 h-4 text-zinc-700 cursor-grab active:cursor-grabbing" />
                <span className="text-2xl font-display opacity-10 tracking-tighter">#{scene.number}</span>
                <input 
                  value={scene.title}
                  onChange={(e) => {
                    const scenes = project.scenes.map(s => s.id === scene.id ? { ...s, title: e.target.value } : s);
                    onUpdate({ scenes });
                  }}
                  className="bg-transparent border-none focus:outline-none cinematic-title text-lg p-0 text-white w-full"
                  placeholder="Título da Cena"
                />
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => {
                  const scenes = project.scenes.filter(s => s.id !== scene.id).map((s, i) => ({ ...s, number: i + 1 }));
                  onUpdate({ scenes });
                }} className="text-zinc-600 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Camera className="w-3 h-3" /> Câmera
                  </label>
                  <input 
                    placeholder="Perspectiva..."
                    value={scene.cameraPerspective}
                    onChange={(e) => {
                      const scenes = project.scenes.map(s => s.id === scene.id ? { ...s, cameraPerspective: e.target.value } : s);
                      onUpdate({ scenes });
                    }}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 focus:outline-none focus:border-magma/50 transition-all text-xs font-medium text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Duração
                  </label>
                  <input 
                    type="number"
                    value={scene.duration}
                    onChange={(e) => {
                      const scenes = project.scenes.map(s => s.id === scene.id ? { ...s, duration: parseInt(e.target.value) || 0 } : s);
                      onUpdate({ scenes });
                    }}
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 focus:outline-none focus:border-magma/50 transition-all text-xs font-medium text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <ImageIcon className="w-3 h-3" /> Preview Visual
                </label>
                <div 
                  className="aspect-video bg-obsidian/50 rounded-2xl border border-dashed border-white/5 flex items-center justify-center overflow-hidden group/thumb relative"
                  onClick={() => document.getElementById(`file-${scene.id}`)?.click()}
                >
                  {scene.visualPreview ? (
                    <img src={scene.visualPreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-zinc-700 group-hover/thumb:text-zinc-400 transition-colors">
                      <Plus className="w-6 h-6" />
                      <span className="text-[8px] font-bold uppercase tracking-widest">Upload Frame</span>
                    </div>
                  )}
                  <input 
                    id={`file-${scene.id}`}
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const scenes = project.scenes.map(s => s.id === scene.id ? { ...s, visualPreview: reader.result as string } : s);
                          onUpdate({ scenes });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <PenTool className="w-3 h-3" /> Roteiro / Ação
                </label>
                <TextArea 
                  value={scene.script}
                  onChange={(val) => {
                    const scenes = project.scenes.map(s => s.id === scene.id ? { ...s, script: val } : s);
                    onUpdate({ scenes });
                  }}
                  placeholder="Descreva a ação..."
                  rows={4}
                  className="text-xs bg-white/5 border-white/5 rounded-xl"
                />
              </div>
            </div>
          </Reorder.Item>
        ))}
      </Reorder.Group>
      </div>

      {project.scenes.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-600 glass-card border-dashed">
          <Edit3 className="w-12 h-12 mb-4 opacity-10" />
          <p className="font-mono text-[10px] uppercase tracking-[4px]">Nenhuma cena criada</p>
          <p className="text-sm mt-2">Clique em "Adicionar Cena" para começar o roteiro.</p>
        </div>
      )}
    </motion.div>
  );
};

const VFXTab = ({ project, onUpdate }: { project: Project, onUpdate: (updates: Partial<Project>) => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="cinematic-title text-5xl">VFX & Efeitos</h3>
          <p className="text-zinc-500 font-medium italic mt-2">Pós-produção e magia digital.</p>
        </div>
        <Button onClick={() => {
          const vfxNotes = [...(project.vfxNotes || [])];
          vfxNotes.push({
            id: Date.now().toString(),
            sceneId: '',
            description: '',
            type: 'Color Grading'
          });
          onUpdate({ vfxNotes });
        }} variant="helios" className="gap-3 h-14 px-8">
          <Sparkles className="w-5 h-5" /> Nova Nota VFX
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {(project.vfxNotes || []).map((note) => (
          <div key={note.id} className="glass-card p-8 space-y-6 relative group">
            <div className="flex justify-between items-center">
              <select 
                value={note.type}
                onChange={(e) => {
                  const vfxNotes = project.vfxNotes.map(n => n.id === note.id ? { ...n, type: e.target.value } : n);
                  onUpdate({ vfxNotes });
                }}
                className="text-[10px] font-bold uppercase tracking-widest bg-obsidian text-white px-4 py-2 rounded-full border border-white/10 focus:outline-none focus:border-magma/50 transition-all"
              >
                <option value="Color Grading">Color Grading</option>
                <option value="CGI">CGI</option>
                <option value="Practical">Efeito Prático</option>
                <option value="Sound Design">Sound Design</option>
                <option value="Transition">Transição</option>
              </select>
              <button onClick={() => {
                const vfxNotes = project.vfxNotes.filter(n => n.id !== note.id);
                onUpdate({ vfxNotes });
              }} className="text-zinc-700 hover:text-magma transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 block">Cena Vinculada</label>
                <select 
                  value={note.sceneId}
                  onChange={(e) => {
                    const vfxNotes = project.vfxNotes.map(n => n.id === note.id ? { ...n, sceneId: e.target.value } : n);
                    onUpdate({ vfxNotes });
                  }}
                  className="w-full text-xs font-bold bg-white/5 border border-white/5 px-4 py-3 rounded-xl focus:outline-none focus:border-magma/50 transition-all text-white"
                >
                  <option value="">Nenhuma cena específica</option>
                  {project.scenes.map(s => (
                    <option key={s.id} value={s.id}>Cena #{s.number}: {s.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 block">Descrição do Efeito</label>
                <TextArea 
                  value={note.description}
                  onChange={(val) => {
                    const vfxNotes = project.vfxNotes.map(n => n.id === note.id ? { ...n, description: val } : n);
                    onUpdate({ vfxNotes });
                  }}
                  placeholder="Explique o que precisa ser feito..."
                  rows={4}
                />
              </div>
            </div>
          </div>
        ))}

        {project.vfxNotes.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-zinc-600 glass-card border-dashed">
            <Wand2 className="w-16 h-16 mb-6 opacity-10" />
            <p className="font-mono text-[10px] uppercase tracking-[4px]">Nenhuma nota de VFX</p>
            <p className="text-sm mt-2 italic">Planeje seus efeitos especiais e pós-produção aqui.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// --- Main App ---

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'writing' | 'idea' | 'script' | 'timeline' | 'vfx'>('writing');
  const [loading, setLoading] = useState(true);

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const currentProject = projects.find(p => p.id === currentProjectId);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setProjects([]);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Test connection
    const testRef = ref(db, '.info/connected');
    onValue(testRef, (snapshot) => {
      if (snapshot.val() === false) {
        console.warn("Realtime Database is offline.");
      }
    });

    const projectsRef = ref(db, `users/${user.uid}/projects`);
    const unsubscribe = onValue(projectsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const projectList = Object.keys(data).map(key => {
            const project = data[key];
            return {
              ...project,
              id: key,
              idea: {
                theme: '',
                targetAudience: '',
                duration: '1:30',
                totalDurationSeconds: 90,
                vibe: '',
                colors: [],
                notes: '',
                ...(project.idea || {})
              },
              scenes: project.scenes ? Object.values(project.scenes).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [],
              characters: project.characters ? Object.values(project.characters) : [],
              locations: project.locations ? Object.values(project.locations) : [],
              vfxNotes: project.vfxNotes ? Object.values(project.vfxNotes) : [],
              markers: project.markers ? Object.values(project.markers) : [],
              timelines: project.timelines ? Object.values(project.timelines).map((t: any) => ({
                ...t,
                markers: t.markers ? Object.values(t.markers) : [],
                sceneIds: t.sceneIds ? Object.values(t.sceneIds) : []
              })) : [],
              activeTimelineId: project.activeTimelineId || null,
            };
          });
          setProjects(projectList as Project[]);
        } else {
          setProjects([]);
        }
        setLoading(false);
      } catch (error) {
        handleDatabaseError(error, 'LIST', 'projects');
      }
    }, (error) => {
      handleDatabaseError(error, 'LIST', 'projects');
    });

    return () => unsubscribe();
  }, [user]);

  const handleReorderScenes = (newOrder: Scene[]) => {
    const updatedScenes = newOrder.map((scene, index) => ({
      ...scene,
      number: index + 1,
      order: index
    }));
    updateProject({ scenes: updatedScenes });
  };

  const login = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login Error:", error);
      setAuthError(error.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentProjectId(null);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const createProject = async () => {
    if (!user) return;
    try {
      const projectsRef = ref(db, `users/${user.uid}/projects`);
      const newProjectRef = push(projectsRef);
      const newProject: Partial<Project> = {
        title: 'Novo Projeto Helios',
        userId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        idea: {
          theme: '',
          targetAudience: '',
          duration: '1:30',
          totalDurationSeconds: 90,
          vibe: '',
          colors: [],
          notes: ''
        },
        scenes: [],
        characters: [],
        locations: [],
        vfxNotes: [],
        markers: [],
        timelines: [],
        activeTimelineId: null
      };
      await set(newProjectRef, newProject);
      setCurrentProjectId(newProjectRef.key);
    } catch (error) {
      handleDatabaseError(error, 'CREATE', 'projects');
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);

  const deleteProject = async (id: string) => {
    if (!user) return;
    try {
      await remove(ref(db, `users/${user.uid}/projects/${id}`));
      if (currentProjectId === id) setCurrentProjectId(null);
      setShowDeleteModal(null);
    } catch (error) {
      handleDatabaseError(error, 'DELETE', `projects/${id}`);
    }
  };

  const updateProject = async (updates: Partial<Project>) => {
    if (!currentProjectId || !user) return;
    try {
      await update(ref(db, `users/${user.uid}/projects/${currentProjectId}`), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleDatabaseError(error, 'UPDATE', `projects/${currentProjectId}`);
    }
  };

  const exportPDF = async () => {
    if (!currentProject) return;
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const addText = (text: string, size: number = 12, style: string = 'normal', color: [number, number, number] = [30, 30, 30]) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', style);
      pdf.setTextColor(color[0], color[1], color[2]);
      const lines = pdf.splitTextToSize(text, pageWidth - (margin * 2));
      
      // Check for page overflow
      const textHeight = lines.length * (size * 0.5);
      if (y + textHeight > 270) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(lines, margin, y);
      y += textHeight + 5;
    };

    const addLine = (color: [number, number, number] = [230, 230, 230]) => {
      pdf.setDrawColor(color[0], color[1], color[2]);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;
    };

    const addSectionHeader = (title: string) => {
      y += 10;
      addText(title, 18, 'bold', [255, 77, 0]);
      addLine([255, 77, 0]);
    };

    // Title Page
    pdf.setFillColor(10, 10, 10);
    pdf.rect(0, 0, pageWidth, 297, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(48);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(currentProject.title.toUpperCase(), pageWidth - 40);
    pdf.text(titleLines, margin, 100);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(150, 150, 150);
    pdf.text('ROTEIRO ORIGINAL & DOCUMENTAÇÃO TÉCNICA', margin, 120);
    
    pdf.setDrawColor(255, 77, 0);
    pdf.setLineWidth(1);
    pdf.line(margin, 125, margin + 50, 125);

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`CRIADO EM: ${new Date(currentProject.createdAt).toLocaleDateString()}`, margin, 260);
    pdf.text(`AUTOR: ${user.displayName?.toUpperCase() || 'DIRETOR'}`, margin, 265);
    
    pdf.addPage();
    y = 25;

    // 1. Idea / Concept
    addSectionHeader('01. CONCEITO GERAL');
    addText('TEMA / PREMISSA', 10, 'bold', [150, 150, 150]);
    addText(currentProject.idea.theme || 'N/A', 12, 'normal');
    y += 5;
    
    addText('PÚBLICO ALVO', 10, 'bold', [150, 150, 150]);
    addText(currentProject.idea.targetAudience || 'N/A', 12, 'normal');
    y += 5;

    addText('DURAÇÃO ESTIMADA', 10, 'bold', [150, 150, 150]);
    addText(currentProject.idea.duration || 'N/A', 12, 'normal');
    y += 5;

    addText('VIBE / ATMOSFERA', 10, 'bold', [150, 150, 150]);
    addText(currentProject.idea.vibe || 'N/A', 12, 'normal');
    y += 5;

    addText('NOTAS DE DIREÇÃO', 10, 'bold', [150, 150, 150]);
    addText(currentProject.idea.notes || 'N/A', 11, 'normal');

    // 2. Characters
    addSectionHeader('02. PERSONAGENS');
    currentProject.characters.forEach(char => {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin - 2, y - 5, pageWidth - (margin * 2) + 4, 25, 'F');
      addText(char.name.toUpperCase(), 13, 'bold', [0, 0, 0]);
      addText(`TRAÇOS: ${char.traits || 'N/A'}`, 9, 'italic', [100, 100, 100]);
      addText(char.description || 'N/A', 11);
      y += 8;
    });

    // 3. Locations
    addSectionHeader('03. LOCAIS');
    currentProject.locations.forEach(loc => {
      addText(loc.name.toUpperCase(), 13, 'bold');
      addText(loc.description || 'N/A', 11);
      y += 5;
    });

    // 4. Writing / Story
    if (currentProject.writing) {
      addSectionHeader('04. HISTÓRIA & ESTRUTURA');
      addText('A NARRATIVA', 12, 'bold');
      addText(currentProject.writing.story || 'N/A', 11);
      y += 5;
      
      pdf.setDrawColor(240, 240, 240);
      pdf.rect(margin, y, pageWidth - (margin * 2), 40);
      const startY = y + 10;
      pdf.setFontSize(10);
      pdf.text('INÍCIO:', margin + 5, startY);
      pdf.text(pdf.splitTextToSize(currentProject.writing.structure.beginning || 'N/A', 50), margin + 5, startY + 5);
      
      pdf.text('MEIO:', margin + 65, startY);
      pdf.text(pdf.splitTextToSize(currentProject.writing.structure.middle || 'N/A', 50), margin + 65, startY + 5);
      
      pdf.text('FIM:', margin + 125, startY);
      pdf.text(pdf.splitTextToSize(currentProject.writing.structure.end || 'N/A', 50), margin + 125, startY + 5);
      y += 50;
    }

    // 5. Script / Scenes
    pdf.addPage();
    y = 25;
    addSectionHeader('05. ROTEIRO DETALHADO');
    currentProject.scenes.forEach(scene => {
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 5;
      
      addText(`CENA ${scene.number}: ${scene.title.toUpperCase()}`, 14, 'bold');
      addText(`${scene.cameraPerspective || 'N/A'} | ${scene.duration}s`, 9, 'italic', [120, 120, 120]);
      y += 2;
      
      pdf.setFont('courier', 'normal');
      addText(scene.script || 'N/A', 11, 'normal', [50, 50, 50]);
      y += 10;
    });

    // 6. VFX Notes
    if (currentProject.vfxNotes && currentProject.vfxNotes.length > 0) {
      addSectionHeader('06. NOTAS DE VFX');
      currentProject.vfxNotes.forEach(note => {
        addText(`${note.type.toUpperCase()}`, 11, 'bold', [255, 77, 0]);
        addText(`CENA: ${note.sceneId || 'GERAL'}`, 9, 'normal', [100, 100, 100]);
        addText(note.description || 'N/A', 11);
        y += 5;
      });
    }

    pdf.save(`${currentProject.title.replace(/\s+/g, '_')}_Master_Script.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Film className="w-8 h-8 text-zinc-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white font-sans selection:bg-magma selection:text-white overflow-hidden">
      <Background />
      <CustomCursor />

      {!user ? (
        <div className="min-h-screen flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full glass-card p-10 space-y-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-magma to-lava-glow" />
            
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-white text-black rounded-3xl flex items-center justify-center mx-auto shadow-[0_20px_40px_rgba(255,255,255,0.1)]">
                <Film className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h2 className="cinematic-title text-4xl tracking-tighter">Helios 44</h2>
                <p className="text-zinc-500 text-[10px] uppercase tracking-[4px] font-mono">
                  {isRegistering ? 'Crie sua conta' : 'Acesse seu estúdio'}
                </p>
              </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-6">
              {isRegistering && (
                <Input 
                  label="Nome" 
                  value={displayName} 
                  onChange={setDisplayName} 
                  placeholder="Seu nome" 
                />
              )}
              <Input 
                label="Email" 
                type="email" 
                value={email} 
                onChange={setEmail} 
                placeholder="seu@email.com" 
              />
              <Input 
                label="Senha" 
                type="password" 
                value={password} 
                onChange={setPassword} 
                placeholder="••••••••" 
              />

              {authError && (
                <p className="text-[10px] font-bold text-magma bg-magma/10 p-4 rounded-2xl border border-magma/20 uppercase tracking-widest">
                  {authError}
                </p>
              )}

              <Button 
                type="submit" 
                variant="helios"
                className="w-full h-14" 
                disabled={authLoading}
              >
                {authLoading ? 'Carregando...' : isRegistering ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-[4px]">
                <span className="bg-obsidian px-4 text-zinc-600 font-mono">Ou</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={login} 
              className="w-full h-14 gap-3"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 grayscale invert" alt="Google" />
              Google Login
            </Button>

            <p className="text-center text-[10px] text-zinc-500 uppercase tracking-[2px] pt-4">
              {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
              <button 
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError(null);
                }}
                className="ml-2 font-extrabold text-white hover:text-magma transition-colors"
              >
                {isRegistering ? 'Entre' : 'Cadastre-se'}
              </button>
            </p>
          </motion.div>
        </div>
      ) : !currentProjectId ? (
        <div className="max-w-6xl mx-auto p-12 space-y-12 h-screen overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between">
            <div>
              <div className="header-meta">Estúdio Pessoal</div>
              <h2 className="cinematic-title text-6xl">Seus Projetos</h2>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 pr-6 border-r border-white/10">
                <div className="text-right">
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{user.displayName}</p>
                  <button onClick={logout} className="text-[10px] font-bold text-magma uppercase tracking-widest hover:text-white transition-colors">Sair</button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-glass border border-white/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-500" />
                  </div>
                )}
              </div>
              <Button onClick={createProject} variant="helios" className="h-14 px-8 gap-3">
                <Plus className="w-5 h-5" /> Novo Filme
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                layoutId={project.id}
                whileHover={{ y: -10 }}
                className="glass-card p-8 group cursor-pointer relative overflow-hidden"
                onClick={() => setCurrentProjectId(project.id)}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5 group-hover:bg-magma transition-colors" />
                
                <div className="flex justify-between items-start mb-8">
                  <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                    <Film className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteModal(project.id);
                    }}
                    className="text-zinc-600 hover:text-magma transition-colors p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                <h3 className="cinematic-title text-2xl mb-4 group-hover:text-magma transition-colors">{project.title}</h3>
                
                <div className="flex gap-4 mb-8">
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    {project.scenes.length} Cenas
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5 text-[10px] font-mono text-zinc-400 uppercase tracking-widest">
                    {project.characters.length} Personagens
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                  <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            ))}

            {projects.length === 0 && (
              <div className="col-span-full py-32 flex flex-col items-center justify-center text-zinc-600 glass-card border-dashed">
                <Film className="w-16 h-16 mb-6 opacity-10" />
                <p className="font-mono text-[10px] uppercase tracking-[4px]">Nenhum projeto iniciado</p>
                <p className="text-sm mt-2">Dê o primeiro passo na sua jornada cinematográfica.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[80px_1fr_350px] h-screen">
          {/* Sidebar */}
          <aside className="border-r border-white/5 flex flex-col items-center py-10 gap-12 bg-obsidian/50 backdrop-blur-xl">
            <div className="w-12 h-12 bg-white text-black rounded-2xl flex items-center justify-center shadow-[0_10px_20px_rgba(255,255,255,0.1)]">
              <Film className="w-6 h-6" />
            </div>

            <nav className="flex flex-col gap-6 flex-1 overflow-y-auto custom-scrollbar px-4 w-full items-center">
              {[
                { id: 'writing', icon: PenTool, label: 'Redação' },
                { id: 'idea', icon: Sparkles, label: 'Ideia' },
                { id: 'script', icon: Layout, label: 'Roteiro' },
                { id: 'timeline', icon: Clock, label: 'Timeline' },
                { id: 'vfx', icon: Wand2, label: 'VFX' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group relative",
                    activeTab === item.id 
                      ? "bg-magma text-white shadow-[0_0_20px_rgba(255,77,0,0.4)]" 
                      : "text-zinc-600 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="absolute left-16 bg-white text-black px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-widest opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-6">
              <button onClick={() => setCurrentProjectId(null)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-zinc-600 hover:text-white hover:bg-white/5 transition-all">
                <ArrowLeft className="w-5 h-5" />
              </button>
              {user.photoURL ? (
                <img src={user.photoURL} className="w-12 h-12 rounded-2xl border border-white/10" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-glass border border-white/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-zinc-500" />
                </div>
              )}
            </div>
          </aside>

          {/* Main Stage */}
          <main className="flex flex-col overflow-hidden bg-obsidian/30">
            <header className="p-12 pb-6 flex items-end justify-between">
              <div>
                <div className="header-meta">Projeto Ativo / {activeTab}</div>
                <input
                  value={currentProject?.title}
                  onChange={(e) => updateProject({ title: e.target.value })}
                  className="cinematic-title text-7xl bg-transparent border-none focus:outline-none w-full placeholder:text-zinc-800"
                  placeholder="Título do Filme"
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={exportPDF} variant="outline" className="h-14 px-8 gap-3">
                  <Download className="w-4 h-4" /> Exportar
                </Button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-12 pt-6 custom-scrollbar">
              <AnimatePresence mode="wait">
                {activeTab === 'writing' && <Writing project={currentProject!} onUpdate={updateProject} />}
                {activeTab === 'idea' && <IdeaTab project={currentProject!} onUpdate={updateProject} />}
                {activeTab === 'script' && <ScriptTab project={currentProject!} onUpdate={updateProject} handleReorderScenes={handleReorderScenes} />}
                {activeTab === 'timeline' && <Timeline project={currentProject!} onUpdate={updateProject} />}
                {activeTab === 'vfx' && <VFXTab project={currentProject!} onUpdate={updateProject} />}
              </AnimatePresence>
            </div>
          </main>

          {/* Right Panel */}
          <aside className="border-l border-white/5 p-10 flex flex-col gap-10 bg-obsidian/50 backdrop-blur-xl">
            <div className="space-y-8">
              <h4 className="cinematic-title text-xl">Estatísticas</h4>
              <div className="space-y-6">
                <div className="stat-block">
                  <p className="stat-label">Duração Total</p>
                  <p className="stat-value">{currentProject?.idea.duration || '00:00'}</p>
                </div>
                <div className="stat-block">
                  <p className="stat-label">Cenas</p>
                  <p className="stat-value">{currentProject?.scenes.length || 0}</p>
                </div>
                <div className="stat-block">
                  <p className="stat-label">Personagens</p>
                  <p className="stat-value">{currentProject?.characters.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <div className="glass-card p-6 bg-magma/5 border-magma/20">
                <p className="text-[10px] font-mono text-magma uppercase tracking-widest mb-2">Dica do Diretor</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  "O cinema é uma questão de o que está no quadro e o que não está." — Martin Scorsese
                </p>
              </div>
              <Button variant="action" onClick={() => setActiveTab('script')}>
                Ver Roteiro Completo
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteModal(null)}
              className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card p-10 max-w-md w-full relative z-10 text-center space-y-8"
            >
              <div className="w-20 h-20 bg-magma/10 text-magma rounded-3xl flex items-center justify-center mx-auto">
                <Trash2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="cinematic-title text-2xl">Excluir Projeto?</h3>
                <p className="text-zinc-500 text-sm">Esta ação é irreversível. Todos os dados do filme serão perdidos para sempre.</p>
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteModal(null)}>Cancelar</Button>
                <Button variant="helios" className="flex-1 bg-red-600 hover:bg-red-700 shadow-red-600/20" onClick={() => deleteProject(showDeleteModal)}>Excluir</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
