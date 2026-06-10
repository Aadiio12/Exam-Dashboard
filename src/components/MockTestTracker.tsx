import React, { useState, useEffect } from 'react';
import { ExamConfig, MockTest } from '../types';
import { saveMockTest, deleteMockTest } from '../utils/storage';
import { Plus, Award, Target, HelpCircle, BookOpen, Trash2, LineChart, AlertTriangle } from 'lucide-react';

interface MockTestTrackerProps {
  config: ExamConfig;
  mocks: MockTest[];
  onMocksUpdate: (updated: MockTest[]) => void;
}

export default function MockTestTracker({
  config,
  mocks,
  onMocksUpdate
}: MockTestTrackerProps) {
  const [mockName, setMockName] = useState('Full Length Mock #5');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  
  // Initialize subject marks mapping
  const [subjectMarks, setSubjectMarks] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    config.subjects.forEach(sub => {
      init[sub.name] = Math.round(sub.targetMarks * 0.95); // default to near target
    });
    return init;
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Auto calculate total
  const calculatedTotal: number = (Object.values(subjectMarks) as number[]).reduce((sum: number, v: number) => sum + (v || 0), 0);

  // Sync if config subjects changes
  useEffect(() => {
    const init: Record<string, number> = {};
    config.subjects.forEach(sub => {
      init[sub.name] = subjectMarks[sub.name] ?? Math.round(sub.targetMarks * 0.95);
    });
    setSubjectMarks(init);
  }, [config.subjects]);

  const handleSubjectMarkChange = (subjName: string, val: number) => {
    setSubjectMarks(prev => ({
      ...prev,
      [subjName]: val
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations: marks cannot exceed set totals
    for (const sub of config.subjects) {
      const marks = subjectMarks[sub.name] || 0;
      if (marks < 0) {
        setErrorMsg(`Marks for ${sub.name} cannot be negative.`);
        return;
      }
      if (marks > sub.totalMarks) {
        setErrorMsg(`Marks for ${sub.name} (${marks}) exceed maximum permitted marks (${sub.totalMarks}). Please verify.`);
        return;
      }
    }

    const newMock: MockTest = {
      id: `mt-${Date.now()}`,
      date,
      mockName: mockName.trim() || 'Custom Mock Evaluator',
      subjectMarks: { ...subjectMarks },
      totalScore: calculatedTotal
    };

    saveMockTest(newMock);
    const updated = [newMock, ...mocks];
    onMocksUpdate(updated);

    // Reset default mock name increments
    setMockName(`Full Length Mock #${mocks.length + 5}`);
    setErrorMsg('');
  };

  const handleDelete = (id: string) => {
    deleteMockTest(id);
    const filtered = mocks.filter(m => m.id !== id);
    onMocksUpdate(filtered);
  };

  // Mock performance statistics
  const totalMocksCount = mocks.length;
  const bestScore = totalMocksCount > 0 ? Math.max(...mocks.map(m => m.totalScore)) : 0;
  const latestScore = totalMocksCount > 0 ? mocks[0].totalScore : 0; // unshifted is newest
  const averageScore = totalMocksCount > 0 ? Math.round(mocks.reduce((sum, m) => sum + m.totalScore, 0) / totalMocksCount) : 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-xl p-4 flex flex-col pl-5 text-left select-none relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Latest Mock Score</span>
          <p className="text-2xl font-extrabold text-white font-display mt-0.5">{latestScore > 0 ? `${latestScore} pts` : "N/A"}</p>
          <span className="text-[9px] text-slate-400 font-mono mt-0.5">Most recent performance</span>
        </div>

        <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-xl p-4 flex flex-col pl-5 text-left select-none relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Apex Highest Mock</span>
          <p className="text-2xl font-extrabold text-[#10b981] font-display mt-0.5">{bestScore > 0 ? `${bestScore} pts` : "N/A"}</p>
          <span className="text-[9px] text-slate-400 font-mono mt-0.5">Peak historic benchmark</span>
        </div>

        <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-xl p-4 flex flex-col pl-5 text-left select-none relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average Mock Score</span>
          <p className="text-2xl font-extrabold text-indigo-400 font-display mt-0.5">{averageScore > 0 ? `${averageScore} pts` : "N/A"}</p>
          <span className="text-[9px] text-zinc-400 font-mono mt-0.5">Weighted statistical norm</span>
        </div>

        <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-xl p-4 flex flex-col pl-5 text-left select-none relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Zone Safety Status</span>
          <p className="text-lg font-bold font-display mt-1">
            {latestScore === 0 ? (
              <span className="text-slate-500">Uninitialized</span>
            ) : latestScore >= config.targetScore ? (
              <span className="text-green-400 uppercase tracking-wider text-sm font-semibold">★ Target Cleared</span>
            ) : latestScore >= config.safeScore ? (
              <span className="text-emerald-400 uppercase tracking-wider text-sm font-semibold">✔ Safe Zone</span>
            ) : latestScore >= config.previousCutoff ? (
              <span className="text-amber-500 uppercase tracking-wider text-sm font-semibold">⚠️ Border Cutoff</span>
            ) : (
              <span className="text-red-400 uppercase tracking-wider text-sm font-semibold">⛔ Below Cutoff</span>
            )}
          </p>
          <span className="text-[9px] text-slate-400 font-mono">Relative to Cutoff ({config.previousCutoff})</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2. Mock score input portal */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md space-y-4">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
          
          <h3 className="text-lg font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2 mb-2">
            <LineChart className="h-5 w-5 text-indigo-400" />
            Enter Mock Performance
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="mock-date">
                Test Date
              </label>
              <input
                id="mock-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-indigo-500 rounded-lg py-2.5 px-3 text-sm text-slate-100 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="mock-title">
                Mock Test Name
              </label>
              <input
                id="mock-title"
                type="text"
                value={mockName}
                onChange={(e) => setMockName(e.target.value)}
                className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-indigo-500 rounded-lg py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 outline-none"
                placeholder="e.g., Prime Mock #5"
                required
              />
            </div>
          </div>

          <div className="border-t border-slate-800/60 pt-4 space-y-3.5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500 block text-left mb-1">Subject-wise Marks breakdown</p>
            
            {config.subjects.map((sub, index) => {
              const currentVal = subjectMarks[sub.name] ?? "";
              const ratioPercent = sub.totalMarks > 0 ? Math.round(((Number(currentVal) || 0) / sub.totalMarks) * 100) : 0;
              
              return (
                <div key={index} className="flex items-center justify-between gap-4 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 hover:border-slate-800 transition">
                  <div className="text-left max-w-[55%]">
                    <span className="text-sm font-semibold text-slate-200 block truncate">{sub.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Target: <strong className="text-emerald-400">{sub.targetMarks}</strong> / {sub.totalMarks} PTS</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-[10px] font-mono font-bold pr-1 ${ratioPercent >= 80 ? 'text-green-400' : ratioPercent >= 60 ? 'text-sky-400' : 'text-amber-500'}`}>
                      {ratioPercent}%
                    </span>
                    <div className="relative w-24">
                      <input
                        type="number"
                        value={currentVal}
                        onChange={(e) => handleSubjectMarkChange(sub.name, Number(e.target.value))}
                        className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-indigo-400 rounded-lg py-1.5 px-2.5 text-center text-sm text-slate-100 font-mono outline-none"
                        placeholder="N/A"
                        min="0"
                        max={sub.totalMarks}
                        required
                      />
                      <span className="absolute right-2.5 bottom-1.5 text-[9px] text-slate-500 font-mono select-none">/ {sub.totalMarks}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time Dynamic Score Tally */}
          <div className="bg-[#0f172a] border border-indigo-950 p-4 rounded-xl flex items-center justify-between shadow-inner">
            <div className="text-left">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Live Calculated Score</span>
              <span className="text-[10px] text-slate-500 font-mono">Subject sums combined in real-time</span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-extrabold font-display text-sky-400">{calculatedTotal}</span>
              <span className="text-xs text-slate-500 font-mono"> / {config.totalMarks} PTS</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/20 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-medium flex items-center gap-1.5 justify-start">
              <AlertTriangle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-semibold uppercase tracking-wider py-4 rounded-xl shadow-lg transition duration-200 active:scale-95 cursor-pointer"
          >
            Commence Test Log
          </button>

        </form>

        {/* 3. Render Historic Mock List */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col">
          
          <h3 className="text-lg font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-emerald-400" />
            Historic Mock logs
          </h3>

          <div className="space-y-3.5 flex-1">
            {mocks.length > 0 ? (
              mocks.map((m) => {
                const totalRatio = config.totalMarks > 0 ? Math.round((m.totalScore / config.totalMarks) * 100) : 0;
                
                return (
                  <div key={m.id} className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 hover:border-slate-700/80 transition relative overflow-hidden">
                    
                    {/* Top title bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-900 pb-2 mb-2.5 gap-2">
                      <div className="text-left">
                        <h4 className="text-sm font-semibold text-slate-200">{m.mockName}</h4>
                        <span className="text-[10px] font-mono text-slate-500">{m.date}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          Index Score: <strong className="text-indigo-400 font-extrabold">{m.totalScore}</strong> / {config.totalMarks}
                        </span>
                        
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] font-bold ${m.totalScore >= config.safeScore ? 'bg-green-950/30 text-green-400 border border-green-500/20' : m.totalScore >= config.previousCutoff ? 'bg-amber-950/30 text-amber-500 border border-amber-500/20' : 'bg-red-950/30 text-red-500 border border-red-500/20'}`}>
                          {totalRatio}% Correct
                        </span>
                      </div>
                    </div>

                    {/* Breakdown bubbles */}
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {Object.entries(m.subjectMarks).map(([subj, marks]) => (
                        <span key={subj} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-1 rounded border border-slate-900 hover:border-slate-800 transition">
                          {subj}: <strong className="text-white">{marks}</strong>
                        </span>
                      ))}
                    </div>

                    {/* Remove option button absolute aligned */}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="absolute right-3.5 bottom-3.5 text-slate-500 hover:text-red-400 p-1 bg-slate-900/40 border border-transparent rounded hover:border-slate-800 transition"
                      title="Delete Mock entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>

                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                No historic mock tests catalogued. Log mock papers above to populate performance matrix analytics.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
