import React, { useState } from 'react';
import { ExamConfig, Mistake, MistakeType } from '../types';
import { saveMistake, deleteMistake } from '../utils/storage';
import { Plus, HelpCircle, ShieldAlert, FileWarning, Search, ChevronDown, CheckCircle, Trash2, AlertTriangle, Lightbulb } from 'lucide-react';

interface MistakeBankViewProps {
  config: ExamConfig;
  mistakes: Mistake[];
  onMistakesUpdate: (updated: Mistake[]) => void;
}

export default function MistakeBankView({
  config,
  mistakes,
  onMistakesUpdate
}: MistakeBankViewProps) {
  const [subject, setSubject] = useState(config.subjects[0]?.name || '');
  const [topic, setTopic] = useState('');
  const [mistakeType, setMistakeType] = useState<MistakeType>(MistakeType.SillyMistake);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [errorMsg, setErrorMsg] = useState('');

  // Filtering criteria
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [searchTopic, setSearchTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!topic.trim()) {
      setErrorMsg('Please specify the topic name or problem index.');
      return;
    }
    if (!notes.trim()) {
      setErrorMsg('Please specify descriptive correction notes.');
      return;
    }

    const newMistake: Mistake = {
      id: `ms-${Date.now()}`,
      subject,
      topic: topic.trim(),
      mistakeType,
      notes: notes.trim(),
      date
    };

    saveMistake(newMistake);
    const updated = [newMistake, ...mistakes];
    onMistakesUpdate(updated);

    // Reset fields
    setTopic('');
    setNotes('');
    setErrorMsg('');
  };

  const handleDelete = (id: string) => {
    deleteMistake(id);
    const filtered = mistakes.filter(m => m.id !== id);
    onMistakesUpdate(filtered);
  };

  const filteredMistakes = mistakes.filter(m => {
    const matchSub = filterSubject === 'All' || m.subject === filterSubject;
    const matchType = filterType === 'All' || m.mistakeType === filterType;
    const matchSearch = !searchTopic.trim() || 
      m.topic.toLowerCase().includes(searchTopic.toLowerCase()) || 
      m.notes.toLowerCase().includes(searchTopic.toLowerCase());
    return matchSub && matchType && matchSearch;
  });

  // Calculate mistake statistics
  const totalMistakes = mistakes.length;
  
  // Calculate frequency array
  const typeCounts = {
    [MistakeType.ConceptError]: 0,
    [MistakeType.SillyMistake]: 0,
    [MistakeType.CalculationError]: 0,
    [MistakeType.TimeManagement]: 0,
    [MistakeType.GuessingError]: 0,
  };

  mistakes.forEach(m => {
    if (typeCounts[m.mistakeType] !== undefined) {
      typeCounts[m.mistakeType]++;
    }
  });

  // Find dominant mistake
  let dominantType = MistakeType.SillyMistake;
  let dominantCount = 0;
  
  Object.entries(typeCounts).forEach(([type, count]) => {
    if (count > dominantCount) {
      dominantCount = count;
      dominantType = type as MistakeType;
    }
  });

  // Dominant resolution guidance strings
  const getResolutionGuidance = (type: MistakeType) => {
    switch (type) {
      case MistakeType.ConceptError:
        return {
          title: "Concept Strengthening Lock",
          action: "Re-read subject theory standard text and solve 30 foundation questions slowly without looking at timer models. Create mindmaps on core formulas.",
          badgeColor: "bg-red-500/10 text-red-400 border border-red-500/20"
        };
      case MistakeType.CalculationError:
        return {
          title: "Speed Math Intervention",
          action: "Practice 15 minutes of daily tables, percentage fractions, decimal squares, and approximate mental calculation quizzes. Stop using scrap sheets for trivial double digit addition.",
          badgeColor: "bg-orange-500/10 text-orange-400 border border-orange-500/20"
        };
      case MistakeType.SillyMistake:
        return {
          title: "Vigilance checklists",
          action: "Read question lines twice before coding or submitting values. Write down what is asked on scratchpad (e.g. 'find AREA, not RADIUS') to eliminate reading errors.",
          badgeColor: "bg-[#eab308]/10 text-yellow-400 border border-yellow-500/20"
        };
      case MistakeType.TimeManagement:
        return {
          title: "Cycle Target Drills",
          action: "Set standard strict timers: 45 seconds maximum per logical puzzle. If no pathway emerges, instantly mark for review or clear and proceed. Guard score yield rate.",
          badgeColor: "bg-sky-500/10 text-sky-400 border border-sky-500/20"
        };
      case MistakeType.GuessingError:
        return {
          title: "Probability stricture",
          action: "Implement strict penalty filters. If you cannot confidently eliminate at least 2 incorrect options, force skip. Guessing is degrading your qualification score boundaries.",
          badgeColor: "bg-purple-500/10 text-purple-400 border border-purple-500/20"
        };
    }
  };

  const guidance = getResolutionGuidance(dominantType);

  return (
    <div className="space-y-6">
      
      {/* 1. Diagnoses Matrix Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-xl p-5 text-left">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Registered Errors</span>
          <p className="text-3xl font-extrabold text-white font-display mt-0.5">{totalMistakes}</p>
          <span className="text-[9px] text-[#e2e8f0]/40 font-mono mt-0.5">Total documented blunders</span>
        </div>

        {totalMistakes > 0 ? (
          <>
            <div className="bg-[#0f172a]/60 border border-slate-800/60 rounded-xl p-5 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">dominant error type</span>
              <p className="text-xl font-bold font-display text-amber-400 mt-1 uppercase tracking-wide">{dominantType}</p>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5">{dominantCount} incidents documented ({Math.round((dominantCount / totalMistakes) * 100)}%)</span>
            </div>

            <div className={`p-5 rounded-xl text-left border ${guidance.badgeColor} flex flex-col justify-between`}>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider opacity-90 block">Diagnostic Directive</span>
                <span className="text-sm font-semibold font-display block mt-0.5">{guidance.title}</span>
                <p className="text-[11px] leading-relaxed mt-1 opacity-80">{guidance.action}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="md:col-span-2 bg-[#0f172a]/30 border border-dashed border-slate-800 rounded-xl p-5 flex items-center justify-center text-slate-500 text-xs">
            Diagnosis module standby. Log blunders in mock practice or daily drills to run diagnostic filters.
          </div>
        )}

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 2. Log mistake portal */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md space-y-4">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent"></div>
          
          <h3 className="text-lg font-bold text-white font-display border-b border-slate-800 pb-3 flex items-center gap-2 mb-2">
            <FileWarning className="h-5 w-5 text-red-400 animate-pulse" />
            File Mistake Entry
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="mistake-date">
                Occurrence Date
              </label>
              <input
                id="mistake-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-red-500 rounded-lg py-2.5 px-3 text-xs text-slate-100 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="mistake-subject">
                Subject
              </label>
              <select
                id="mistake-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-red-500 rounded-lg py-2.5 px-3 text-xs text-slate-100 outline-none"
                required
              >
                {config.subjects.map((sub, idx) => (
                  <option key={idx} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="mistake-topic">
              Topic or Problem Type
            </label>
            <input
              id="mistake-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Simple Interest compound logic, Subject-verb agreement rules, etc."
              className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-red-500 rounded-lg py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="mistake-type-select">
              Error Driver (Mistake Type)
            </label>
            <select
              id="mistake-type-select"
              value={mistakeType}
              onChange={(e) => setMistakeType(e.target.value as MistakeType)}
              className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-red-500 rounded-lg py-2.5 px-3.5 text-xs text-slate-100 outline-none font-semibold text-amber-400"
              required
            >
              <option value={MistakeType.ConceptError}>📚 Concept Error</option>
              <option value={MistakeType.SillyMistake}>🤪 Silly Mistake</option>
              <option value={MistakeType.CalculationError}>🧮 Calculation Error</option>
              <option value={MistakeType.TimeManagement}>⏱️ Time Management</option>
              <option value={MistakeType.GuessingError}>🎲 Guessing Error</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1" htmlFor="mistake-notes">
              Correction Notes & Strategy (How to avoid)
            </label>
            <textarea
              id="mistake-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail the correct logic path, math checkpoints or mnemonic systems to avoid repetition."
              className="w-full bg-[#1e293b]/70 border border-slate-700/80 focus:border-red-500 rounded-lg py-2.5 px-4 text-xs text-slate-100 placeholder-slate-500 outline-none h-24 resize-none"
              required
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/20 text-red-400 border border-red-500/20 rounded-xl text-[11px] font-medium flex items-center gap-1.5 justify-start">
              <AlertTriangle className="h-4 w-4" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider py-3.5 rounded-xl shadow-lg transition duration-200 active:scale-95 cursor-pointer"
          >
            Log Blunder in Bank
          </button>

        </form>

        {/* 3. Mistakes catalog with search and filters */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col space-y-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                <Search className="h-5 w-5 text-indigo-400" />
                Blunder Records Catalog
              </h3>
              <p className="text-xs text-slate-400">Filter, search, and review mistake parameters</p>
            </div>
          </div>

          {/* Filters shelf */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-950/50 p-3 rounded-xl border border-slate-850">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Subject Stream</label>
              <select
                value={filterSubject}
                id="filter-subject-select"
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 focus:outline-none"
              >
                <option value="All">All Subjects</option>
                {config.subjects.map((sub, idx) => (
                  <option key={idx} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Error Driver</label>
              <select
                value={filterType}
                id="filter-type-select"
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 focus:outline-none"
              >
                <option value="All">All Drivers</option>
                <option value={MistakeType.ConceptError}>📚 Concept Error</option>
                <option value={MistakeType.SillyMistake}>🤪 Silly Mistake</option>
                <option value={MistakeType.CalculationError}>🧮 Calculation Error</option>
                <option value={MistakeType.TimeManagement}>⏱️ Time Management</option>
                <option value={MistakeType.GuessingError}>🎲 Guessing Error</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Term Search</label>
              <input
                type="text"
                value={searchTopic}
                id="filter-search-input"
                onChange={(e) => setSearchTopic(e.target.value)}
                placeholder="Search topic or notes..."
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 focus:outline-none placeholder-slate-600"
              />
            </div>
          </div>

          {/* Mistakes Feed */}
          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredMistakes.length > 0 ? (
              filteredMistakes.map((m) => {
                const getDriverBadge = (t: MistakeType) => {
                  switch (t) {
                    case MistakeType.ConceptError:
                      return "bg-red-950/40 text-red-400 border border-red-500/10";
                    case MistakeType.CalculationError:
                      return "bg-amber-950/40 text-amber-400 border border-amber-500/10";
                    case MistakeType.SillyMistake:
                      return "bg-yellow-950/40 text-yellow-500 border border-yellow-500/10";
                    case MistakeType.TimeManagement:
                      return "bg-sky-950/40 text-sky-400 border border-sky-500/10";
                    case MistakeType.GuessingError:
                      return "bg-purple-950/40 text-purple-400 border border-purple-500/10";
                  }
                };

                return (
                  <div key={m.id} className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-xl text-left relative group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold font-mono text-slate-500">{m.date}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          {m.subject}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getDriverBadge(m.mistakeType)}`}>
                          {m.mistakeType}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-[#e2e8f0] mb-1.5">{m.topic}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed bg-[#0c101a] p-3 rounded-lg border border-slate-900 whitespace-pre-line font-medium italic">
                      &ldquo;{m.notes}&rdquo;
                    </p>

                    {/* Delete entry */}
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="absolute right-3.5 top-3.5 text-slate-500 hover:text-red-400 p-1 bg-slate-900/40 border border-transparent rounded hover:border-slate-800 transition md:opacity-0 group-hover:opacity-100"
                      title="Clear Blunder entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs border border-dashed border-slate-850 rounded-xl">
                No mistakes match the currently active filtering criteria.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
