
export interface User {
  username: string;
}

export interface DesignSystem {
  metadata: {
    appName: string;
    styleVibe: "Modern" | "Corporate" | "Playful" | "Brutalist" | "Minimalist";
  };
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    secondary: string;
    accent: string;
    muted: string;
    border: string;
  };
  layout: {
    radius: string;
    spacing: string;
    container: string;
  };
  typography: {
    fontSans: string;
    h1: string;
    h2: string;
    body: string;
  };
}

export type AgentStatus = "idle" | "managing" | "planning" | "designing" | "architecting" | "coding" | "reviewing" | "plugging" | "compiling" | "healing" | "ready" | "error";

export type LifecycleHook = 'post-planning' | 'post-coding' | 'post-audit' | 'on-demand';

export interface NeuralPlugin {
  id: string;
  name: string;
  description: string;
  icon: string; // Lucide icon name string
  hook: LifecycleHook;
  enabled: boolean;
  author: string;
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  vfsSize: number;
  processes: string[];
}

export interface OptimizationSuggestion {
  id: string;
  type: 'performance' | 'structure' | 'resource';
  message: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ReviewComment {
  file: string;
  line?: number;
  severity: 'critical' | 'warning' | 'insight';
  category: 'quality' | 'a11y' | 'performance' | 'design' | 'maintainability' | 'security' | 'seo';
  message: string;
  recommendation: string;
}

export interface ReviewReport {
  id: string;
  timestamp: number;
  overallScore: number;
  scores: {
    quality: number;
    a11y: number;
    performance: number;
    design: number;
    security?: number;
    seo?: number;
  };
  comments: ReviewComment[];
}

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  label: string;
  status: AgentStatus;
  fileSystem: Record<string, string>;
  designSystem?: DesignSystem;
  terminalLogs: string[];
  reviewReport?: ReviewReport;
}

export interface ProjectState {
  userPrompt: string;
  srs?: string;
  plan?: {
    features: string[];
    files: string[];
    dependencies: string[];
  };
  designSystem?: DesignSystem;
  fileSystem: Record<string, string>;
  terminalLogs: string[];
  status: AgentStatus;
  iterationCount: number;
  currentFile: string | null;
  lastSaved?: string;
  activeTab?: 'code' | 'preview';
  resources: ResourceMetrics;
  suggestions: OptimizationSuggestion[];
  history: HistorySnapshot[];
  selectedHistoryId: string | null;
  activeReview: ReviewReport | null;
  installedPlugins: NeuralPlugin[];
}

export interface FileEntry {
  name: string;
  content: string;
  type: 'file' | 'folder';
  children?: FileEntry[];
}
