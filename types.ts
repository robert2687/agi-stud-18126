
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

export type AgentStatus = "idle" | "planning" | "designing" | "architecting" | "coding" | "compiling" | "healing" | "ready" | "error";

export interface ProjectState {
  userPrompt: string;
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
}

export interface FileEntry {
  name: string;
  content: string;
  type: 'file' | 'folder';
  children?: FileEntry[];
}
