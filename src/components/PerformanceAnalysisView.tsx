import { ExamConfig, DailyPractice, MockTest } from '../types';
import { getSubjectAnalytics, PerformanceAnalysis } from '../utils/analytics';
import { Award, Target, AlertTriangle, TrendingUp, TrendingDown, Minus, ShieldAlert, Sparkles } from 'lucide-react';

interface PerformanceAnalysisViewProps {
  config: ExamConfig;
  mocks: MockTest[];
  practices: DailyPractice[];
}

export default function PerformanceAnalysisView({
  config,
  mocks,
  practices
}: PerformanceAnalysisViewProps) {
  const subjectAnalytics = getSubjectAnalytics(config, mocks, practices);

  // Identify weak domains (e.g. gap to target marks is greater than 3, or accuracy is under 75%)
  const weakDomains = subjectAnalytics.filter(s => s.gapToTarget > 3 || s.accuracy < 75);

  const getTrendIcon = (trend: 'Improving' | 'Stable' | 'Declining') => {
    switch (trend) {
      case 'Improving':
        return <TrendingUp className="h-4.5 w-4.5 text-green-400" />;
      case 'Declining':
        return <TrendingDown className="h-4.5 w-4.5 text-red-400" />;
      default:
        return <Minus className="h-4.5 w-4.5 text-slate-400" />;
    }
  };

  const getTrendBadgeValue = (trend: 'Improving' | 'Stable' | 'Declining') => {
    switch (trend) {
      case 'Improving':
        return "bg-green-950/40 text-green-400 border border-green-500/10";
      case 'Declining':
        return "bg-red-950/40 text-red-500 border border-red-500/10";
      default:
        return "bg-slate-900 text-slate-400 border border-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Weak Domains Identification Header */}
      {weakDomains.length > 0 ? (
        <div className="bg-red-950/10 border border-red-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-left relative overflow-hidden backdrop-blur-md">
          <div className="absolute right-[-20px] bottom-[-20px] text-red-500/5 rotate-12 scale-150">
            <AlertTriangle className="h-32 w-32" />
          </div>
          
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl shrink-0 animate-pulse">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <div className="space-y-1 relative z-10 flex-1">
            <h3 className="text-base font-bold text-red-400 font-display">
              Vulnerability Identified: Weak Subjects Detected
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              We tracked gaps between your actual scores and targets in <strong className="text-red-400">{weakDomains.length} domains</strong>: 
              {weakDomains.map((w, index) => (
                <span key={index} className="inline-flex mx-1 font-bold text-white bg-red-950/40 px-2 py-0.5 rounded border border-red-500/10">
                  {w.subjectName} (-{w.gapToTarget} pts)
                </span>
              ))}. Close these loops to secure selection status.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-green-950/10 border border-green-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-4 text-left relative overflow-hidden backdrop-blur-md">
          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl shrink-0">
            <Sparkles className="h-7 w-7" />
          </div>

          <div className="space-y-1 relative z-10">
            <h3 className="text-base font-bold text-green-400 font-display">
              Target Equilibrium Secure: All Streams Aligned
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Superb coverage! No subject lags significantly below specified targeting thresholds. Your score distribution models demonstrate strong baseline stability.
            </p>
          </div>
        </div>
      )}

      {/* 2. Subjects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {subjectAnalytics.map((analysis, index) => {
          const configSubject = config.subjects.find(s => s.name === analysis.subjectName);
          const ratioPercent = configSubject && configSubject.totalMarks > 0 
            ? Math.round((analysis.currentAverage / configSubject.totalMarks) * 100) 
            : 0;

          const isWeak = weakDomains.some(w => w.subjectName === analysis.subjectName);

          return (
            <div 
              key={index}
              className={`bg-slate-900/80 border rounded-2xl p-6 relative overflow-hidden backdrop-blur-md transition-all duration-300 ${isWeak ? 'border-red-500/15 focus-within:border-red-500/30' : 'border-slate-800/80'}`}
            >
              <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ backgroundColor: isWeak ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.2)' }}></div>
              
              <div className="flex items-start justify-between border-b border-slate-800/60 pb-3.5 mb-4">
                <div className="text-left w-[65%]">
                  <h4 className="text-base font-bold text-white tracking-tight truncate">{analysis.subjectName}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">Stream Schema Distribution</span>
                </div>
                
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg border font-mono ${getTrendBadgeValue(analysis.trend)}`}>
                  {getTrendIcon(analysis.trend)}
                  {analysis.trend}
                </span>
              </div>

              {/* Grid indices */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                
                <div className="bg-[#0f172a] border border-slate-850 p-2.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Stream Target</span>
                  <p className="text-lg font-bold font-display text-white mt-0.5">{analysis.targetMarks} pts</p>
                  <span className="text-[9px] text-slate-400 font-mono">/ {configSubject?.totalMarks} Marks</span>
                </div>

                <div className="bg-[#0f172a] border border-slate-850 p-2.5 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Actual Average</span>
                  <p className="text-lg font-bold font-display mt-0.5 text-indigo-400">{analysis.currentAverage} pts</p>
                  <span className="text-[9px] text-slate-400 font-mono">{ratioPercent}% Efficiency</span>
                </div>

              </div>

              {/* Progress Gauges */}
              <div className="space-y-3 pt-1">
                
                {/* Score Gap progress line */}
                <div>
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className="text-slate-400">Target Gap Analysis</span>
                    {analysis.gapToTarget > 0 ? (
                      <span className="text-red-400 font-bold">-{analysis.gapToTarget} Marks Lag</span>
                    ) : (
                      <span className="text-emerald-400 font-bold">Target Accomplished</span>
                    )}
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${analysis.gapToTarget > 0 ? 'bg-indigo-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, Math.round((analysis.currentAverage / analysis.targetMarks) * 100))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Accuracy index progress line */}
                <div>
                  <div className="flex justify-between items-center text-xs font-mono mb-1">
                    <span className="text-slate-400">Practice Correctness Ratio</span>
                    <span className={`font-bold ${analysis.accuracy >= 80 ? 'text-green-400' : analysis.accuracy >= 65 ? 'text-sky-400' : 'text-amber-500'}`}>
                      {analysis.accuracy}% Acc
                    </span>
                  </div>
                  <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${analysis.accuracy >= 80 ? 'bg-emerald-500' : analysis.accuracy >= 65 ? 'bg-sky-500' : 'bg-amber-500'}`}
                      style={{ width: `${analysis.accuracy}%` }}
                    ></div>
                  </div>
                </div>

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}
