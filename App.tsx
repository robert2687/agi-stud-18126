
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
  Info,
  Puzzle,
  Search,
  Shield,
  FileJson,
  FlaskConical,
  Globe
} from 'lucide-react';
import Editor, { DiffEditor, OnMount } from "@monaco-editor/react";
import { ProjectState, AgentStatus, DesignSystem, User, ResourceMetrics, OptimizationSuggestion, HistorySnapshot, ReviewReport, ReviewComment, NeuralPlugin, LifecycleHook } from './types';
import { 
  getManagerResponse,
  getPlannerResponse, 
  getDesignerResponse, 
  getCoderResponse, 
  getPatcherResponse,
  getReviewResponse,
  executePluginAgent
} from './geminiService';

// --- Constants ---
const STORAGE_KEY = 'agentic_studio_pro_v3';
const AUTH_KEY = 'agentic_studio_auth';
const SESSION_KEY = 'agentic_studio_session';

const DEFAULT_PLUGINS: NeuralPlugin[] = [
  { id: 'shield-6', name: 'Shield-6', description: 'Advanced security auditor. Checks for hardcoded keys and XSS vulnerabilities.', icon: 'Shield', hook: 'post-audit', enabled: false, author: 'Sentinel Labs' },
  { id: 'scribe-seo', name: 'Scribe SEO', description: 'SEO optimization agent. Validates semantic HTML, meta tags, and alt text.', icon: 'Globe', hook: 'post-coding', enabled: false, author: 'Organic Reach Inc.' },
  { id: 'pulse-test', name: 'Pulse Test', description: 'Automatic test generator. Creates Vitest unit tests for components.', icon: 'FlaskConical', hook: 'on-demand', enabled: false, author: 'QA Swarm' }
];

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

