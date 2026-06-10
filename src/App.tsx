import { useState, useEffect } from 'react';
import { ExamConfig, DailyPractice, MockTest, Mistake, MissionTask } from './types';
import {
  getExamConfig,
  getDailyPractices,
  getMockTests,
  getMistakes,
  getMissionTasks,
  clearAllData
} from './utils/storage';

// Subcomponents
import ExamSetup from './components/ExamSetup';
import DashboardView from './components/DashboardView';
import PracticeTracker from './components/PracticeTracker';
import MockTestTracker from './components/MockTestTracker';
import MistakeBankView from './components/MistakeBankView';
import PerformanceAnalysisView from './components/PerformanceAnalysisView';
import VisualAnalyticsView from './components/VisualAnalyticsView';
import GoogleSheetsSync from './components/GoogleSheetsSync';

// Icons
import {
  ShieldAlert,
  Target,
  BookOpen,
  Award,
  FileWarning,
  LineChart,
  Settings,
  RefreshCw,
  Cpu,
  LogOut,
  Radio,
  FileSpreadsheet
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [practices, setPractices] = useState<DailyPractice[]>([]);
  const [mocks, setMocks] = useState<MockTest[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [missions, setMissions] = useState<MissionTask[]>([]);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isInitializing, setIsInitializing] = useState(true);

  // Load all initial structures during mount with a one-time clean-slate migrator
  useEffect(() => {
    const demoCleaned = localStorage.getItem("emc_clean_scratch_v2");
    if (!demoCleaned) {
      clearAllData();
      localStorage.setItem("emc_clean_scratch_v2", "true");
      setIsInitializing(false);
      return;
    }

    const loadedConfig = getExamConfig();
    if (loadedConfig) {
      setConfig(loadedConfig);
      setPractices(getDailyPractices());
      setMocks(getMockTests());
      setMistakes(getMistakes());
      
      const subjectNames = loadedConfig.subjects.map(s => s.name);
      setMissions(getMissionTasks(subjectNames));
    }
    setIsInitializing(false);
  }, []);

  const handleSetupComplete = (newConfig: ExamConfig) => {
    setConfig(newConfig);
    setPractices(getDailyPractices());
    setMocks(getMockTests());
    setMistakes(getMistakes());
    
    const subjectNames = newConfig.subjects.map(s => s.name);
    setMissions(getMissionTasks(subjectNames));
    setActiveTab('dashboard');
  };

  const handleResetStation = () => {
    if (window.confirm("Are you sure you want to shut down this terminal? This will clear all logged mock tests, mistakes, and practices from local browser memory.")) {
      clearAllData();
      setConfig(null);
      setPractices([]);
      setMocks([]);
      setMistakes([]);
      setMissions([]);
      setActiveTab('dashboard');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center font-mono text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-indigo-400" />
          <span className="tracking-widest">INITIALIZING COMMAND DECK...</span>
        </div>
      </div>
    );
  }

  // Render initialization screen if no config exists
  if (!config) {
    return <ExamSetup onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] font-sans flex flex-col relative">
      
      {/* Absolute Decorative Glows */}
      <div className="absolute top-0 left-[-20%] w-[50rem] h-[50rem] rounded-full bg-[#00d4ff]/3 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[45rem] h-[55rem] rounded-full bg-[#00d4ff]/3 blur-[100px] pointer-events-none"></div>

      {/* 1. Global Terminal Control Header */}
      <header className="sticky top-0 z-40 bg-[#010409]/90 border-b border-[#30363d] backdrop-blur-xl px-4 sm:px-6 py-4.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500/20 to-sky-500/10 border border-indigo-500/30 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <Cpu className="h-5.5 w-5.5 text-indigo-400" id="header-cpu-logo" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-black tracking-wide font-display text-white">
                EXAM MISSION CONTROL
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono flex items-center gap-1">
                <Radio className="h-3 w-3 inline text-emerald-400 animate-pulse" />
                SYSTEM SECURE // LOCAL STATION ONLINE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Display configured exam banner indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300">
              <span className="font-semibold text-slate-400">Exam:</span>
              <span className="font-bold text-white font-mono">{config.examName}</span>
            </div>

            <button
              onClick={handleResetStation}
              className="text-slate-400 hover:text-red-400 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-slate-900/60 border border-slate-800/80 hover:border-red-500/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Shutdown Base
            </button>
          </div>

        </div>
      </header>

      {/* 2. Primary Navigation Tabs Panel */}
      <div className="bg-[#010409]/60 border-b border-[#30363d] py-2.5 px-4 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-2 sm:gap-3 min-w-[700px]">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/10 border border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <Target className="h-4.5 w-4.5" />
            Flight Deck
          </button>

          <button
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center gap-2 ${activeTab === 'practice' ? 'bg-[#10b981] text-white shadow-lg shadow-green-500/10 border border-[#10b981]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            Daily Practice
          </button>

          <button
            onClick={() => setActiveTab('mocks')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center gap-2 ${activeTab === 'mocks' ? 'bg-indigo-600 text-white border border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <Award className="h-4.5 w-4.5" />
            Mock Tests
          </button>

          <button
            onClick={() => setActiveTab('mistakes')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center gap-2 ${activeTab === 'mistakes' ? 'bg-red-600 text-white border border-red-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <FileWarning className="h-4.5 w-4.5" />
            Mistake Bank
          </button>

          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center gap-2 ${activeTab === 'performance' ? 'bg-indigo-600 text-white border border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <ShieldAlert className="h-4.5 w-4.5" />
            Performance Gaps
          </button>

          <button
            onClick={() => setActiveTab('charts')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center gap-2 ${activeTab === 'charts' ? 'bg-[#06b6d4] text-white border border-[#06b6d4]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <LineChart className="h-4.5 w-4.5" />
            Visualizer Center
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center gap-2 ${activeTab === 'sheets' ? 'bg-[#3fb950] text-white border border-[#3fb950]' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <FileSpreadsheet className="h-4.5 w-4.5" />
            Google Sheets Sync
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-slate-700 text-white border border-slate-600' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'}`}
          >
            <Settings className="h-4.5 w-4.5" />
            Settings
          </button>

        </div>
      </div>

      {/* 3. Central Application Stage */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        
        {/* Dynamic component routing based on active tab state */}
        {activeTab === 'dashboard' && (
          <DashboardView
            config={config}
            mocks={mocks}
            practices={practices}
            missions={missions}
            onMissionUpdate={setMissions}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'practice' && (
          <PracticeTracker
            config={config}
            practices={practices}
            onPracticesUpdate={setPractices}
          />
        )}

        {activeTab === 'mocks' && (
          <MockTestTracker
            config={config}
            mocks={mocks}
            onMocksUpdate={setMocks}
          />
        )}

        {activeTab === 'mistakes' && (
          <MistakeBankView
            config={config}
            mistakes={mistakes}
            onMistakesUpdate={setMistakes}
          />
        )}

        {activeTab === 'performance' && (
          <PerformanceAnalysisView
            config={config}
            mocks={mocks}
            practices={practices}
          />
        )}

        {activeTab === 'charts' && (
          <VisualAnalyticsView
            config={config}
            mocks={mocks}
            practices={practices}
            mistakes={mistakes}
          />
        )}

        {activeTab === 'sheets' && (
          <GoogleSheetsSync
            config={config}
            mocks={mocks}
            practices={practices}
            mistakes={mistakes}
          />
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 text-left">
              <h3 className="text-lg font-bold text-white mb-2 font-display">Configure Exam Stream Parameters</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Need to fine-tune your target date, change target parameters or register a custom subject total weightage? Update your initialization setup below.
              </p>
              
              <ExamSetup 
                onSetupComplete={(updatedConfig) => {
                  setConfig(updatedConfig);
                  setActiveTab('dashboard');
                }} 
              />
            </div>
          </div>
        )}

      </main>

      {/* 4. Console Telemetry Status Footer */}
      <footer className="mt-12 bg-slate-950/80 border-t border-slate-800/50 py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p className="font-mono text-[10px] tracking-wider">
            STATION TELEMETRY: INBOUND COMPILING OK // DB ENGINE: LOCALSTORAGE PERSISTED // SUPABASE READY STATE
          </p>
          <p className="font-medium text-slate-600">
            &copy; 2026 Exam Mission Control. Crafted for Competitive Success.
          </p>
        </div>
      </footer>

    </div>
  );
}
