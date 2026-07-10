export interface Character {
  id: string;
  name: string;
  traits: string;
  description: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
}

export interface Dialogue {
  id: string;
  characterId?: string;
  character: string;
  text: string;
  parenthetical?: string;
}

export interface Scene {
  id: string;
  number: number;
  title: string;
  visualPreview: string; // base64 or placeholder
  cameraPerspective: string;
  script: string;
  dialogues: Dialogue[];
  vfxId?: string;
  duration: number; // in seconds
  order: number;
  color?: string; // RGB or Hex
  
  // Slate / Claquete fields for cinema standard
  roll?: string;
  take?: string;
  slateScene?: string;
  dayNight?: 'DAY' | 'NIGHT' | '';
  intExt?: 'INT' | 'EXT' | '';
  soundMos?: 'SOUND' | 'MOS' | '';
}

export interface TimelineMarker {
  id: string;
  time: number; // in seconds
  label: string;
  color?: string;
}

export interface VFXNote {
  id: string;
  sceneId: string;
  description: string;
  type: string;
}

export interface ProjectIdea {
  theme: string;
  targetAudience: string;
  duration: string; // display string
  totalDurationSeconds: number; // for timeline
  vibe: string;
  colors: string[];
  notes: string;
}

export interface ProjectTimeline {
  id: string;
  name: string;
  totalDurationSeconds: number;
  markers: TimelineMarker[];
  sceneIds: string[]; // List of scene IDs in this timeline
}

export interface NoteBlock {
  id: string;
  title: string;
  content: string;
  category: string; // e.g. "Materiais", "Equipe", "Tarefas", "Geral"
}

export interface ReferenceItem {
  id: string;
  title: string;
  type: 'link' | 'image';
  url: string;
  description?: string;
  createdAt: number;
}

export interface Project {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  idea: ProjectIdea;
  scenes: Scene[];
  characters: Character[];
  locations: Location[];
  vfxNotes: VFXNote[];
  markers: TimelineMarker[]; // Legacy field for backward compatibility
  timelines?: ProjectTimeline[];
  activeTimelineId?: string;
  noteBlocks?: NoteBlock[];
  references?: ReferenceItem[];
  writing?: {
    story: string;
    structure: {
      beginning: string;
      middle: string;
      end: string;
      plotPoints: string[];
    };
  };
}
