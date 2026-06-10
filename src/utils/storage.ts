import { ExamConfig, DailyPractice, MockTest, Mistake, MissionTask, MistakeType } from '../types';

const KEYS = {
  EXAM_CONFIG: "emc_exam_config",
  DAILY_PRACTICES: "emc_daily_practices",
  MOCK_TESTS: "emc_mock_tests",
  MISTAKES: "emc_mistakes",
  MISSION_TASKS: "emc_mission_tasks",
  MISSION_DATE: "emc_mission_date",
};

// Default structures
export function getExamConfig(): ExamConfig | null {
  const data = localStorage.getItem(KEYS.EXAM_CONFIG);
  return data ? JSON.parse(data) : null;
}

export function saveExamConfig(config: ExamConfig): void {
  localStorage.setItem(KEYS.EXAM_CONFIG, JSON.stringify(config));
}

export function getDailyPractices(): DailyPractice[] {
  const data = localStorage.getItem(KEYS.DAILY_PRACTICES);
  return data ? JSON.parse(data) : [];
}

export function saveDailyPractice(practice: DailyPractice): void {
  const list = getDailyPractices();
  const index = list.findIndex(p => p.id === practice.id);
  if (index >= 0) {
    list[index] = practice;
  } else {
    list.unshift(practice);
  }
  localStorage.setItem(KEYS.DAILY_PRACTICES, JSON.stringify(list));
}

export function deleteDailyPractice(id: string): void {
  const list = getDailyPractices().filter(p => p.id !== id);
  localStorage.setItem(KEYS.DAILY_PRACTICES, JSON.stringify(list));
}

export function getMockTests(): MockTest[] {
  const data = localStorage.getItem(KEYS.MOCK_TESTS);
  return data ? JSON.parse(data) : [];
}

export function saveMockTest(test: MockTest): void {
  const list = getMockTests();
  const index = list.findIndex(t => t.id === test.id);
  if (index >= 0) {
    list[index] = test;
  } else {
    list.unshift(test);
  }
  localStorage.setItem(KEYS.MOCK_TESTS, JSON.stringify(list));
}

export function deleteMockTest(id: string): void {
  const list = getMockTests().filter(t => t.id !== id);
  localStorage.setItem(KEYS.MOCK_TESTS, JSON.stringify(list));
}

export function getMistakes(): Mistake[] {
  const data = localStorage.getItem(KEYS.MISTAKES);
  return data ? JSON.parse(data) : [];
}

export function saveMistake(mistake: Mistake): void {
  const list = getMistakes();
  const index = list.findIndex(m => m.id === mistake.id);
  if (index >= 0) {
    list[index] = mistake;
  } else {
    list.unshift(mistake);
  }
  localStorage.setItem(KEYS.MISTAKES, JSON.stringify(list));
}

export function deleteMistake(id: string): void {
  const list = getMistakes().filter(m => m.id !== id);
  localStorage.setItem(KEYS.MISTAKES, JSON.stringify(list));
}

export function getMissionTasks(subjects: string[]): MissionTask[] {
  const savedDate = localStorage.getItem(KEYS.MISSION_DATE);
  const todayStr = new Date().toISOString().substring(0, 10);
  
  if (savedDate === todayStr) {
    const data = localStorage.getItem(KEYS.MISSION_TASKS);
    if (data) {
      return JSON.parse(data);
    }
  }

  // Generate new daily mission if date changed or doesn't exist
  const newMissions = generateDefaultMissions(subjects);
  localStorage.setItem(KEYS.MISSION_DATE, todayStr);
  localStorage.setItem(KEYS.MISSION_TASKS, JSON.stringify(newMissions));
  return newMissions;
}

export function saveMissionTasks(tasks: MissionTask[]): void {
  localStorage.setItem(KEYS.MISSION_TASKS, JSON.stringify(tasks));
}

function generateDefaultMissions(subjects: string[]): MissionTask[] {
  if (subjects.length === 0) {
    return [
      { id: "m1", subject: "Quant", description: "Solve 50 algebra or arithmetic questions", isCompleted: false, targetCount: 50, type: "Questions" },
      { id: "m2", subject: "Reasoning", description: "Practice 30 logical puzzle & series questions", isCompleted: false, targetCount: 30, type: "Questions" },
      { id: "m3", subject: "English", description: "Solve 1 Reading Comprehension passage & synonyms", isCompleted: false, targetCount: 1, type: "Passage" },
      { id: "m4", subject: "General Knowledge", description: "Revision of current affairs & static science quiz", isCompleted: false, type: "Revision" }
    ];
  }

  // Generate dynamically based on given subjects
  return subjects.map((sub, idx) => {
    const types: ('Questions' | 'Revision' | 'Passage' | 'Practice')[] = ['Questions', 'Revision', 'Practice', 'Passage'];
    const type = types[idx % types.length];
    
    let desc = "";
    let target: number | undefined;

    if (type === 'Questions') {
      target = 40 + (idx * 5) % 20;
      desc = `Solve ${target} practice questions in ${sub}`;
    } else if (type === 'Revision') {
      desc = `Review formulas, concepts, and mistake notes for ${sub}`;
    } else if (type === 'Passage') {
      target = 1;
      desc = `Read and solve 1 study set / comprehension pass in ${sub}`;
    } else {
      desc = `Full chapter evaluation practice for ${sub}`;
    }

    return {
      id: `m-dynamic-${idx}-${Date.now()}`,
      subject: sub,
      description: desc,
      isCompleted: false,
      targetCount: target,
      type
    };
  });
}

