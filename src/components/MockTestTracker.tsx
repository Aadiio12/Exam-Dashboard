import React, { useState, useEffect } from 'react';
import { ExamConfig, MockTest } from '../types';
import { saveMockTest, deleteMockTest } from '../utils/storage';
import { Plus, Award, Target, HelpCircle, BookOpen, Trash2, LineChart, AlertTriangle, Gauge, Clock } from 'lucide-react';

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
  
  // Custom tracking fields
  const [totalQuestions, setTotalQuestions] = useState<number>(100);
  const [skipped, setSkipped] = useState<number>(5);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);
  const [optionsCount, setOptionsCount] = useState<number>(4);
  const [timeSpent, setTimeSpent] = useState<number>(120); // in minutes

  // Initialize subject marks mapping supporting decimal point values!
  const [subjectMarks, setSubjectMarks] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    config.subjects.forEach(sub => {
      init[sub.name] = (sub.targetMarks * 0.9).toFixed(2); // default to decimal target
    });
    return init;
  });

  const [errorMsg, setErrorMsg] = useState('');

  // Auto calculate total in floating points
  const calculatedTotal: number = parseFloat(
    (Object.values(subjectMarks) as string[])
      .reduce((sum: number, v: string) => sum + (parseFloat(v) || 0), 0)
      .toFixed(2)
  );

  // Auto estimate speed per question
  const attemptedCount = Math.max(0, totalQuestions - skipped);
  const calculatedSpeed = attemptedCount > 0 
    ? Math.round((timeSpent * 60) / attemptedCount) 
    : 0;

  // Sync if config subjects changes
  useEffect(() => {
    const init: Record<string, string> = {};
    config.subjects.forEach(sub => {
      init[sub.name] = subjectMarks[sub.name] ?? (sub.targetMarks * 0.9).toFixed(2);
    });
    setSubjectMarks(init);
  }, [config.subjects]);

  const handleSubjectMarkChange = (subjName: string, val: string) => {
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
      const marks = parseFloat(subjectMarks[sub.name]) || 0;
      if (marks < 0) {
        setErrorMsg(`Marks for ${sub.name} cannot be negative.`);
        return;
      }
      if (marks > sub.totalMarks) {
        setErrorMsg(`Marks for ${sub.name} (${marks}) exceed maximum permitted marks (${sub.totalMarks}). Please check.`);
        return;
      }
    }

    if (totalQuestions <= 0) {
      setErrorMsg('Total questions must be greater than zero.');
      return;
    }

    // Parse and submit
    const numericSubjectMarks: Record<string, number> = {};
    Object.entries(subjectMarks).forEach(([k, v]) => {
      numericSubjectMarks[k] = parseFloat(v as string) || 0;
    });

    const newMock: MockTest = {
      id: `mt-${Date.now()}`,
      date,
      mockName: mockName.trim() || 'Custom Mock Evaluator',
      subjectMarks: numericSubjectMarks,
      totalScore: calculatedTotal,
      skipped,
      negativeMarking,
      totalQuestions,
      optionsCount,
      perQuestionSpeed: calculatedSpeed
    };

    saveMockTest(newMock);
    const updated = [newMock, ...mocks];
    onMocksUpdate(updated);

    // Reset default mock name increments
    setMockName(`Full Length Mock #${mocks.length + 6}`);
    setErrorMsg('');
  };

  const handleDelete = (id: string) => {
    deleteMockTest(id);
    const filtered = mocks.filter(m => m.id !== id);
    onMocksUpdate(filtered);
  };

  // Mock performance statistics in decimal precision
  const totalMocksCount = mocks.length;
  const bestScore = totalMocksCount > 0 ? Math.max(...mocks.map(m => m.totalScore)) : 0;
  const latestScore = totalMocksCount > 0 ? mocks[0].totalScore : 0; // unshifted is newest
  const averageScore = totalMocksCount > 0 
    ? parseFloat((mocks.reduce((sum, m) => sum + m.totalScore, 0) / totalMocksCount).toFixed(2)) 
    : 0;

  const averageSpeed = mocks.length > 0
    ? Math.round(mocks.reduce((sum, m) => sum + (m.perQuestionSpeed || 0), 0) / mocks.length)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Header Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[#161b22]/90 border border-[#30363d] rounded-xl p-4 flex flex-col pl-5 text-left select-none relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Latest Mock Score</span>
          <p className="text-2xl font-extrabold text-white font-display mt-0.5">{latestScore > 0 ? `${latestScore} pts` : "N/A"}</p>
          <span className="text-[9px] text-[#8b949e] font-mono mt-0.5">Most recent scorecard</span>
        </div>

        <div className="bg-[#161b22]/90 border border-[#30363d] rounded-xl p-4 flex flex-col pl-5 text-left select-none relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Apex Peak Mock</span>
          <p className="text-2xl font-extrabold text-[#3fb950] font-display mt-0.5">{bestScore > 0 ? `${bestScore} pts` : "N/A"}</p>
          <span className="text-[9px] text-[#8b949e] font-mono mt-0.5">Peak historic target</span>
        </div>

        <div className="bg-[#161b22]/90 border border-[#30363d] rounded-xl p-4 flex flex-col pl-5 text-left select-none relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Average Mock Score</span>
          <p className="text-2xl font-extrabold text-indigo-400 font-display mt-0.5">{averageScore > 0 ? `${averageScore} pts` : "N/A"}</p>
          <span className="text-[9px] text-[#8b949e] font-mono mt-0.5">Current historic score norm</span>
        </div>

        <div className="bg-[#161b22]/90 border border-[#30363d] rounded-xl p-4 flex flex-col pl-5 text-left select-none relative overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Zone Safety Status</span>
          <p className="text-lg font-bold font-display mt-1">
            {latestScore === 0 ? (
              <span className="text-[#8b949e]">Uninitialized</span>
            ) : latestScore >= config.targetScore ? (
              <span className="text-[#3fb950] uppercase tracking-wider text-sm font-semibold">★ Target Cleared</span>
            ) : latestScore >= config.safeScore ? (
              <span className="text-[#00d4ff] uppercase tracking-wider text-sm font-semibold">✔ Safe Zone</span>
            ) : latestScore >= config.previousCutoff ? (
              <span className="text-amber-500 uppercase tracking-wider text-sm font-semibold">⚠️ Border Cutoff</span>
            ) : (
              <span className="text-[#ff7b72] uppercase tracking-wider text-sm font-semibold">⛔ Below Cutoff</span>
            )}
          </p>
          <span className="text-[9px] text-[#8b949e] font-mono">Relative to Cutoff ({config.previousCutoff})</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2. Mock score input portal */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-[#161b22]/90 border border-[#30363d] rounded-2xl p-6 relative overflow-hidden backdrop-blur-md space-y-4">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent"></div>
          
          <h3 className="text-lg font-bold text-white font-display border-b border-[#30363d] pb-3 flex items-center gap-2 mb-2">
            <LineChart className="h-5 w-5 text-indigo-400" />
            Enter Mock Performance
          </h3>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="mock-date">
                Test Date
              </label>
              <input
                id="mock-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-indigo-500 rounded-lg py-2 px-3 text-sm text-[#c9d1d9] outline-none"
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
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-indigo-500 rounded-lg py-2 px-3 text-sm text-[#c9d1d9] placeholder-[#8b949e]/40 outline-none"
                placeholder="e.g., Prime Mock #5"
                required
              />
            </div>
          </div>

          {/* New Custom statistical fields */}
          <div className="grid grid-cols-3 gap-2.5 bg-[#010409]/40 p-3 rounded-xl border border-[#30363d]">
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Total Ques
              </label>
              <input
                type="number"
                step="any"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#161b22] border border-[#30363d] focus:border-indigo-400 rounded-lg py-1 px-2 text-xs font-mono text-[#c9d1d9] text-center"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Skipped Ques
              </label>
              <input
                type="number"
                step="any"
                value={skipped}
                onChange={(e) => setSkipped(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#161b22] border border-[#30363d] focus:border-indigo-400 rounded-lg py-1 px-2 text-xs font-mono text-[#c9d1d9] text-center"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Time (Mins)
              </label>
              <input
                type="number"
                step="any"
                value={timeSpent}
                onChange={(e) => setTimeSpent(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#161b22] border border-[#30363d] focus:border-indigo-400 rounded-lg py-1 px-2 text-xs font-mono text-[#c9d1d9] text-center"
                min="1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Negative Weight / Penalty
              </label>
              <input
                type="number"
                step="any"
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-indigo-400 rounded-lg py-1.5 px-2 text-xs font-mono text-slate-300"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                MCQ Options Count
              </label>
              <select
                value={optionsCount}
                onChange={(e) => setOptionsCount(parseInt(e.target.value) || 4)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-indigo-400 rounded-lg py-1.5 px-2 text-xs text-slate-300 outline-none"
              >
                <option value={4}>4 Options</option>
                <option value={5}>5 Options</option>
                <option value={2}>2 Options</option>
              </select>
            </div>
          </div>

          <div className="border-t border-[#30363d] pt-4 space-y-3.5">
            <p className="text-xs font-bold uppercase tracking-widest text-[#8b949e] block text-left mb-1">Subject-wise Marks breakdown (Decimals Allowed)</p>
            
            {config.subjects.map((sub, index) => {
              const currentVal = subjectMarks[sub.name] ?? "";
              const numericVal = parseFloat(currentVal) || 0;
              const ratioPercent = sub.totalMarks > 0 ? Math.round((numericVal / sub.totalMarks) * 100) : 0;
              
              return (
                <div key={index} className="flex items-center justify-between gap-4 bg-[#010409]/40 p-3 rounded-xl border border-[#30363d] hover:border-slate-800 transition">
                  <div className="text-left max-w-[55%]">
                    <span className="text-sm font-semibold text-white block truncate">{sub.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Target: <strong className="text-[#3fb950]">{sub.targetMarks}</strong> / {sub.totalMarks} PTS</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-[10px] font-mono font-bold pr-1 ${ratioPercent >= 80 ? 'text-[#3fb950]' : ratioPercent >= 60 ? 'text-[#00d4ff]' : 'text-amber-500'}`}>
                      {ratioPercent}%
                    </span>
                    <div className="relative w-28">
                      <input
                        type="number"
                        step="any"
                        value={currentVal}
                        onChange={(e) => handleSubjectMarkChange(sub.name, e.target.value)}
                        className="w-full bg-[#1e293b]/50 border border-[#30363d] focus:border-indigo-400 rounded-lg py-1.5 px-2 text-right pr-9 text-xs text-[#c9d1d9] font-mono outline-none"
                        placeholder="0.0"
                        min="0"
                        max={sub.totalMarks}
                        required
                      />
                      <span className="absolute right-2 bottom-1.5 text-[9px] text-slate-500 font-mono select-none">/{sub.totalMarks}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Real-time Dynamic Score Tally */}
          <div className="bg-[#010409] border border-[#30363d] p-4 rounded-xl space-y-2 shadow-inner text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Live Calculated Score</span>
                <span className="text-[10px] text-slate-500 font-mono">Real-time point sums loaded</span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold font-display text-[#00d4ff]">{calculatedTotal}</span>
                <span className="text-xs text-[#8b949e] font-mono"> / {config.totalMarks} PTS</span>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#30363d]/50 pt-2 text-[10px] text-slate-400 font-mono">
              <span>Estimated speed per item:</span>
              <span className="text-yellow-400 font-bold">{calculatedSpeed} seconds per question</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/20 text-[#ff7b72] border border-red-900/30 rounded-xl text-[11px] font-medium flex items-center gap-1.5 justify-start">
              <AlertTriangle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider py-4 rounded-xl shadow-lg transition duration-200 active:scale-95 cursor-pointer"
          >
            Commence Test Log
          </button>

        </form>

        {/* 3. Render Historic Mock List */}
        <div className="lg:col-span-7 bg-[#161b22]/90 border border-[#30363d] rounded-2xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col">
          
          <h3 className="text-lg font-bold text-white font-display border-b border-[#30363d] pb-3 flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-[#3fb950]" />
            Historic Mock logs
          </h3>

          <div className="space-y-3.5 flex-1">
            {mocks.length > 0 ? (
              mocks.map((m) => {
                const totalRatio = config.totalMarks > 0 ? Math.round((m.totalScore / config.totalMarks) * 100) : 0;
                
                return (
                  <div key={m.id} className="bg-[#010409]/60 border border-[#30363d] rounded-xl p-4 hover:border-slate-750 transition relative overflow-hidden text-left">
                    
                    {/* Top title bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#30363d] pb-2 mb-2.5 gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{m.mockName}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500">{m.date}</span>
                          <span className="text-[10px] font-mono text-[#8b949e] bg-[#161b22] px-1.5 py-0.5 rounded">
                            {m.totalQuestions ? `${m.totalQuestions - (m.skipped || 0)}/${m.totalQuestions} items` : "N/A items"}
                          </span>
                          {m.perQuestionSpeed ? (
                            <span className="text-[10px] font-mono text-yellow-400 bg-yellow-950/20 px-1.5 rounded">
                              ⚡ {m.perQuestionSpeed}s/Q
                            </span>
                          ) : null}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-300 bg-[#161b22] px-2 py-1 rounded">
                          Score: <strong className="text-[#00d4ff] font-extrabold">{m.totalScore}</strong> / {config.totalMarks}
                        </span>
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded font-mono text-[10px] font-bold ${m.totalScore >= config.safeScore ? 'bg-green-950/30 text-[#3fb950] border border-green-500/20' : m.totalScore >= config.previousCutoff ? 'bg-amber-950/30 text-amber-500 border border-amber-500/20' : 'bg-red-950/20 text-[#ff7b72] border border-red-900/20'}`}>
                          {totalRatio}% Correct
                        </span>
                      </div>
                    </div>

                    {/* Breakdown bubbles */}
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {Object.entries(m.subjectMarks).map(([subj, marks]) => (
                        <span key={subj} className="text-[10px] bg-[#161b22] text-[#c9d1d9] px-2 py-1 rounded border border-[#30363d] transition">
                          {subj}: <strong className="text-white">{marks}</strong>
                        </span>
                      ))}
                    </div>

                    {/* Remove option button absolute aligned */}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="absolute right-3.5 bottom-3.5 text-slate-500 hover:text-red-400 p-1 bg-slate-900/40 border border-transparent rounded hover:border-[#30363d] transition cursor-pointer"
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
