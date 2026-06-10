import React, { useState } from 'react';
import { ExamConfig, DailyPractice } from '../types';
import { saveDailyPractice, deleteDailyPractice } from '../utils/storage';
import { Plus, Target, CheckCircle, XCircle, Clock, Trash2, BookOpen, AlertCircle, History } from 'lucide-react';

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
  const [questionsAttempted, setQuestionsAttempted] = useState(30);
  const [correct, setCorrect] = useState(25);
  const [wrong, setWrong] = useState(5);
  const [timeSpent, setTimeSpent] = useState(45); // value in minutes
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [errorMsg, setErrorMsg] = useState('');

  // Handle auto calculation alignment
  const handleCorrectChange = (val: number) => {
    setCorrect(val);
    const calculatedWrong = Math.max(0, questionsAttempted - val);
    setWrong(calculatedWrong);
  };

  const handleWrongChange = (val: number) => {
    setWrong(val);
    const calculatedCorrect = Math.max(0, questionsAttempted - val);
    setCorrect(calculatedCorrect);
  };

  const handleTotalChange = (val: number) => {
    setQuestionsAttempted(val);
    // Align values proportionally or reset
    if (correct + wrong !== val) {
      setCorrect(Math.floor(val * 0.8));
      setWrong(val - Math.floor(val * 0.8));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (questionsAttempted <= 0) {
      setErrorMsg('Questions attempted must be greater than zero.');
      return;
    }
    if (correct + wrong !== questionsAttempted) {
      setErrorMsg(`Mathematics error: Correct (${correct}) + Wrong (${wrong}) must exactly equal Total Questions Attempted (${questionsAttempted}).`);
      return;
    }
    if (timeSpent <= 0) {
      setErrorMsg('Please specify a positive time spent studying.');
      return;
    }

    const newPractice: DailyPractice = {
      id: `p-${Date.now()}`,
      date,
      subject,
      questionsAttempted,
      correct,
      wrong,
      timeSpent
    };

    saveDailyPractice(newPractice);
    const updatedPractices = [newPractice, ...practices];
    onPracticesUpdate(updatedPractices);
    setErrorMsg('');
  };

  const handleDelete = (id: string) => {
    deleteDailyPractice(id);
    const filtered = practices.filter(p => p.id !== id);
    onPracticesUpdate(filtered);
  };

  // Aggregated Stats
  const totalQuestionsSolved = practices.reduce((sum, p) => sum + p.questionsAttempted, 0);
  const totalCorrect = practices.reduce((sum, p) => sum + p.correct, 0);
  const totalTimeSpent = practices.reduce((sum, p) => sum + p.timeSpent, 0);
  const averageAccuracy = totalQuestionsSolved > 0 ? Math.round((totalCorrect / totalQuestionsSolved) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* 1. Practice Summary Dashboard Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-[#10b981]/5 border border-[#10b981]/25 rounded-2xl p-5 text-left relative overflow-hidden">
          <div className="absolute right-3.5 bottom-2 opacity-5 scale-120"><CheckCircle className="h-20 w-20 text-[#10b981]" /></div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Overall Accuracy Index</span>
          <p className="text-3xl font-extrabold text-[#10b981] font-display mt-1">{averageAccuracy}%</p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Weighted correctness value</span>
        </div>

        <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-5 text-left relative overflow-hidden">
          <div className="absolute right-3.5 bottom-2 opacity-5 scale-120"><Target className="h-20 w-20 text-indigo-400" /></div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Questions Answered</span>
          <p className="text-3xl font-extrabold text-white font-display mt-1">{totalQuestionsSolved}</p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">Cleared challenge items</span>
        </div>

        <div className="bg-sky-950/20 border border-sky-500/20 rounded-2xl p-5 text-left relative overflow-hidden">
          <div className="absolute right-3.5 bottom-2 opacity-5 scale-120"><Clock className="h-20 w-20 text-sky-400" /></div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hours Engaged</span>
          <p className="text-3xl font-extrabold text-white font-display mt-1">{(totalTimeSpent / 60).toFixed(1)} <span className="text-sm font-semibold text-slate-400">HRS</span></p>
          <span className="text-[10px] text-slate-400 font-mono mt-1 block">{totalTimeSpent} minutes spent on tasks</span>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2. Practice logger form */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md space-y-4">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
          
          <h3 className="text-lg font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            Log Practice Session
          </h3>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="practice-date">
              Session Date
            </label>
            <input
              id="practice-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-emerald-500 rounded-lg py-2 px-3 text-sm text-slate-100 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="practice-subject">
              Focused Stream / Subject
            </label>
            <select
              id="practice-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-emerald-500 rounded-lg py-2.5 px-3.5 text-sm text-slate-100 outline-none"
              required
            >
              <option value="" disabled>Select Subject</option>
              {config.subjects.map((s, idx) => (
                <option key={idx} value={s.name}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="practice-total">
              Questions Attempted
            </label>
            <input
              id="practice-total"
              type="number"
              value={questionsAttempted}
              onChange={(e) => handleTotalChange(Number(e.target.value))}
              className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-emerald-500 rounded-lg py-2 px-3 text-sm text-slate-100 outline-none font-mono"
              min="1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-green-400 mb-1" htmlFor="practice-correct">
                Correct Items
              </label>
              <input
                id="practice-correct"
                type="number"
                value={correct}
                onChange={(e) => handleCorrectChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-green-500/20 focus:border-green-500 rounded-lg py-2 px-3 text-sm text-green-400 outline-none font-mono"
                min="0"
                max={questionsAttempted}
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-red-400 mb-1" htmlFor="practice-wrong">
                Wrong Items
              </label>
              <input
                id="practice-wrong"
                type="number"
                value={wrong}
                onChange={(e) => handleWrongChange(Number(e.target.value))}
                className="w-full bg-slate-950 border border-red-500/20 focus:border-red-500 rounded-lg py-2 px-3 text-sm text-red-500 outline-none font-mono"
                min="0"
                max={questionsAttempted}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="practice-time">
              Minutes Spent
            </label>
            <div className="relative">
              <input
                id="practice-time"
                type="number"
                value={timeSpent}
                onChange={(e) => setTimeSpent(Number(e.target.value))}
                className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-emerald-500 rounded-lg py-2 pl-3 pr-12 text-sm text-slate-100 outline-none font-mono"
                min="1"
                required
              />
              <span className="absolute inset-y-0 right-3.5 flex items-center text-slate-500 text-xs font-mono select-none">MINS</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/20 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-medium flex items-center gap-1.5 justify-start">
              <AlertCircle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-semibold uppercase tracking-wider py-3.5 rounded-xl transition duration-200 active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] cursor-pointer"
          >
            Log Practice Entry
          </button>

        </form>

        {/* 3. Practice Logs History */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col">
          
          <h3 className="text-lg font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-indigo-400" />
            Practice Session History
          </h3>

          <div className="overflow-x-auto flex-1">
            {practices.length > 0 ? (
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-500 font-semibold px-3 py-1">
                    <th className="pb-3 pl-3">Date</th>
                    <th className="pb-3 text-left">Subject</th>
                    <th className="pb-3 text-center">Attempted</th>
                    <th className="pb-3 text-center">Score Ratio (C / W)</th>
                    <th className="pb-3 text-center">Accuracy%</th>
                    <th className="pb-3 text-center">Time</th>
                    <th className="pb-3 pr-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {practices.map((p) => {
                    const accuracy = p.questionsAttempted > 0 ? Math.round((p.correct / p.questionsAttempted) * 100) : 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-950/30 text-sm transition">
                        <td className="py-3.5 pl-3 font-mono font-medium text-slate-400 text-xs">{p.date}</td>
                        <td className="py-3.5 text-slate-200 font-semibold">{p.subject}</td>
                        <td className="py-3.5 text-center font-mono font-medium text-slate-300">{p.questionsAttempted} Qs</td>
                        <td className="py-3.5 text-center font-mono text-xs">
                          <span className="text-emerald-400 font-bold">{p.correct}</span>
                          <span className="text-slate-500 mx-1">/</span>
                          <span className="text-red-400 font-bold">{p.wrong}</span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold leading-none ${accuracy >= 85 ? 'bg-green-950/30 text-green-400 border border-green-500/20' : accuracy >= 70 ? 'bg-sky-950/30 text-sky-400 border border-sky-500/20' : 'bg-amber-950/30 text-amber-500 border border-amber-500/20'}`}>
                            {accuracy}%
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-mono text-xs text-slate-300">{p.timeSpent} mins</td>
                        <td className="py-3.5 pr-3 text-center">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 border border-transparent hover:border-slate-800 rounded-lg transition"
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
