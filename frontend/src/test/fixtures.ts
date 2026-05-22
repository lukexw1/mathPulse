/** Test fixtures — reusable mock data for tests. */

import type { AnswerResult, DashboardData, Question, TopicProgress, UserProfile } from "../types";

export const mockUserProfile: UserProfile = {
  id: 123456,
  username: "testuser",
  first_name: "Test",
  goal: "sat",
  xp: 250,
  level: 1,
  streak_days: 3,
  is_new: false,
  photo_url: null,
};

export const mockNewUserProfile: UserProfile = {
  ...mockUserProfile,
  is_new: true,
  xp: 0,
  level: 1,
  streak_days: 0,
  goal: null,
};

export const mockQuestion: Question = {
  id: "q-001",
  topic: "algebra",
  subtopic: "linear_equations",
  difficulty: 2,
  question_type: "multiple_choice",
  question_key: "al_1m_1",
  stem: "If $2x + 5 = 13$, what is the value of $x$?",
  choices: [
    { label: "A", text: "3" },
    { label: "B", text: "4" },
    { label: "C", text: "5" },
    { label: "D", text: "6" },
  ],
  hint: "Try isolating x by first removing the constant on the left side.",
};

export const mockGridInQuestion: Question = {
  id: "q-002",
  topic: "algebra",
  subtopic: "quadratic_equations",
  difficulty: 4,
  question_type: "grid_in",
  question_key: "al_1g_2",
  stem: "What is the positive solution of $x^2 - 5x + 6 = 0$?",
  choices: null,
  hint: "Try factoring.",
};

export const mockCorrectResult: AnswerResult = {
  is_correct: true,
  correct_answer: "B",
  question_key: "al1m_10",
  solution_steps: [
    { step: 1, text: "Subtract 5 from both sides", formula: "2x + 5 - 5 = 13 - 5" },
    { step: 2, text: "Simplify", formula: "2x = 8" },
    { step: 3, text: "Divide both sides by 2", formula: "x = 4" },
  ],
  xp_earned: 10,
  new_total_xp: 110,
  new_level: 2,
  achievement_earned: null,
};

export const mockIncorrectResult: AnswerResult = {
  is_correct: false,
  correct_answer: "B",
  question_key: "al1m_11",
  solution_steps: [
    { step: 1, text: "Subtract 5 from both sides", formula: "2x = 8" },
    { step: 2, text: "Divide both sides by 2", formula: "x = 4" },
  ],
  xp_earned: 0,
  new_total_xp: 100,
  new_level: 2,
  achievement_earned: null,
};

export const mockResultWithAchievement: AnswerResult = {
  ...mockCorrectResult,
  achievement_earned: "first_correct",
};

export const mockTopicProgress: TopicProgress[] = [
  { topic: "algebra", solved: 8, total_questions: 40, accuracy: 0.2 },
  { topic: "geometry", solved: 5, total_questions: 40, accuracy: 0.125 },
  { topic: "statistics", solved: 2, total_questions: 35, accuracy: 0.057 },
  { topic: "advanced_math", solved: 1, total_questions: 35, accuracy: 0.029 },
];

export const mockDashboardData: DashboardData = {
  xp: 250,
  level: 1,
  xp_to_next_level: 250,
  streak_days: 3,
  streak_record: 7,
  review_due_count: 5,
  topics: mockTopicProgress,
  total_solved: 40,
  next_unlearned_topic: {
    subtopic: "linear_equations",
    title: "Линейные уравнения",
    estimated_minutes: 8,
  },
};

export const mockOnboardingQuestions: Question[] = [
  { ...mockQuestion, id: "onb-1", difficulty: 1 },
  { ...mockQuestion, id: "onb-2", difficulty: 2 },
  { ...mockQuestion, id: "onb-3", difficulty: 3 },
  { ...mockQuestion, id: "onb-4", difficulty: 4 },
  { ...mockQuestion, id: "onb-5", difficulty: 5 },
];
