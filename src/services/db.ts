import { 
  ClassLevel, Subject, Chapter, Topic, Question, Test, Attempt, AttemptAnswer,
  TestConfigInput, QuestionFilterParams, CSVImportQuestion, CSVValidationResult,
  TestQuestion, User
} from '../types';
import { 
  initialClasses, initialSubjects, initialChapters, initialTopics, 
  initialQuestions, samplePredefinedTests, sampleAttempts 
} from '../data/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// STORAGE KEYS FOR LOCAL MOCK DB
const STORAGE_KEYS = {
  CLASSES: 'horizon_cbt_classes',
  SUBJECTS: 'horizon_cbt_subjects',
  CHAPTERS: 'horizon_cbt_chapters',
  TOPICS: 'horizon_cbt_topics',
  QUESTIONS: 'horizon_cbt_questions',
  TESTS: 'horizon_cbt_tests',
  ATTEMPTS: 'horizon_cbt_attempts',
  ANSWERS: 'horizon_cbt_answers',
  STUDENTS: 'horizon_cbt_students',
};

// Helper to initialize local storage with seed data if empty
function initializeLocalStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.CLASSES)) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(initialClasses));
  } else {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CLASSES) || '[]') as ClassLevel[];
      const missing = initialClasses.filter(ic => !stored.some(sc => sc.id === ic.id));
      if (missing.length > 0) {
        const merged = [...stored, ...missing].sort((a, b) => a.display_order - b.display_order);
        localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(merged));
      }
    } catch (e) {
      console.error('Error syncing classes:', e);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(initialSubjects));
  } else {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]') as Subject[];
      const missing = initialSubjects.filter(is => !stored.some(ss => ss.id === is.id));
      if (missing.length > 0) {
        localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify([...stored, ...missing]));
      }
    } catch (e) {
      console.error('Error syncing subjects:', e);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.CHAPTERS)) {
    localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify(initialChapters));
  } else {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAPTERS) || '[]') as Chapter[];
      const missing = initialChapters.filter(newCh => !stored.some(sCh => sCh.id === newCh.id));
      if (missing.length > 0) {
        localStorage.setItem(STORAGE_KEYS.CHAPTERS, JSON.stringify([...stored, ...missing]));
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.TOPICS)) {
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(initialTopics));
  } else {
    try {
      const storedTops = JSON.parse(localStorage.getItem(STORAGE_KEYS.TOPICS) || '[]') as Topic[];
      const missing = initialTopics.filter(newTp => !storedTops.some(sTp => sTp.id === newTp.id));
      if (missing.length > 0) {
        localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify([...storedTops, ...missing]));
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Self-heal questions in localStorage: fix any cross-subject chapter mapping
  try {
    const rawQuestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]') as Question[];
    const allChapters = JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAPTERS) || '[]') as Chapter[];
    let modified = false;

    for (const q of rawQuestions) {
      if (!q.class_id) {
        q.class_id = 'c9';
        modified = true;
      }
      if (!q.subject_id) {
        q.subject_id = 's9_sci';
        modified = true;
      }
      // Check if question's chapter belongs to this subject
      const chap = allChapters.find(c => c.id === q.chapter_id);
      if (!chap || chap.subject_id !== q.subject_id) {
        const matchInSubject = allChapters.find(c => 
          c.subject_id === q.subject_id && 
          chap && (c.name.toLowerCase().trim() === chap.name.toLowerCase().trim() || c.chapter_number === chap.chapter_number)
        );
        if (matchInSubject) {
          q.chapter_id = matchInSubject.id;
          modified = true;
        }
      }

      if (q.id === 'q_1013' && !q.image_url) {
        q.image_url = 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80';
        q.question_text = 'Identify the cellular organelle represented in the diagram, known as the powerhouse of the cell:';
        modified = true;
      }
    }

    if (modified) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(rawQuestions));
    }
  } catch (e) {
    console.error('Question healing error:', e);
  }

  if (localStorage.getItem(STORAGE_KEYS.QUESTIONS) === null) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(initialQuestions));
  } else {
    try {
      const storedQs = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUESTIONS) || '[]') as Question[];
      const missingQs = initialQuestions.filter(nq => !storedQs.some(sq => sq.id === nq.id));
      if (missingQs.length > 0) {
        localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify([...storedQs, ...missingQs]));
      }
    } catch (e) {
      console.error('Error syncing questions:', e);
    }
  }

  if (!localStorage.getItem(STORAGE_KEYS.TESTS)) {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(samplePredefinedTests));
  } else {
    try {
      const storedTests = JSON.parse(localStorage.getItem(STORAGE_KEYS.TESTS) || '[]') as Test[];
      const missingTests = samplePredefinedTests.filter(nt => !storedTests.some(st => st.id === nt.id));
      if (missingTests.length > 0) {
        localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify([...storedTests, ...missingTests]));
      }
    } catch (e) {
      console.error('Error syncing tests:', e);
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.ATTEMPTS)) {
    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ANSWERS)) {
    localStorage.setItem(STORAGE_KEYS.ANSWERS, JSON.stringify([]));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  }
}

