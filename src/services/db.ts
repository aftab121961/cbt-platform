import { 
  ClassLevel, Subject, Chapter, Topic, Question, Test, Attempt, AttemptAnswer,
  TestConfigInput, QuestionFilterParams, CSVImportQuestion, CSVValidationResult,
  TestQuestion, User
} from '../types';
import { 
  initialClasses, initialSubjects, initialChapters, initialTopics, 
  initialQuestions, samplePredefinedTests 
} from '../data/seedData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// STORAGE KEYS FOR LOCAL CACHE & OFFLINE RESILIENCE
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

// Helper to initialize local storage cache with seed data if empty
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
      console.error('Error syncing classes cache:', e);
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
      console.error('Error syncing subjects cache:', e);
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

  if (localStorage.getItem(STORAGE_KEYS.QUESTIONS) === null) {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(initialQuestions));
  }

  if (!localStorage.getItem(STORAGE_KEYS.TESTS)) {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(samplePredefinedTests));
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
// STUDENT DIRECTORY SERVICES (SUPABASE CLOUD SYNC)
// ==========================================

export async function getRegisteredStudents(): Promise<User[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // Auto-migrate: check if this device has any local students not yet in cloud
      const localStudents = getLocal<User>(STORAGE_KEYS.STUDENTS);
      if (localStudents && localStudents.length > 0) {
        const payload = localStudents.map(s => ({
          id: s.id,
          name: s.name.trim(),
          email: s.email.trim().toLowerCase(),
          role: 'student',
          class_id: s.class_id || null,
          password: s.password?.trim() || null,
          created_at: s.created_at || new Date().toISOString()
        }));
        await supabase.from('users').upsert(payload, { onConflict: 'email' });
      }

      // Fetch the single source of truth from Supabase Cloud
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLocal(STORAGE_KEYS.STUDENTS, data);
        return data;
      }
      if (error) {
        console.warn('Supabase getRegisteredStudents error:', error.message);
      }
    } catch (e) {
      console.warn('Supabase getRegisteredStudents network error:', e);
    }
  }
  return getLocal<User>(STORAGE_KEYS.STUDENTS);
}

export async function findStudentByEmail(email: string): Promise<User | null> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return null;

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase findStudentByEmail error:', e);
    }
  }

  const localStudents = getLocal<User>(STORAGE_KEYS.STUDENTS);
  return localStudents.find(s => s.email.trim().toLowerCase() === cleanEmail) || null;
}

export async function saveRegisteredStudent(student: User): Promise<User> {
  const cleanEmail = student.email.trim().toLowerCase();
  let studentToSave: User = {
    ...student,
    email: cleanEmail,
    role: 'student'
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const payload = {
        id: studentToSave.id,
        name: studentToSave.name.trim(),
        email: cleanEmail,
        role: 'student',
        class_id: studentToSave.class_id || null,
        password: studentToSave.password?.trim() || null,
        created_at: studentToSave.created_at || new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'email' })
        .select()
        .single();

      if (!error && data) {
        studentToSave = data;
      } else if (error) {
        console.error('Supabase saveRegisteredStudent error:', error.message);
      }
    } catch (err) {
      console.error('Supabase saveRegisteredStudent network error:', err);
    }
  }

  const students = getLocal<User>(STORAGE_KEYS.STUDENTS);
  const existingIdx = students.findIndex(
    s => s.id === studentToSave.id || s.email.toLowerCase() === cleanEmail
  );
  if (existingIdx >= 0) {
    students[existingIdx] = studentToSave;
  } else {
    students.unshift(studentToSave);
  }
  setLocal(STORAGE_KEYS.STUDENTS, students);
  return studentToSave;
}

// ==========================================
// CURRICULUM SERVICES
// ==========================================

export async function getClasses(): Promise<ClassLevel[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('classes').select('*').order('display_order');
      if (!error && data && data.length > 0) {
        setLocal(STORAGE_KEYS.CLASSES, data);
        return data;
      }
    } catch (e) {
      console.warn('Supabase getClasses error:', e);
    }
  }
  const classes = getLocal<ClassLevel>(STORAGE_KEYS.CLASSES);
  return classes.sort((a, b) => a.display_order - b.display_order);
}