// Demo data generator to populate the system for a test drive
export function loadDemoData(): void {
  const examDate = new Date();
  examDate.setDate(examDate.getDate() + 45); // 45 days remaining
  
  const demoConfig: ExamConfig = {
    examName: "SSC CGL (Tier I)",
    examDate: examDate.toISOString().substring(0, 10),
    totalMarks: 200,
    targetScore: 160,
    safeScore: 145,
    previousCutoff: 135,
    subjects: [
      { name: "Quantitative Aptitude", totalMarks: 50, targetMarks: 45 },
      { name: "General Intelligence & Reasoning", totalMarks: 50, targetMarks: 45 },
      { name: "English Comprehension", totalMarks: 50, targetMarks: 40 },
      { name: "General Awareness", totalMarks: 50, targetMarks: 30 }
    ]
  };

  const demoPractice: DailyPractice[] = [
    { id: "p1", date: "2026-06-09", subject: "Quantitative Aptitude", questionsAttempted: 50, correct: 44, wrong: 6, timeSpent: 60 },
    { id: "p2", date: "2026-06-09", subject: "General Intelligence & Reasoning", questionsAttempted: 30, correct: 28, wrong: 2, timeSpent: 30 },
    { id: "p3", date: "2026-06-08", subject: "English Comprehension", questionsAttempted: 40, correct: 32, wrong: 8, timeSpent: 35 },
    { id: "p4", date: "2026-06-07", subject: "General Awareness", questionsAttempted: 50, correct: 25, wrong: 25, timeSpent: 40 },
    { id: "p5", date: "2026-06-06", subject: "Quantitative Aptitude", questionsAttempted: 40, correct: 34, wrong: 6, timeSpent: 50 },
    { id: "p6", date: "2026-06-05", subject: "General Intelligence & Reasoning", questionsAttempted: 40, correct: 37, wrong: 3, timeSpent: 35 }
  ];

  const demoMocks: MockTest[] = [
    {
      id: "mt1",
      date: "2026-06-08",
      mockName: "All India Live Mock #4",
      subjectMarks: {
        "Quantitative Aptitude": 42,
        "General Intelligence & Reasoning": 46,
        "English Comprehension": 38,
        "General Awareness": 22
      },
      totalScore: 148
    },
    {
      id: "mt2",
      date: "2026-06-04",
      mockName: "Previous Year Paper 2024",
      subjectMarks: {
        "Quantitative Aptitude": 38,
        "General Intelligence & Reasoning": 44,
        "English Comprehension": 35,
        "General Awareness": 18
      },
      totalScore: 135
    },
    {
      id: "mt3",
      date: "2026-05-30",
      mockName: "Prep Scholar Mock #1",
      subjectMarks: {
        "Quantitative Aptitude": 32,
        "General Intelligence & Reasoning": 40,
        "English Comprehension": 30,
        "General Awareness": 15
      },
      totalScore: 117
    }
  ];

  const demoMistakes: Mistake[] = [
    { id: "ms1", date: "2026-06-09", subject: "Quantitative Aptitude", topic: "SI & CI Partnership", mistakeType: MistakeType.CalculationError, notes: "Messed up (1 + r/100)^t formula compounding math for half-yearly rate scaling." },
    { id: "ms2", date: "2026-06-08", subject: "Quantitative Aptitude", topic: "Geometry - Triangles Similarity", mistakeType: MistakeType.ConceptError, notes: "Remember that areas of similar triangles are in ratio of square of corresponding altitudes, not direct ratio!" },
    { id: "ms3", date: "2026-06-07", subject: "English Comprehension", topic: "Subject-Verb Agreement", mistakeType: MistakeType.SillyMistake, notes: "Selected plural verb for composite collective nouns such as 'each of the systems is...' instead of 'are'." },
    { id: "ms4", date: "2026-06-06", subject: "General Intelligence & Reasoning", topic: "Coding Decoding Matrix", mistakeType: MistakeType.TimeManagement, notes: "Spent 5 minutes on a single hard grid. Trigger rule: mark for review if puzzle stays unsolved in 90 seconds!" },
    { id: "ms5", date: "2026-06-05", subject: "General Awareness", topic: "Modern History - Viceroys", mistakeType: MistakeType.GuessingError, notes: "Attempted guess on Viceroy decrees during Quit India movement. Memorize exact timelines of Linlithgow and Wavell." }
  ];

  localStorage.setItem(KEYS.EXAM_CONFIG, JSON.stringify(demoConfig));
  localStorage.setItem(KEYS.DAILY_PRACTICES, JSON.stringify(demoPractice));
  localStorage.setItem(KEYS.MOCK_TESTS, JSON.stringify(demoMocks));
  localStorage.setItem(KEYS.MISTAKES, JSON.stringify(demoMistakes));
}

export function clearAllData(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}
