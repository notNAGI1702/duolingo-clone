/** Typed wrapper around the FastAPI backend. All data flows through here. */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      detail = (await res.json()).detail ?? detail;
    } catch {}
    throw new ApiError(res.status, detail);
  }
  return res.json();
}

const get = <T>(path: string) => request<T>(path);
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: "PATCH", body: JSON.stringify(body) });

// ---------------------------------------------------------------- types

export interface Course {
  id: number;
  title: string;
  language_code: string;
  from_language: string;
  flag_emoji: string;
}

export interface Me {
  id: number;
  username: string;
  display_name: string;
  avatar_emoji: string;
  total_xp: number;
  gems: number;
  hearts: number;
  max_hearts: number;
  seconds_to_next_heart: number | null;
  streak: number;
  streak_active_today: boolean;
  daily_goal: number;
  daily_xp: number;
  today: string;
  course: Course | null;
}

export type SkillStatus = "locked" | "available" | "active" | "complete" | "legendary";

export interface LessonMeta {
  id: number;
  position: number;
  title: string;
  xp_reward: number;
  exercise_count: number;
  completed: boolean;
}

export interface SkillNode {
  id: number;
  position: number;
  title: string;
  icon: string;
  kind: string;
  crowns: number;
  max_crowns: number;
  lessons_done: number;
  total_lessons: number;
  status: SkillStatus;
  next_lesson_id: number | null;
  lessons: LessonMeta[];
}

export interface Unit {
  id: number;
  position: number;
  title: string;
  description: string;
  color: string;
  unlocked: boolean;
  skills: SkillNode[];
}

export interface Path {
  course: Course;
  units: Unit[];
  active_skill_id: number | null;
}

export interface Exercise {
  id: number;
  position: number;
  kind: "multiple_choice" | "translate" | "match_pairs" | "fill_blank" | "type_answer";
  prompt: string;
  payload: {
    options?: { id: number; text: string; emoji?: string }[] | string[];
    source?: string;
    bank?: string[];
    pairs?: { a: string; b: string }[];
    before?: string;
    after?: string;
    hint?: string;
  };
  audio_text: string | null;
}

export interface LessonSession {
  session_id: number;
  mode: "lesson" | "practice";
  lesson_id: number;
  lesson_title: string;
  skill_title: string;
  hearts: number;
  max_hearts: number;
  exercises: Exercise[];
}

export interface AnswerResult {
  correct: boolean;
  note: string | null;
  solution: string;
  hearts: number;
  out_of_hearts: boolean;
}

export interface CompleteResult {
  state: string;
  xp_earned: number;
  total_xp: number;
  streak: number;
  streak_extended: boolean;
  daily_xp: number;
  daily_goal: number;
  daily_goal_reached: boolean;
  accuracy: number;
  duration_seconds: number;
  hearts: number;
  gems: number;
  crown_earned: boolean;
  crowns: number;
  skill_title: string;
  new_achievements: { code: string; title: string; tier: number; icon: string }[];
}

export interface LeaderboardRow {
  rank: number;
  user_id: number;
  display_name: string;
  avatar_emoji: string;
  xp: number;
  is_me: boolean;
}

export interface Leaderboard {
  league: string;
  week_start: string;
  rows: LeaderboardRow[];
}

export interface AchievementInfo {
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: number;
  max_tier: number;
  value: number;
  next_threshold: number;
  progress: number;
}

export interface Profile {
  user: Me;
  joined: string;
  lessons_completed: number;
  crowns: number;
  words_learned: number;
  perfect_lessons: number;
  achievements: AchievementInfo[];
  following: number;
  followers: number;
}

export interface Quest {
  code: string;
  title: string;
  icon: string;
  value: number;
  target: number;
  reward_gems: number;
  done: boolean;
}

// ---------------------------------------------------------------- calls

export const api = {
  me: () => get<Me>("/api/me"),
  setGoal: (daily_goal: number) => patch<Me>("/api/me/goal", { daily_goal }),
  path: () => get<Path>("/api/path"),
  skill: (id: number) => get<SkillNode>(`/api/skills/${id}`),
  startLesson: (lessonId: number) => post<LessonSession>(`/api/lessons/${lessonId}/start`),
  startPractice: () => post<LessonSession>("/api/practice/start"),
  answer: (sessionId: number, exerciseId: number, answer: Record<string, unknown>) =>
    post<AnswerResult>(`/api/sessions/${sessionId}/answer`, {
      exercise_id: exerciseId,
      answer,
    }),
  complete: (sessionId: number) => post<CompleteResult>(`/api/sessions/${sessionId}/complete`),
  quit: (sessionId: number) => post<{ state: string }>(`/api/sessions/${sessionId}/quit`),
  leaderboard: () => get<Leaderboard>("/api/leaderboard"),
  profile: () => get<Profile>("/api/profile"),
  quests: () => get<Quest[]>("/api/quests"),
  refillHearts: () => post<Me>("/api/hearts/refill", { method: "gems" }),
  advanceDay: (days = 1) => post<Me>("/api/dev/advance-day", { days }),
  resetProgress: () => post<Me>("/api/dev/reset-progress"),
};