export async function getSubjects(classId?: string): Promise<Subject[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('subjects').select('*');
      if (classId) query = query.eq('class_id', classId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase getSubjects error:', e);
    }
  }
  const subjects = getLocal<Subject>(STORAGE_KEYS.SUBJECTS);
  if (classId) return subjects.filter(s => s.class_id === classId);
  return subjects;
}

export async function getChapters(subjectId?: string): Promise<Chapter[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('chapters').select('*').order('chapter_number');
      if (subjectId) query = query.eq('subject_id', subjectId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase getChapters error:', e);
    }
  }
  const chapters = getLocal<Chapter>(STORAGE_KEYS.CHAPTERS);
  let filtered = chapters;
  if (subjectId) filtered = chapters.filter(c => c.subject_id === subjectId);
  return filtered.sort((a, b) => a.chapter_number - b.chapter_number);
}

export async function getTopics(chapterId?: string): Promise<Topic[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('topics').select('*');
      if (chapterId) query = query.eq('chapter_id', chapterId);
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('Supabase getTopics error:', e);
    }
  }
  const topics = getLocal<Topic>(STORAGE_KEYS.TOPICS);
  if (chapterId) return topics.filter(t => t.chapter_id === chapterId);
  return topics;
}

// ==========================================
// QUESTION BANK SERVICES (SUPABASE CLOUD SYNC)
// ==========================================

export async function getQuestions(params: QuestionFilterParams = {}): Promise<Question[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('questions').select('*');
      if (params.class_id) query = query.eq('class_id', params.class_id);
      if (params.subject_id) query = query.eq('subject_id', params.subject_id);
      if (params.chapter_id) query = query.eq('chapter_id', params.chapter_id);
      if (params.topic_id) query = query.eq('topic_id', params.topic_id);
      if (params.difficulty && params.difficulty !== 'mixed') query = query.eq('difficulty', params.difficulty);
      if (params.source_type) query = query.eq('source_type', params.source_type);
      if (params.exam_name) query = query.ilike('exam_name', `%${params.exam_name}%`);
      if (params.search_query) query = query.ilike('question_text', `%${params.search_query}%`);

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        const formattedQuestions: Question[] = data.map((q: any) => ({
          ...q,
          marks: Number(q.marks) || 1,
          negative_marks: Number(q.negative_marks) || 0
        }));

        if (!params.class_id && !params.subject_id && !params.chapter_id && !params.topic_id && !params.search_query) {
          setLocal(STORAGE_KEYS.QUESTIONS, formattedQuestions);
        }
        return formattedQuestions;
      }
    } catch (e) {
      console.warn('Supabase getQuestions error:', e);
    }
  }

  // Local Storage Fallback
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
    try {
      const { data, error } = await supabase.from('questions').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return {
          ...data,
          marks: Number(data.marks) || 1,
          negative_marks: Number(data.negative_marks) || 0
        };
      }
    } catch (e) {
      console.warn('Supabase getQuestionById error:', e);
    }
  }
  const questions = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
  return questions.find(q => q.id === id) || null;
}

export async function addQuestion(q: Omit<Question, 'id' | 'created_at'>): Promise<Question> {
  const newQuestion: Question = {
    ...q,
    id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('questions').insert([newQuestion]).select().single();
      if (!error && data) {
        const resultQ: Question = {
          ...data,
          marks: Number(data.marks) || 1,
          negative_marks: Number(data.negative_marks) || 0
        };
        const list = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
        list.unshift(resultQ);
        setLocal(STORAGE_KEYS.QUESTIONS, list);
        return resultQ;
      }
      if (error) {
        console.error('Supabase addQuestion error:', error.message);
      }
    } catch (e) {
      console.error('Supabase addQuestion network error:', e);
    }
  }

  const list = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
  list.unshift(newQuestion);
  setLocal(STORAGE_KEYS.QUESTIONS, list);
  return newQuestion;
}

export async function updateQuestion(id: string, updates: Partial<Question>): Promise<Question | null> {
  const payload = { ...updates, updated_at: new Date().toISOString() };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        const resultQ: Question = {
          ...data,
          marks: Number(data.marks) || 1,
          negative_marks: Number(data.negative_marks) || 0
        };
        const list = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
        const idx = list.findIndex(q => q.id === id);
        if (idx !== -1) {
          list[idx] = resultQ;
          setLocal(STORAGE_KEYS.QUESTIONS, list);
        }
        return resultQ;
      }
      if (error) {
        console.error('Supabase updateQuestion error:', error.message);
      }
    } catch (e) {
      console.error('Supabase updateQuestion network error:', e);
    }
  }

  const list = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
  const index = list.findIndex(q => q.id === id);
  if (index === -1) return null;

  const updated = { ...list[index], ...payload };
  list[index] = updated;
  setLocal(STORAGE_KEYS.QUESTIONS, list);
  return updated;
}

