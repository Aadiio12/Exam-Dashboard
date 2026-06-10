import React, { useState } from 'react';
import { ExamConfig, DailyPractice } from '../types';
import { saveDailyPractice, deleteDailyPractice } from '../utils/storage';
import { Plus, Target, CheckCircle, XCircle, Clock, Trash2, BookOpen, AlertCircle, History, Gauge, Compass } from 'lucide-react';

interface PracticeTrackerProps {
  config: ExamConfig;
  practices: DailyPractice[];
  onPracticesUpdate: (updated: DailyPractice[]) => void;
}

export default function PracticeTracker({
  config,
  practices,
  onPracticesUpdate
}: PracticeTrackerProps) {
  const [subject, setSubject] = useState(config.subjects[0]?.name || '');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  
  // Custom tracking fields
  const [totalQuestions, setTotalQuestions] = useState<number>(30);
  const [skipped, setSkipped] = useState<number>(2);
  const [correct, setCorrect] = useState<number>(22);
  const [wrong, setWrong] = useState<number>(6);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);
  const [optionsCount, setOptionsCount] = useState<number>(4);
  const [timeSpent, setTimeSpent] = useState<number>(40); // in minutes
  
  // Custom or auto points scorer
  const [score, setScore] = useState<string>("20.5"); // support decimals/floats
  const [isCustomScore, setIsCustomScore] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto calculations
  const attemptedQuestions = Math.max(0, totalQuestions - skipped);
  
  // Calculate automated default score: correct - (wrong * negativeMarking)
  const defaultCalculatedScore = parseFloat((correct - (wrong * negativeMarking)).toFixed(2));
  const activeScore = isCustomScore ? parseFloat(score) || 0 : defaultCalculatedScore;

  // Auto speed per question (in seconds) based on time spent on attempted questions
  const calculatedSpeed = attemptedQuestions > 0 
    ? Math.round((timeSpent * 60) / attemptedQuestions) 
    : 0;

  // Handle alignment when core question totals shift
  const handleTotalQuestionsChange = (val: number) => {
    setTotalQuestions(val);
    if (val < skipped + correct + wrong) {
      // Proportional reset
      const newSkipped = Math.floor(val * 0.1);
      const remaining = val - newSkipped;
      const newCorrect = Math.floor(remaining * 0.8);
      const newWrong = remaining - newCorrect;
      setSkipped(newSkipped);
      setCorrect(newCorrect);
      setWrong(newWrong);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (totalQuestions <= 0) {
      setErrorMsg('Total questions must be greater than zero.');
      return;
    }
    
    // Sum validation using floating precision parsing
    const precisionSum = parseFloat((correct + wrong + skipped).toFixed(2));
    if (precisionSum !== totalQuestions) {
      setErrorMsg(`Balance Error: Correct (${correct}) + Wrong (${wrong}) + Skipped (${skipped}) equals ${precisionSum}, which must match Total Questions (${totalQuestions}).`);
      return;
    }

    if (timeSpent <= 0) {
      setErrorMsg('Time spent must be greater than zero.');
      return;
    }

    const newPractice: DailyPractice = {
      id: `p-${Date.now()}`,
      date,
      subject,
      questionsAttempted: attemptedQuestions,
      correct,
      wrong,
      timeSpent,
      skipped,
      negativeMarking,
      totalQuestions,
      optionsCount,
      perQuestionSpeed: calculatedSpeed,
      score: activeScore
    };

    saveDailyPractice(newPractice);
    const updatedPractices = [newPractice, ...practices];
    onPracticesUpdate(updatedPractices);
    
    // Reset or keep some defaults for convenient data logging
    setErrorMsg('');
  };

  const handleDelete = (id: string) => {
    deleteDailyPractice(id);
    const filtered = practices.filter(p => p.id !== id);
    onPracticesUpdate(filtered);
  };

  // Aggregated Practice Stats
  const totalQuestionsSolved = practices.reduce((sum, p) => sum + (p.questionsAttempted || 0), 0);
  const totalCorrect = practices.reduce((sum, p) => sum + (p.correct || 0), 0);
  const totalSpentTime = practices.reduce((sum, p) => sum + (p.timeSpent || 0), 0);
  const averageAccuracy = totalQuestionsSolved > 0 
    ? Math.round((totalCorrect / totalQuestionsSolved) * 100) 
    : 0;
    
  const averageSpeed = practices.length > 0
    ? Math.round(practices.reduce((sum, p) => sum + (p.perQuestionSpeed || 0), 0) / practices.length)
    : 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Practice Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        
        <div className="bg-[#3fb950]/5 border border-[#3fb950]/20 rounded-2xl p-5 text-left relative overflow-hidden">
          <div className="absolute right-3.5 bottom-2 opacity-5 scale-120"><CheckCircle className="h-20 w-20 text-[#3fb950]" /></div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Overall Accuracy</span>
          <p className="text-3xl font-extrabold text-[#3fb950] font-display mt-1">{averageAccuracy}%</p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Correct ratio on attempted</span>
        </div>

        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5 text-left relative overflow-hidden">
          <div className="absolute right-3.5 bottom-2 opacity-5 scale-120"><Target className="h-20 w-20 text-indigo-400" /></div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Attempted Questions</span>
          <p className="text-3xl font-extrabold text-white font-display mt-1">{totalQuestionsSolved}</p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Accumulated study reps</span>
        </div>

        <div className="bg-amber-950/20 border border-amber-500/10 rounded-2xl p-5 text-left relative overflow-hidden">
          <div className="absolute right-3.5 bottom-2 opacity-5 scale-120"><Gauge className="h-20 w-20 text-yellow-400" /></div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Speed / Item</span>
          <p className="text-3xl font-extrabold text-yellow-400 font-display mt-1">
            {averageSpeed > 0 ? `${averageSpeed}s` : "N/A"}
          </p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Time spent per question</span>
        </div>

        <div className="bg-sky-950/20 border border-sky-500/20 rounded-2xl p-5 text-left relative overflow-hidden">
          <div className="absolute right-3.5 bottom-2 opacity-5 scale-120"><Clock className="h-20 w-20 text-sky-400" /></div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hours Tracked</span>
          <p className="text-3xl font-extrabold text-white font-display mt-1">{(totalSpentTime / 60).toFixed(1)} <span className="text-sm font-semibold text-slate-400">HRS</span></p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">{totalSpentTime} minutes total study time</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2. Practice logger form */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-[#161b22]/90 border border-[#30363d] rounded-2xl p-6 relative overflow-hidden backdrop-blur-md space-y-4">
          <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#3fb950]/40 to-transparent"></div>
          
          <h3 className="text-lg font-bold text-white font-display border-b border-[#30363d] pb-3 flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-[#3fb950]" />
            Log Practice Session
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] mb-1" htmlFor="practice-date">
                Session Date
              </label>
              <input
                id="practice-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#3fb950] rounded-lg py-2 px-3 text-sm text-[#c9d1d9] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8b949e] mb-1" htmlFor="practice-subject">
                Subject Stream
              </label>
              <select
                id="practice-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#3fb950] rounded-lg py-2 px-3 text-sm text-[#c9d1d9] outline-none"
                required
              >
                <option value="" disabled>Select Subject</option>
                {config.subjects.map((s, idx) => (
                  <option key={idx} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#8b949e] mb-1" htmlFor="practice-total">
                Total Ques
              </label>
              <input
                id="practice-total"
                type="number"
                step="any"
                value={totalQuestions}
                onChange={(e) => handleTotalQuestionsChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#3fb950] rounded-lg py-1.5 px-2.5 text-sm text-[#c9d1d9] outline-none font-mono"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="practice-skipped">
                Skipped Ques
              </label>
              <input
                id="practice-skipped"
                type="number"
                step="any"
                value={skipped}
                onChange={(e) => setSkipped(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-indigo-400 rounded-lg py-1.5 px-2.5 text-sm text-[#c9d1d9] outline-none font-mono"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="practice-minutes">
                Time Spent
              </label>
              <div className="relative">
                <input
                  id="practice-minutes"
                  type="number"
                  step="any"
                  value={timeSpent}
                  onChange={(e) => setTimeSpent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-indigo-400 rounded-lg py-1.5 pl-2.5 pr-8 text-sm text-[#c9d1d9] outline-none font-mono"
                  min="0.1"
                  required
                />
                <span className="absolute inset-y-0 right-2 flex items-center text-[9px] text-slate-500 font-mono">MINS</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#3fb950] mb-1" htmlFor="practice-correct">
                Correct Answers
              </label>
              <input
                id="practice-correct"
                type="number"
                step="any"
                value={correct}
                onChange={(e) => setCorrect(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#010409] border border-[#3fb950]/30 focus:border-[#3fb950] rounded-lg py-2 px-3 text-sm text-[#3fb950] outline-none font-mono"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#ff7b72] mb-1" htmlFor="practice-wrong">
                Wrong Answers
              </label>
              <input
                id="practice-wrong"
                type="number"
                step="any"
                value={wrong}
                onChange={(e) => setWrong(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#010409] border border-[#ff7b72]/30 focus:border-[#ff7b72] rounded-lg py-2 px-3 text-sm text-[#ff7b72] outline-none font-mono"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="practice-negative">
                Negative Weight (per penalty)
              </label>
              <input
                id="practice-negative"
                type="number"
                step="any"
                value={negativeMarking}
                onChange={(e) => setNegativeMarking(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-1.5 px-2.5 text-sm font-mono text-[#c9d1d9] outline-none"
                placeholder="e.g. 0.25"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="practice-options">
                Options / Alternatives Count
              </label>
              <select
                id="practice-options"
                value={optionsCount}
                onChange={(e) => setOptionsCount(parseInt(e.target.value) || 4)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-indigo-400 rounded-lg py-2 px-2.5 text-sm text-slate-300 outline-none"
              >
                <option value={4}>4 Options (Standard MCQ)</option>
                <option value={5}>5 Options (Bank PO/GMAT)</option>
                <option value={2}>2 Options (True/False)</option>
                <option value={3}>3 Options (Ternary choice)</option>
              </select>
            </div>
          </div>

          {/* Point-value scores option */}
          <div className="bg-[#010409]/60 border border-[#30363d] p-3.5 rounded-xl text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">Set Custom Score overriding Auto Scorer?</span>
              <input
                type="checkbox"
                checked={isCustomScore}
                onChange={(e) => setIsCustomScore(e.target.checked)}
                className="rounded border-[#30363d] bg-slate-900 text-indigo-500 focus:ring-0 cursor-pointer h-4 w-4"
              />
            </div>

            {isCustomScore ? (
              <div className="space-y-1 pt-1.5">
                <label className="block text-[10px] text-slate-400 uppercase font-mono font-bold">Custom Point Score Value</label>
                <input
                  type="number"
                  step="any"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full bg-[#161b22] border border-indigo-500/30 rounded-lg py-1.5 px-3 text-sm text-[#00d4ff] font-mono outline-none"
                  placeholder="e.g. 21.75"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400">Auto Scored Matrix: (C - W*penalty)</span>
                <span className="font-mono text-[#00d4ff] font-extrabold">{defaultCalculatedScore} PTS</span>
              </div>
            )}
            
            {/* Speed display */}
            <div className="flex items-center justify-between border-t border-[#30363d] pt-2 mt-2 text-xs">
              <span className="text-slate-400">Estimated Speed:</span>
              <span className="font-mono text-yellow-400 font-bold">{calculatedSpeed} seconds / question</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/20 text-[#ff7b72] border border-red-900/30 rounded-xl text-[11px] font-medium flex items-center gap-1.5 justify-start">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#3fb950] hover:bg-[#34a245] text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl transition duration-200 active:scale-95 shadow-[0_0_15px_rgba(63,185,80,0.15)] hover:shadow-[0_0_25px_rgba(63,185,80,0.3)] cursor-pointer"
          >
            Log Practice Entry
          </button>

        </form>

        {/* 3. Practice Logs History */}
        <div className="lg:col-span-7 bg-[#161b22]/90 border border-[#30363d] rounded-2xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col">
          
          <h3 className="text-lg font-bold text-white font-display border-b border-[#30363d] pb-3 flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-indigo-400" />
            Practice Session History
          </h3>

          <div className="overflow-x-auto flex-1">
            {practices.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[550px]">
                <thead>
                  <tr className="border-b border-[#30363d] text-[10px] uppercase tracking-widest text-[#8b949e] font-semibold px-3 py-1">
                    <th className="pb-3 pl-3">Date</th>
                    <th className="pb-3 text-left">Subject</th>
                    <th className="pb-3 text-center">Attempt/Total</th>
                    <th className="pb-3 text-center">Score (C / W / S)</th>
                    <th className="pb-3 text-center">Speed</th>
                    <th className="pb-3 pr-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]/50">
                  {practices.map((p) => {
                    const accuracy = p.questionsAttempted > 0 ? Math.round((p.correct / p.questionsAttempted) * 100) : 0;
                    return (
                      <tr key={p.id} className="hover:bg-[#010409]/30 text-sm transition text-slate-300">
                        <td className="py-3.5 pl-3 font-mono font-medium text-[#8b949e] text-xs">{p.date}</td>
                        <td className="py-3.5 font-semibold text-white">{p.subject}</td>
                        <td className="py-3.5 text-center font-mono font-medium text-xs">
                          {p.questionsAttempted} / {p.totalQuestions || p.questionsAttempted} Qs
                        </td>
                        <td className="py-3.5 text-center font-mono text-xs">
                          <div className="font-extrabold text-[#00d4ff] mb-0.5">{p.score !== undefined ? `${p.score} pts` : "N/A"}</div>
                          <div className="text-[10px] text-slate-500">
                            (<span className="text-[#3fb950]">{p.correct}</span>
                            <span className="mx-0.5">/</span>
                            <span className="text-[#ff7b72]">{p.wrong}</span>
                            <span className="mx-0.5">/</span>
                            <span>{p.skipped || 0}</span>)
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          <div className="font-mono text-xs text-yellow-400 font-semibold">{p.perQuestionSpeed || 0}s/Q</div>
                          <div className="text-[9px] text-[#8b949e]">{p.timeSpent} mins total</div>
                        </td>
                        <td className="py-3.5 pr-3 text-center">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 border border-transparent hover:border-[#30363d] rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16 text-slate-500 text-sm">
                No custom daily practice logs recorded. Log your first session today to populate records.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