// Run storage init on import
initializeLocalStorage();

// LOCAL STORAGE HELPERS
function getLocal<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('LocalStorage read error:', e);
    return [];
  }
}

function setLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('LocalStorage write error:', e);
  }
}

// ==========================================
// STUDENT DIRECTORY SERVICES
// ==========================================
export async function getRegisteredStudents(): Promise<User[]> {
  const students = getLocal<User>(STORAGE_KEYS.STUDENTS);
  return students;
}

export async function saveRegisteredStudent(student: User): Promise<User> {
  const students = getLocal<User>(STORAGE_KEYS.STUDENTS);
  const existingIdx = students.findIndex(s => s.id === student.id || s.email === student.email);
  if (existingIdx >= 0) {
    students[existingIdx] = student;
  } else {
    students.unshift(student);
  }
  setLocal(STORAGE_KEYS.STUDENTS, students);
  return student;
}

// ==========================================
// CURRICULUM SERVICES
// ==========================================
export async function getClasses(): Promise<ClassLevel[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('classes').select('*').order('display_order');
    if (!error && data) return data;
  }
  const classes = getLocal<ClassLevel>(STORAGE_KEYS.CLASSES);
  return classes.sort((a, b) => a.display_order - b.display_order);
}

export async function getSubjects(classId?: string): Promise<Subject[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('subjects').select('*');
    if (classId) query = query.eq('class_id', classId);
    const { data, error } = await query;
    if (!error && data) return data;
  }
  const subjects = getLocal<Subject>(STORAGE_KEYS.SUBJECTS);
  if (classId) return subjects.filter(s => s.class_id === classId);
  return subjects;
}

export async function getChapters(subjectId?: string): Promise<Chapter[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('chapters').select('*').order('chapter_number');
    if (subjectId) query = query.eq('subject_id', subjectId);
    const { data, error } = await query;
    if (!error && data) return data;
  }
  const chapters = getLocal<Chapter>(STORAGE_KEYS.CHAPTERS);
  let filtered = chapters;
  if (subjectId) filtered = chapters.filter(c => c.subject_id === subjectId);
  return filtered.sort((a, b) => a.chapter_number - b.chapter_number);
}

export async function getTopics(chapterId?: string): Promise<Topic[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('topics').select('*');
    if (chapterId) query = query.eq('chapter_id', chapterId);
    const { data, error } = await query;
    if (!error && data) return data;
  }
  const topics = getLocal<Topic>(STORAGE_KEYS.TOPICS);
  if (chapterId) return topics.filter(t => t.chapter_id === chapterId);
  return topics;
}

// ==========================================
// QUESTION BANK SERVICES
// ==========================================
export async function getQuestions(params: QuestionFilterParams = {}): Promise<Question[]> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('questions').select('*');
    if (params.class_id) query = query.eq('class_id', params.class_id);
    if (params.subject_id) query = query.eq('subject_id', params.subject_id);
    if (params.chapter_id) query = query.eq('chapter_id', params.chapter_id);
    if (params.topic_id) query = query.eq('topic_id', params.topic_id);
    if (params.difficulty) query = query.eq('difficulty', params.difficulty);
    if (params.source_type) query = query.eq('source_type', params.source_type);
    if (params.exam_name) query = query.ilike('exam_name', `%${params.exam_name}%`);
    if (params.search_query) query = query.ilike('question_text', `%${params.search_query}%`);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error && data) return data;
  }

  let list = getLocal<Question>(STORAGE_KEYS.QUESTIONS);

  if (params.class_id) list = list.filter(q => q.class_id === params.class_id);
  if (params.subject_id) list = list.filter(q => q.subject_id === params.subject_id);
  if (params.chapter_id) list = list.filter(q => q.chapter_id === params.chapter_id);
  if (params.topic_id) list = list.filter(q => q.topic_id === params.topic_id);
  if (params.difficulty && params.difficulty !== 'mixed') {
    list = list.filter(q => q.difficulty === params.difficulty);
  }
  if (params.source_type) list = list.filter(q => q.source_type === params.source_type);
  if (params.search_query) {
    const qLower = params.search_query.toLowerCase();
    list = list.filter(q => 
      q.question_text.toLowerCase().includes(qLower) ||
      (q.exam_name && q.exam_name.toLowerCase().includes(qLower)) ||
      q.option_a.toLowerCase().includes(qLower) ||
      q.option_b.toLowerCase().includes(qLower)
    );
  }

  return list;
}