export async function deleteQuestion(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('questions').delete().eq('id', id);
      if (error) {
        console.error('Supabase deleteQuestion error:', error.message);
      }
    } catch (e) {
      console.error('Supabase deleteQuestion network error:', e);
    }
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
  
  const idMatch = classes.find(c => c.id.toLowerCase() === raw);
  if (idMatch) return idMatch;

  const exact = classes.find(c => c.name.toLowerCase() === raw);
  if (exact) return exact;

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

  const numMatch = raw.match(/\b(5|6|7|8|9|10|11|12)\b/) || raw.match(/\d+/);
  if (numMatch) {
    const num = numMatch[1] || numMatch[0];
    const found = classes.find(c => c.id === `c${num}` || c.name.toLowerCase().includes(num));
    if (found) return found;
  }

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

async function findOrCreateSubject(subjectName: string, classId: string, allSubjects: Subject[]): Promise<Subject> {
  const rawName = (subjectName || '').trim();
  const rawLower = rawName.toLowerCase();
  const classSubjects = allSubjects.filter(s => s.class_id === classId);

  let found = classSubjects.find(s => s.name.toLowerCase() === rawLower);
  if (found) return found;

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

  if (rawLower) {
    found = classSubjects.find(s => s.name.toLowerCase().includes(rawLower) || rawLower.includes(s.name.toLowerCase()));
    if (found) return found;
  }

  if (!rawName && classSubjects.length > 0) {
    return classSubjects[0];
  }

  const newSubject: Subject = {
    id: `s_${classId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: rawName || 'General',
    class_id: classId,
    created_at: new Date().toISOString()
  };

  allSubjects.push(newSubject);
  const currentLocal = getLocal<Subject>(STORAGE_KEYS.SUBJECTS);
  setLocal(STORAGE_KEYS.SUBJECTS, [...currentLocal, newSubject]);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('subjects').upsert(newSubject);
    } catch (e) {
      console.warn('Supabase upsert subject error:', e);
    }
  }

  return newSubject;
}

async function findOrCreateChapter(chapterName: string, subjectId: string, allChapters: Chapter[]): Promise<Chapter> {
  const rawName = (chapterName || '').trim();
  const rawClean = cleanName(rawName);
  const rawLower = rawClean.toLowerCase().replace(/[^a-z0-9]/g, '');

  const existingSubjectChapters = allChapters.filter(c => c.subject_id === subjectId);
  
  let found = existingSubjectChapters.find(c => {
    const cClean = cleanName(c.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    return cClean === rawLower || c.name.toLowerCase().trim() === rawName.toLowerCase();
  });

  if (!found && rawLower.length >= 3) {
    found = existingSubjectChapters.find(c => {
      const cClean = cleanName(c.name).toLowerCase().replace(/[^a-z0-9]/g, '');
      return cClean.includes(rawLower) || rawLower.includes(cClean);
    });
  }

  if (found) return found;

  const matchedAnywhere = allChapters.find(c => {
    const cClean = cleanName(c.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    return cClean === rawLower;
  });

  const newChapterNumber = existingSubjectChapters.length + 1;
  const newChapter: Chapter = {
    id: `ch_${subjectId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    subject_id: subjectId,
    name: rawClean || (matchedAnywhere ? cleanName(matchedAnywhere.name) : rawName) || `Chapter ${newChapterNumber}`,
    chapter_number: newChapterNumber,
    created_at: new Date().toISOString()
  };

  allChapters.push(newChapter);
  const currentLocal = getLocal<Chapter>(STORAGE_KEYS.CHAPTERS);
  setLocal(STORAGE_KEYS.CHAPTERS, [...currentLocal, newChapter]);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('chapters').upsert(newChapter);
    } catch (e) {
      console.warn('Supabase upsert chapter error:', e);
    }
  }

  return newChapter;
}

