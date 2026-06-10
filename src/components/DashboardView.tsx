import React, { useState } from 'react';
import { ExamConfig, DailyPractice, MockTest, MissionTask } from '../types';
import { calcDaysRemaining, getGeneralStats, getRecommendations } from '../utils/analytics';
import { saveMissionTasks } from '../utils/storage';
import { ShieldCheck, Target, Award, ShieldAlert, Sparkles, Plus, Calendar, Clock, Rocket, AlertTriangle, CheckSquare, Square, Check, Trash2, Sliders, TrendingUp, HelpCircle, ArrowUpRight } from 'lucide-react';

interface DashboardViewProps {
  config: ExamConfig;
  mocks: MockTest[];
  practices: DailyPractice[];
  missions: MissionTask[];
  onMissionUpdate: (updated: MissionTask[]) => void;
  onNavigateToTab: (tabId: string) => void;
}

export default function DashboardView({
  config,
  mocks,
  practices,
  missions,
  onMissionUpdate,
  onNavigateToTab
}: DashboardViewProps) {
  const daysLeft = calcDaysRemaining(config.examDate);
  const stats = getGeneralStats(config, mocks, practices);
  const { recommendations, overallAdvice } = getRecommendations(config, mocks, practices);

  const [customDesc, setCustomDesc] = useState('');
  const [customSubject, setCustomSubject] = useState(config.subjects[0]?.name || 'Quant');

  // Dynamic user-customized simulator parameters
  const [simMocks, setSimMocks] = useState<number>(5);
  const [simAccuracy, setSimAccuracy] = useState<number>(85);
  const [simQuestions, setSimQuestions] = useState<number>(200);

  // Current Average Score based on actual scores added (mocks first, fallback to practices)
  const currentAverageScore = mocks.length > 0 
    ? parseFloat((mocks.reduce((sum, m) => sum + m.totalScore, 0) / mocks.length).toFixed(2))
    : (practices.length > 0 
        ? parseFloat((practices.reduce((sum, p) => sum + (p.score !== undefined ? p.score : (p.correct - (p.wrong * (p.negativeMarking || 0.25)))), 0) / practices.length).toFixed(2)) 
        : 0);

  // Calculate Selection Gap dynamically from current average
  const selectionGap = parseFloat((config.previousCutoff - currentAverageScore).toFixed(2));
  
  // Progress ratio calculation relative to total Marks
  const progressPercentage = Math.min(100, Math.max(0, Math.round((currentAverageScore / config.totalMarks) * 100)));
  const gapPercentage = Math.round((selectionGap / config.totalMarks) * 100);

  // Toggle mission completion
  const handleToggleMission = (id: string) => {
    const nextMissions = missions.map(m => {
      if (m.id === id) {
        return { ...m, isCompleted: !m.isCompleted };
      }
      return m;
    });
    onMissionUpdate(nextMissions);
    saveMissionTasks(nextMissions);
  };

  // Add custom task to mission checklist
  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDesc.trim()) return;

    const newTask: MissionTask = {
      id: `custom-${Date.now()}`,
      subject: customSubject,
      description: customDesc.trim(),
      isCompleted: false,
      type: 'Practice'
    };

    const nextMissions = [...missions, newTask];
    onMissionUpdate(nextMissions);
    saveMissionTasks(nextMissions);
    setCustomDesc('');
  };

  // Delete task
  const handleDeleteTask = (id: string) => {
    const nextMissions = missions.filter(m => m.id !== id);
    onMissionUpdate(nextMissions);
    saveMissionTasks(nextMissions);
  };

  const completedMissionsCount = missions.filter(m => m.isCompleted).length;
  const missionProgress = missions.length > 0 ? Math.round((completedMissionsCount / missions.length) * 100) : 0;

  // Simulator Formulas
  // 1. Solving practice questions at selected accuracy acts as strong topic revision
  const practiceBoost = parseFloat(((simQuestions * (simAccuracy / 100)) * 0.15).toFixed(2));
  
  // 2. Taking full-length mock tests optimizes pacing and cuts calculation blunder frequency
  const mockBoost = parseFloat((simMocks * 1.6).toFixed(2));
  
  const totalSimulatedBoost = parseFloat((practiceBoost + mockBoost).toFixed(2));
  const simulatedAverage = parseFloat(Math.min(config.totalMarks, currentAverageScore + totalSimulatedBoost).toFixed(2));
  const simulatedGapRelation = parseFloat((simulatedAverage - config.previousCutoff).toFixed(2));

  return (
    <div className="space-y-6">
      
      {/* 1. Main Header Station & Countdown BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/40 via-slate-900/40 to-sky-950/30 border border-[#30363d] rounded-2xl p-6 md:p-8 backdrop-blur-md">
        <div className="absolute inset-0 bg-grid-slate-800/[0.05] bg-[bottom_center] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        <div className="absolute top-0 right-0 p-8 text-indigo-500/10 pointer-events-none scale-150">
          <Rocket className="h-56 w-56" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wider text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 rounded-full mb-3 uppercase">
              <span className="h-2 w-2 rounded-full bg-[#00d4ff] animate-pulse"></span>
              EXAM PREPARATION STATION
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-display text-white mb-2">
              {config.examName} Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl leading-relaxed">
              Target Score: <strong className="text-slate-200">{config.targetScore} PTS</strong> | Safe Zone Baseline: <strong className="text-slate-200">{config.safeScore} PTS</strong> | Previous Cutoff Score: <strong className="text-[#ff7b72]">{config.previousCutoff} PTS</strong>.
            </p>
          </div>
          
          {/* Days Countdown Dial */}
          <div className="bg-[#010409]/90 border border-[#30363d] rounded-2xl p-4 md:p-5 text-center min-w-[150px] shadow-lg relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"></div>
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5 mb-1">
              <Calendar className="h-3 w-3 text-pink-400" /> Countdown
            </div>
            <div className="text-4xl font-extrabold text-white tracking-tight font-display py-1">
              {daysLeft}
            </div>
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Days Remaining
            </div>
          </div>
        </div>
      </div>

      {/* 2. Selection Gap System Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Prediction Indicator Panel */}
        <div className="lg:col-span-2 bg-[#161b22]/95 border border-[#30363d] rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[100%] bg-gradient-to-b from-[#3fb950]/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center justify-between border-b border-[#30363d] pb-4 mb-5">
            <div className="text-left">
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#3fb950]" />
                Selection Gap Analysis
              </h2>
              <p className="text-xs text-slate-400">Current Average Score vs Previous Year Cutoff</p>
            </div>
            <span className="bg-[#3fb950]/10 text-[#3fb950] text-xs px-2.5 py-1 rounded-md font-mono border border-[#3fb950]/20">
              Live Core Sync
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 text-center">
            
            <div className="bg-[#010409] border border-[#30363d] rounded-xl p-4">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1 font-mono">PREVIOUS YEAR CUTOFF</p>
              <p className="text-2xl font-bold font-display text-[#ff7b72]">{config.previousCutoff} pts</p>
              <p className="text-[10px] text-slate-500 font-mono">Cutoff Benchmark</p>
            </div>

            <div className="bg-[#111c30] border border-[#00d4ff]/20 rounded-xl p-4 relative group">
              <div className="absolute top-1.5 right-1.5 leading-none">
                <div className="h-2 w-2 rounded-full bg-[#00d4ff] animate-ping"></div>
              </div>
              <p className="text-xs text-slate-200 font-semibold uppercase mb-1 font-mono">CURRENT AVG SCORE</p>
              <p className="text-3xl font-extrabold font-display text-[#00d4ff] tracking-tight">{currentAverageScore} <span className="text-xs font-normal">pts</span></p>
              <p className="text-[10px] text-slate-400 font-mono">Based on added entries</p>
            </div>

            <div className={`bg-[#010409]/60 border rounded-xl p-4 ${selectionGap <= 0 ? 'border-green-500/20 bg-green-950/5' : 'border-amber-500/20 bg-amber-950/5'}`}>
              <p className="text-xs text-slate-400 font-medium uppercase mb-1 font-mono">SELECTION GAP</p>
              {selectionGap <= 0 ? (
                <>
                  <p className="text-2xl font-bold font-display text-[#3fb950]">+{Math.abs(selectionGap)}</p>
                  <p className="text-[10px] text-[#3fb950] font-mono">Surplus Marks</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold font-display text-amber-400">{selectionGap}</p>
                  <p className="text-[10px] text-amber-500 font-mono">Marks to Cutoff</p>
                </>
              )}
            </div>

          </div>

          {/* Graphical Progress Bar with active value above and below */}
          <div className="space-y-2 mt-4 text-left">
            <div className="flex justify-between text-xs font-mono font-medium relative border-b border-[#30363d]/40 pb-2 mb-4">
              <span className="text-slate-500">0 pts</span>
              <span className="text-[#ff7b72] font-semibold">Cutoff Limit: {config.previousCutoff} pts</span>
              <span className="text-slate-500">Max: {config.totalMarks} pts</span>
            </div>
            
            {/* Real-time Indicator Above Progress Bar */}
            <div className="relative pt-6 pb-2">
              <div 
                className="absolute top-[-10px] transform -translate-x-1/2 flex flex-col items-center pointer-events-none group transition-all duration-1000 z-20"
                style={{ left: `${Math.max(4, Math.min(96, progressPercentage))}%` }}
              >
                <div className="bg-[#0bd6ff] text-slate-950 text-xs font-extrabold py-1 px-3 rounded-md font-mono shadow-[0_0_15px_rgba(0,212,255,0.4)] whitespace-nowrap">
                  Current Average: {currentAverageScore} pts
                </div>
                <div className="w-2 h-2 bg-[#0bd6ff] rotate-45 mt-[-4px]"></div>
              </div>

              {/* Progress Bar Track */}
              <div className="h-5 bg-[#010409] rounded-full overflow-hidden p-0.5 border border-[#30363d] relative mt-2 shadow-inner">
                {/* Cutoff marker line */}
                <div 
                  className="absolute top-0 bottom-0 w-[2.5px] bg-red-500 z-10"
                  style={{ left: `${(config.previousCutoff / config.totalMarks) * 100}%` }}
                >
                  <div className="absolute top-[-14px] left-[-3px] w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
                </div>
                
                {/* Dynamic colored progress fill */}
                <div 
                  className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${selectionGap <= 0 ? 'from-[#00d4ff] to-[#3fb950]' : 'from-[#00d4ff] to-[#f2cc60]'}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center bg-[#010409]/60 p-3.5 rounded-xl border border-[#30363d]" style={{ contentVisibility: 'auto' }}>
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4.5 w-4.5 text-[#00d4ff] shrink-0 mt-0.5" />
                <div className="text-left leading-relaxed">
                  <p className="text-xs font-mono text-slate-300">
                    <strong className="text-[#00d4ff] font-bold">Dynamic Status Summary:</strong>{' '}
                    {selectionGap <= 0 
                      ? "Congratulations! Your average performance is tracking beyond the competitive cutoff line. Maintain study volume to buffer any final exam stress."
                      : `You are currently matching ${progressPercentage}% of optimal marks. Close the remaining ${selectionGap} marks using the Planner Simulator inputs below.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Recommendation Engine UI */}
        <div className="bg-[#161b22]/95 border border-[#30363d] rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[100%] bg-gradient-to-b from-[#00d4ff]/5 to-transparent pointer-events-none"></div>
          
          <div>
            <div className="flex items-center gap-2 border-b border-[#30363d] pb-3 mb-4">
              <Sparkles className="h-5 w-5 text-indigo-400 rotate-12" />
              <div className="text-left">
                <h3 className="text-base font-bold text-white font-display">Target Close Advice</h3>
                <p className="text-[10px] text-slate-400">AI Priority-Leverage Recommendations</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed italic mb-4 text-left">
              "{overallAdvice}"
            </p>

            {/* Score Addition Gaps */}
            <div className="space-y-2.5 text-left">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div key={index} className="bg-[#010409]/60 p-2.5 rounded-xl border border-[#30363d] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 bg-[#161b22] h-5 w-5 rounded-md flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{rec.subject}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-950/20 text-[#3fb950] border border-emerald-500/20 rounded-md font-mono">
                      +{rec.improvement} Marks
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 bg-slate-950/30 rounded-xl border border-dashed border-[#30363d] text-xs text-slate-400">
                  Daily practices & mock inputs are fully balanced! High performance registered.
                </div>
              )}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#30363d] flex justify-end">
            <button
              onClick={() => onNavigateToTab('performance')}
              className="text-[11px] font-semibold text-[#00d4ff] hover:text-[#0bd6ff] transition-all font-mono tracking-wider"
            >
              Examine Weak Sub-Sections &rarr;
            </button>
          </div>

        </div>

      </div>

      {/* 3. Dynamic Interactive Improvement Simulator & Target Planner */}
      <div className="bg-[#161b22]/95 border border-[#30363d] rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#30363d] pb-4 mb-6">
          <div className="text-left">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Sliders className="h-5 w-5 text-[#00d4ff]" />
              Interactive Improvement Simulator & Target Planner
            </h2>
            <p className="text-xs text-slate-400">Configure planned reps below to instantly compute projected test average improvements</p>
          </div>
          <span className="bg-indigo-950/40 text-indigo-400 text-[10px] font-mono px-2 py-1 rounded border border-indigo-500/20 shrink-0 self-start md:self-auto">
            PROJECTION ENGINE v2.1
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          
          {/* Simulator Inputs */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Planned Mock Papers to Attempt
                </label>
                <span className="text-xs font-mono font-bold text-[#00d4ff] bg-[#00d4ff]/10 px-2.5 py-0.5 rounded border border-[#00d4ff]/10">
                  {simMocks} Papers
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                value={simMocks}
                onChange={(e) => setSimMocks(parseInt(e.target.value) || 0)}
                className="w-full accent-[#00d4ff] bg-slate-950 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-1 hover:text-slate-400">
                Pacing practice and calculation speed optimization (Projected Boost: ~1.60 marks per mock)
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Practice Questions Goal
                </label>
                <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-400/10 px-2.5 py-0.5 rounded border border-yellow-400/10">
                  +{simQuestions} Questions
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="25"
                value={simQuestions}
                onChange={(e) => setSimQuestions(parseInt(e.target.value) || 0)}
                className="w-full accent-yellow-400 bg-slate-950 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-1 hover:text-slate-400">
                Coverage scaling over weak subtopics (Provides +0.15 points per correct study output)
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Target Practice Accuracy
                </label>
                <span className="text-xs font-mono font-bold text-[#3fb950] bg-[#3fb950]/10 px-2.5 py-0.5 rounded border border-[#3fb950]/10">
                  {simAccuracy}% Accuracy
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={simAccuracy}
                onChange={(e) => setSimAccuracy(parseInt(e.target.value) || 50)}
                className="w-full accent-[#3fb950] bg-slate-950 h-2 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-1 hover:text-slate-400">
                Expected correct answer density on upcoming revision sets
              </span>
            </div>
          </div>

          {/* Simulator Outputs */}
          <div className="lg:col-span-5 bg-[#010409] border border-[#30363d] rounded-2xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#00d4ff] flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                SIMULATED SCORE FORECAST
              </h4>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Current Average Score:</span>
                  <span className="text-sm font-mono text-slate-300">{currentAverageScore} pts</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Simulated Boost:</span>
                  <span className="text-sm font-mono text-[#3fb950] font-bold">+{totalSimulatedBoost} pts</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-[#30363d] pt-2.5">
                  <span className="text-sm font-medium text-white">Projected Average:</span>
                  <span className="text-xl font-extrabold text-[#00d4ff] font-mono">{simulatedAverage} pts</span>
                </div>
              </div>

              <div className="p-3 bg-indigo-950/10 border border-indigo-900/35 rounded-xl text-xs space-y-1 text-slate-300">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  Cutoff Relationship:
                </p>
                <p className="text-[11px] leading-relaxed">
                  {simulatedGapRelation >= 0 ? (
                    <span>With these efforts, you cross cutoff by <strong className="text-[#3fb950] font-bold">+{Math.abs(simulatedGapRelation)}</strong> marks! (Safe Zone Cleared).</span>
                  ) : (
                    <span>You will close key gaps, leaving only <strong className="text-[#ff7b72] font-bold">{Math.abs(simulatedGapRelation)}</strong> points to bypass previous boundaries.</span>
                  )}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#30363d] text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
              <span>* Projected scores are estimations derived from historic SSC/UPSC alignment graphs.</span>
            </div>
          </div>

        </div>
      </div>

      {/* 4. Primary Key Metric Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[#161b22]/90 border border-[#30363d] rounded-xl p-4 flex items-center gap-4 hover:border-slate-800 transition">
          <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Target className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Exam Target</span>
            <span className="text-lg font-bold font-display text-white">{config.targetScore} <span className="text-xs text-slate-400">pts</span></span>
          </div>
        </div>

        <div className="bg-[#161b22]/90 border border-[#30363d] rounded-xl p-4 flex items-center gap-4 hover:border-slate-800 transition">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Award className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Safe Score</span>
            <span className="text-lg font-bold font-display text-white">{config.safeScore} <span className="text-xs text-slate-400">pts</span></span>
          </div>
        </div>

        <div className="bg-[#161b22]/90 border border-[#30363d] rounded-xl p-4 flex items-center gap-4 hover:border-slate-800 transition">
          <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">LATEST MOCK</span>
            <span className="text-lg font-bold font-display text-white">
              {stats.latestMockScore > 0 ? `${stats.latestMockScore} pts` : "N/A"}
            </span>
          </div>
        </div>

        <div className="bg-[#161b22]/90 border border-[#30363d] rounded-xl p-4 flex items-center gap-4 hover:border-slate-800 transition">
          <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">BEST MOCK</span>
            <span className="text-lg font-bold font-display text-white">
              {stats.bestMockScore > 0 ? `${stats.bestMockScore} pts` : "N/A"}
            </span>
          </div>
        </div>

      </div>

      {/* 5. Mission Control Section (Today's Tasks) */}
      <div className="bg-[#161b22]/95 border border-[#30363d] rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#30363d] pb-4 mb-5 gap-4">
          <div className="text-left">
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-400" />
              Command Center: Daily Study Mission
            </h2>
            <p className="text-xs text-slate-400">Establish and complete core actionable tasks for today's station cycle.</p>
          </div>
          
          {/* Mission Progress Indicator bar */}
          <div className="flex items-center gap-3 bg-[#010409] px-3.5 py-1.5 rounded-xl border border-[#30363d] font-mono">
            <span className="text-xs text-slate-400">STUDY STAGE CLEAR:</span>
            <div className="w-24 bg-[#161b22] h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${missionProgress}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-indigo-400">{missionProgress}%</span>
          </div>
        </div>

        {/* List of Tasks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-6">
          {missions.length > 0 ? (
            missions.map((task) => (
              <div 
                key={task.id}
                className={`flex items-start justify-between border rounded-xl p-4 transition-all duration-300 ${task.isCompleted ? 'bg-[#010409]/30 border-[#30363d]/55 text-slate-500' : 'bg-[#010409]/90 border-[#30363d] text-slate-200'}`}
              >
                <div className="flex items-start gap-3.5 flex-1 select-none pr-4">
                  <button 
                    onClick={() => handleToggleMission(task.id)}
                    className="mt-0.5 shrink-0 hover:scale-110 transition duration-150 cursor-pointer"
                  >
                    {task.isCompleted ? (
                      <div className="h-5 w-5 rounded-md bg-indigo-600 border border-indigo-400 flex items-center justify-center text-white">
                        <Check className="h-3.5 w-3.5 stroke-[3px]" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-md border border-slate-700 bg-slate-900 flex items-center justify-center hover:border-indigo-500" />
                    )}
                  </button>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-mono tracking-widest ${task.isCompleted ? 'bg-slate-900 text-slate-500' : 'bg-indigo-950/40 text-indigo-400 border border-indigo-500/10'}`}>
                        {task.subject}
                      </span>
                      {task.targetCount && (
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-900 px-1.5 py-0.5 rounded">
                          Target: {task.targetCount}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm leading-relaxed ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-205 font-medium'}`}>
                      {task.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-slate-900 border border-transparent hover:border-[#30363d] rounded-lg transition cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

              </div>
            ))
          ) : (
            <div className="col-span-2 text-center p-8 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-sm">
              No mission parameters active for today's cycle. Set dynamic study items below!
            </div>
          )}
        </div>

        {/* Add custom mission item */}
        <form onSubmit={handleAddCustomTask} className="bg-[#010409]/40 p-4 border border-[#30363d] rounded-2xl text-left">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 block">Log Custom Task Milestone</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={customSubject}
              id="mission-sub-select"
              onChange={(e) => setCustomSubject(e.target.value)}
              className="bg-[#161b22] border border-[#30363d] hover:border-slate-700 text-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
            >
              {config.subjects.map((s, idx) => (
                <option key={idx} value={s.name}>{s.name}</option>
              ))}
            </select>
            <input
              type="text"
              id="mission-desc-input"
              value={customDesc}
              onChange={(e) => setCustomDesc(e.target.value)}
              placeholder="e.g., Practice 20 puzzles or read Newspaper Editorials and revise formulas"
              className="flex-1 bg-[#161b22] border border-[#30363d] hover:border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Mission Target
            </button>
          </div>
        </form>

      </div>

    </div>
  );
}
