import { ExamConfig, DailyPractice, MockTest, Mistake } from '../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { Sparkles, HelpCircle, BarChart2, PieChart, TrendingUp, AlertTriangle } from 'lucide-react';

interface VisualAnalyticsViewProps {
  config: ExamConfig;
  mocks: MockTest[];
  practices: DailyPractice[];
  mistakes: Mistake[];
}

export default function VisualAnalyticsView({
  config,
  mocks,
  practices,
  mistakes
}: VisualAnalyticsViewProps) {

  // 1. DATA PREPARATION: Daily Questions Solved (Last 7 active days)
  const practicesGroupedByDate = practices.reduce((acc, p) => {
    acc[p.date] = (acc[p.date] || 0) + p.questionsAttempted;
    return acc;
  }, {} as Record<string, number>);

  const dailyQuestionsData = Object.entries(practicesGroupedByDate)
    .map(([date, qty]) => ({ date, Questions: qty }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7); // take last 7 logged days

  // 2. DATA PREPARATION: Accuracy Trend
  // Group correct and attempted by date to get daily accuracy %
  const dailyAccuracyGroup = practices.reduce((acc, p) => {
    if (!acc[p.date]) {
      acc[p.date] = { correct: 0, attempted: 0 };
    }
    acc[p.date].correct += p.correct;
    acc[p.date].attempted += p.questionsAttempted;
    return acc;
  }, {} as Record<string, { correct: number; attempted: number }>);

  const dailyAccuracyData = Object.entries(dailyAccuracyGroup)
    .map(([date, val]) => ({
      date,
      Accuracy: val.attempted > 0 ? Math.round((val.correct / val.attempted) * 100) : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  // 3. DATA PREPARATION: Mock Score Trend (Oldest to Newest)
  const mockTrendData = [...mocks]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(m => ({
      date: m.date,
      Score: m.totalScore,
      name: m.mockName
    }));

  // 4. DATA PREPARATION: Subject-wise Mock Performance over time (Each mock acts as a checkpoint)
  const sortedMocks = [...mocks].sort((a, b) => a.date.localeCompare(b.date));
  const subjectPerformanceData = sortedMocks.map(m => {
    const row: Record<string, any> = {
      date: m.date,
      name: m.mockName
    };
    config.subjects.forEach(sub => {
      row[sub.name] = m.subjectMarks[sub.name] || 0;
    });
    return row;
  });

  // 5. DATA PREPARATION: Mistake Driver Distribution
  const mistakeCounts = mistakes.reduce((acc, m) => {
    acc[m.mistakeType] = (acc[m.mistakeType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mistakeDistributionData = Object.entries(mistakeCounts).map(([type, count]) => ({
    name: type.replace(" Mistake", "").replace(" Error", ""),
    Count: count
  }));

  // Color palette for subjects and mistakes to ensure a premium look
  const NEON_COLORS = [
    "#00d4ff", // Brand Cyan
    "#3fb950", // Emerald Green
    "#f2cc60", // Gold
    "#ff7b72", // Soft Red
    "#8b949e", // Slate Dim
    "#ffffff"  // Pure White
  ];

  const MISTAKE_COLORS: Record<string, string> = {
    "Concept": "#ff7b72",      // Soft Red
    "Silly": "#f2cc60",        // Gold
    "Calculation": "#f2cc60",  // Gold/Orange
    "Time Management": "#00d4ff", // Brand Cyan
    "Guessing": "#8b949e"      // Slate Dim
  };

  return (
    <div className="space-y-6">
      
      {/* Overview stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Graph Card 1: Mock Score Performance & Zone Lines */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="text-left">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-400" />
                Mock Paper Progress Timeline
              </h3>
              <p className="text-[10px] text-slate-400">Total Scores relative to Cutoff ({config.previousCutoff}), Target ({config.targetScore}), and Safe Zone ({config.safeScore})</p>
            </div>
          </div>

          <div className="h-64">
            {mockTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrendData} margin={{ top: 20, right: 15, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="date" stroke="#8b949e" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <YAxis domain={['auto', config.totalMarks]} stroke="#8b949e" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '12px' }}
                    labelStyle={{ color: '#8b949e', fontWeight: 'bold' }}
                    itemStyle={{ color: '#ffffff' }}
                  />
                  {/* Reference indicator lines */}
                  <ReferenceLine y={config.previousCutoff} stroke="#ff7b72" strokeDasharray="4 4" label={{ value: 'Cutoff', fill: '#ff7b72', position: 'top', fontSize: 10 }} />
                  <ReferenceLine y={config.safeScore} stroke="#3fb950" strokeDasharray="4 4" label={{ value: 'Safe', fill: '#3fb950', position: 'top', fontSize: 10 }} />
                  <ReferenceLine y={config.targetScore} stroke="#00d4ff" strokeDasharray="4 4" label={{ value: 'Target', fill: '#00d4ff', position: 'top', fontSize: 10 }} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="Score" 
                    stroke="#00d4ff" 
                    strokeWidth={3} 
                    dot={{ fill: '#00b4df', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Log mock records to initialize progress timeline charts.
              </div>
            )}
          </div>
        </div>

        {/* Graph Card 2: Subject Performance mock progression */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="text-left">
              <h3 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                <BarChart2 className="h-4.5 w-4.5 text-indigo-400" />
                Stream Performance tracking
              </h3>
              <p className="text-[10px] text-slate-400">Progression of subject-wise scores across logged mock tests</p>
            </div>
          </div>

          <div className="h-64">
            {subjectPerformanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={subjectPerformanceData} margin={{ top: 15, right: 15, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="date" stroke="#8b949e" style={{ fontSize: '10px' }} />
                  <YAxis stroke="#8b949e" style={{ fontSize: '10px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                  
                  {config.subjects.map((sub, idx) => (
                    <Line 
                      key={sub.name}
                      type="monotone" 
                      dataKey={sub.name} 
                      stroke={NEON_COLORS[idx % NEON_COLORS.length]} 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Input mock tests to observe stream-specific score progression.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Second Row of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 3: Daily questions solved */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
          <h4 className="text-sm font-bold text-white font-display border-b border-slate-800/60 pb-3 mb-4 text-left">
            Daily Solved Questions (Activity)
          </h4>
          <div className="h-56">
            {dailyQuestionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyQuestionsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="date" stroke="#8b949e" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#8b949e" style={{ fontSize: '9px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }} />
                  <Bar dataKey="Questions" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Log daily practices to chart solved volume statistics.
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Daily practice accuracy */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
          <h4 className="text-sm font-bold text-white font-display border-b border-slate-800/60 pb-3 mb-4 text-left">
            Chronological Accuracy %
          </h4>
          <div className="h-56">
            {dailyAccuracyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyAccuracyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                  <XAxis dataKey="date" stroke="#8b949e" style={{ fontSize: '9px', fontFamily: 'monospace' }} />
                  <YAxis stroke="#8b949e" style={{ fontSize: '9px' }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }} />
                  <Line type="monotone" dataKey="Accuracy" stroke="#3fb950" strokeWidth={2.5} dot={{ fill: '#35a447' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Log daily practices to chart correct-item ratio lines.
              </div>
            )}
          </div>
        </div>

        {/* Chart 5: Mistakes driver distribution */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md">
          <h4 className="text-sm font-bold text-white font-display border-b border-slate-800/60 pb-3 mb-4 text-left flex items-center gap-1.5 justify-between">
            <span>Mistake Drivers Layout</span>
            <span className="text-[10px] text-red-400 font-bold bg-red-950/20 px-2 py-0.5 rounded">Risk Analysis</span>
          </h4>
          
          <div className="h-56">
            {mistakeDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mistakeDistributionData} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363d" horizontal={false} />
                  <XAxis type="number" stroke="#8b949e" style={{ fontSize: '9px' }} />
                  <YAxis dataKey="name" type="category" stroke="#c9d1d9" style={{ fontSize: '10px', fontWeight: 'bold' }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d' }} />
                  <Bar dataKey="Count" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                    {mistakeDistributionData.map((entry, index) => {
                      // Attempt to color code by key or default
                      let col = MISTAKE_COLORS[entry.name] || NEON_COLORS[index % NEON_COLORS.length];
                      return <Cell key={`cell-${index}`} fill={col} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                Record blunder records in the bank to display error drivers.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
