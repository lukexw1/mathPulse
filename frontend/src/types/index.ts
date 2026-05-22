/** Shared TypeScript types matching backend schemas. */

export interface Choice {
  label: string;
  text: string;
}

export interface SolutionStep {
  step: number;
  text: string;
  formula: string;
}

export interface Question {
  id: string;
  topic: string;
  subtopic: string;
  difficulty: number;
  question_type: "multiple_choice" | "grid_in";
  question_key: string;
  stem?: string;        // populated from i18n
  choices?: Choice[] | null;  // populated from i18n
  hint?: string | null;       // populated from i18n
}

export interface AnswerResult {
  is_correct: boolean;
  correct_answer: string;
  question_key: string;  // For i18n lookup of solution_steps
  solution_steps: SolutionStep[];  // Deprecated - use question_key + i18n
  xp_earned: number;
  new_total_xp: number;
  new_level: number;
  achievement_earned: string | null;
}

export interface TopicProgress {
  topic: string;
  solved: number;
  total_questions: number;
  accuracy: number;
}

export interface NextTheoryTopic {
  subtopic: string;
  title: string;
  estimated_minutes: number;
}

export interface DashboardData {
  xp: number;
  level: number;
  xp_to_next_level: number;
  streak_days: number;
  streak_record: number;
  review_due_count: number;
  topics: TopicProgress[];
  total_solved: number;
  next_unlearned_topic: NextTheoryTopic | null;
}

export interface UserProfile {
  id: number;
  username: string | null;
  first_name: string;
  goal: string | null;
  xp: number;
  level: number;
  streak_days: number;
  is_new: boolean;
  photo_url: string | null;
}

export interface ApiResponse<T = unknown> {
  data: T;
  error: string | null;
  message: string | null;
}

export interface SubtopicProgress {
  solved: number;
  total_questions: number;
  accuracy: number;
}

export interface ProfileData {
  id: number;
  first_name: string;
  username: string | null;
  xp: number;
  level: number;
  streak_days: number;
  total_solved: number;
  accuracy: number;
  achievements: Array<{ code: string; title: string; description: string }>;
  topics: Record<string, {
    solved: number;
    total_questions: number;
    accuracy: number;
    subtopics?: Record<string, SubtopicProgress>;
  }>;
}

/** Theory types */
export interface TheoryArticleItem {
  subtopic: string;
  title: string;
  estimated_minutes: number;
  completed: boolean;
  best_score: number | null;
}

export interface TheoryListResponse {
  articles: TheoryArticleItem[];
}

export interface TheoryProgress {
  subtopic: string;
  completed: boolean;
  quiz_score: number | null;
  quiz_attempts: number;
  best_score: number | null;
  completed_at: string | null;
  last_attempt_at: string | null;
}

export interface TheoryArticleResponse {
  subtopic: string;
  title: string;
  content_md: string;
  estimated_minutes: number;
  quiz_questions: string[];
  progress: TheoryProgress | null;
}

export interface QuizResult {
  question_id: string;
  correct: boolean;
  selected_index: number;
  correct_index: number;
}

export interface QuizSubmitResponse {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  results: QuizResult[];
  xp_earned: number;
  new_badges: Array<{
    badge: {
      id: string;
      code: string;
      title: string;
      description: string;
      icon: string | null;
      xp_reward: number;
    };
    earned_at: string;
  }>;
}
