export interface SubjectConfig {
  name: string;
  totalMarks: number;
  targetMarks: number;
}

export interface ExamConfig {
  examName: string;
  examDate: string; // ISO String (YYYY-MM-DD)
  totalMarks: number;
  targetScore: number;
  safeScore: number;
  previousCutoff: number;
  subjects: SubjectConfig[];
}

export interface DailyPractice {
  id: string;
  date: string; // YYYY-MM-DD
  subject: string;
  questionsAttempted: number;
  correct: number;
  wrong: number;
  timeSpent: number; // in minutes
  skipped?: number;
  negativeMarking?: number;
  totalQuestions?: number;
  optionsCount?: number;
  perQuestionSpeed?: number; // in seconds
  score?: number;
}

export interface MockTest {
  id: string;
  date: string; // YYYY-MM-DD
  mockName: string;
  subjectMarks: Record<string, number>; // { [subjectName]: score }
  totalScore: number;
  skipped?: number;
  negativeMarking?: number;
  totalQuestions?: number;
  optionsCount?: number;
  perQuestionSpeed?: number; // in seconds
}

export enum MistakeType {
  ConceptError = "Concept Error",
  SillyMistake = "Silly Mistake",
  CalculationError = "Calculation Error",
  TimeManagement = "Time Management",
  GuessingError = "Guessing Error"
}

export interface Mistake {
  id: string;
  subject: string;
  topic: string;
  mistakeType: MistakeType;
  notes: string;
  date: string; // YYYY-MM-DD
}

export interface MissionTask {
  id: string;
  subject: string;
  description: string;
  isCompleted: boolean;
  targetCount?: number;
  type: 'Questions' | 'Revision' | 'Passage' | 'Practice';
}
