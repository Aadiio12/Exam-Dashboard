import { ExamConfig, DailyPractice, MockTest, Mistake } from '../types';

export interface PerformanceAnalysis {
  subjectName: string;
  targetMarks: number;
  currentAverage: number;
  gapToTarget: number;
  accuracy: number;
  totalQuestions: number;
  trend: 'Improving' | 'Stable' | 'Declining';
}

export function calcDaysRemaining(examDateStr: string): number {
  const targetDate = new Date(examDateStr);
  const today = new Date();
  
  // Set times to midnight to calculate pure date difference
  targetDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getGeneralStats(config: ExamConfig, mocks: MockTest[], practices: DailyPractice[]) {
  const totalMocks = mocks.length;
  let latestMockScore = 0;
  let bestMockScore = 0;
  let avgMockScore = 0;

  if (totalMocks > 0) {
    // Mocks are sorted newest first in our storage wrapper
    latestMockScore = mocks[0].totalScore;
    bestMockScore = Math.max(...mocks.map(m => m.totalScore));
    avgMockScore = mocks.reduce((sum, m) => sum + m.totalScore, 0) / totalMocks;
  }

  // Calculate Overall Daily Practice stats
  const totalQuestionsSolved = practices.reduce((sum, p) => sum + p.questionsAttempted, 0);
  const totalCorrect = practices.reduce((sum, p) => sum + p.correct, 0);
  const overallPracticeAccuracy = totalQuestionsSolved > 0 ? (totalCorrect / totalQuestionsSolved) * 100 : 0;

  // Compute Predicted Score
  // If mocks exist: 45% Latest Mock + 35% Average Mock + 10% Best Mock + 10% Daily Practice Correctness Ratio * Exam Total Marks
  // If no mocks exist: Daily Practice Accuracy * Exam Total Marks. If no practice, 65% of Total Marks.
  let predictedScore = 0;
  let formulaLabel = "";

  if (totalMocks > 0) {
    const practiceContribution = (overallPracticeAccuracy / 100) * config.totalMarks;
    predictedScore = 
      (latestMockScore * 0.45) + 
      (avgMockScore * 0.35) + 
      (bestMockScore * 0.10) + 
      (practiceContribution * 0.10);
    
    formulaLabel = `45% Latest Mock (${latestMockScore.toFixed(0)}) + 35% Avg Mock (${avgMockScore.toFixed(0)}) + 10% Best Mock (${bestMockScore.toFixed(0)}) + 10% Practice index (${practiceContribution.toFixed(0)})`;
  } else if (totalQuestionsSolved > 0) {
    predictedScore = (overallPracticeAccuracy / 100) * config.totalMarks;
    formulaLabel = `Daily Practice Accuracy (${overallPracticeAccuracy.toFixed(1)}%) * Total Marks (${config.totalMarks})`;
  } else {
    predictedScore = config.previousCutoff * 0.95; // default fallback prediction
    formulaLabel = `Default starting state (95% of Cutoff). Input Daily practice or Mocks to initialize forecast.`;
  }

  predictedScore = Math.min(config.totalMarks, Math.round(predictedScore));

  const selectionGap = config.previousCutoff - predictedScore;

  return {
    latestMockScore,
    bestMockScore,
    avgMockScore: Math.round(avgMockScore),
    totalQuestionsSolved,
    overallPracticeAccuracy: Math.round(overallPracticeAccuracy),
    predictedScore,
    formulaLabel,
    selectionGap
  };
}

export function getSubjectAnalytics(config: ExamConfig, mocks: MockTest[], practices: DailyPractice[]): PerformanceAnalysis[] {
  return config.subjects.map(subject => {
    // 1. Fetch mock averages
    const subjectMocks = mocks.map(m => m.subjectMarks[subject.name] || 0).filter(s => s > 0);
    const mockAverage = subjectMocks.length > 0 ? subjectMocks.reduce((sum, m) => sum + m, 0) / subjectMocks.length : 0;

    // 2. Fetch practice data
    const subjectPractices = practices.filter(p => p.subject === subject.name);
    const totalQs = subjectPractices.reduce((sum, p) => sum + p.questionsAttempted, 0);
    const totalCorrect = subjectPractices.reduce((sum, p) => sum + p.correct, 0);
    const accuracy = totalQs > 0 ? (totalCorrect / totalQs) * 100 : 0;

    // 3. Current average representation is mock average, or practice accuracy-scaled target, or baseline
    let currentAverage = 0;
    if (subjectMocks.length > 0) {
      currentAverage = mockAverage;
    } else if (totalQs > 0) {
      currentAverage = (accuracy / 100) * subject.totalMarks;
    } else {
      currentAverage = subject.targetMarks * 0.70; // baseline 70% of target
    }
    
    currentAverage = parseFloat(currentAverage.toFixed(1));
    const gapToTarget = parseFloat((subject.targetMarks - currentAverage).toFixed(1));

    // 4. Determine trend
    // Look at past mock test scores if they exist, or past daily accuracies
    let trend: 'Improving' | 'Stable' | 'Declining' = 'Stable';
    if (subjectMocks.length > 1) {
      const firstHalf = subjectMocks.slice(Math.ceil(subjectMocks.length / 2));
      const secondHalf = subjectMocks.slice(0, Math.ceil(subjectMocks.length / 2));
      const avgEarly = firstHalf.reduce((s, x) => s + x, 0) / firstHalf.length;
      const avgRecent = secondHalf.reduce((s, x) => s + x, 0) / secondHalf.length;
      
      if (avgRecent - avgEarly > 1) {
        trend = 'Improving';
      } else if (avgEarly - avgRecent > 1) {
        trend = 'Declining';
      }
    } else if (subjectPractices.length > 1) {
      // Practice accuracy trend over time
      const sortedPractices = [...subjectPractices].sort((a,b) => b.date.localeCompare(a.date));
      const recentAcc = sortedPractices[0].questionsAttempted > 0 ? sortedPractices[0].correct / sortedPractices[0].questionsAttempted : 0.7;
      const olderAccs = sortedPractices.slice(1).reduce((s, p) => s + (p.questionsAttempted > 0 ? p.correct / p.questionsAttempted : 0.7), 0) / (sortedPractices.length - 1);
      
      if (recentAcc - olderAccs > 0.05) {
        trend = 'Improving';
      } else if (olderAccs - recentAcc > 0.05) {
        trend = 'Declining';
      }
    }

    return {
      subjectName: subject.name,
      targetMarks: subject.targetMarks,
      currentAverage,
      gapToTarget: Math.max(0, gapToTarget),
      accuracy: totalQs > 0 ? Math.round(accuracy) : 70, // baseline
      totalQuestions: totalQs,
      trend
    };
  });
}

export function getRecommendations(config: ExamConfig, mocks: MockTest[], practices: DailyPractice[]): {
  recommendations: { subject: string; improvement: number }[];
  overallAdvice: string;
} {
  const analysis = getSubjectAnalytics(config, mocks, practices);
  const stats = getGeneralStats(config, mocks, practices);
  const gap = stats.selectionGap;

  if (gap <= 0) {
    // Already safety cleared or in target reach!
    // Offer stabilization points
    const weakSubjects = [...analysis]
      .filter(a => a.gapToTarget > 0)
      .sort((a, b) => b.gapToTarget - a.gapToTarget);

    const recommendations = weakSubjects.map(w => ({
      subject: w.subjectName,
      improvement: Math.ceil(w.gapToTarget)
    })).slice(0, 3);

    return {
      recommendations,
      overallAdvice: "Defensive target verified. You currently project inside the qualifying matrix. Focus on safeguarding consistency and addressing minor subject gaps to optimize overall percentile."
    };
  }

  // Distribute required 'gap' score to candidate subjects that are currently performing below their Target marks
  const candidates = analysis.map(a => {
    // Subject potential is standard gap to target marks
    // If they already met their target, potential gap is small but we can still push beyond target up to totalMarks
    const maxPushValue = config.subjects.find(s => s.name === a.subjectName)!.totalMarks - a.currentAverage;
    const potential = Math.max(0.5, a.targetMarks - a.currentAverage);
    return {
      subjectName: a.subjectName,
      potential,
      maxPushValue: Math.max(1, maxPushValue)
    };
  });

  const totalPot = candidates.reduce((s, c) => s + c.potential, 0);

  let rawShares = candidates.map(c => {
    let rawShare = totalPot > 0 ? (c.potential / totalPot) * gap : gap / candidates.length;
    // clip sharing to max push value
    let share = Math.round(Math.min(c.maxPushValue, rawShare));
    return {
      subject: c.subjectName,
      improvement: share
    };
  });

  // Make sure sum of shares equals gap
  let sumShares = rawShares.reduce((s, r) => s + r.improvement, 0);
  let diff = gap - sumShares;

  if (diff !== 0 && rawShares.length > 0) {
    // Add/subtract reminder to biggest capacity subject
    const sorted = [...rawShares].sort((a,b) => {
      const limitA = candidates.find(c => c.subjectName === a.subject)?.maxPushValue || 1;
      const limitB = candidates.find(c => c.subjectName === b.subject)?.maxPushValue || 1;
      return (limitB - b.improvement) - (limitA - a.improvement);
    });
    
    const targetSub = rawShares.find(r => r.subject === sorted[0].subject);
    if (targetSub) {
      targetSub.improvement = Math.max(1, targetSub.improvement + diff);
    }
  }

  // Format and filter entries so they don't suggest 0 improvement triggers
  const activeShares = rawShares.filter(r => r.improvement > 0);

  return {
    recommendations: activeShares,
    overallAdvice: `To secure qualifying ranks, you have a ${gap}-mark selection gap to close. Prioritize subjects with the highest improvement leverage, focusing heavily on ${activeShares[0]?.subject || 'troubled domains'}.`
  };
}