// --- Plugin Marketplace Component ---
const PluginMarketplace: React.FC<{ 
  plugins: NeuralPlugin[], 
  onToggle: (id: string) => void,
  onRun: (plugin: NeuralPlugin) => void 
}> = ({ plugins, onToggle, onRun }) => {
  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'Shield': return <Shield size={18} className="text-red-400" />;
      case 'Globe': return <Globe size={18} className="text-blue-400" />;
      case 'FlaskConical': return <FlaskConical size={18} className="text-purple-400" />;
      default: return <Puzzle size={18} className="text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] p-4 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle size={16} className="text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Neural Marketplace</span>
        </div>
      </div>

      <div className="space-y-4">
        {plugins.map((plugin) => (
          <div key={plugin.id} className={`p-4 rounded-2xl border transition-all ${plugin.enabled ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${plugin.enabled ? 'bg-indigo-500/20' : 'bg-slate-800'}`}>
                  {getIcon(plugin.icon)}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">{plugin.name}</h3>
                  <span className="text-[9px] text-slate-500 uppercase tracking-tighter">by {plugin.author}</span>
                </div>
              </div>
              <button 
                onClick={() => onToggle(plugin.id)}
                className={`w-10 h-5 rounded-full relative transition-colors ${plugin.enabled ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${plugin.enabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-4">{plugin.description}</p>
            <div className="flex items-center justify-between">
              <div className="px-2 py-0.5 bg-slate-800 rounded text-[8px] font-mono text-slate-500 uppercase">
                Hook: {plugin.hook}
              </div>
              {plugin.enabled && (
                <button 
                  onClick={() => onRun(plugin)}
                  className="text-[10px] font-bold text-indigo-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <Play size={10} /> RUN NOW
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <FileJson size={12} className="text-slate-500" />
          <span className="text-[9px] font-bold text-slate-500 uppercase">Developer API</span>
        </div>
        <p className="text-[9px] text-slate-600 leading-relaxed italic">Drag and drop a manifest.json to load local agents into the Neural Swarm.</p>
      </div>
    </div>
  );
};

// --- Audit/Review Component ---
const NeuralAuditPanel: React.FC<{ report: ReviewReport | null, onFix: (comment: ReviewComment) => void }> = ({ report, onFix }) => {
  if (!report) return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
      <ShieldCheck size={48} className="text-slate-800" />
      <p className="text-xs text-slate-500">No active audit reports. Start a Neural Cycle.</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#0f172a] p-4 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider">Audit Report</span>
        </div>
        <div className="text-[10px] font-mono font-bold text-emerald-400">{report.overallScore}%</div>
      </div>

      <div className="space-y-3">
        {report.comments.map((comment, idx) => (
          <div key={idx} className={`p-3 rounded-xl border text-[10px] space-y-2 ${comment.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-900 border-slate-800'}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-tighter text-slate-400">{comment.category}</span>
              <span className="opacity-50 font-mono">{comment.file}</span>
            </div>
            <p className="text-slate-200">{comment.message}</p>
            <div className="pt-2 flex items-center justify-between border-t border-white/5">
              <span className="italic opacity-50">Rec: {comment.recommendation}</span>
              <button onClick={() => onFix(comment)} className="text-indigo-400 font-bold flex items-center gap-1"><RefreshCw size={10} /> FIX</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Theme Laboratory Component ---
const ThemeLaboratory: React.FC<{ design: DesignSystem | undefined, updateDesign: (d: DesignSystem) => void }> = ({ design, updateDesign }) => {
  if (!design) return <div className="p-4 text-slate-500 text-[10px]">Initialize a project.</div>;

  const handleChange = (path: string, value: string) => {
    const newDesign = { ...design };
    const keys = path.split('.');
    let current: any = newDesign;
    for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
    current[keys[keys.length - 1]] = value;
    updateDesign(newDesign);
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] p-4 space-y-6">
      <div className="flex items-center gap-2">
        <Palette size={16} className="text-indigo-400" />
        <span className="text-xs font-bold uppercase tracking-wider">Theme Lab</span>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 uppercase">Primary</label>
            <input type="color" value={design.colors.primary} onChange={(e) => handleChange('colors.primary', e.target.value)} className="w-full h-8 rounded border-none bg-transparent cursor-pointer" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 uppercase">Accent</label>
            <input type="color" value={design.colors.accent} onChange={(e) => handleChange('colors.accent', e.target.value)} className="w-full h-8 rounded border-none bg-transparent cursor-pointer" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] text-slate-500 uppercase">Radius: {design.layout.radius}</label>
          <input type="range" min="0" max="32" value={parseInt(design.layout.radius)} onChange={(e) => handleChange('layout.radius', `${e.target.value}px`)} className="w-full accent-indigo-500" />
        </div>
      </div>
    </div>
  );
};

// --- Auth Component ---
const AuthScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-6">
      <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-500/20"><Puzzle className="text-white" size={32} /></div>
          <h1 className="text-2xl font-bold uppercase tracking-widest text-white">Agentic Studio</h1>
          <p className="text-slate-500 text-sm">PLUGIN-READY ARCHITECTURE</p>
        </div>
        <div className="space-y-4">
          <input value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Username" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Password" />
          <button onClick={() => onLogin({ username })} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all uppercase tracking-widest text-xs">Login</button>
        </div>
      </div>
    </div>
  );
};

// --- History Component ---
const HistoryTimeline: React.FC<{ snapshots: HistorySnapshot[], onSelect: (id: string | null) => void, selectedId: string | null }> = ({ snapshots, onSelect, selectedId }) => {
  return (
    <div className="w-12 hover:w-48 bg-[#020617] border-r border-slate-800 transition-all group z-20 overflow-y-auto">
      <div className="p-4 border-b border-slate-800"><HistoryIcon size={18} className="text-slate-500" /></div>
      <div className="p-2 space-y-4">
        <div onClick={() => onSelect(null)} className={`p-2 rounded cursor-pointer transition-all ${!selectedId ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-600'}`}>
          <GitBranch size={16} />
        </div>
        {[...snapshots].reverse().map(s => (
          <div key={s.id} onClick={() => onSelect(s.id)} className={`p-2 rounded cursor-pointer transition-all border ${selectedId === s.id ? 'bg-slate-800 border-slate-700 text-white' : 'border-transparent text-slate-600'}`}>
             <span className="text-[9px] font-bold group-hover:block hidden truncate uppercase tracking-tighter">{s.label}</span>
             <span className="text-[9px] block group-hover:hidden">•</span>
          </div>
        ))}
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
    if (saved) return JSON.parse(saved);
    return {
      userPrompt: "",
      fileSystem: {},
      terminalLogs: ["Neural orchestrator online."],
      status: "idle",
      iterationCount: 0,
      currentFile: null,
      activeTab: 'code',
      resources: { cpu: 0, memory: 0, vfsSize: 0, processes: [] },
      suggestions: [],
      history: [],
      selectedHistoryId: null,
      activeReview: null,
      installedPlugins: DEFAULT_PLUGINS
    };
  });

  const [input, setInput] = useState(project.userPrompt);
  const [sidebarTab, setSidebarTab] = useState<'theme' | 'audit' | 'plugins'>('plugins');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }, [project]);

  const captureSnapshot = useCallback((label: string) => {
    setProject(prev => {
      const snap: HistorySnapshot = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        label,
        status: prev.status,
        fileSystem: { ...prev.fileSystem },
        designSystem: prev.designSystem ? { ...prev.designSystem } : undefined,
        terminalLogs: [...prev.terminalLogs],
        reviewReport: prev.activeReview || undefined
      };
      return { ...prev, history: [...prev.history, snap] };
    });
  }, []);

  const handlePluginToggle = (id: string) => {
    setProject(prev => ({
      ...prev,
      installedPlugins: prev.installedPlugins.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
    }));
  };

  const runPluginManually = async (plugin: NeuralPlugin) => {
    setProject(prev => ({ 
      ...prev, 
      status: 'plugging', 
      terminalLogs: [...prev.terminalLogs, `> Manually triggering plugin: ${plugin.name}`] 
    }));
    
    const result = await executePluginAgent(plugin, project.fileSystem, project.designSystem!);
    
    setProject(prev => {
      const newFS = { ...prev.fileSystem };
      result.mutations?.forEach((m: any) => { newFS[m.file] = m.content; });
      
      const newReview = prev.activeReview ? { ...prev.activeReview } : { id: 'rev', timestamp: Date.now(), overallScore: 100, scores: { quality: 100, a11y: 100, performance: 100, design: 100 }, comments: [] };
      if (result.comments) newReview.comments = [...newReview.comments, ...result.comments];
      
      return {
        ...prev,
        fileSystem: newFS,
        activeReview: newReview,
        status: 'ready',
        terminalLogs: [...prev.terminalLogs, `> ${plugin.name} execution finished.`]
      };
    });
    captureSnapshot(`Manual Run: ${plugin.name}`);
  };

  const startGeneration = async () => {
    if (!input) return;
    setProject(prev => ({
      ...prev,
      userPrompt: input,
      status: "managing",
      fileSystem: {},
      terminalLogs: [...prev.terminalLogs, `> New Project: "${input}"`],
      activeReview: null
    }));
  };

  useEffect(() => {
    if (!user) return;
    const executeCycle = async () => {
      if (project.status === "managing") {
        const srs = await getManagerResponse(project.userPrompt);
        setProject(prev => ({ ...prev, srs, status: "planning" }));
      }
      if (project.status === "planning") {
        const plan = await getPlannerResponse(project.srs!);
        setProject(prev => ({ ...prev, plan, status: "designing" }));
      }
      if (project.status === "designing") {
        const design = await getDesignerResponse(project.userPrompt, project.plan!.features);
        setProject(prev => ({ ...prev, designSystem: design, status: "architecting" }));
      }
      if (project.status === "architecting") {
        const initialFS: Record<string, string> = {};
        project.plan!.files.forEach(f => { initialFS[f] = "// Initializing..."; });
        setProject(prev => ({ ...prev, fileSystem: initialFS, status: "coding" }));
      }
      if (project.status === "coding") {
        const files = Object.keys(project.fileSystem);
        for (const file of files) {
          setProject(prev => ({ ...prev, currentFile: file }));
          const code = await getCoderResponse(file, project.plan!, project.designSystem!, project.fileSystem);
          setProject(prev => ({ ...prev, fileSystem: { ...prev.fileSystem, [file]: code } }));
        }

        // --- Post-Coding Plugin Hook ---
        const codingPlugins = project.installedPlugins.filter(p => p.enabled && p.hook === 'post-coding');
        for (const p of codingPlugins) {
          setProject(prev => ({ ...prev, terminalLogs: [...prev.terminalLogs, `> Lifecycle Hook: ${p.name} executing...`] }));
          const result = await executePluginAgent(p, project.fileSystem, project.designSystem!);
          setProject(prev => {
            const fs = { ...prev.fileSystem };
            result.mutations?.forEach((m: any) => { fs[m.file] = m.content; });
            return { ...prev, fileSystem: fs };
          });
        }

        setProject(prev => ({ ...prev, status: "reviewing" }));
      }
      if (project.status === "reviewing") {
        const review = await getReviewResponse(project.fileSystem, project.designSystem!);
        
        // --- Post-Audit Plugin Hook ---
        const auditPlugins = project.installedPlugins.filter(p => p.enabled && p.hook === 'post-audit');
        for (const p of auditPlugins) {
           setProject(prev => ({ ...prev, terminalLogs: [...prev.terminalLogs, `> Audit Hook: ${p.name} running...`] }));
           const result = await executePluginAgent(p, project.fileSystem, project.designSystem!);
           if (result.comments) review.comments = [...review.comments, ...result.comments];
        }

        setProject(prev => ({ ...prev, activeReview: review, status: "compiling" }));
      }
      if (project.status === "compiling") {
        setTimeout(() => setProject(prev => ({ ...prev, status: "ready", activeTab: 'preview' })), 800);
        captureSnapshot("Neural Deployment Ready");
      }
    };
    executeCycle();
  }, [project.status, user]);

  if (!user) return <AuthScreen onLogin={setUser} />;

  const historicalSnap = project.selectedHistoryId ? project.history.find(h => h.id === project.selectedHistoryId) : null;
  const isViewingHistory = !!project.selectedHistoryId;
  const activeFS = isViewingHistory ? historicalSnap?.fileSystem : project.fileSystem;
  const activeDesign = isViewingHistory ? historicalSnap?.designSystem : project.designSystem;

  const previewDoc = useMemo(() => {
    if (!activeDesign) return "";
    return `
      <!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script><style>
      :root { --primary: ${activeDesign.colors.primary}; --accent: ${activeDesign.colors.accent}; --radius: ${activeDesign.layout.radius}; --spacing: ${activeDesign.layout.spacing}; }
      body { background-color: ${activeDesign.colors.background}; padding: var(--spacing); font-family: sans-serif; }
      .btn { background: var(--primary); color: white; padding: 0.75rem 1.5rem; border-radius: var(--radius); display: inline-block; font-weight: bold; }
      </style></head><body>
      <div class="max-w-xl mx-auto py-20 text-center">
        <h1 class="text-5xl font-black mb-4" style="color: ${activeDesign.colors.foreground}">${activeDesign.metadata.appName}</h1>
        <p class="text-slate-500 mb-8 uppercase tracking-widest text-sm">Plugin Architecture Active: ${project.installedPlugins.filter(p => p.enabled).length} Enabled</p>
        <div class="btn">Launch Neural Interface</div>
      </div>
      </body></html>
    `;
  }, [activeDesign, project.installedPlugins]);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0f172a] text-slate-100 font-sans overflow-hidden">
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-[#0f172a]/80 backdrop-blur-md z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/10"><Puzzle className="text-white" size={18} /></div>
          <h1 className="font-bold text-sm tracking-tighter uppercase">Neural Swarm <span className="text-indigo-400">Pro</span></h1>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
              <Activity size={12} className={project.status !== 'idle' ? 'text-indigo-400 animate-pulse' : 'text-slate-500'} />
              <span className="text-[10px] font-bold uppercase">{project.status}</span>
           </div>
           <button onClick={startGeneration} disabled={project.status !== 'idle' && project.status !== 'ready'} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50">GENERATE</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <HistoryTimeline snapshots={project.history} onSelect={id => setProject(p => ({ ...p, selectedHistoryId: id }))} selectedId={project.selectedHistoryId} />

        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-800">
          <div className="flex h-10 border-b border-slate-800 bg-[#0f172a]">
             <button onClick={() => setProject(p => ({ ...p, activeTab: 'code' }))} className={`px-6 h-full text-[10px] font-bold tracking-widest ${project.activeTab === 'code' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500'}`}>SOURCE</button>
             <button onClick={() => setProject(p => ({ ...p, activeTab: 'preview' }))} className={`px-6 h-full text-[10px] font-bold tracking-widest ${project.activeTab === 'preview' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500'}`}>PREVIEW</button>
          </div>
          <div className="flex-1 relative bg-[#020617]">
            {project.activeTab === 'code' ? (
              <Editor height="100%" language={getFileLanguage(project.currentFile)} theme="vs-dark" value={project.currentFile ? activeFS[project.currentFile] : "// Engine idle..."} options={{ minimap: { enabled: false }, fontSize: 13, readOnly: isViewingHistory }} />
            ) : (
              <div className="absolute inset-0 bg-[#f8fafc]"><iframe title="preview" srcDoc={previewDoc} className="w-full h-full border-none" /></div>
            )}
          </div>
          <div className="h-24 bg-[#020617] border-t border-slate-800 p-2 font-mono text-[9px] text-slate-500 overflow-y-auto">
            {(isViewingHistory ? historicalSnap?.terminalLogs : project.terminalLogs)?.map((l, i) => <div key={i} className="py-0.5"><span className="text-indigo-900/50 mr-2">➜</span>{l}</div>)}
          </div>
        </div>

        <div className="w-80 flex flex-col bg-[#020617] border-l border-slate-800">
          <div className="flex h-10 border-b border-slate-800 shrink-0">
             <button onClick={() => setSidebarTab('plugins')} className={`flex-1 h-full text-[9px] font-bold flex items-center justify-center gap-1 ${sidebarTab === 'plugins' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500'}`}><Puzzle size={12} /> PLUGINS</button>
             <button onClick={() => setSidebarTab('audit')} className={`flex-1 h-full text-[9px] font-bold flex items-center justify-center gap-1 ${sidebarTab === 'audit' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500'}`}><ShieldCheck size={12} /> AUDIT</button>
             <button onClick={() => setSidebarTab('theme')} className={`flex-1 h-full text-[9px] font-bold flex items-center justify-center gap-1 ${sidebarTab === 'theme' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}><Palette size={12} /> THEME</button>
          </div>
          <div className="flex-1 overflow-hidden">
            {sidebarTab === 'plugins' && <PluginMarketplace plugins={project.installedPlugins} onToggle={handlePluginToggle} onRun={runPluginManually} />}
            {sidebarTab === 'audit' && <NeuralAuditPanel report={project.activeReview} onFix={() => {}} />}
            {sidebarTab === 'theme' && <ThemeLaboratory design={project.designSystem} updateDesign={d => setProject(p => ({ ...p, designSystem: d }))} />}
          </div>
          <div className="p-4 space-y-4 border-t border-slate-800">
            <textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Project intent..." className="w-full h-20 bg-slate-900 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 resize-none outline-none focus:ring-1 focus:ring-indigo-500 transition-all" />
            <button onClick={startGeneration} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-[10px] font-bold shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2 tracking-widest uppercase"><Zap size={14} /> Neural Pulse</button>
          </div>
        </div>
      </main>
    </div>
  );
}