async function findOrCreateTopic(topicName: string, chapterId: string, allTopics: Topic[]): Promise<Topic> {
  const rawName = (topicName || '').trim();
  const rawClean = cleanName(rawName);
  const rawLower = rawClean.toLowerCase().replace(/[^a-z0-9]/g, '');

  const existingChapterTopics = allTopics.filter(t => t.chapter_id === chapterId);
  
  let found = existingChapterTopics.find(t => {
    const tClean = cleanName(t.name).toLowerCase().replace(/[^a-z0-9]/g, '');
    return tClean === rawLower || t.name.toLowerCase().trim() === rawName.toLowerCase();
  });

  if (!found && rawLower.length >= 3) {
    found = existingChapterTopics.find(t => {
      const tClean = cleanName(t.name).toLowerCase().replace(/[^a-z0-9]/g, '');
      return tClean.includes(rawLower) || rawLower.includes(tClean);
    });
  }

  if (found) return found;

  const newTopic: Topic = {
    id: `tp_${chapterId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    chapter_id: chapterId,
    name: rawClean || rawName || 'General Topic',
    created_at: new Date().toISOString()
  };

  allTopics.push(newTopic);
  const currentLocal = getLocal<Topic>(STORAGE_KEYS.TOPICS);
  setLocal(STORAGE_KEYS.TOPICS, [...currentLocal, newTopic]);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('topics').upsert(newTopic);
    } catch (e) {
      console.warn('Supabase upsert topic error:', e);
    }
  }

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
  const questionsToInsert: Question[] = [];

  if (validRows.length > 0) {
    for (const rawItem of validRows) {
      const raw = normalizeCSVRawRow(rawItem);

      const classObj = findClassFlexibly(raw.class, classes);
      const subjectObj = await findOrCreateSubject(raw.subject, classObj.id, subjects);
      const chapterObj = await findOrCreateChapter(raw.chapter, subjectObj.id, chapters);
      const topicObj = await findOrCreateTopic(raw.topic, chapterObj.id, topics);

      const newQ: Question = {
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
        created_at: new Date().toISOString()
      };

      questionsToInsert.push(newQ);
      importedCount++;
    }
  }

  // Batch insert into Supabase Cloud
  if (isSupabaseConfigured && supabase && questionsToInsert.length > 0) {
    try {
      const batchSize = 30;
      for (let i = 0; i < questionsToInsert.length; i += batchSize) {
        const batch = questionsToInsert.slice(i, i + batchSize);
        const { error } = await supabase.from('questions').upsert(batch);
        if (error) console.error('Supabase batch question import error:', error);
      }
    } catch (e) {
      console.error('Supabase batch question import network error:', e);
    }
  }

  // Update local cache
  if (questionsToInsert.length > 0) {
    const list = getLocal<Question>(STORAGE_KEYS.QUESTIONS);
    setLocal(STORAGE_KEYS.QUESTIONS, [...questionsToInsert, ...list]);
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
// TEST GENERATION ENGINE & TEST MANAGEMENT (CLOUD SYNC)
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
    id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title: customTitle || `${subjectName} ${config.test_type.toUpperCase()} Test (${selectedQuestions.length} Questions)`,
    class_id: config.class_id,
    subject_id: config.subject_id,
    chapter_id: isAllChapters ? null : (config.chapter_id || null),
    topic_id: isAllChapters ? null : (config.topic_id || null),
    difficulty: config.difficulty || 'mixed',
    test_type: config.test_type,
    number_of_questions: selectedQuestions.length,
    duration_minutes: config.duration_minutes,
    total_marks: selectedQuestions.reduce((acc, q) => acc + (q.marks || 1), 0),
    created_at: new Date().toISOString()
  };

  // Sync test to Supabase Cloud
  if (isSupabaseConfigured && supabase) {
    try {
      const { error: testErr } = await supabase.from('tests').insert([{
        id: newTest.id,
        title: newTest.title,
        class_id: newTest.class_id,
        subject_id: newTest.subject_id,
        chapter_id: newTest.chapter_id || null,
        topic_id: newTest.topic_id || null,
        difficulty: newTest.difficulty || 'mixed',
        test_type: newTest.test_type,
        number_of_questions: newTest.number_of_questions,
        duration_minutes: newTest.duration_minutes,
        total_marks: newTest.total_marks,
        created_at: newTest.created_at
      }]);

      if (!testErr && selectedQuestions.length > 0) {
        const tqPayload = selectedQuestions.map((q, idx) => ({
          id: `tq_${newTest.id}_${idx + 1}`,
          test_id: newTest.id,
          question_id: q.id,
          question_order: idx + 1,
          marks: q.marks || 1,
          negative_marks: q.negative_marks || 0
        }));
        await supabase.from('test_questions').insert(tqPayload);
      }
    } catch (e) {
      console.error('Supabase test sync error:', e);
    }
  }

  const tests = getLocal<Test>(STORAGE_KEYS.TESTS);
  tests.unshift(newTest);
  setLocal(STORAGE_KEYS.TESTS, tests);

  return {
    test: newTest,
    questions: selectedQuestions
  };
}

export async function getTestById(id: string): Promise<Test | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('tests').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return {
          ...data,
          total_marks: Number(data.total_marks) || 0,
          number_of_questions: Number(data.number_of_questions) || 0,
          duration_minutes: Number(data.duration_minutes) || 15
        };
      }
    } catch (e) {
      console.warn('Supabase getTestById error:', e);
    }
  }

  const tests = getLocal<Test>(STORAGE_KEYS.TESTS);
  return tests.find(t => t.id === id) || null;
}

export async function getAllTests(): Promise<Test[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('tests').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const formatted = data.map((t: any) => ({
          ...t,
          total_marks: Number(t.total_marks) || 0,
          number_of_questions: Number(t.number_of_questions) || 0,
          duration_minutes: Number(t.duration_minutes) || 15
        }));
        setLocal(STORAGE_KEYS.TESTS, formatted);
        return formatted;
      }
    } catch (e) {
      console.warn('Supabase getAllTests error:', e);
    }
  }
  return getLocal<Test>(STORAGE_KEYS.TESTS);
}

// ==========================================
// ATTEMPTS & EVALUATION ENGINE (SUPABASE CLOUD SYNC)
// ==========================================

export async function createAttempt(testId: string, studentId: string, studentName?: string, studentEmail?: string): Promise<Attempt> {
  const test = await getTestById(testId);

  let sName = studentName;
  let sEmail = (studentEmail || '').trim().toLowerCase();

  if (!sName || !sEmail) {
    const found = await findStudentByEmail(sEmail) || (await getRegisteredStudents()).find(s => s.id === studentId);
    if (found) {
      sName = sName || found.name;
      sEmail = sEmail || found.email;
    }
  }

  const newAttempt: Attempt = {
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    test_id: testId,
    student_id: studentId,
    student_name: sName || 'Candidate Student',
    student_email: sEmail || 'student@horizoncbt.edu',
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

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('attempts').insert([{
        id: newAttempt.id,
        test_id: newAttempt.test_id,
        student_id: newAttempt.student_id,
        student_name: newAttempt.student_name,
        student_email: newAttempt.student_email,
        started_at: newAttempt.started_at,
        score: newAttempt.score,
        total_marks: newAttempt.total_marks,
        correct_count: newAttempt.correct_count,
        wrong_count: newAttempt.wrong_count,
        unattempted_count: newAttempt.unattempted_count,
        accuracy: newAttempt.accuracy,
        time_taken_seconds: newAttempt.time_taken_seconds,
        status: newAttempt.status
      }]);
    } catch (e) {
      console.error('Supabase createAttempt error:', e);
    }
  }

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
  
  // If not found in local cache, try fetching from Supabase
  let attempt: Attempt;
  if (attemptIndex === -1) {
    const details = await getAttemptDetails(attemptId);
    if (!details) throw new Error('Attempt not found');
    attempt = details.attempt;
  } else {
    attempt = attempts[attemptIndex];
  }

  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unattemptedCount = 0;
  let totalMarks = 0;
  let totalTimeSpent = 0;

  const attemptAnswersList: AttemptAnswer[] = [];

  testQuestions.forEach(q => {
    totalMarks += (q.marks || 1);
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
        score += (q.marks || 1);
      } else {
        wrongCount++;
        score -= (q.negative_marks || 0);
      }
    }

    attemptAnswersList.push({
      id: `ans_${q.id}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
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

  // Sync submission to Supabase Cloud
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Upsert attempt record in Supabase
      const { error: attErr } = await supabase
        .from('attempts')
        .upsert({
          id: updatedAttempt.id,
          test_id: updatedAttempt.test_id,
          student_id: updatedAttempt.student_id,
          student_name: updatedAttempt.student_name,
          student_email: updatedAttempt.student_email,
          started_at: updatedAttempt.started_at,
          submitted_at: updatedAttempt.submitted_at,
          score: updatedAttempt.score,
          total_marks: updatedAttempt.total_marks,
          correct_count: updatedAttempt.correct_count,
          wrong_count: updatedAttempt.wrong_count,
          unattempted_count: updatedAttempt.unattempted_count,
          accuracy: updatedAttempt.accuracy,
          time_taken_seconds: updatedAttempt.time_taken_seconds,
          status: 'completed'
        });

      if (attErr) console.error('Supabase submit attempt error:', attErr.message);

      // 2. Batch insert answers into Supabase
      const answersPayload = attemptAnswersList.map(a => ({
        id: a.id,
        attempt_id: a.attempt_id,
        question_id: a.question_id,
        selected_answer: a.selected_answer,
        is_correct: a.is_correct,
        time_spent_seconds: a.time_spent_seconds,
        marked_for_review: a.marked_for_review,
        answered_at: a.answered_at
      }));

      const { error: ansErr } = await supabase.from('attempt_answers').upsert(answersPayload);
      if (ansErr) console.error('Supabase submit answers error:', ansErr.message);
    } catch (e) {
      console.error('Supabase submitAttempt network error:', e);
    }
  }

  // Update local cache
  if (attemptIndex >= 0) {
    attempts[attemptIndex] = updatedAttempt;
    setLocal(STORAGE_KEYS.ATTEMPTS, attempts);
  } else {
    setLocal(STORAGE_KEYS.ATTEMPTS, [updatedAttempt, ...attempts]);
  }

  const existingAnswers = getLocal<AttemptAnswer>(STORAGE_KEYS.ANSWERS);
  const filteredExisting = existingAnswers.filter(a => a.attempt_id !== attemptId);
  setLocal(STORAGE_KEYS.ANSWERS, [...filteredExisting, ...attemptAnswersList]);

  return {
    attempt: updatedAttempt,
    answers: attemptAnswersList
  };
}