export async function getQuestionById(id: string): Promise<Question | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('questions').select('*').eq('id', id).single();
    if (!error && data) return data;
  }
  const questions = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
  return questions.find(q => q.id === id) || null;
}

export async function addQuestion(q: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
  const newQuestion: Question = {
    ...q,
    id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('questions').insert([newQuestion]).select().single();
    if (!error && data) return data;
  }

  const list = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
  list.unshift(newQuestion);
  setLocal(STORAGE_KEYS.QUESTIONS, list);
  return newQuestion;
}

export async function updateQuestion(id: string, updates: Partial<Question>): Promise<Question | null> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.from('questions').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (!error && data) return data;
  }

  const list = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
  const index = list.findIndex(q => q.id === id);
  if (index === -1) return null;

  const updated = { ...list[index], ...updates, updated_at: new Date().toISOString() };
  list[index] = updated;
  setLocal(STORAGE_KEYS.QUESTIONS, list);
  return updated;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (!error) return true;
  }

  const list = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
  const filtered = list.filter(q => q.id !== id);
  setLocal(STORAGE_KEYS.QUESTIONS, filtered);
  return true;
}

export async function clearAllQuestions(): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('questions').delete().neq('id', '');
    } catch (e) {
      console.error('Supabase clear questions error:', e);
    }
  }

  setLocal(STORAGE_KEYS.QUESTIONS, []);
  return true;
}

// ==========================================
// BULK CSV IMPORT VALIDATION & PROCESSING
// ==========================================

export function normalizeCSVRawRow(rawRow: any): CSVImportQuestion {
  if (!rawRow || typeof rawRow !== 'object') {
    return {
      class: '', subject: '', chapter: '', topic: '',
      question: '', option_a: '', option_b: '', option_c: '', option_d: '',
      correct_answer: '', difficulty: 'medium', source_type: 'practice', solution: ''
    };
  }

  const getField = (aliases: string[]): string => {
    for (const key of Object.keys(rawRow)) {
      const cleanKey = key.replace(/^\ufeff/, '').trim().toLowerCase().replace(/[\s\-_]+/g, '');
      for (const alias of aliases) {
        const cleanAlias = alias.toLowerCase().replace(/[\s\-_]+/g, '');
        if (cleanKey === cleanAlias) {
          const val = rawRow[key];
          if (val !== undefined && val !== null) {
            const strVal = String(val).trim();
            if (strVal) return strVal;
          }
        }
      }
    }
    return '';
  };

  return {
    class: getField(['class', 'grade', 'standard', 'std', 'class_name', 'class_level', 'level']),
    subject: getField(['subject', 'subject_name', 'sub', 'course']),
    chapter: getField(['chapter', 'chapter_name', 'chap', 'unit', 'lesson']),
    topic: getField(['topic', 'toppic', 'topic_name', 'subtopic', 'sub_topic', 'section']),
    difficulty: getField(['difficulty', 'level', 'diff']) || 'medium',
    source_type: getField(['source_type', 'source', 'type']) || 'practice',
    exam_name: getField(['exam_name', 'exam', 'board']) || undefined,
    exam_year: getField(['exam_year', 'year']) || undefined,
    question: getField(['question', 'question_text', 'question_prompt', 'prompt', 'q']),
    image_url: getField(['image_url', 'image', 'img', 'diagram', 'diagram_url', 'img_url', 'picture', 'photo']) || undefined,
    option_a: getField(['option_a', 'optiona', 'opt_a', 'opta', 'a', 'option_1', 'opt1', '1']),
    option_b: getField(['option_b', 'optionb', 'opt_b', 'optb', 'b', 'option_2', 'opt2', '2']),
    option_c: getField(['option_c', 'optionc', 'opt_c', 'optc', 'c', 'option_3', 'opt3', '3']),
    option_d: getField(['option_d', 'optiond', 'opt_d', 'optd', 'd', 'option_4', 'opt4', '4']),
    correct_answer: getField(['correct_answer', 'correct_ans', 'correct', 'answer', 'ans', 'key']),
    marks: Number(getField(['marks', 'mark', 'score'])) || 1,
    negative_marks: Number(getField(['negative_marks', 'neg_marks', 'negative', 'penalty'])) || 0.25,
    solution: getField(['solution', 'explanation', 'expl', 'solution_text', 'rationale']) || 'Solution not provided.',
  };
}

