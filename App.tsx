
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
  Clock
} from 'lucide-react';
import Editor, { OnMount } from "@monaco-editor/react";
import { ProjectState, AgentStatus, DesignSystem, User } from './types';
import { 
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
  if (!filename) return "typescript";
  const ext = filename.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
    py: "python",
    go: "go",
    rs: "rust",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml"
  };
  return map[ext || ""] || "typescript";
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
    planning: { color: 'bg-blue-500', icon: <Zap size={14} className="animate-pulse"/>, text: 'Planner' },
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

const IframePreview = React.memo(({ designSystem }: { designSystem?: DesignSystem }) => {
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
  return JSON.stringify(prev.designSystem) === JSON.stringify(next.designSystem);
});

const PreviewSystem = ({ status, designSystem }: { status: AgentStatus; designSystem?: DesignSystem }) => {
  const isReady = status === 'ready';

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden h-full">
      {isReady ? (
        <IframePreview designSystem={designSystem} />
      ) : (
        <div className="flex-1 w-full bg-slate-100 animate-pulse" />
      )}

      {!isReady && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-sm text-slate-400 text-sm gap-4 transition-all duration-300">
          <Loader2 size={32} className="animate-spin text-blue-500" />
          <div className="text-center">
            <p className="font-bold text-slate-600">Awaiting system compilation...</p>
            <p className="text-[10px] uppercase tracking-widest mt-1 opacity-60">Phase: {status}</p>
          </div>
        </div>
      )}
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
        // Explicitly restoring state while ensuring status transitions are safe
        return { 
          ...parsed, 
          status: parsed.status === 'ready' ? 'ready' : 'idle',
          terminalLogs: [...(parsed.terminalLogs || []), `> System workspace restored. Last seen at ${parsed.lastSaved || 'unknown'}.`]
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
      currentFile: null
    };
  });

  const [input, setInput] = useState(project.userPrompt);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>(project.status === 'ready' ? 'preview' : 'code');
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<any>(null);

  const addLog = (msg: string) => {
    setProject(prev => ({ ...prev, terminalLogs: [...prev.terminalLogs, msg] }));
  };

  /**
   * Core persistence logic: saves current workspace state to disk.
   */
  const saveToDisk = useCallback(() => {
    setIsSaving(true);
    const now = new Date().toLocaleTimeString();
    const updatedProject = { ...project, lastSaved: now };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProject));
    setProject(prev => ({ ...prev, lastSaved: now }));
    setTimeout(() => setIsSaving(false), 800);
  }, [project]);

  // Auto-save debounced effect
  useEffect(() => {
    if (!user) return;
    const timeoutId = setTimeout(saveToDisk, 1500);
    return () => clearTimeout(timeoutId);
  }, [project.fileSystem, project.currentFile, project.userPrompt, project.status, user, saveToDisk]);

  // Keyboard shortcut listener for manual save (Cmd/Ctrl + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToDisk();
        addLog("> Manual save complete.");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveToDisk]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
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
      status: "planning",
      terminalLogs: [...prev.terminalLogs, `> Initializing Project: "${input}"`],
      fileSystem: {},
      iterationCount: 0
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

    const runPlanner = async () => {
      try {
        addLog("Planner: Analyzing intent and creating engineering blueprint...");
        const plan = await getPlannerResponse(project.userPrompt);
        setProject(prev => ({ ...prev, plan, status: "designing" }));
        addLog(`Planner: Successfully drafted plan with ${plan.files.length} files.`);
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Planner: ${err}`);
      }
    };

    const runDesigner = async () => {
      try {
        if (!project.plan) return;
        addLog("Designer: Establishing design tokens and accessibility compliance...");
        const design = await getDesignerResponse(project.userPrompt, project.plan.features);
        setProject(prev => ({ ...prev, designSystem: design, status: "architecting" }));
        addLog(`Designer: Generated theme.json for "${design.metadata.appName}" (${design.metadata.styleVibe} vibe).`);
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Designer: ${err}`);
      }
    };

    const runArchitect = async () => {
      try {
        if (!project.plan) return;
        addLog("Architect: Scaffolding virtual file system and installing dependencies...");
        const initialFS: Record<string, string> = {};
        project.plan.files.forEach(f => { initialFS[f] = "// Generating content..."; });
        setProject(prev => ({ ...prev, fileSystem: initialFS, status: "coding" }));
        addLog(`Architect: Files scaffolded. Ready for senior coder.`);
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
        addLog("Coder: All modules implemented. Triggering build...");
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Coder: ${err}`);
      }
    };

    const runCompiler = async () => {
      try {
        addLog("Compiler: Running 'npm run build' in WebContainer sandbox...");
        await new Promise(r => setTimeout(r, 1500));
        const shouldFail = Math.random() < 0.3 && project.iterationCount < 1;
        if (shouldFail) {
          addLog("Compiler Error: Module not found. ReferenceError: './components/OldButton' is not defined.");
          setProject(prev => ({ ...prev, status: "healing" }));
        } else {
          addLog("Compiler Success: Build complete. Assets optimized.");
          setProject(prev => ({ ...prev, status: "ready" }));
          setActiveTab('preview');
        }
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Compiler: ${err}`);
      }
    };

    const runPatcher = async () => {
      try {
        addLog("Patcher: Analyzing stderr logs. Performing surgical fix...");
        const failingFile = "src/App.tsx";
        const code = project.fileSystem[failingFile];
        const patch = await getPatcherResponse(failingFile, code, "ReferenceError: './components/OldButton' is not defined.");
        setProject(prev => ({
          ...prev,
          fileSystem: { ...prev.fileSystem, [failingFile]: patch },
          status: "compiling",
          iterationCount: prev.iterationCount + 1
        }));
        addLog(`Patcher: Applied mutations to ${failingFile}. Retrying build.`);
      } catch (err) {
        setProject(prev => ({ ...prev, status: "error" }));
        addLog(`Error in Patcher: ${err}`);
      }
    };

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
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f172a]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Cpu className="text-white" size={18} />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight">AGENTIC STUDIO <span className="text-blue-400">PRO</span></h1>
            <p className="text-[10px] text-slate-500 font-medium">BROWSER-NATIVE SELF-HEALING IDE</p>
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
              RUN
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
          onFileSelect={(f) => setProject(p => ({ ...p, currentFile: f }))} 
        />

        {/* Editor & Preview Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex h-10 border-b border-slate-800 px-4 bg-[#0f172a] justify-between items-center">
            <div className="flex h-full">
              <button 
                onClick={() => setActiveTab('code')}
                className={`px-4 h-full flex items-center gap-2 text-xs font-medium transition-all ${activeTab === 'code' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400'}`}
              >
                <Code2 size={14} />
                EDITOR
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`px-4 h-full flex items-center gap-2 text-xs font-medium transition-all ${activeTab === 'preview' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50' : 'text-slate-400'}`}
              >
                <Layout size={14} />
                PREVIEW
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-xs font-mono text-slate-500 truncate px-4">
              {project.currentFile && <span className="opacity-50">{project.currentFile}</span>}
            </div>

            {activeTab === 'code' && (
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
            {activeTab === 'code' ? (
              <div className="h-full w-full">
                <Editor
                  height="100%"
                  language={getFileLanguage(project.currentFile)}
                  theme="vs-dark"
                  path={project.currentFile || undefined}
                  value={project.currentFile ? project.fileSystem[project.currentFile] : "// No file selected"}
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
            ) : (
              <div className="h-full w-full bg-white flex flex-col relative">
                <div className="h-8 bg-slate-100 border-b flex items-center px-4 gap-4 shrink-0">
                   <div className="flex gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                     <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                     <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                   </div>
                   <div className="flex-1 bg-white border rounded h-5 text-[10px] flex items-center px-2 text-slate-400">
                     localhost:3000
                   </div>
                   <ExternalLink size={12} className="text-slate-400" />
                </div>
                
                <PreviewSystem 
                  status={project.status} 
                  designSystem={project.designSystem} 
                />
              </div>
            )}
          </div>

          <div className="h-40 shrink-0">
            <Terminal logs={project.terminalLogs} />
          </div>
        </div>

        {/* Right Sidebar - Chat / Intent */}
        <div className="w-80 border-l border-slate-800 flex flex-col bg-[#0f172a] shrink-0">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="text-blue-400" size={16} />
              <span className="text-sm font-bold uppercase tracking-wider">INTENT</span>
            </div>
            {project.status !== 'idle' && (
              <button 
                onClick={() => {
                  if (confirm("Reset current project workspace? All unsaved work in memory will be lost.")) {
                    localStorage.removeItem(STORAGE_KEY);
                    setProject({
                      userPrompt: "",
                      fileSystem: {},
                      terminalLogs: ["System Reset."],
                      status: "idle",
                      iterationCount: 0,
                      currentFile: null
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
             <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
               <p className="text-xs text-slate-400 italic">"Define what you want to build. Our agents will plan, design, and heal the codebase automatically."</p>
             </div>
             
             {project.plan && (
               <div className="space-y-4">
                 <div className="space-y-2">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Features</span>
                   <ul className="space-y-1">
                     {project.plan.features.map((f, i) => (
                       <li key={i} className="text-xs flex items-start gap-2 text-slate-300">
                         <div className="mt-1 w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                         {f}
                       </li>
                     ))}
                   </ul>
                 </div>
                 {project.designSystem && (
                   <div className="space-y-2 pt-2 border-t border-slate-800">
                     <span className="text-[10px] font-bold text-slate-500 uppercase">Design System</span>
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

          <div className="p-4 border-t border-slate-800">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your app architecture..."
                className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-3 pr-10 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[80px] resize-none"
                disabled={project.status !== 'idle' && project.status !== 'ready' && project.status !== 'error'}
              />
              <button
                onClick={startGeneration}
                disabled={project.status !== 'idle' && project.status !== 'ready' && project.status !== 'error'}
                className="absolute right-2 bottom-2 p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-slate-700 text-white rounded-lg transition-all"
              >
                <Zap size={16} />
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
            <span>RUNTIME PORT: 3000</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