export async function getAttemptDetails(attemptId: string): Promise<{ attempt: Attempt; answers: AttemptAnswer[] } | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: attData, error: attError } = await supabase
        .from('attempts')
        .select('*')
        .eq('id', attemptId)
        .maybeSingle();

      if (!attError && attData) {
        const attempt: Attempt = {
          ...attData,
          score: Number(attData.score) || 0,
          total_marks: Number(attData.total_marks) || 0,
          correct_count: Number(attData.correct_count) || 0,
          wrong_count: Number(attData.wrong_count) || 0,
          unattempted_count: Number(attData.unattempted_count) || 0,
          accuracy: Number(attData.accuracy) || 0,
          time_taken_seconds: Number(attData.time_taken_seconds) || 0
        };

        const test = await getTestById(attempt.test_id);
        if (test) attempt.test = test;

        const { data: ansData } = await supabase
          .from('attempt_answers')
          .select('*, questions(*)')
          .eq('attempt_id', attemptId);

        let answers: AttemptAnswer[] = [];
        if (ansData) {
          answers = ansData.map((row: any) => ({
            id: row.id,
            attempt_id: row.attempt_id,
            question_id: row.question_id,
            selected_answer: row.selected_answer,
            is_correct: Boolean(row.is_correct),
            time_spent_seconds: Number(row.time_spent_seconds) || 0,
            marked_for_review: Boolean(row.marked_for_review),
            answered_at: row.answered_at,
            question: row.questions ? {
              ...row.questions,
              marks: Number(row.questions.marks) || 1,
              negative_marks: Number(row.questions.negative_marks) || 0
            } : undefined
          }));
        }

        return { attempt, answers };
      }
    } catch (e) {
      console.warn('Supabase getAttemptDetails error:', e);
    }
  }

  // Local storage fallback
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
  const cleanEmail = (studentEmail || '').trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('attempts').select('*, tests(*)');
      
      if (studentId && cleanEmail) {
        query = query.or(`student_id.eq.${studentId},student_email.ilike.${cleanEmail}`);
      } else if (cleanEmail) {
        query = query.ilike('student_email', cleanEmail);
      } else if (studentId) {
        query = query.eq('student_id', studentId);
      }

      const { data, error } = await query.order('started_at', { ascending: false });
      if (!error && data) {
        const formatted: Attempt[] = data.map((a: any) => ({
          ...a,
          score: Number(a.score) || 0,
          total_marks: Number(a.total_marks) || 0,
          correct_count: Number(a.correct_count) || 0,
          wrong_count: Number(a.wrong_count) || 0,
          unattempted_count: Number(a.unattempted_count) || 0,
          accuracy: Number(a.accuracy) || 0,
          time_taken_seconds: Number(a.time_taken_seconds) || 0,
          test: a.tests ? {
            ...a.tests,
            total_marks: Number(a.tests.total_marks) || 0,
            number_of_questions: Number(a.tests.number_of_questions) || 0,
            duration_minutes: Number(a.tests.duration_minutes) || 15
          } : undefined
        }));
        return formatted;
      }
    } catch (e) {
      console.warn('Supabase getStudentAttempts error:', e);
    }
  }

  // Local storage fallback
  const attempts = getLocal<Attempt>(STORAGE_KEYS.ATTEMPTS);
  const studentAttempts = attempts.filter(
    a => a.student_id === studentId || (cleanEmail && a.student_email?.toLowerCase() === cleanEmail)
  );
  
  const tests = getLocal<Test>(STORAGE_KEYS.TESTS);
  return studentAttempts.map(a => ({
    ...a,
    test: tests.find(t => t.id === a.test_id) || a.test
  }));
}