function cleanName(str: string): string {
  if (!str) return '';
  return str.replace(/^(\(\d+\)|\d+\)|\d+\.|\d+\:|\s*ch(apter)?\s*\d+[\:\.\-]?)/gi, '').trim();
}

function findClassFlexibly(className: string, classes: ClassLevel[]): ClassLevel {
  const raw = (className || '').trim().toLowerCase();
  
  // 1. Direct ID match (e.g. "c9", "jee", "neet", "cuet")
  const idMatch = classes.find(c => c.id.toLowerCase() === raw);
  if (idMatch) return idMatch;

  // 2. Exact name match (e.g. "Class 9", "JEE Mains", "NEET", "CUET")
  const exact = classes.find(c => c.name.toLowerCase() === raw);
  if (exact) return exact;

  // 3. Competitive Exams matching
  if (raw.includes('jee') || raw.includes('mains') || raw.includes('iit') || raw.includes('engineering')) {
    const jee = classes.find(c => c.id === 'jee' || c.name.toLowerCase().includes('jee'));
    if (jee) return jee;
  }
  if (raw.includes('neet') || raw.includes('medical') || raw.includes('aipmt')) {
    const neet = classes.find(c => c.id === 'neet' || c.name.toLowerCase().includes('neet'));
    if (neet) return neet;
  }
  if (raw.includes('cuet')) {
    const cuet = classes.find(c => c.id === 'cuet' || c.name.toLowerCase().includes('cuet'));
    if (cuet) return cuet;
  }

  // 4. Number extraction
  const numMatch = raw.match(/\b(5|6|7|8|9|10|11|12)\b/) || raw.match(/\d+/);
  if (numMatch) {
    const num = numMatch[1] || numMatch[0];
    const found = classes.find(c => c.id === `c${num}` || c.name.toLowerCase().includes(num));
    if (found) return found;
  }

  // 5. Roman numeral extraction
  if (/\b(xii|12)\b/i.test(raw)) return classes.find(c => c.id === 'c12') || classes[0];
  if (/\b(xi|11)\b/i.test(raw)) return classes.find(c => c.id === 'c11') || classes[0];
  if (/\b(x|10)\b/i.test(raw)) return classes.find(c => c.id === 'c10') || classes[0];
  if (/\b(ix|9)\b/i.test(raw)) return classes.find(c => c.id === 'c9') || classes[0];
  if (/\b(viii|8)\b/i.test(raw)) return classes.find(c => c.id === 'c8') || classes[0];
  if (/\b(vii|7)\b/i.test(raw)) return classes.find(c => c.id === 'c7') || classes[0];
  if (/\b(vi|6)\b/i.test(raw)) return classes.find(c => c.id === 'c6') || classes[0];
  if (/\b(v|5)\b/i.test(raw)) return classes.find(c => c.id === 'c5') || classes[0];

  return classes.find(c => c.id === 'c9') || classes[0];
}

