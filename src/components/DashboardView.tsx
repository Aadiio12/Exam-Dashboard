import React, { useState } from 'react';
import { ExamConfig, DailyPractice, MockTest, MissionTask } from '../types';
import { calcDaysRemaining, getGeneralStats, getRecommendations } from '../utils/analytics';
import { saveMissionTasks } from '../utils/storage';
import { ShieldCheck, Target, Award, ShieldAlert, Sparkles, Plus, Calendar, Clock, Rocket, AlertTriangle, CheckSquare, Square, Check, Trash2 } from 'lucide-react';

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

  const progressPercentage = Math.min(100, Math.round((stats.predictedScore / config.totalMarks) * 100));
  const gapPercentage = Math.round((stats.selectionGap / config.totalMarks) * 100);

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

  return (
    <div className="space-y-6">
      
      {/* 1. Main Header Station & Countdown BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-950/40 via-slate-900/40 to-sky-950/30 border border-slate-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-md">
        <div className="absolute inset-0 bg-grid-slate-800/[0.05] bg-[bottom_center] [mask-image:linear-gradient(to_bottom,white,transparent)]"></div>
        <div className="absolute top-0 right-0 p-8 text-indigo-500/10 pointer-events-none scale-150">
          <Rocket className="h-56 w-56" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold tracking-wider text-sky-400 bg-sky-400/10 border border-sky-400/20 rounded-full mb-3 uppercase">
              <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
              LIVE STATION ACTIVE
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight font-display text-white mb-2">
              {config.examName} Terminal
            </h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Target Score: <strong className="text-slate-200">{config.targetScore} PTS</strong> | Safe Zone Baseline: <strong className="text-slate-200">{config.safeScore} PTS</strong> | Previous Cutoff Score: <strong className="text-slate-200">{config.previousCutoff} PTS</strong>.
            </p>
          </div>
          
          {/* Days Countdown Dial */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 md:p-5 text-center min-w-[150px] shadow-lg relative overflow-hidden group">
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
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[100%] bg-gradient-to-b from-[#10b981]/5 to-transparent pointer-events-none"></div>
          
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                Selection Gap Analysis
              </h2>
              <p className="text-xs text-slate-400">Current Forecast Relative to Previous Year Cutoff</p>
            </div>
            <span className="bg-emerald-950/20 text-emerald-400 text-xs px-2.5 py-1 rounded-md font-mono border border-emerald-500/20">
              Confidence Index: Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 text-center">
            
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">PREVIOUS CUTOFF</p>
              <p className="text-2xl font-bold font-display text-[#fc5a5a]">{config.previousCutoff}</p>
              <p className="text-[10px] text-slate-500 font-mono">Benchmark Score</p>
            </div>

            <div className="bg-[#111c30] border border-sky-950 rounded-xl p-4 relative group">
              <div className="absolute top-1.5 right-1.5 leading-none">
                <div className="h-2 w-2 rounded-full bg-sky-400 animate-ping"></div>
              </div>
              <p className="text-xs text-slate-300 font-semibold uppercase mb-1">PREDICTED SCORE</p>
              <p className="text-3xl font-extrabold font-display text-sky-400 tracking-tight">{stats.predictedScore}</p>
              <p className="text-[10px] text-slate-400 font-mono">Dynamic Model</p>
            </div>

            <div className={`bg-[#0f172a] border rounded-xl p-4 ${stats.selectionGap <= 0 ? 'border-green-500/20 bg-green-950/5' : 'border-amber-500/20 bg-amber-950/5'}`}>
              <p className="text-xs text-slate-400 font-medium uppercase mb-1">SELECTION GAP</p>
              {stats.selectionGap <= 0 ? (
                <>
                  <p className="text-2xl font-bold font-display text-green-400">+{Math.abs(stats.selectionGap)}</p>
                  <p className="text-[10px] text-green-500 font-mono">Surplus Marks</p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold font-display text-amber-400">{stats.selectionGap}</p>
                  <p className="text-[10px] text-amber-500 font-mono">Marks Gap</p>
                </>
              )}
            </div>

          </div>

          {/* Graphical Progress Bar showing cutoff vs predicted */}
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-xs font-mono font-medium">
              <span className="text-slate-400">0</span>
              <span className="text-red-400">Cutoff Limit: {config.previousCutoff} pts</span>
              <span className="text-slate-400">Max: {config.totalMarks}</span>
            </div>
            
            <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
              {/* Cutoff marker line */}
              <div 
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10"
                style={{ left: `${(config.previousCutoff / config.totalMarks) * 100}%` }}
              >
                <div className="absolute top-[-14px] left-[-3px] w-2 h-2 rounded-full bg-red-500 animate-ping"></div>
              </div>
              
              {/* Predicted score bar */}
              <div 
                className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${stats.selectionGap <= 0 ? 'from-[#0284c7] to-[#10b981]' : 'from-[#3b82f6] to-[#f59e0b]'}`}
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-slate-900 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-[11px] font-mono text-slate-300">
                    <strong className="text-sky-400">Readiness Algorithm:</strong> {stats.formulaLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Dynamic Recommendation Engine UI */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 right-0 h-[100%] bg-gradient-to-b from-[#3b82f6]/5 to-transparent pointer-events-none"></div>
          
          <div>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-spin-slow" />
              <div>
                <h3 className="text-base font-bold text-white font-display">Target Close Advice</h3>
                <p className="text-[10px] text-slate-400">AI Priority-Leverage Recommendations</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
              "{overallAdvice}"
            </p>

            {/* Score Addition Gaps */}
            <div className="space-y-2.5">
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <div key={index} className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 bg-slate-900 h-5 w-5 rounded-md flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-200">{rec.subject}</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 rounded-md font-mono">
                      +{rec.improvement} Marks
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center p-4 bg-slate-950/30 rounded-xl border border-dashed border-slate-800 text-xs text-slate-400">
                  Daily practices & mock inputs are fully balanced! High performance registered.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 pb-1 flex justify-end">
            <button
              onClick={() => onNavigateToTab('performance')}
              className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-all font-mono"
            >
              Examine Weak Sub-Sections &rarr;
            </button>
          </div>

        </div>

      </div>

      {/* 3. Primary Key Metric Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[#0f172a]/60 border border-slate-800/50 rounded-xl p-4 flex items-center gap-4 hover:border-slate-800 transition">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Target className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Exam Target</span>
            <span className="text-xl font-bold font-display text-white">{config.targetScore} <span className="text-xs text-slate-400">pts</span></span>
          </div>
        </div>

        <div className="bg-[#0f172a]/60 border border-slate-800/50 rounded-xl p-4 flex items-center gap-4 hover:border-slate-800 transition">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <Award className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Safe Score</span>
            <span className="text-xl font-bold font-display text-white">{config.safeScore} <span className="text-xs text-slate-400">pts</span></span>
          </div>
        </div>

        <div className="bg-[#0f172a]/60 border border-slate-800/50 rounded-xl p-4 flex items-center gap-4 hover:border-slate-800 transition">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">LATEST MOCK</span>
            <span className="text-xl font-bold font-display text-white">
              {stats.latestMockScore > 0 ? `${stats.latestMockScore} pts` : "N/A"}
            </span>
          </div>
        </div>

        <div className="bg-[#0f172a]/60 border border-slate-800/50 rounded-xl p-4 flex items-center gap-4 hover:border-slate-800 transition">
          <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">BEST MOCK</span>
            <span className="text-xl font-bold font-display text-white">
              {stats.bestMockScore > 0 ? `${stats.bestMockScore} pts` : "N/A"}
            </span>
          </div>
        </div>

      </div>

      {/* 4. Mission Control Section (Today's Tasks) */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 mb-5 gap-4">
          <div>
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-indigo-400" />
              Command Center: Daily Study Mission
            </h2>
            <p className="text-xs text-slate-400">Establish and complete core actionable tasks for today's station cycle.</p>
          </div>
          
          {/* Mission Progress Indicator bar */}
          <div className="flex items-center gap-3 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800 font-mono">
            <span className="text-xs text-slate-400">STAGE CLEAR:</span>
            <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${missionProgress}%` }}
              ></div>
            </div>
            <span className="text-xs font-bold text-indigo-400">{missionProgress}%</span>
          </div>
        </div>

        {/* List of Tasks */}
        <div className="space-y-3 mb-6">
          {missions.length > 0 ? (
            missions.map((task, index) => (
              <div 
                key={task.id}
                className={`flex items-start justify-between border rounded-xl p-4 transition-all duration-300 ${task.isCompleted ? 'bg-slate-950/40 border-slate-900 text-slate-500' : 'bg-slate-950/90 border-slate-800 text-slate-200'}`}
              >
                <div className="flex items-start gap-3.5 flex-1 select-none pr-4">
                  <button 
                    onClick={() => handleToggleMission(task.id)}
                    className="mt-0.5 shrink-0 hover:scale-115 transition duration-150"
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
                    <p className={`text-sm leading-relaxed ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                      {task.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="text-slate-500 hover:text-red-400 p-1.5 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-lg transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

              </div>
            ))
          ) : (
            <div className="text-center p-8 bg-slate-950/30 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-sm">
              No mission parameters active for today's cycle. Set dynamic study items below!
            </div>
          )}
        </div>

        {/* Add custom mission item */}
        <form onSubmit={handleAddCustomTask} className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 block text-left">Custom Mission Item</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={customSubject}
              id="mission-sub-select"
              onChange={(e) => setCustomSubject(e.target.value)}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
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
              className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 placeholder-slate-500 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs font-semibold uppercase tracking-wider px-5 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shrink-0 shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition"
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