export async function getAllAttempts(): Promise<Attempt[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      // Auto-migrate: upload any local attempts not yet in cloud
      const localAttempts = getLocal<Attempt>(STORAGE_KEYS.ATTEMPTS);
      if (localAttempts && localAttempts.length > 0) {
        const payload = localAttempts.map(a => ({
          id: a.id,
          test_id: a.test_id,
          student_id: a.student_id,
          student_name: a.student_name,
          student_email: (a.student_email || '').trim().toLowerCase(),
          started_at: a.started_at,
          submitted_at: a.submitted_at,
          score: a.score,
          total_marks: a.total_marks,
          correct_count: a.correct_count,
          wrong_count: a.wrong_count,
          unattempted_count: a.unattempted_count,
          accuracy: a.accuracy,
          time_taken_seconds: a.time_taken_seconds,
          status: a.status
        }));
        await supabase.from('attempts').upsert(payload, { onConflict: 'id' });
      }

      const { data, error } = await supabase
        .from('attempts')
        .select('*, tests(*)')
        .order('started_at', { ascending: false });

      if (!error && data) {
        const formatted: Attempt[] = data.map((a: any) => ({
          ...a,
          score: Number(a.score) || 0,
          total_marks: Number(a.total_marks) || 0,
          correct_count: Number(a.correct_count) || 0,
          wrong_count: Number(a.wrong_count) || 0,
          unattempted_count: Number(a.unattempted_count) || 0,
          accuracy: Number(a.accuracy) || 0,
          time_taken_seconds: Number(a.time_taken_seconds) || 0,
          test: a.tests ? {
            ...a.tests,
            total_marks: Number(a.tests.total_marks) || 0,
            number_of_questions: Number(a.tests.number_of_questions) || 0,
            duration_minutes: Number(a.tests.duration_minutes) || 15
          } : undefined
        }));
        setLocal(STORAGE_KEYS.ATTEMPTS, formatted);
        return formatted;
      }
    } catch (e) {
      console.warn('Supabase getAllAttempts error:', e);
    }
  }

  // Local storage fallback
  const attempts = getLocal<Attempt>(STORAGE_KEYS.ATTEMPTS);
  const tests = getLocal<Test>(STORAGE_KEYS.TESTS);
  const students = getLocal<User>(STORAGE_KEYS.STUDENTS);

  return attempts.map(a => {
    const foundStudent = students.find(s => s.id === a.student_id || s.email.toLowerCase() === a.student_email?.toLowerCase());
    return {
      ...a,
      student_name: a.student_name || foundStudent?.name || 'Candidate Student',
      student_email: a.student_email || foundStudent?.email || 'student@horizoncbt.edu',
      test: tests.find(t => t.id === a.test_id) || a.test
    };
  });
}