function findOrCreateSubject(subjectName: string, classId: string, allSubjects: Subject[]): Subject {
  const rawName = (subjectName || '').trim();
  const rawLower = rawName.toLowerCase();
  const classSubjects = allSubjects.filter(s => s.class_id === classId);

  // 1. Exact match (case insensitive)
  let found = classSubjects.find(s => s.name.toLowerCase() === rawLower);
  if (found) return found;

  // 2. Keyword matching for common curriculum terms (Physics, Chemistry, Maths, Biology, Science)
  if (rawLower.includes('phys')) {
    found = classSubjects.find(s => s.name.toLowerCase().includes('phys'));
    if (found) return found;
  }

  if (rawLower.includes('chem')) {
    found = classSubjects.find(s => s.name.toLowerCase().includes('chem'));
    if (found) return found;
  }

  if (rawLower.includes('bio')) {
    found = classSubjects.find(s => s.name.toLowerCase().includes('bio'));
    if (found) return found;
  }

  if (rawLower.includes('math')) {
    found = classSubjects.find(s => s.name.toLowerCase().includes('math'));
    if (found) return found;
  }

  if (rawLower.includes('sci')) {
    found = classSubjects.find(s => s.name.toLowerCase().includes('science'));
    if (found) return found;
  }

  // 3. Substring match
  if (rawLower) {
    found = classSubjects.find(s => s.name.toLowerCase().includes(rawLower) || rawLower.includes(s.name.toLowerCase()));
    if (found) return found;
  }

  // Default to Science for Class 9/10 if subject name wasn't specified
  if (classId === 'c9' || classId === 'c10') {
    const sciDefault = classSubjects.find(s => s.name.toLowerCase().includes('science'));
    if (sciDefault) return sciDefault;
  }

  // If no subject name was provided and class has subjects, use first
  if (!rawName && classSubjects.length > 0) {
    return classSubjects[0];
  }

  // 4. DYNAMICALLY CREATE SUBJECT if it doesn't exist for this class!
  const newSubject: Subject = {
    id: `s_${classId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name: rawName || 'General',
    class_id: classId,
    created_at: new Date().toISOString()
  };

  allSubjects.push(newSubject);
  const currentLocal = getLocal<Subject>(STORAGE_KEYS.SUBJECTS);
  setLocal(STORAGE_KEYS.SUBJECTS, [...currentLocal, newSubject]);

  return newSubject;
}

function findOrCreateChapter(chapterName: string, subjectId: string, allChapters: Chapter[]): Chapter {
  const rawName = (chapterName || '').trim();
  const rawClean = cleanName(rawName);
  const rawLower = rawClean.toLowerCase().replace(/[^a-z0-9]/g, '');

  const existingSubjectChapters = allChapters.filter(c => c.subject_id === subjectId);
  
  // 1. Exact or cleaned match in this subject
  let found = existingSubjectChapters.find(c => {
    const cClean = cleanName(c.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    return cClean === rawLower || c.name.toLowerCase().trim() === rawName.toLowerCase();
  });

  // 2. Fuzzy / keyword match in this subject
  if (!found && rawLower.length >= 3) {
    found = existingSubjectChapters.find(c => {
      const cClean = cleanName(c.name).toLowerCase().replace(/[^a-z0-9]/g, '');
      return cClean.includes(rawLower) || rawLower.includes(cClean);
    });
  }

  if (found) return found;

  // 3. If raw name matches a chapter in another subject, borrow its clean name
  const matchedAnywhere = allChapters.find(c => {
    const cClean = cleanName(c.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    return cClean === rawLower;
  });

  // 4. CREATE CHAPTER DYNAMICALLY for THIS subjectId
  const newChapterNumber = existingSubjectChapters.length + 1;
  const newChapter: Chapter = {
    id: `ch_${subjectId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    subject_id: subjectId,
    name: rawClean || (matchedAnywhere ? cleanName(matchedAnywhere.name) : rawName) || `Chapter ${newChapterNumber}`,
    chapter_number: newChapterNumber,
    created_at: new Date().toISOString()
  };

  allChapters.push(newChapter);
  const currentLocal = getLocal<Chapter>(STORAGE_KEYS.CHAPTERS);
  setLocal(STORAGE_KEYS.CHAPTERS, [...currentLocal, newChapter]);

  return newChapter;
}

function findOrCreateTopic(topicName: string, chapterId: string, allTopics: Topic[]): Topic {
  const rawName = (topicName || '').trim();
  const rawClean = cleanName(rawName);
  const rawLower = rawClean.toLowerCase().replace(/[^a-z0-9]/g, '');

  const existingChapterTopics = allTopics.filter(t => t.chapter_id === chapterId);
  
  // 1. Exact or cleaned match in this chapter
  let found = existingChapterTopics.find(t => {
    const tClean = cleanName(t.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    return tClean === rawLower || t.name.toLowerCase().trim() === rawName.toLowerCase();
  });

  if (found) return found;

  // 2. Fuzzy match in this chapter
  if (!found && rawLower.length >= 3) {
    found = existingChapterTopics.find(t => {
      const tClean = cleanName(t.name).toLowerCase().replace(/[^a-z0-9]/g, '');
      return tClean.includes(rawLower) || rawLower.includes(tClean);
    });
  }

  if (found) return found;

  // 3. CREATE TOPIC DYNAMICALLY with the EXACT topic name from CSV
  const newTopic: Topic = {
    id: `tp_${chapterId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    chapter_id: chapterId,
    name: rawClean || rawName || 'General Topic',
    created_at: new Date().toISOString()
  };

  allTopics.push(newTopic);
  const currentLocal = getLocal<Topic>(STORAGE_KEYS.TOPICS);
  setLocal(STORAGE_KEYS.TOPICS, [...currentLocal, newTopic]);

  return newTopic;
}

export async function validateCSVRows(csvRows: (CSVImportQuestion | any)[]): Promise<CSVValidationResult> {
  const validRows: CSVImportQuestion[] = [];
  const invalidRows: { rowNumber: number; rowData: any; errors: string[] }[] = [];

  csvRows.forEach((item, index) => {
    const row = normalizeCSVRawRow(item);
    const errors: string[] = [];
    if (!row.class) errors.push('Class is required');
    if (!row.subject) errors.push('Subject is required');
    if (!row.chapter) errors.push('Chapter is required');
    if (!row.topic) errors.push('Topic is required');
    if (!row.question) errors.push('Question text is required');
    if (!row.option_a || !row.option_b || !row.option_c || !row.option_d) {
      errors.push('All four options (A, B, C, D) must be present');
    }
    const cleanAns = row.correct_answer?.trim().toUpperCase();
    if (!['A', 'B', 'C', 'D', 'TRUE', 'FALSE'].includes(cleanAns)) {
      errors.push('Correct answer must be A, B, C, D, True, or False');
    }

    if (errors.length > 0) {
      invalidRows.push({ rowNumber: index + 1, rowData: item, errors });
    } else {
      validRows.push(row);
    }
  });

  return {
    validRows,
    invalidRows,
    totalParsed: csvRows.length
  };
}

export async function importCSVRows(validRows: (CSVImportQuestion | any)[]): Promise<{ importedCount: number }> {
  const classes = await getClasses();
  const subjects = await getSubjects();
  const chapters = await getChapters();
  const topics = await getTopics();

  let importedCount = 0;
  if (validRows.length > 0) {
    for (const rawItem of validRows) {
      const raw = normalizeCSVRawRow(rawItem);

      const classObj = findClassFlexibly(raw.class, classes);
      const subjectObj = findOrCreateSubject(raw.subject, classObj.id, subjects);
      const chapterObj = findOrCreateChapter(raw.chapter, subjectObj.id, chapters);
      const topicObj = findOrCreateTopic(raw.topic, chapterObj.id, topics);

      await addQuestion({
        question_text: raw.question,
        question_type: raw.correct_answer === 'True' || raw.correct_answer === 'False' ? 'true_false' : 'mcq',
        class_id: classObj.id,
        subject_id: subjectObj.id,
        chapter_id: chapterObj.id,
        topic_id: topicObj.id,
        difficulty: (raw.difficulty?.toLowerCase() as any) || 'medium',
        source_type: (raw.source_type?.toLowerCase() as any) || 'practice',
        exam_name: raw.exam_name || null,
        exam_year: raw.exam_year ? Number(raw.exam_year) : null,
        option_a: raw.option_a,
        option_b: raw.option_b,
        option_c: raw.option_c,
        option_d: raw.option_d,
        correct_answer: raw.correct_answer.trim(),
        solution: raw.solution || 'Solution not provided.',
        marks: raw.marks ? Number(raw.marks) : 1,
        negative_marks: raw.negative_marks ? Number(raw.negative_marks) : 0.25,
        image_url: raw.image_url ? raw.image_url.trim() : null,
      });
      importedCount++;
    }
  }

  return { importedCount };
}

export async function validateAndImportCSV(csvRows: CSVImportQuestion[]): Promise<CSVValidationResult & { importedCount: number }> {
  const valResult = await validateCSVRows(csvRows);
  const impResult = await importCSVRows(valResult.validRows);
  return {
    ...valResult,
    importedCount: impResult.importedCount
  };
}

// ==========================================
// TEST GENERATION ENGINE & TEST MANAGEMENT
// ==========================================
export async function generateTest(config: TestConfigInput, customTitle?: string): Promise<{ test: Test; questions: Question[]; error?: string }> {
  const isAllChapters = !config.chapter_id || config.chapter_id === 'all' || config.test_type === 'full_syllabus' || config.test_type === 'custom';
  const matchingQuestions = await getQuestions({
    class_id: config.class_id,
    subject_id: config.subject_id,
    chapter_id: isAllChapters ? undefined : config.chapter_id,
    topic_id: isAllChapters || !config.topic_id || config.topic_id === 'all' ? undefined : config.topic_id,
    difficulty: config.difficulty !== 'mixed' ? config.difficulty : undefined,
  });

  const availableCount = matchingQuestions.length;
  let selectedQuestions: Question[] = [];

  if (availableCount < config.number_of_questions) {
    if (availableCount === 0) {
      return {
        test: null as any,
        questions: [],
        error: 'No questions are available for the selected filters. Please select "All Chapters" or set difficulty to Mixed.'
      };
    }
    selectedQuestions = [...matchingQuestions];
  } else {
    const shuffled = [...matchingQuestions].sort(() => Math.random() - 0.5);
    selectedQuestions = shuffled.slice(0, config.number_of_questions);
  }

  const subjects = await getSubjects();
  const subjectName = subjects.find(s => s.id === config.subject_id)?.name || 'Subject';

  const newTest: Test = {
    id: `test_${Date.now()}`,
    title: customTitle || `${subjectName} ${config.test_type.toUpperCase()} Test (${selectedQuestions.length} Questions)`,
    class_id: config.class_id,
    subject_id: config.subject_id,
    chapter_id: isAllChapters ? null : (config.chapter_id || null),
    topic_id: isAllChapters ? null : (config.topic_id || null),
    difficulty: config.difficulty || 'mixed',
    test_type: config.test_type,
    number_of_questions: selectedQuestions.length,
    duration_minutes: config.duration_minutes,
    total_marks: selectedQuestions.reduce((acc, q) => acc + q.marks, 0),
    created_at: new Date().toISOString()
  };

  const tests = getLocal<Test>(STORAGE_KEYS.TESTS);
  tests.unshift(newTest);
  setLocal(STORAGE_KEYS.TESTS, tests);

  return {
    test: newTest,
    questions: selectedQuestions
  };
}

export async function getTestById(id: string): Promise<Test | null> {
  const tests = getLocal<Test>(STORAGE_KEYS.TESTS);
  return tests.find(t => t.id === id) || null;
}

// ==========================================
// ATTEMPTS & EVALUATION ENGINE
// ==========================================
export async function createAttempt(testId: string, studentId: string, studentName?: string, studentEmail?: string): Promise<Attempt> {
  const test = await getTestById(testId);

  let sName = studentName;
  let sEmail = studentEmail;

  if (!sName || !sEmail) {
    const students = getLocal<User>(STORAGE_KEYS.STUDENTS);
    const found = students.find(s => s.id === studentId);
    if (found) {
      sName = sName || found.name;
      sEmail = sEmail || found.email;
    }
  }

  const newAttempt: Attempt = {
    id: `att_${Date.now()}`,
    test_id: testId,
    student_id: studentId,
    student_name: sName || 'Alex Sharma',
    student_email: sEmail || 'alex.student@horizoncbt.edu',
    started_at: new Date().toISOString(),
    score: 0,
    total_marks: test ? test.total_marks : 0,
    correct_count: 0,
    wrong_count: 0,
    unattempted_count: test ? test.number_of_questions : 0,
    accuracy: 0,
    time_taken_seconds: 0,
    status: 'in_progress',
    test: test || undefined
  };

  const attempts = getLocal<Attempt>(STORAGE_KEYS.ATTEMPTS);
  attempts.unshift(newAttempt);
  setLocal(STORAGE_KEYS.ATTEMPTS, attempts);

  return newAttempt;
}

export async function submitAttempt(
  attemptId: string, 
  userAnswers: Record<string, { selectedAnswer: string | null; markedForReview: boolean; timeSpentSeconds: number }>,
  testQuestions: Question[]
): Promise<{ attempt: Attempt; answers: AttemptAnswer[] }> {
  const attempts = getLocal<Attempt>(STORAGE_KEYS.ATTEMPTS);
  const attemptIndex = attempts.findIndex(a => a.id === attemptId);
  if (attemptIndex === -1) throw new Error('Attempt not found');

  const attempt = attempts[attemptIndex];
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let totalMarks = 0;
  let totalTimeSpent = 0;

  const attemptAnswersList: AttemptAnswer[] = [];

  testQuestions.forEach(q => {
    totalMarks += q.marks;
    const userAns = userAnswers[q.id];
    const selected = userAns ? userAns.selectedAnswer : null;
    const timeSpent = userAns ? userAns.timeSpentSeconds : 0;
    const marked = userAns ? userAns.markedForReview : false;
    totalTimeSpent += timeSpent;

    let isCorrect = false;

    if (!selected) {
      unattemptedCount++;
    } else {
      if (selected.trim().toUpperCase() === q.correct_answer.trim().toUpperCase()) {
        isCorrect = true;
        correctCount++;
        score += q.marks;
      } else {
        wrongCount++;
        score -= q.negative_marks;
      }
    }

    attemptAnswersList.push({
      id: `ans_${q.id}_${Date.now()}`,
      attempt_id: attemptId,
      question_id: q.id,
      selected_answer: selected,
      is_correct: isCorrect,
      time_spent_seconds: timeSpent,
      marked_for_review: marked,
      answered_at: new Date().toISOString(),
      question: q
    });
  });

  const attemptedTotal = correctCount + wrongCount;
  const accuracy = attemptedTotal > 0 ? Math.round((correctCount / attemptedTotal) * 100) : 0;
  const finalScore = Math.max(0, parseFloat(score.toFixed(2)));

  const updatedAttempt: Attempt = {
    ...attempt,
    submitted_at: new Date().toISOString(),
    score: finalScore,
    total_marks: totalMarks,
    correct_count: correctCount,
    wrong_count: wrongCount,
    unattempted_count: unattemptedCount,
    accuracy,
    time_taken_seconds: totalTimeSpent,
    status: 'completed'
  };

  attempts[attemptIndex] = updatedAttempt;
  setLocal(STORAGE_KEYS.ATTEMPTS, attempts);

  const existingAnswers = getLocal<AttemptAnswer>(STORAGE_KEYS.ANSWERS);
  const filteredExisting = existingAnswers.filter(a => a.attempt_id !== attemptId);
  setLocal(STORAGE_KEYS.ANSWERS, [...filteredExisting, ...attemptAnswersList]);

  return {
    attempt: updatedAttempt,
    answers: attemptAnswersList
  };
}

export async function getAttemptDetails(attemptId: string): Promise<{ attempt: Attempt; answers: AttemptAnswer[] } | null> {
  const attempts = getLocal<Attempt>(STORAGE_KEYS.ATTEMPTS);
  const attempt = attempts.find(a => a.id === attemptId);
  if (!attempt) return null;

  const test = await getTestById(attempt.test_id);
  if (test) attempt.test = test;

  const allAnswers = getLocal<AttemptAnswer>(STORAGE_KEYS.ANSWERS);
  let attemptAnswers = allAnswers.filter(a => a.attempt_id === attemptId);

  const questions = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
  attemptAnswers = attemptAnswers.map(ans => ({
    ...ans,
    question: questions.find(q => q.id === ans.question_id) || ans.question
  }));

  return { attempt, answers: attemptAnswers };
}

export async function getStudentAttempts(studentId: string, studentEmail?: string): Promise<Attempt[]> {
  const attempts = getLocal<Attempt>(STORAGE_KEYS.ATTEMPTS);
  const studentAttempts = attempts.filter(a => a.student_id === studentId || (studentEmail && a.student_email === studentEmail));
  
  const tests = getLocal<Test>(STORAGE_KEYS.TESTS);
  return studentAttempts.map(a => ({
    ...a,
    test: tests.find(t => t.id === a.test_id) || a.test
  }));
}

export async function getAllAttempts(): Promise<Attempt[]> {
  const attempts = getLocal<Attempt>(STORAGE_KEYS.ATTEMPTS);
  const tests = getLocal<Test>(STORAGE_KEYS.TESTS);
  const students = getLocal<User>(STORAGE_KEYS.STUDENTS);

  return attempts.map(a => {
    const foundStudent = students.find(s => s.id === a.student_id);
    return {
      ...a,
      student_name: a.student_name || foundStudent?.name || 'Alex Sharma',
      student_email: a.student_email || foundStudent?.email || 'alex.student@horizoncbt.edu',
      test: tests.find(t => t.id === a.test_id) || a.test
    };
  });
}

