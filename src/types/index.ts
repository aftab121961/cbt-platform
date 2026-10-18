export type UserRole = 'student' | 'admin' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  class_id?: string | null;
  created_at: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  display_order: number;
  created_at?: string;
}

export interface Subject {
  id: string;
  name: string;
  class_id: string;
  created_at?: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  name: string;
  chapter_number: number;
  created_at?: string;
}

export interface Topic {
  id: string;
  chapter_id: string;
  name: string;
  created_at?: string;
}

export type QuestionType = 'mcq' | 'true_false';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';
export type SourceType = 'practice' | 'pyq';

export interface Question {
  id: string;
  question_text: string;
  question_type: QuestionType;
  class_id: string;
  subject_id: string;
  chapter_id: string;
  topic_id: string;
  difficulty: QuestionDifficulty;
  source_type: SourceType;
  exam_name?: string | null;
  exam_year?: number | null;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string; // 'A' | 'B' | 'C' | 'D' | 'True' | 'False'
  solution: string;
  marks: number;
  negative_marks: number;
  image_url?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at?: string;
}

export type TestType = 'chapter' | 'topic' | 'custom' | 'pyq' | 'full_syllabus';
export type DifficultyFilter = 'easy' | 'medium' | 'hard' | 'mixed';

export interface Test {
  id: string;
  title: string;
  class_id: string;
  subject_id: string;
  chapter_id?: string | null;
  topic_id?: string | null;
  difficulty?: DifficultyFilter | null;
  test_type: TestType;
  number_of_questions: number;
  duration_minutes: number;
  total_marks: number;
  created_by?: string | null;
  created_at: string;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  question_id: string;
  question_order: number;
  marks: number;
  negative_marks: number;
  question?: Question;
}

export interface Attempt {
  id: string;
  test_id: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  started_at: string;
  submitted_at?: string | null;
  score: number;
  total_marks: number;
  correct_count: number;
  wrong_count: number;
  unattempted_count: number;
  accuracy: number; // 0 - 100 percentage
  time_taken_seconds: number;
  status: 'in_progress' | 'completed';
  test?: Test;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean;
  time_spent_seconds: number;
  marked_for_review: boolean;
  answered_at?: string | null;
  question?: Question;
}

export interface TestConfigInput {
  class_id: string;
  subject_id: string;
  chapter_id?: string;
  topic_id?: string;
  difficulty?: DifficultyFilter;
  test_type: TestType;
  number_of_questions: number;
  duration_minutes: number;
}

export interface QuestionFilterParams {
  class_id?: string;
  subject_id?: string;
  chapter_id?: string;
  topic_id?: string;
  difficulty?: string;
  source_type?: string;
  exam_name?: string;
  search_query?: string;
}

export interface CSVImportQuestion {
  class: string;
  subject: string;
  chapter: string;
  topic: string;
  difficulty: string;
  source_type: string;
  exam_name?: string;
  exam_year?: string | number;
  question: string;
  image_url?: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  marks?: number;
  negative_marks?: number;
  solution: string;
}

export interface CSVValidationResult {
  validRows: CSVImportQuestion[];
  invalidRows: { rowNumber: number; rowData: any; errors: string[] }[];
  totalParsed: number;
}
