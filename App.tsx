import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  Play, 
  Terminal as TerminalIcon, 
  Code2, 
  Layout, 
  Files, 
  MessageSquare, 
  Cpu, 
  Settings, 
  ChevronRight, 
  ChevronDown, 
  FileCode, 
  FolderOpen,
  Zap,
  CheckCircle2,
  AlertCircle, 
  Loader2,
  Undo,
  Redo,
  ExternalLink,
  Save,
  User as UserIcon,
  Lock,
  LogOut,
  ArrowRight,
  Clock,
  ClipboardList,
  Maximize2,
  Minimize2
} from 'lucide-react';
import Editor, { OnMount } from "@monaco-editor/react";
import { ProjectState, AgentStatus, DesignSystem, User } from './types';
import { 
  getManagerResponse,
  getPlannerResponse, 
  getDesignerResponse, 
  getCoderResponse, 
  getPatcherResponse 
} from './geminiService';

// --- Constants ---
const STORAGE_KEY = 'agentic_studio_pro_v1';
const AUTH_KEY = 'agentic_studio_auth';
const SESSION_KEY = 'agentic_studio_session';

const getFileLanguage = (filename: string | null) => {
  if (!filename) return "plaintext";
  const lower = filename.toLowerCase();
  
  // Specific full filenames
  if (lower === 'dockerfile') return 'dockerfile';
  if (lower === 'makefile') return 'makefile';
  if (lower === 'cmakelists.txt') return 'cmake';
  if (lower === 'jenkinsfile') return 'groovy';
  if (lower === 'vite.config.js' || lower === 'vite.config.ts') return 'javascript';
  if (lower === 'next.config.js') return 'javascript';
  
  // Dotfiles
  if (lower.startsWith('.env')) return 'ini';
  if (lower.startsWith('.babelrc')) return 'json';
  if (lower.startsWith('.eslintrc')) return 'json';
  if (lower.startsWith('.prettierrc')) return 'json';
  if (lower === '.gitignore' || lower === '.npmignore') return 'plaintext';

  const ext = filename.split('.').pop()?.toLowerCase();
  
  // Extension mapping
  const map: Record<string, string> = {
    // TypeScript / JavaScript
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    mjs: "javascript",
    cjs: "javascript",
    
    // Web
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    less: "less",
    sass: "scss",
    json: "json",
    xml: "xml",
    svg: "xml",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    markdown: "markdown",
    
    // Backend / Systems
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    h: "cpp",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    
    // Scripts / Config
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    bat: "bat",
    ps1: "powershell",
    ini: "ini",
    toml: "ini",
    sql: "sql",
    
    // Other
    rb: "ruby",
    lua: "lua",
    r: "r",
    dart: "dart",
    swift: "swift",
    kt: "kotlin",
    pl: "perl",
    
    // Framework specific (fallback to html or similar)
    vue: "html",
    svelte: "html",
    astro: "html",
    
    // Text
    txt: "plaintext",
    log: "plaintext"
  };

  return map[ext || ""] || "plaintext";
};

// --- Auth Component ---

const AuthScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    const users = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');

    if (isLogin) {
      if (users[username] && users[username] === password) {
        const user = { username };
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        onLogin(user);
      } else {
        setError('Invalid username or password.');
      }
    } else {
      if (users[username]) {
        setError('Username already exists.');
      } else {
        users[username] = password;
        localStorage.setItem(AUTH_KEY, JSON.stringify(users));
        const user = { username };
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        onLogin(user);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-4">
            <Cpu className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Agentic Studio <span className="text-blue-400">Pro</span></h1>
          <p className="text-slate-400 text-sm font-medium mt-1">THE SELF-HEALING ENGINE</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="developer_pro"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-medium bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</p>}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2 group"
          >
            {isLogin ? 'LOG IN' : 'SIGN UP'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-400 hover:text-blue-400 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- IDE Components ---

const StatusBadge: React.FC<{ status: AgentStatus }> = ({ status }) => {
  const config = {
    idle: { color: 'bg-slate-500', icon: <Cpu size={14}/>, text: 'Idle' },
    managing: { color: 'bg-indigo-600', icon: <ClipboardList size={14} className="animate-pulse"/>, text: 'Manager' },
    planning: { color: 'bg-blue-500', icon: <Zap size={14}/>, text: 'Planner' },
    designing: { color: 'bg-purple-500', icon: <Layout size={14}/>, text: 'Designer' },
    architecting: { color: 'bg-indigo-500', icon: <Files size={14}/>, text: 'Architect' },
    coding: { color: 'bg-emerald-500', icon: <Code2 size={14} className="animate-pulse"/>, text: 'Coder' },
    compiling: { color: 'bg-orange-500', icon: <Loader2 size={14} className="animate-spin"/>, text: 'Compiler' },
    healing: { color: 'bg-red-500', icon: <Zap size={14} className="animate-bounce"/>, text: 'Patcher' },
    ready: { color: 'bg-green-500', icon: <CheckCircle2 size={14}/>, text: 'Ready' },
    error: { color: 'bg-red-700', icon: <AlertCircle size={14}/>, text: 'Halted' }
  };

  const active = config[status] || config.idle;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${active.color} text-white transition-all duration-300 shadow-lg`}>
      {active.icon}
      <span>{active.text.toUpperCase()}</span>
    </div>
  );
};

const FileExplorer: React.FC<{ 
  files: string[]; 
  activeFile: string | null; 
  onFileSelect: (f: string) => void 
}> = ({ files, activeFile, onFileSelect }) => {
  return (
    <div className="flex flex-col h-full bg-[#0f172a] border-r border-slate-800 w-64 shrink-0">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2 text-slate-400 font-medium">
        <Files size={18} />
        <span className="text-sm">FILES</span>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {files.length === 0 ? (
          <div className="p-4 text-xs text-slate-500 italic text-center">No files generated yet.</div>
        ) : (
          files.map(file => (
            <button
              key={file}
              onClick={() => onFileSelect(file)}
              className={`w-full text-left px-4 py-1.5 flex items-center gap-2 text-xs transition-colors hover:bg-slate-800 ${activeFile === file ? 'bg-slate-800 text-blue-400 border-l-2 border-blue-400' : 'text-slate-400'}`}
            >
              <FileCode size={14} />
              <span className="truncate">{file}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

const Terminal: React.FC<{ logs: string[] }> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full bg-[#020617] p-4 font-mono text-xs overflow-y-auto border-t border-slate-800" ref={scrollRef}>
      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <TerminalIcon size={14} />
        <span className="font-bold">TERMINAL</span>
      </div>
      {logs.map((log, i) => (
        <div key={i} className={`mb-1 ${log.includes('Error') || log.includes('failed') ? 'text-red-400' : log.includes('Success') || log.includes('done') ? 'text-green-400' : 'text-slate-300'}`}>
          <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
          {log}
        </div>
      ))}
    </div>
  );
};

const IframePreview = React.memo(({ designSystem, status }: { designSystem?: DesignSystem, status: AgentStatus }) => {
  return (
    <iframe 
      title="preview"
      className="flex-1 w-full border-none h-full bg-white"
      srcDoc={`
        <html>
          <head>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { font-family: sans-serif; background: ${designSystem?.colors?.background || '#f8fafc'}; color: ${designSystem?.colors?.foreground || '#0f172a'}; margin: 0; }
              .btn-primary { background-color: ${designSystem?.colors?.primary || '#2563eb'}; color: ${designSystem?.colors?.primaryForeground || '#ffffff'}; }
            </style>
          </head>
          <body class="flex items-center justify-center min-h-screen p-4">
            <div class="text-center p-8 bg-white shadow-xl rounded-2xl max-w-md border border-slate-100 transition-all hover:scale-[1.02]">
              <h1 class="text-2xl font-bold text-slate-800 mb-4">${designSystem?.metadata.appName || 'Application Ready'}</h1>
              <p class="text-slate-500 mb-6 text-sm">
                Your browser-native environment has been successfully deployed and self-healed. 
                The agents have completed the architectural cycle for: 
                <span class="block mt-2 font-mono text-[10px] bg-slate-100 p-2 rounded text-slate-700">${designSystem?.metadata.styleVibe || 'Modern'} Vibe</span>
              </p>
              <button class="btn-primary px-6 py-2 rounded-lg font-semibold transition-all shadow-md active:scale-95">
                GET STARTED
              </button>
              <div class="mt-8 pt-6 border-t border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                Agentic Studio Pro Runtime v1.0.4
              </div>
            </div>
          </body>
        </html>
      `}
    />
  );
}, (prev, next) => {
  // Optimization: 
  // 1. If we are not ready in the next state, we don't need to update the iframe (it will be hidden).
  if (next.status !== 'ready') return true;

  // 2. If we are transitioning to 'ready', we must re-render to ensure content is up-to-date.
  if (prev.status !== 'ready' && next.status === 'ready') return false;

  // 3. If we are already ready, only re-render if the design system has actually changed.
  return JSON.stringify(prev.designSystem) === JSON.stringify(next.designSystem);
});

const PreviewSystem = ({ status, designSystem }: { status: AgentStatus; designSystem?: DesignSystem }) => {
  const isReady = status === 'ready';

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full">
      {/* 
        Keep iframe mounted but hidden when not ready to preserve state and avoid unnecessary reloads.
        We use CSS visibility/opacity+pointer-events to hide it rather than unmounting.
      */}
      <div className={`absolute inset-0 transition-opacity duration-500 ${isReady ? 'opacity-100 z-10' : 'opacity-0 -z-10 pointer-events-none'}`}>
        <IframePreview designSystem={designSystem} status={status} />
      </div>

      <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-sm text-slate-400 text-sm gap-4 transition-all duration-300 ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <Loader2 size={32} className="animate-spin text-blue-500" />
        <div className="text-center">
          <p className="font-bold text-slate-600">Awaiting system compilation...</p>
          <p className="text-[10px] uppercase tracking-widest mt-1 opacity-60">Phase: {status}</p>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
  });

  const [project, setProject] = useState<ProjectState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { 
          ...parsed, 
          // If status was in an active agent state, reset to idle to prevent stuck states.
          // If ready or error, preserve it.
          status: ['ready', 'error', 'idle'].includes(parsed.status) ? parsed.status : 'idle',
          terminalLogs: [...(parsed.terminalLogs || []), `> Workspace restored. Last saved: ${parsed.lastSaved || 'N/A'}`],
          // Restore active tab or default based on status
          activeTab: parsed.activeTab || (parsed.status === 'ready' ? 'preview' : 'code'),
          editorViewState: parsed.editorViewState || {}
        };
      } catch (e) {
        console.error("Failed to parse saved project state", e);
      }
    }
    return {
      userPrompt: "",
      fileSystem: {},
      terminalLogs: ["Welcome to Agentic Studio Pro. Define your intent to begin."],
      status: "idle",
      iterationCount: 0,
      currentFile: null,
      activeTab: 'code',
      editorViewState: {}
    };
  });

  const [input, setInput] = useState(project.userPrompt);
  const [isSaving, setIsSaving] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const editorRef = useRef<any>(null);
  
  // Ref to hold current project state for event listeners and stable access
  const projectRef = useRef(project);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  // Enhanced Auto-save Logic
  const saveToDisk = useCallback(() => {
    if (!user || !projectRef.current) return;
    setIsSaving(true);
    
    // Capture current view state if editor is active and valid
    let currentViewState = { ...projectRef.current.editorViewState };
    if (editorRef.current && projectRef.current.currentFile && projectRef.current.activeTab === 'code') {
      const viewState = editorRef.current.saveViewState();
      if (viewState) {
         currentViewState = {
           ...currentViewState,
           [projectRef.current.currentFile]: viewState
         };
      }
    }

    const now = new Date().toLocaleTimeString();
    // Use projectRef.current to avoid closure staleness and ensure we have latest data
    const updatedProject = { 
      ...projectRef.current, 
      lastSaved: now,
      editorViewState: currentViewState
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProject));
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
    
    // Update state to sync lastSaved and viewState without triggering loops (since effect depends on project props)
    setProject(prev => ({ 
      ...prev, 
      lastSaved: now,
      editorViewState: currentViewState
    }));
    
    // Simulate network delay for UI feedback
    setTimeout(() => setIsSaving(false), 800);
  }, [user]);

  // Save on unmount / visibility change (tab switch)
  useEffect(() => {
    const handleSaveOnExit = () => {
      // Use saveToDisk logic manually here to ensure synchronous execution if needed, 
      // but keeping it simple with direct storage access is safer for unload events.
      if (user && projectRef.current) {
        const now = new Date().toLocaleTimeString();
        const stateToSave = { ...projectRef.current, lastSaved: now };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
        } catch(e) { console.error("Exit save failed", e); }
      }
    };

    window.addEventListener('beforeunload', handleSaveOnExit);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleSaveOnExit();
      }
    });

    return () => {
      window.removeEventListener('beforeunload', handleSaveOnExit);
      document.removeEventListener('visibilitychange', handleSaveOnExit);
    };
  }, [user]);

  // Periodic auto-save (Debounced)
  useEffect(() => {
    if (!user) return;
    // Debounce save when filesystem, current file, user prompt, or activeTab changes
    const timeoutId = setTimeout(saveToDisk, 2000); // 2 seconds debounce
    return () => clearTimeout(timeoutId);
  }, [project.fileSystem, project.currentFile, project.userPrompt, project.status, project.activeTab, user, saveToDisk]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToDisk();
      }
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveToDisk, isZenMode]);

  // Restore Editor View State when active file changes
  useEffect(() => {
    if (project.activeTab === 'code' && project.currentFile && editorRef.current && project.editorViewState?.[project.currentFile]) {
      // Small timeout to allow model switch to propagate
      setTimeout(() => {
        if(editorRef.current) {
          editorRef.current.restoreViewState(project.editorViewState![project.currentFile!]);
          editorRef.current.focus();
        }
      }, 50);
    }
  }, [project.currentFile, project.activeTab]);

  const addLog = (msg: string) => {
    setProject(prev => ({ ...prev, terminalLogs: [...prev.terminalLogs, msg] }));
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
  };

  const handleFileSelect = (filename: string) => {
    if (filename === project.currentFile) return;

    // Save current file's view state before switching
    let newViewState = { ...project.editorViewState };
    if (editorRef.current && project.currentFile) {
      const currentViewState = editorRef.current.saveViewState();
      if (currentViewState) {
        newViewState[project.currentFile] = currentViewState;
      }
    }

    setProject(prev => ({ 
      ...prev, 
      currentFile: filename,
      editorViewState: newViewState
    }));
  };

  const triggerUndo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('source', 'undo', null);
      editorRef.current.focus();
    }
  };

  const triggerRedo = () => {
    if (editorRef.current) {
      editorRef.current.trigger('source', 'redo', null);
      editorRef.current.focus();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  const startGeneration = async () => {
    if (!input) return;
    setProject(prev => ({
      ...prev,
      userPrompt: input,
      status: "managing",
      terminalLogs: [...prev.terminalLogs, `> Starting workflow for: "${input}"`],
      fileSystem: {},
      srs: undefined,
      plan: undefined,
      designSystem: undefined,
      iterationCount: 0,
      activeTab: 'code',
      editorViewState: {}
    }));
  };

  const handleEditorChange = (value: string | undefined) => {
    if (project.currentFile && value !== undefined) {
      setProject(prev => ({
        ...prev,
        fileSystem: { ...prev.fileSystem, [prev.currentFile!]: value }
      }));
    }
  };

  useEffect(() => {
    if (!user) return;

    const runManager = async () => {
      try {
        addLog("Manager: Generating Software Requirement Specification (SRS)...");
        const srs = await getManagerResponse(project.userPrompt);
        setProject(prev => ({ ...prev, srs, status: "planning" }));
        addLog("Manager: Technical blueprint completed.");
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Manager: ${err}`);
      }
    };

    const runPlanner = async () => {
      try {
        if (!project.srs) return;
        addLog("Planner: Mapping file system based on SRS...");
        const plan = await getPlannerResponse(project.srs);
        setProject(prev => ({ ...prev, plan, status: "designing" }));
        addLog(`Planner: Scaffolded ${plan.files.length} modules.`);
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Planner: ${err}`);
      }
    };

    const runDesigner = async () => {
      try {
        if (!project.plan) return;
        addLog("Designer: Constructing atomic design system...");
        const design = await getDesignerResponse(project.userPrompt, project.plan.features);
        setProject(prev => ({ ...prev, designSystem: design, status: "architecting" }));
        addLog(`Designer: Branding finalized for "${design.metadata.appName}".`);
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Designer: ${err}`);
      }
    };

    const runArchitect = async () => {
      try {
        if (!project.plan) return;
        addLog("Architect: Generating virtual file structures...");
        const initialFS: Record<string, string> = {};
        project.plan.files.forEach(f => { initialFS[f] = "// Coding in progress..."; });
        setProject(prev => ({ ...prev, fileSystem: initialFS, status: "coding" }));
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Architect: ${err}`);
      }
    };

    const runCoder = async () => {
      try {
        if (!project.plan || !project.designSystem) return;
        const filesToCode = Object.keys(project.fileSystem);
        for (const file of filesToCode) {
          setProject(prev => ({ ...prev, currentFile: file }));
          addLog(`Coder: Implementing ${file}...`);
          const code = await getCoderResponse(file, project.plan, project.designSystem, project.fileSystem);
          setProject(prev => ({
            ...prev,
            fileSystem: { ...prev.fileSystem, [file]: code }
          }));
        }
        setProject(prev => ({ ...prev, status: "compiling", currentFile: filesToCode[0] }));
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Coder: ${err}`);
      }
    };

    const runCompiler = async () => {
      try {
        addLog("Compiler: Optimizing build artifacts...");
        await new Promise(r => setTimeout(r, 1200));
        const shouldFail = Math.random() < 0.25 && project.iterationCount < 1;
        if (shouldFail) {
          addLog("Compiler Error: Build failed due to inconsistent module resolution.");
          setProject(prev => ({ ...prev, status: "healing" }));
        } else {
          addLog("Compiler Success: Runtime deployed at :3000.");
          setProject(prev => ({ ...prev, status: "ready", activeTab: 'preview' })); // Auto-switch to preview on success
        }
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Compiler: ${err}`);
      }
    };

    const runPatcher = async () => {
      try {
        addLog("Patcher: Performing self-healing mutation...");
        const failingFile = "src/App.tsx";
        const code = project.fileSystem[failingFile];
        const patch = await getPatcherResponse(failingFile, code, "Module resolution conflict in App components.");
        setProject(prev => ({
          ...prev,
          fileSystem: { ...prev.fileSystem, [failingFile]: patch },
          status: "compiling",
          iterationCount: prev.iterationCount + 1
        }));
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Patcher: ${err}`);
      }
    };

    if (project.status === "managing") runManager();
    if (project.status === "planning") runPlanner();
    if (project.status === "designing") runDesigner();
    if (project.status === "architecting") runArchitect();
    if (project.status === "coding") runCoder();
    if (project.status === "compiling") runCompiler();
    if (project.status === "healing") runPatcher();

  }, [project.status, project.userPrompt, user]);

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0f172a] text-slate-100 font-sans">
      {/* Header */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f172a]/80 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="text-white" size={18} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">AGENTIC STUDIO <span className="text-blue-400">PRO</span></h1>
            <p className="text-[10px] text-slate-500 font-medium">SELF-HEALING ARCHITECTURE</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <StatusBadge status={project.status} />
          <div className="h-4 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
              <UserIcon size={14} className="text-blue-400" />
              <span className="text-xs font-semibold">{user.username}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-400/10 hover:text-red-400 rounded-lg text-slate-400 transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
            <button 
              onClick={saveToDisk}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
              title="Save Workspace (Ctrl+S)"
            >
              <Save size={18} className={isSaving ? "text-blue-400" : ""} />
            </button>
            <button 
              onClick={startGeneration}
              disabled={project.status !== 'idle' && project.status !== 'ready' && project.status !== 'error'}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={14} fill="currentColor" />
              BUILD
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-16 border-r border-slate-800 flex flex-col items-center py-4 gap-6 bg-[#0f172a] shrink-0">
          <Files className="text-blue-400" size={20} />
          <MessageSquare className="text-slate-500 hover:text-slate-300 cursor-pointer" size={20} />
          <Layout className="text-slate-500 hover:text-slate-300 cursor-pointer" size={20} />
          <div className="mt-auto flex flex-col gap-6">
            <Cpu className="text-slate-500 hover:text-slate-300 cursor-pointer" size={20} />
            <Settings className="text-slate-500 hover:text-slate-300 cursor-pointer" size={20} />
          </div>
        </div>

        <FileExplorer 
          files={Object.keys(project.fileSystem)} 
          activeFile={project.currentFile}
          onFileSelect={handleFileSelect} 
        />

        {/* Editor & Preview Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex h-10 border-b border-slate-800 px-4 bg-[#0f172a] justify-between items-center shrink-0">
            <div className="flex h-full">
              <button 
                onClick={() => setProject(p => ({ ...p, activeTab: 'code' }))}
                className={`px-4 h-full flex items-center gap-2 text-xs font-medium transition-all ${project.activeTab === 'code' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400'}`}
              >
                <Code2 size={14} />
                CODE
              </button>
              <button 
                onClick={() => setProject(p => ({ ...p, activeTab: 'preview' }))}
                className={`px-4 h-full flex items-center gap-2 text-xs font-medium transition-all ${project.activeTab === 'preview' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400'}`}
              >
                <Layout size={14} />
                PREVIEW
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 truncate px-4">
              {project.currentFile && <span className="opacity-50">{project.currentFile}</span>}
            </div>

            {project.activeTab === 'code' && (
              <div className="flex items-center gap-1">
                <button 
                  onClick={triggerUndo} 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" 
                  title="Undo (Ctrl+Z)"
                >
                  <Undo size={14} />
                </button>
                <button 
                  onClick={triggerRedo} 
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" 
                  title="Redo (Ctrl+Y)"
                >
                  <Redo size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden relative">
            {/* Editor View */}
            <div className={`absolute inset-0 w-full h-full bg-[#1e293b] transition-opacity duration-200 ${project.activeTab === 'code' ? 'z-10 opacity-100' : 'z-0 opacity-0 pointer-events-none'}`}>
                <Editor
                  height="100%"
                  language={getFileLanguage(project.currentFile)}
                  theme="vs-dark"
                  path={project.currentFile || undefined}
                  value={project.currentFile ? project.fileSystem[project.currentFile] : "// Select a file to view code"}
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: 'Fira Code',
                    scrollBeyondLastLine: false,
                    readOnly: project.status !== 'ready' && project.status !== 'idle' && project.status !== 'error',
                    automaticLayout: true,
                  }}
                />
            </div>

            {/* Preview View */}
            <div className={`
                bg-white flex flex-col transition-all duration-300 ease-in-out
                ${isZenMode ? 'fixed inset-0 z-[100]' : 'absolute inset-0 w-full h-full'}
                ${project.activeTab === 'preview' ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}
            `}>
                <div className="h-8 bg-slate-100 border-b flex items-center px-4 gap-4 shrink-0">
                   <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                     <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                     <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                   </div>
                   <div className="flex-1 bg-white border rounded h-5 text-[10px] flex items-center px-2 text-slate-400">
                     localhost:3000
                   </div>
                   <div className="flex items-center gap-3">
                     <button 
                        onClick={() => setIsZenMode(!isZenMode)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title={isZenMode ? "Exit Zen Mode (Esc)" : "Enter Zen Mode"}
                     >
                       {isZenMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                     </button>
                     <ExternalLink size={12} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                   </div>
                </div>
                
                <PreviewSystem 
                  status={project.status} 
                  designSystem={project.designSystem} 
                />
            </div>
          </div>

          <div className="h-40 shrink-0">
            <Terminal logs={project.terminalLogs} />
          </div>
        </div>

        {/* Right Sidebar - Product Manager / Intent */}
        <div className="w-80 border-l border-slate-800 flex flex-col bg-[#0f172a] shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="text-blue-400" size={16} />
              <span className="text-sm font-bold uppercase tracking-wider">INTENT</span>
            </div>
            {project.status !== 'idle' && (
              <button 
                onClick={() => {
                  if (confirm("Reset current project workspace?")) {
                    localStorage.removeItem(STORAGE_KEY);
                    setProject({
                      userPrompt: "",
                      fileSystem: {},
                      terminalLogs: ["System Reset."],
                      status: "idle",
                      iterationCount: 0,
                      currentFile: null,
                      activeTab: 'code',
                      editorViewState: {}
                    });
                    setInput("");
                  }
                }}
                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
              >
                RESET
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {project.status === 'idle' && (
               <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                 <p className="text-xs text-slate-400 italic">"Our Product Manager agent will first build a technical blueprint for your idea."</p>
               </div>
             )}

             {project.srs && (
               <div className="space-y-4 animate-in fade-in duration-700">
                 <div className="space-y-2">
                   <div className="flex items-center gap-2">
                     <ClipboardList size={14} className="text-blue-400" />
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Product Specification</span>
                   </div>
                   <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-[11px] leading-relaxed text-slate-300 font-sans whitespace-pre-wrap">
                     {project.srs}
                   </div>
                 </div>

                 {project.designSystem && (
                   <div className="space-y-2 pt-2 border-t border-slate-800">
                     <div className="flex items-center gap-2">
                        <Layout size={14} className="text-purple-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Generated Theme</span>
                     </div>
                     <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900 p-2 rounded border border-slate-800">
                          <p className="text-[9px] text-slate-500 mb-1">Primary</p>
                          <div className="h-2 rounded" style={{ backgroundColor: project.designSystem.colors.primary }} />
                        </div>
                        <div className="bg-slate-900 p-2 rounded border border-slate-800">
                          <p className="text-[9px] text-slate-500 mb-1">Vibe</p>
                          <p className="text-[10px] font-bold">{project.designSystem.metadata.styleVibe}</p>
                        </div>
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>

          <div className="p-4 border-t border-slate-800 shrink-0">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your app idea..."
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-3 pr-10 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[100px] resize-none"
                disabled={project.status !== 'idle' && project.status !== 'ready' && project.status !== 'error'}
              />
              <button
                onClick={startGeneration}
                disabled={project.status !== 'idle' && project.status !== 'ready' && project.status !== 'error'}
                className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700 text-white rounded-lg transition-all shadow-lg"
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-8 border-t border-slate-800 bg-[#0f172a] flex items-center justify-between px-4 text-[10px] font-medium text-slate-500 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Zap size={10} className="text-yellow-500" />
            <span>HEALING ENGINE ACTIVE</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-800" />
          <div className="flex items-center gap-1.5 min-w-[140px]">
            {isSaving ? (
              <div className="flex items-center gap-1.5 text-blue-400">
                <Loader2 size={10} className="animate-spin" />
                <span>SAVING CHANGES...</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500">
                <CheckCircle2 size={10} className="text-green-500" />
                <span>SAVED {project.lastSaved ? `@ ${project.lastSaved}` : ''}</span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 uppercase tracking-widest">
          <span>UTF-8</span>
          <span>TYPESCRIPT</span>
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${project.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span>PORT: 3000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}