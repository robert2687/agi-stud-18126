
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
  Minimize2,
  Activity,
  HardDrive,
  BarChart3,
  Lightbulb,
  RefreshCw,
  History as HistoryIcon,
  GitBranch,
  SplitSquareHorizontal,
  RotateCcw,
  Palette,
  Layers,
  Box,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Info
} from 'lucide-react';
import Editor, { DiffEditor, OnMount } from "@monaco-editor/react";
import { ProjectState, AgentStatus, DesignSystem, User, ResourceMetrics, OptimizationSuggestion, HistorySnapshot, ReviewReport, ReviewComment } from './types';
import { 
  getManagerResponse,
  getPlannerResponse, 
  getDesignerResponse, 
  getCoderResponse, 
  getPatcherResponse,
  getReviewResponse
} from './geminiService';

// --- Constants ---
const STORAGE_KEY = 'agentic_studio_pro_v2';
const AUTH_KEY = 'agentic_studio_auth';
const SESSION_KEY = 'agentic_studio_session';

const getFileLanguage = (filename: string | null) => {
  if (!filename) return "plaintext";
  const lower = filename.toLowerCase();
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.html')) return 'html';
  if (lower.endsWith('.json')) return 'json';
  return 'plaintext';
};

// --- Neural Audit Panel ---
const NeuralAuditPanel: React.FC<{ 
  report: ReviewReport | null, 
  onFix: (comment: ReviewComment) => void 
}> = ({ report, onFix }) => {
  if (!report) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
      <ShieldCheck size={48} className="text-slate-800" />
      <p className="text-xs text-slate-500 font-medium">No active audit reports. Initiate a Neural Cycle to audit the codebase.</p>
    </div>
  );

  const getSeverityStyles = (severity: string) => {
    switch(severity) {
      case 'critical': return 'border-red-500/30 bg-red-500/5 text-red-200';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5 text-yellow-200';
      default: return 'border-blue-500/30 bg-blue-500/5 text-blue-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch(severity) {
      case 'critical': return <AlertCircle size={14} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-yellow-500" />;
      default: return <Info size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] p-4 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Neural Audit v1</span>
        </div>
        <div className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-bold text-emerald-400">
          SCORE: {report.overallScore}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(report.scores).map(([key, val]) => (
          <div key={key} className="p-2 bg-slate-900 border border-slate-800 rounded-lg">
            <div className="text-[9px] uppercase font-bold text-slate-500 mb-1">{key}</div>
            <div className="text-sm font-mono text-white">{val}%</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <span className="text-[10px] font-bold uppercase text-slate-500">Pull Request Feedback</span>
        {report.comments.map((comment, idx) => (
          <div key={idx} className={`p-3 rounded-xl border text-[10px] space-y-2 transition-all hover:scale-[1.02] ${getSeverityStyles(comment.severity)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {getSeverityIcon(comment.severity)}
                <span className="font-bold uppercase tracking-tighter">{comment.category}</span>
              </div>
              <span className="font-mono opacity-50">{comment.file}</span>
            </div>
            <p className="leading-relaxed opacity-90">{comment.message}</p>
            <div className="pt-2 border-t border-white/5 flex items-center justify-between">
              <span className="italic opacity-60">Rec: {comment.recommendation}</span>
              <button 
                onClick={() => onFix(comment)}
                className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded flex items-center gap-1 transition-colors"
              >
                <RefreshCw size={10} /> FIX
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Theme Laboratory Component ---
const ThemeLaboratory: React.FC<{ 
  design: DesignSystem | undefined, 
  updateDesign: (d: DesignSystem) => void,
  onSync: () => void 
}> = ({ design, updateDesign, onSync }) => {
  if (!design) return <div className="p-4 text-slate-500 text-[10px]">Initialize a project to unlock the Laboratory.</div>;

  const handleChange = (path: string, value: string) => {
    const newDesign = { ...design };
    const keys = path.split('.');
    let current: any = newDesign;
    for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
    current[keys[keys.length - 1]] = value;
    updateDesign(newDesign);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] p-4 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette size={16} className="text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Theme Laboratory</span>
        </div>
        <button onClick={onSync} title="Publish to Neural Engine" className="p-1.5 bg-indigo-600/20 hover:bg-indigo-600 rounded text-indigo-400 hover:text-white transition-all">
          <Save size={14} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase text-slate-500">Core Spectrum</span>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400">Primary</label>
              <div className="flex items-center gap-2">
                <input type="color" value={design.colors.primary} onChange={(e) => handleChange('colors.primary', e.target.value)} className="w-6 h-6 rounded border-none bg-transparent cursor-pointer" />
                <span className="text-[9px] font-mono text-slate-500">{design.colors.primary}</span>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-400">Accent</label>
              <div className="flex items-center gap-2">
                <input type="color" value={design.colors.accent} onChange={(e) => handleChange('colors.accent', e.target.value)} className="w-6 h-6 rounded border-none bg-transparent cursor-pointer" />
                <span className="text-[9px] font-mono text-slate-500">{design.colors.accent}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-bold uppercase text-slate-500">Geometric Logic</span>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] text-slate-400">
                <label>Radius</label>
                <span>{design.layout.radius}</span>
              </div>
              <input 
                type="range" min="0" max="32" step="2"
                value={parseInt(design.layout.radius)} 
                onChange={(e) => handleChange('layout.radius', `${e.target.value}px`)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] text-slate-400">
                <label>Spacing Scale</label>
                <span>{design.layout.spacing}</span>
              </div>
              <input 
                type="range" min="2" max="12" step="1"
                value={parseInt(design.layout.spacing)} 
                onChange={(e) => handleChange('layout.spacing', `${e.target.value}px`)}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" 
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <span className="text-[10px] font-bold uppercase text-slate-500">Vibe Selection</span>
          <div className="grid grid-cols-2 gap-2">
            {["Modern", "Brutalist", "Minimalist", "Corporate"].map(v => (
              <button 
                key={v}
                onClick={() => handleChange('metadata.styleVibe', v as any)}
                className={`px-2 py-2 rounded text-[9px] font-bold border transition-all ${design.metadata.styleVibe === v ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
              >
                {v.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- History Sidebar Component ---
const HistoryTimeline: React.FC<{ 
  snapshots: HistorySnapshot[], 
  selectedId: string | null, 
  onSelect: (id: string | null) => void,
  onRollback: (id: string) => void
}> = ({ snapshots, selectedId, onSelect, onRollback }) => {
  return (
    <div className="flex flex-col h-full bg-[#020617] border-r border-slate-800 w-12 hover:w-64 transition-all duration-300 group z-20">
      <div className="p-4 flex items-center gap-3 border-b border-slate-800 overflow-hidden shrink-0">
        <HistoryIcon size={18} className="text-blue-400 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">Neural History</span>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-4">
        <div 
          onClick={() => onSelect(null)}
          className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${!selectedId ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' : 'text-slate-500 hover:bg-slate-800 border border-transparent'}`}
        >
          <GitBranch size={16} className="shrink-0" />
          <div className="text-[10px] font-bold uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">HEAD (Active)</div>
        </div>

        <div className="relative pl-4 space-y-6">
          <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800" />
          {[...snapshots].reverse().map((s) => (
            <div key={s.id} className="relative group/item">
              <div 
                className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#020617] transition-all z-10 ${selectedId === s.id ? 'bg-blue-400 scale-125 shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'bg-slate-600 group-hover/item:bg-slate-400'}`} 
              />
              <div 
                onClick={() => onSelect(s.id)}
                className={`ml-4 p-2 rounded-lg cursor-pointer border transition-all ${selectedId === s.id ? 'bg-slate-800 border-slate-700' : 'border-transparent hover:bg-slate-900'}`}
              >
                <div className="flex flex-col gap-1 overflow-hidden">
                  <span className={`text-[10px] font-bold uppercase whitespace-nowrap transition-opacity opacity-0 group-hover:opacity-100 ${selectedId === s.id ? 'text-white' : 'text-slate-400'}`}>{s.label}</span>
                  <div className="flex items-center justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] font-mono text-slate-600">{new Date(s.timestamp).toLocaleTimeString()}</span>
                    {selectedId === s.id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onRollback(s.id); }}
                        className="text-[9px] font-bold text-blue-400 hover:text-white flex items-center gap-1"
                      >
                        <RotateCcw size={10} /> RESTORE
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Auth Component ---
const AuthScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError('Please fill in all fields.'); return; }
    const users = JSON.parse(localStorage.getItem(AUTH_KEY) || '{}');
    if (isLogin) {
      if (users[username] && users[username] === password) {
        const user = { username };
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
        onLogin(user);
      } else { setError('Invalid username or password.'); }
    } else {
      if (users[username]) { setError('Username already exists.'); }
      else {
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
      <div className="w-full max-w-md bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl mb-4">
            <Cpu className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase">Agentic Studio <span className="text-blue-400">Pro</span></h1>
          <p className="text-slate-400 text-sm font-medium mt-1">NEURAL AUDIT ENGINE</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Username" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="Password" />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all">{isLogin ? 'LOG IN' : 'SIGN UP'}</button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-sm text-slate-400 hover:text-blue-400 transition-colors">{isLogin ? "Need an account? Sign up" : "Have an account? Log in"}</button>
      </div>
    </div>
  );
};

// --- Resource Manager Panel ---
const ResourceMonitor: React.FC<{ metrics: ResourceMetrics, suggestions: OptimizationSuggestion[], onRestart: () => void }> = ({ metrics, suggestions, onRestart }) => {
  const getProgressColor = (val: number) => {
    if (val > 90) return 'bg-red-500';
    if (val > 70) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Resource Manager</span>
        </div>
        <button onClick={onRestart} title="Restart WebContainer" className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-blue-400 transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
            <span>CPU Load</span>
            <span>{metrics.cpu.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${getProgressColor(metrics.cpu)}`} style={{ width: `${metrics.cpu}%` }} />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
            <span>Memory Usage</span>
            <span>{metrics.memory} MB</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${getProgressColor((metrics.memory / 1024) * 100)}`} style={{ width: `${(metrics.memory / 1024) * 100}%` }} />
          </div>
        </div>

        <div className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg border border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive size={12} className="text-slate-500" />
            <span className="text-[10px] text-slate-400">VFS Size</span>
          </div>
          <span className="text-[10px] font-mono text-blue-400">{metrics.vfsSize} KB</span>
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
      const parsed = JSON.parse(saved);
      return { 
        ...parsed, 
        status: ['ready', 'error', 'idle'].includes(parsed.status) ? parsed.status : 'idle',
        resources: parsed.resources || { cpu: 0, memory: 0, vfsSize: 0, processes: [] },
        suggestions: parsed.suggestions || [],
        history: parsed.history || [],
        selectedHistoryId: null,
        activeReview: parsed.activeReview || null
      };
    }
    return {
      userPrompt: "",
      fileSystem: {},
      terminalLogs: ["Neural link established."],
      status: "idle",
      iterationCount: 0,
      currentFile: null,
      activeTab: 'code',
      resources: { cpu: 1.2, memory: 124, vfsSize: 0, processes: ['init'] },
      suggestions: [],
      history: [],
      selectedHistoryId: null,
      activeReview: null
    };
  });

  const [input, setInput] = useState(project.userPrompt);
  const [sidebarTab, setSidebarTab] = useState<'resources' | 'theme' | 'audit'>('resources');
  
  // Persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  // Snapshot Capture Helper
  const captureSnapshot = useCallback((label: string) => {
    setProject(prev => {
      const snapshot: HistorySnapshot = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        label,
        status: prev.status,
        fileSystem: { ...prev.fileSystem },
        designSystem: prev.designSystem ? { ...prev.designSystem } : undefined,
        terminalLogs: [...prev.terminalLogs],
        reviewReport: prev.activeReview || undefined
      };
      return { ...prev, history: [...prev.history, snapshot] };
    });
  }, []);

  // Rollback Handler
  const handleRollback = (id: string) => {
    const snap = project.history.find(s => s.id === id);
    if (!snap) return;
    setProject(prev => ({
      ...prev,
      fileSystem: { ...snap.fileSystem },
      designSystem: snap.designSystem ? { ...snap.designSystem } : prev.designSystem,
      status: 'ready',
      terminalLogs: [...prev.terminalLogs, `> Restored to checkpoint: ${snap.label}`],
      activeReview: snap.reviewReport || null,
      selectedHistoryId: null
    }));
  };

  // Fix Audit Comment Handler
  const handleFixAudit = async (comment: ReviewComment) => {
    const currentCode = project.fileSystem[comment.file];
    if (!currentCode) return;
    
    setProject(prev => ({ 
      ...prev, 
      status: 'healing', 
      terminalLogs: [...prev.terminalLogs, `> Neural Auditor suggesting surgical fix for ${comment.file}: ${comment.recommendation}`] 
    }));
    
    const patchedCode = await getPatcherResponse(comment.file, currentCode, `Code Audit Issue: ${comment.message}. Fix: ${comment.recommendation}`);
    
    setProject(prev => ({
      ...prev,
      fileSystem: { ...prev.fileSystem, [comment.file]: patchedCode },
      status: 'ready',
      terminalLogs: [...prev.terminalLogs, `> Fixed audit issue in ${comment.file}.`]
    }));
    captureSnapshot(`Auditor Fix: ${comment.file}`);
  };

  // --- Simulated Resource Loop ---
  useEffect(() => {
    const interval = setInterval(() => {
      setProject(prev => {
        let cpuTarget = 1.5;
        let memBase = 120 + Object.keys(prev.fileSystem).length * 10;
        let procs = ['vfs', 'node'];

        if (['coding', 'reviewing'].includes(prev.status)) {
          cpuTarget = 65 + Math.random() * 20;
          memBase += 200;
          procs.push(prev.status === 'coding' ? 'gemini-coder' : 'gemini-reviewer');
        }

        const newCpu = prev.resources.cpu + (cpuTarget - prev.resources.cpu) * 0.1;
        const vfsSize = Object.keys(prev.fileSystem).reduce((acc: number, key: string) => acc + (prev.fileSystem[key]?.length || 0), 0) / 1024;
        
        return {
          ...prev,
          resources: {
            cpu: newCpu,
            memory: Math.round(memBase + (Math.random() * 5)),
            vfsSize: Math.round(vfsSize),
            processes: procs
          }
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const startGeneration = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    setProject(prev => ({
      ...prev,
      userPrompt: trimmedInput,
      plan: undefined,
      designSystem: undefined,
      status: "planning",
      terminalLogs: [...prev.terminalLogs, `> Initializing Project: "${trimmedInput}"`],
      fileSystem: {},
      iterationCount: 0,
      currentFile: null,
      lastSaved: undefined
      userPrompt: input,
      status: "managing",
      fileSystem: {},
      terminalLogs: [...prev.terminalLogs, `> Project Intent: "${input}"`],
      history: [],
      selectedHistoryId: null,
      activeReview: null
    }));
  };

  useEffect(() => {
    if (!user) return;
    const executeCycle = async () => {
       if (project.status === "managing") {
         const srs = await getManagerResponse(project.userPrompt);
         setProject(prev => ({ ...prev, srs, status: "planning" }));
         captureSnapshot("SRS Created");
       }
       if (project.status === "planning") {
         const plan = await getPlannerResponse(project.srs!);
         setProject(prev => ({ ...prev, plan, status: "designing" }));
         captureSnapshot("Plan Finalized");
       }
       if (project.status === "designing") {
         const design = await getDesignerResponse(project.userPrompt, project.plan!.features);
         setProject(prev => ({ ...prev, designSystem: design, status: "architecting" }));
         captureSnapshot("Design Seeded");
       }
       if (project.status === "architecting") {
         const initialFS: Record<string, string> = {};
         project.plan!.files.forEach(f => { initialFS[f] = "// Initializing..."; });
         setProject(prev => ({ ...prev, fileSystem: initialFS, status: "coding" }));
         captureSnapshot("FS Scaffolding");
       }
       if (project.status === "coding") {
         const files = Object.keys(project.fileSystem);
         for (const file of files) {
           setProject(prev => ({ ...prev, currentFile: file }));
           const code = await getCoderResponse(file, project.plan!, project.designSystem!, project.fileSystem);
           setProject(prev => ({ 
             ...prev, 
             fileSystem: { ...prev.fileSystem, [file]: code }
           }));
         }
         setProject(prev => ({ ...prev, status: "reviewing" }));
         captureSnapshot("Implementation Complete");
       }
       if (project.status === "reviewing") {
         setProject(prev => ({ ...prev, terminalLogs: [...prev.terminalLogs, "> Running Neural Auditor..."] }));
         const review = await getReviewResponse(project.fileSystem, project.designSystem!);
         setProject(prev => ({ 
           ...prev, 
           activeReview: review, 
           status: "compiling", 
           sidebarTab: 'audit' 
         }));
         captureSnapshot("Neural Audit Complete");
       }
       if (project.status === "compiling") {
         await new Promise(r => setTimeout(r, 1000));
         setProject(prev => ({ ...prev, status: "ready", activeTab: 'preview' }));
         captureSnapshot("Ready for Deployment");
       }
    };
    executeCycle();
  }, [project.status, user]);

  const historicalSnapshot = project.selectedHistoryId ? project.history.find(h => h.id === project.selectedHistoryId) : null;
  const isViewingHistory = !!project.selectedHistoryId;
  const activeDesign = isViewingHistory ? historicalSnapshot?.designSystem : project.designSystem;

  const previewDoc = useMemo(() => {
    if (!activeDesign) return "";
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          :root {
            --primary: ${activeDesign.colors.primary};
            --accent: ${activeDesign.colors.accent};
            --bg: ${activeDesign.colors.background};
            --fg: ${activeDesign.colors.foreground};
            --radius: ${activeDesign.layout.radius};
            --spacing: ${activeDesign.layout.spacing};
          }
          body { background-color: var(--bg); color: var(--fg); font-family: sans-serif; padding: var(--spacing); }
          .card { background: white; border-radius: var(--radius); box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 2rem; margin-bottom: 2rem; border: 1px solid #e2e8f0; }
          .btn { background-color: var(--primary); color: white; padding: 0.75rem 1.5rem; border-radius: var(--radius); font-weight: bold; display: inline-block; }
          .badge { display: inline-block; background: #f1f5f9; color: #475569; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="max-w-2xl mx-auto py-12">
          <header class="mb-12 text-center">
            <div class="badge mb-4">${activeDesign.metadata.styleVibe} architecture</div>
            <h1 class="text-4xl font-black mb-2">${activeDesign.metadata.appName}</h1>
            <p class="text-slate-500">Neural Review Pipeline Active</p>
          </header>
          <div class="card">
            <h2 class="text-xl font-bold mb-4">Neural Audit Passed</h2>
            <p class="mb-6 text-slate-600 leading-relaxed">This view provides a live preview of the design system components before final generation.</p>
            <div class="btn">Deploy App</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }, [activeDesign]);

  if (!user) return <AuthScreen onLogin={setUser} />;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0f172a] text-slate-100 font-sans">
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f172a]/80 backdrop-blur-md z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg"><ShieldCheck className="text-white" size={18} /></div>
          <h1 className="font-bold text-sm tracking-tight uppercase">Agentic Studio <span className="text-blue-400">Pro</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            <div className={`w-2 h-2 rounded-full ${project.status === 'idle' ? 'bg-slate-500' : 'bg-green-500 animate-pulse'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{project.status}</span>
          </div>
          <button onClick={startGeneration} disabled={project.status !== 'idle' && project.status !== 'ready'} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-500/10">INITIATE PROJECT</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <HistoryTimeline 
          snapshots={project.history} 
          selectedId={project.selectedHistoryId} 
          onSelect={(id) => setProject(p => ({ ...p, selectedHistoryId: id }))}
          onRollback={handleRollback}
        />

        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
          <div className="flex h-10 border-b border-slate-800 bg-[#0f172a] items-center px-4">
             <div className="flex h-full mr-auto">
               <button onClick={() => setProject(p => ({ ...p, activeTab: 'code' }))} className={`px-4 h-full text-[10px] font-bold tracking-widest transition-all ${project.activeTab === 'code' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>SOURCE</button>
               <button onClick={() => setProject(p => ({ ...p, activeTab: 'preview' }))} className={`px-4 h-full text-[10px] font-bold tracking-widest transition-all ${project.activeTab === 'preview' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500 hover:text-slate-300'}`}>DEPLOYMENT</button>
             </div>
             {isViewingHistory && (
               <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md">
                 <Clock size={10} className="text-blue-400" />
                 <span className="text-[9px] font-bold text-blue-400 uppercase">Snapshot Mode</span>
               </div>
             )}
          </div>

          <div className="flex-1 relative bg-[#020617]">
            {project.activeTab === 'code' ? (
              isViewingHistory && project.currentFile ? (
                <DiffEditor 
                  height="100%" 
                  language={getFileLanguage(project.currentFile)}
                  original={historicalSnapshot?.fileSystem[project.currentFile] || ""}
                  modified={project.fileSystem[project.currentFile] || ""}
                  theme="vs-dark"
                  options={{ minimap: { enabled: false }, fontSize: 13, readOnly: true }}
                />
              ) : (
                <Editor 
                  height="100%" 
                  language={getFileLanguage(project.currentFile)} 
                  theme="vs-dark" 
                  value={project.currentFile ? project.fileSystem[project.currentFile] : "// Select a file or start generation..."} 
                  options={{ minimap: { enabled: false }, fontSize: 13, readOnly: isViewingHistory }} 
                />
              )
            ) : (
              <div className="absolute inset-0 bg-[#f8fafc]">
                <iframe title="Neural Preview" srcDoc={previewDoc} className="w-full h-full border-none" />
              </div>
            )}
          </div>

          <div className="h-28 bg-[#020617] border-t border-slate-800 p-2 font-mono text-[9px] text-slate-500 overflow-y-auto">
            {(isViewingHistory ? historicalSnapshot?.terminalLogs : project.terminalLogs)?.map((l, i) => <div key={i} className="py-0.5"><span className="text-blue-900/50 mr-2">➜</span>{l}</div>)}
          </div>
        </div>

        <div className="w-80 flex flex-col bg-[#020617] border-l border-slate-800">
          <div className="flex h-10 border-b border-slate-800 shrink-0">
             <button onClick={() => setSidebarTab('resources')} className={`flex-1 h-full text-[9px] font-bold flex items-center justify-center gap-1 ${sidebarTab === 'resources' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-slate-500'}`}>
                <Activity size={12} /> RESOURCES
             </button>
             <button onClick={() => setSidebarTab('theme')} className={`flex-1 h-full text-[9px] font-bold flex items-center justify-center gap-1 ${sidebarTab === 'theme' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500'}`}>
                <Palette size={12} /> THEME
             </button>
             <button onClick={() => setSidebarTab('audit')} className={`flex-1 h-full text-[9px] font-bold flex items-center justify-center gap-1 ${sidebarTab === 'audit' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-slate-500'}`}>
                <ShieldCheck size={12} /> AUDIT
             </button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'resources' && <ResourceMonitor metrics={project.resources} suggestions={project.suggestions} onRestart={() => window.location.reload()} />}
            {sidebarTab === 'theme' && <ThemeLaboratory design={project.designSystem} updateDesign={(d) => setProject(p => ({ ...p, designSystem: d }))} onSync={() => captureSnapshot("Design Update")} />}
            {sidebarTab === 'audit' && <NeuralAuditPanel report={isViewingHistory ? historicalSnapshot?.reviewReport || null : project.activeReview} onFix={handleFixAudit} />}
          </div>

          <div className="p-4 space-y-4 border-t border-slate-800">
            <textarea 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              disabled={project.status !== 'idle' && project.status !== 'ready'}
              placeholder="Describe your next neural project..." 
              className="w-full h-20 bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" 
            />
            <button 
              onClick={startGeneration} 
              disabled={project.status !== 'idle' && project.status !== 'ready'}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-[10px] font-bold transition-all shadow-xl shadow-blue-500/10 flex items-center justify-center gap-2"
            >
              <Zap size={14} /> RUN ENGINE
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
