import React, { useState } from 'react';
import { ExamConfig, SubjectConfig } from '../types';
import { saveExamConfig } from '../utils/storage';
import { KeyRound, ShieldAlert, Target, Award, ListChecks, Plus, Trash2, Zap } from 'lucide-react';

interface ExamSetupProps {
  onSetupComplete: (config: ExamConfig) => void;
}

export default function ExamSetup({ onSetupComplete }: ExamSetupProps) {
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [totalMarks, setTotalMarks] = useState(100);
  const [targetScore, setTargetScore] = useState(80);
  const [safeScore, setSafeScore] = useState(75);
  const [previousCutoff, setPreviousCutoff] = useState(60);

  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);

  const [newSubName, setNewSubName] = useState('');
  const [newSubTotal, setNewSubTotal] = useState(50);
  const [newSubTarget, setNewSubTarget] = useState(40);
  const [errorMsg, setErrorMsg] = useState('');

  const addSubject = () => {
    if (!newSubName.trim()) {
      setErrorMsg('Please specify a subject name.');
      return;
    }
    if (subjects.some(s => s.name.toLowerCase() === newSubName.trim().toLowerCase())) {
      setErrorMsg('Subject already exists.');
      return;
    }
    if (newSubTarget > newSubTotal) {
      setErrorMsg('Target marks cannot exceed total marks.');
      return;
    }
    
    setSubjects([...subjects, {
      name: newSubName.trim(),
      totalMarks: newSubTotal,
      targetMarks: newSubTarget
    }]);
    setNewSubName('');
    setErrorMsg('');
  };

  const removeSubject = (index: number) => {
    if (subjects.length <= 1) {
      setErrorMsg('You must have at least one subject configured.');
      return;
    }
    setSubjects(subjects.filter((_, i) => i !== index));
    setErrorMsg('');
  };

  const currentConfiguredSum = subjects.reduce((sum, s) => sum + s.totalMarks, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Validations
    if (!examName.trim()) {
      setErrorMsg('Exam Name is required.');
      return;
    }
    if (!examDate) {
      setErrorMsg('Exam Date is required.');
      return;
    }
    if (totalMarks <= 0) {
      setErrorMsg('Total Marks must be positive.');
      return;
    }
    if (targetScore > totalMarks) {
      setErrorMsg('Target score cannot exceed total marks.');
      return;
    }
    if (safeScore > totalMarks) {
      setErrorMsg(`Safe score cannot exceed total marks of ${totalMarks}.`);
      return;
    }
    if (previousCutoff > totalMarks) {
      setErrorMsg('Previous cutoff cannot exceed total marks.');
      return;
    }

    if (subjects.length === 0) {
      setErrorMsg('Please add at least one subject to your schema.');
      return;
    }

    if (currentConfiguredSum !== totalMarks) {
      setErrorMsg(`The sum of all subject total marks (${currentConfiguredSum}) does not equal the exam total marks (${totalMarks}). Please align them before launching.`);
      return;
    }

    const config: ExamConfig = {
      examName,
      examDate,
      totalMarks,
      targetScore,
      safeScore,
      previousCutoff,
      subjects
    };

    saveExamConfig(config);
    onSetupComplete(config);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#c9d1d9] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Grid and Glowing Orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#1e1b4b_0%,transparent_60%)] opacity-20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,#00d4ff_0%,transparent_60%)] opacity-10"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none"></div>

      <div className="max-w-4xl w-full space-y-8 z-10">
        
        {/* Header Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3.5 bg-gradient-to-tr from-indigo-500/10 to-indigo-500/5 border border-indigo-500/20 rounded-2xl shadow-[0_0_20px_rgba(0,212,255,0.1)] mb-4 animate-pulse">
            <Zap className="h-10 w-10 text-indigo-400" id="header-zap-icon" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-[#cbd5e1] to-[#00d4ff] bg-clip-text text-transparent">
            EXAM PREPARATION DASHBOARD
          </h1>
          <p className="mt-2.5 text-slate-400 max-w-md mx-auto text-sm md:text-base leading-relaxed">
            Initialize your terminal to track mock tests, record performance gaps, log daily sessions, and command your study strategy.
          </p>
        </div>

        {/* Configuration Card Form */}
        <form onSubmit={handleSubmit} className="bg-[#161b22]/90 border border-[#30363d] rounded-2xl shadow-2xl p-6 md:p-8 backdrop-blur-xl relative">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent"></div>
          
          <h2 className="text-xl md:text-2xl font-semibold tracking-wide font-display border-b border-[#30363d] pb-4 mb-6 flex items-center gap-2 text-white">
            <KeyRound className="h-5 w-5 text-indigo-400" />
            Phase 1: Basic Target Configurations
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-1.5" htmlFor="setup-exam-name">
                Exam Name
              </label>
              <input
                id="setup-exam-name"
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g., UPSC Prelims, JEE Advanced, SSC CGL"
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-2.5 px-4 text-sm text-[#c9d1d9] placeholder-[#8b949e]/50 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-1.5" htmlFor="setup-exam-date">
                Exam Date
              </label>
              <input
                id="setup-exam-date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-2.5 px-4 text-sm text-[#c9d1d9] outline-none transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 md:col-span-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-1.5" htmlFor="setup-total-marks">
                  Total Marks
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8b949e] text-xs font-mono font-bold">PTS</div>
                  <input
                    id="setup-total-marks"
                    type="number"
                    value={totalMarks}
                    onChange={(e) => setTotalMarks(Number(e.target.value))}
                    className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-2.5 pl-12 pr-4 text-sm text-[#c9d1d9] outline-none transition-all font-mono"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-1.5" htmlFor="setup-target-score">
                  Your Target Score
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Target className="h-4 w-4 text-[#3fb950]" /></div>
                  <input
                    id="setup-target-score"
                    type="number"
                    value={targetScore}
                    onChange={(e) => setTargetScore(Number(e.target.value))}
                    className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#c9d1d9] outline-none transition-all font-mono"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-1.5" htmlFor="setup-safe-score">
                  Safe Target Score
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><Award className="h-4 w-4 text-[#00d4ff]" /></div>
                  <input
                    id="setup-safe-score"
                    type="number"
                    value={safeScore}
                    onChange={(e) => setSafeScore(Number(e.target.value))}
                    className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#c9d1d9] outline-none transition-all font-mono"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#8b949e] mb-1.5" htmlFor="setup-previous-cutoff">
                  Prev Year Cutoff
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500"><ShieldAlert className="h-4 w-4 text-[#f2cc60]" /></div>
                  <input
                    id="setup-previous-cutoff"
                    type="number"
                    value={previousCutoff}
                    onChange={(e) => setPreviousCutoff(Number(e.target.value))}
                    className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-2.5 pl-10 pr-4 text-sm text-[#c9d1d9] outline-none transition-all font-mono"
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Phase 2: Subject Weightage */}
          <h2 className="text-xl md:text-2xl font-semibold tracking-wide font-display border-b border-[#30363d] pb-4 mb-6 flex items-center gap-2 text-white">
            <ListChecks className="h-5 w-5 text-emerald-400" />
            Phase 2: Subject Schema Configuration
          </h2>

          {/* Current Subjects List */}
          <div className="space-y-3.5 mb-6">
            <div className="flex text-xs font-semibold uppercase tracking-wider text-slate-500 px-3">
              <span className="w-[50%]">Subject Name</span>
              <span className="w-[20%] text-center">Total Marks</span>
              <span className="w-[20%] text-center">Target Marks</span>
              <span className="w-[10%]"></span>
            </div>

            {subjects.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[#30363d] rounded-xl text-xs text-slate-500">
                No subject streams added yet. Register your exam subjects below (e.g. Mathematics, General Science) to match your {totalMarks} overall Points.
              </div>
            ) : (
              subjects.map((sub, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3"
                >
                  <div className="w-[50%] font-medium text-slate-200 text-sm truncate">{sub.name}</div>
                  <div className="w-[20%] text-center text-sm font-mono text-slate-300">{sub.totalMarks}</div>
                  <div className="w-[20%] text-center text-sm font-mono text-emerald-400 font-semibold">{sub.targetMarks}</div>
                  <div className="w-[10%] text-right">
                    <button
                      type="button"
                      onClick={() => removeSubject(index)}
                      className="text-slate-500 hover:text-red-400 pr-1 transition cursor-pointer"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Subject Marks Summary Balance */}
          <div className="bg-[#161b22] p-3.5 rounded-xl border border-[#30363d] flex items-center justify-between mb-6">
            <span className="text-xs font-semibold tracking-wider text-[#8b949e] uppercase">Subject Sum Balance:</span>
            <span className={`text-sm font-mono font-bold px-3 py-1 bg-[#010409] rounded-lg border ${currentConfiguredSum === totalMarks ? 'text-[#3fb950] border-[#3fb950]/30' : 'text-[#f2cc60] border-[#f2cc60]/30'}`}>
              {currentConfiguredSum} / {totalMarks} PTS
            </span>
          </div>

          {/* Add a subject */}
          <div className="bg-[#161b22]/70 hover:bg-[#161b22] border border-[#30363d] rounded-xl p-4 transition-all duration-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block">Add New Subject Stream</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Subject Name"
                value={newSubName}
                onChange={(e) => setNewSubName(e.target.value)}
                className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-2 px-3 text-sm text-[#c9d1d9] outline-none"
              />
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-500 text-xs font-mono font-bold">Tot</span>
                  <input
                    type="number"
                    placeholder="Total"
                    value={newSubTotal || ''}
                    onChange={(e) => setNewSubTotal(Number(e.target.value))}
                    className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-2 pl-9 pr-2 text-sm text-[#c9d1d9] outline-none font-mono"
                    min="1"
                  />
                </div>
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-2.5 flex items-center text-slate-500 text-xs font-mono font-bold">Tgt</span>
                  <input
                    type="number"
                    placeholder="Target"
                    value={newSubTarget || ''}
                    onChange={(e) => setNewSubTarget(Number(e.target.value))}
                    className="w-full bg-[#010409]/60 border border-[#30363d] focus:border-[#00d4ff] rounded-lg py-2 pl-9 pr-2 text-sm text-[#c9d1d9] outline-none font-mono"
                    min="1"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addSubject}
                className="w-full sm:w-auto bg-[#30363d] hover:bg-[#8b949e]/20 border border-[#30363d] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add Stream
              </button>
            </div>
          </div>

          {/* Validation & Submit Actions */}
          {errorMsg && (
            <div className="mt-6 p-4 bg-red-950/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-medium flex items-start gap-2">
              <span className="font-bold">SYSTEM ALERT:</span> {errorMsg}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl font-bold text-sm tracking-wide transition-all shadow-[0_4px_25px_rgba(79,70,229,0.25)] hover:shadow-[0_4px_30px_rgba(79,70,229,0.4)] hover:-translate-y-0.5"
            >
              Initialize Exam Station
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
