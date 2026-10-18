import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getClasses, getSubjects, getChapters, getTopics, generateTest, getQuestions } from '../services/db';
import { ClassLevel, Subject, Chapter, Topic, TestType, DifficultyFilter, Question } from '../types';
import { 
  CheckCircle2, ArrowRight, Play, BookOpen, Layers, ShieldCheck, 
  Clock, HelpCircle, AlertTriangle, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import { LoadingState } from '../components/LoadingState';

export const CreateTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSubjectId = searchParams.get('subject');

  const { selectedClassId } = useAuth();

  // Master Data
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Selections
  const [classId, setClassId] = useState<string>(selectedClassId || 'c9');
  const [subjectId, setSubjectId] = useState<string>('');
  const [testMode, setTestMode] = useState<TestType>('chapter');
  const [chapterId, setChapterId] = useState<string>(''); // empty string means "All Chapters"
  const [topicId, setTopicId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

  // Validation / Preview state
  const [matchingCount, setMatchingCount] = useState<number>(0);
  const [generating, setGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load Classes and all Question Bank statistics
  useEffect(() => {
    async function initData() {
      setLoading(true);
      try {
        const [cls, qList] = await Promise.all([
          getClasses(),
          getQuestions()
        ]);
        setClasses(cls);
        setAllQuestions(qList);

        // Smart class selection: if default class has 0 questions but another class has questions, auto-select it!
        const initialCId = selectedClassId || 'c9';
        const hasQuestionsInInitial = qList.some(q => q.class_id === initialCId);
        if (!hasQuestionsInInitial && qList.length > 0) {
          // Find class with most questions
          const countsByClass: Record<string, number> = {};
          qList.forEach(q => {
            countsByClass[q.class_id] = (countsByClass[q.class_id] || 0) + 1;
          });
          const bestClass = Object.entries(countsByClass).sort((a, b) => b[1] - a[1])[0];
          if (bestClass) {
            setClassId(bestClass[0]);
          } else {
            setClassId(initialCId);
          }
        } else {
          setClassId(initialCId);
        }
      } catch (err) {
        console.error('Failed to init classes/questions:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, [selectedClassId]);

  // Compute question counts across curriculum
  const stats = useMemo(() => {
    const classCounts: Record<string, number> = {};
    const subjectCounts: Record<string, number> = {};
    const chapterCounts: Record<string, number> = {};
    const topicCounts: Record<string, number> = {};

    allQuestions.forEach(q => {
      if (q.class_id) classCounts[q.class_id] = (classCounts[q.class_id] || 0) + 1;
      if (q.subject_id) subjectCounts[q.subject_id] = (subjectCounts[q.subject_id] || 0) + 1;
      if (q.chapter_id) chapterCounts[q.chapter_id] = (chapterCounts[q.chapter_id] || 0) + 1;
      if (q.topic_id) topicCounts[q.topic_id] = (topicCounts[q.topic_id] || 0) + 1;
    });

    return { classCounts, subjectCounts, chapterCounts, topicCounts };
  }, [allQuestions]);

  // Load Subjects when classId changes
  useEffect(() => {
    async function loadSubjs() {
      if (!classId) return;
      const subjs = await getSubjects(classId);
      setSubjects(subjs);
      if (subjs.length > 0) {
        // Prefer preselectedSubjectId if valid
        if (preselectedSubjectId && subjs.some(s => s.id === preselectedSubjectId)) {
          setSubjectId(preselectedSubjectId);
        } else {
          // Auto-select subject with the MOST questions in this class
          const sorted = [...subjs].sort((a, b) => (stats.subjectCounts[b.id] || 0) - (stats.subjectCounts[a.id] || 0));
          setSubjectId(sorted[0].id);
        }
      } else {
        setSubjectId('');
      }
    }
    loadSubjs();
  }, [classId, preselectedSubjectId, stats.subjectCounts]);

  // Load Chapters when subjectId changes
  useEffect(() => {
    async function loadChaps() {
      if (!subjectId) {
        setChapters([]);
        setChapterId('');
        return;
      }
      const chaps = await getChapters(subjectId);
      setChapters(chaps);
      // Default to "All Chapters" ("") so all questions in the subject are included right away!
      setChapterId('');
    }
    loadChaps();
  }, [subjectId]);

  // Load Topics when chapterId changes
  useEffect(() => {
    async function loadTops() {
      if (!chapterId) {
        setTopics([]);
        setTopicId('');
        return;
      }
      const tops = await getTopics(chapterId);
      setTopics(tops);
      setTopicId('');
    }
    loadTops();
  }, [chapterId]);

  // Real-time calculation of matching questions in Question Bank
  useEffect(() => {
    async function checkMatching() {
      if (!classId || !subjectId) {
        setMatchingCount(0);
        return;
      }

      const isAllChapters = !chapterId || testMode === 'full_syllabus' || testMode === 'custom';

      const matched = await getQuestions({
        class_id: classId,
        subject_id: subjectId,
        chapter_id: isAllChapters ? undefined : chapterId,
        topic_id: (testMode === 'topic' && topicId) ? topicId : undefined,
        difficulty: difficulty !== 'mixed' ? difficulty : undefined,
        source_type: testMode === 'pyq' ? 'pyq' : undefined
      });
      setMatchingCount(matched.length);
      
      if (matched.length < questionCount && matched.length > 0) {
        setErrorMessage(`Only ${matched.length} questions match your exact filters. Starting the test will automatically generate an exam with all ${matched.length} available questions.`);
      } else if (matched.length === 0) {
        setErrorMessage('No questions match the selected filters. Please select "All Chapters" or switch to Mixed difficulty.');
      } else {
        setErrorMessage(null);
      }
    }
    checkMatching();
  }, [classId, subjectId, chapterId, topicId, difficulty, testMode, questionCount]);

  const handleStartTest = async () => {
    if (matchingCount === 0) {
      setErrorMessage('Cannot start test with 0 matching questions.');
      return;
    }

    setGenerating(true);
    setErrorMessage(null);

    try {
      const selectedSubjectObj = subjects.find(s => s.id === subjectId);
      const selectedChapterObj = chapters.find(c => c.id === chapterId);
      const isAllChapters = !chapterId || testMode === 'full_syllabus' || testMode === 'custom';
      
      const customTitle = `${selectedSubjectObj?.name || 'Subject'} - ${isAllChapters ? 'Full Subject' : (selectedChapterObj?.name || 'Practice')} (${testMode.toUpperCase()})`;

      const result = await generateTest(
        {
          class_id: classId,
          subject_id: subjectId,
          chapter_id: isAllChapters ? undefined : chapterId,
          topic_id: (testMode === 'topic' && topicId) ? topicId : undefined,
          difficulty: difficulty,
          test_type: testMode,
          number_of_questions: Math.min(questionCount, matchingCount),
          duration_minutes: durationMinutes
        },
        customTitle
      );

      if (result.error || !result.test) {
        setErrorMessage(result.error || 'Failed to generate test.');
        setGenerating(false);
      } else {
        // Store test questions into sessionStorage for test session
        sessionStorage.setItem(`test_questions_${result.test.id}`, JSON.stringify(result.questions));
        navigate(`/test/${result.test.id}`);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('An unexpected error occurred while generating the test.');
      setGenerating(false);
    }
  };

  if (loading) return <LoadingState message="Loading CBT test generator..." />;

  const currentSubjectObj = subjects.find(s => s.id === subjectId);
  const currentChapterObj = chapters.find(c => c.id === chapterId);
  const currentSubjectTotalQuestions = stats.subjectCounts[subjectId] || 0;

  // Diagnostics for Quick Fix buttons when matchingCount === 0
  const otherSubjectsInClassWithQuestions = subjects.filter(s => s.id !== subjectId && (stats.subjectCounts[s.id] || 0) > 0);
  const otherClassesWithQuestions = classes.filter(c => c.id !== classId && (stats.classCounts[c.id] || 0) > 0);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          <span>Horizon CBT Test Configurator</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Create Computer Based Test
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Select class, subject, test scope, and launch a real-time exam session instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Config Steps */}
        <div className="lg:col-span-2 space-y-6">

          {/* Step 1: Select Class */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 1: Select Class
              </label>
              <span className="text-[11px] text-slate-400">Total bank: {allQuestions.length} Qs</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {classes.map((cObj) => {
                const isSelected = classId === cObj.id;
                const count = stats.classCounts[cObj.id] || 0;
                return (
                  <button
                    key={cObj.id}
                    type="button"
                    onClick={() => setClassId(cObj.id)}
                    className={`py-3 px-3 rounded-xl border text-center font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.02]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{cObj.name}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      isSelected 
                        ? 'bg-white/20 text-white' 
                        : count > 0 
                          ? 'bg-blue-100 text-blue-700 font-semibold' 
                          : 'bg-slate-200 text-slate-500'
                    }`}>
                      {count} {count === 1 ? 'Question' : 'Questions'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Subject */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 2: Select Subject
              </label>
              {subjects.length > 0 && (
                <span className="text-[11px] text-slate-400">{subjects.length} subjects found</span>
              )}
            </div>
            {subjects.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No subjects available for this class.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {subjects.map((s) => {
                  const isSelected = subjectId === s.id;
                  const count = stats.subjectCounts[s.id] || 0;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSubjectId(s.id)}
                      className={`py-3 px-3.5 rounded-xl border font-bold text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <BookOpen className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{s.name}</span>
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : count > 0 
                            ? 'bg-indigo-100 text-indigo-700 font-semibold' 
                            : 'bg-slate-200 text-slate-500'
                      }`}>
                        {count} Qs
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Select Test Mode */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Step 3: Select Test Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'chapter', label: 'Chapter Test', desc: 'Specific chapter or all chapters' },
                { id: 'full_syllabus', label: 'Full Syllabus', desc: 'All chapters in subject' },
                { id: 'topic', label: 'Topic Test', desc: 'Specific sub-topic' },
                { id: 'custom', label: 'Custom Test', desc: 'Practice questions' },
                { id: 'pyq', label: 'PYQ Test', desc: 'Past exams' },
              ].map((mode) => {
                const isSelected = testMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setTestMode(mode.id as TestType);
                      if (mode.id === 'full_syllabus') {
                        setChapterId('');
                      }
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-left font-bold text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-bold">{mode.label}</div>
                    <div className={`text-[10px] font-normal mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                      {mode.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 4 & 5: Chapter and Topic Selectors */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Step 4: Select Chapter
                </label>
                <span className="text-[11px] text-slate-400">
                  {currentSubjectTotalQuestions} questions in {currentSubjectObj?.name || 'subject'}
                </span>
              </div>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                disabled={testMode === 'full_syllabus'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="">
                  ⭐ All Chapters in {currentSubjectObj?.name || 'Subject'} ({currentSubjectTotalQuestions} Qs Available)
                </option>
                {chapters.map((ch) => {
                  const chapCount = stats.chapterCounts[ch.id] || 0;
                  return (
                    <option key={ch.id} value={ch.id}>
                      Ch {ch.chapter_number}: {ch.name} ({chapCount} Qs)
                    </option>
                  );
                })}
              </select>
              {testMode === 'full_syllabus' && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  ✓ Full Syllabus mode automatically covers all chapters in {currentSubjectObj?.name}.
                </p>
              )}
            </div>

            {testMode === 'topic' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Step 5: Select Topic (Optional)
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Topics in Chapter</option>
                  {topics.map((tp) => {
                    const tpCount = stats.topicCounts[tp.id] || 0;
                    return (
                      <option key={tp.id} value={tp.id}>
                        {tp.name} ({tpCount} Qs)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Step 6: Select Difficulty */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Step 6: Select Difficulty
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'mixed', label: 'Mixed' },
                { id: 'easy', label: 'Easy' },
                { id: 'medium', label: 'Medium' },
                { id: 'hard', label: 'Hard' }
              ].map((diff) => {
                const isSelected = difficulty === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setDifficulty(diff.id as DifficultyFilter)}
                    className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-700 text-white border-blue-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {diff.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 7 & 8: Questions & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 7: Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      questionCount === count
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {count} Qs
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Step 8: Duration
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 15, 20, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 text-xs font-bold rounded-lg border cursor-pointer ${
                      durationMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {mins} m
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Live Configuration Summary Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl sticky top-24 space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <h3 className="font-extrabold text-lg">Test Summary</h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-400">Class:</span>
                <span className="font-bold text-white uppercase">{classes.find(c => c.id === classId)?.name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-400">Subject:</span>
                <span className="font-bold text-blue-300">{currentSubjectObj?.name || '-'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-400">Chapter:</span>
                <span className="font-bold text-slate-200 truncate max-w-[150px]">
                  {chapterId ? (currentChapterObj?.name || 'Selected Chapter') : '⭐ All Chapters'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-400">Difficulty:</span>
                <span className="font-bold text-amber-300 capitalize">{difficulty}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <span className="text-slate-400">Questions:</span>
                <span className="font-extrabold text-white text-sm">{questionCount} Qs</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Timer:</span>
                <span className="font-extrabold text-emerald-400 text-sm">{durationMinutes} Minutes</span>
              </div>
            </div>

            {/* Bank Matching Badge */}
            <div className="p-3 bg-white/10 rounded-xl border border-white/10 text-center">
              <div className="text-[11px] text-slate-300 font-medium">Bank Availability</div>
              <div className={`text-xl font-black mt-0.5 ${matchingCount > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {matchingCount} Matching Questions
              </div>
            </div>

            {/* Error Message & Quick Fix Solutions */}
            {errorMessage && (
              <div className="p-3.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200 text-xs space-y-2.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>

                {/* 1-Click Quick Fix Options when 0 questions match */}
                {matchingCount === 0 && (
                  <div className="pt-2 border-t border-amber-500/30 space-y-1.5">
                    <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
                      Quick Fix Suggestions:
                    </p>

                    {/* Option 1: Switch to All Chapters if subject has questions */}
                    {chapterId && currentSubjectTotalQuestions > 0 && (
                      <button
                        type="button"
                        onClick={() => setChapterId('')}
                        className="w-full text-left py-1.5 px-2.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 font-bold text-[11px] transition-all flex items-center justify-between cursor-pointer border border-emerald-500/30"
                      >
                        <span>✓ Select "All Chapters" in {currentSubjectObj?.name}</span>
                        <span className="text-emerald-300">{currentSubjectTotalQuestions} Qs</span>
                      </button>
                    )}

                    {/* Option 2: Reset difficulty to Mixed */}
                    {difficulty !== 'mixed' && (
                      <button
                        type="button"
                        onClick={() => setDifficulty('mixed')}
                        className="w-full text-left py-1.5 px-2.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 font-bold text-[11px] transition-all flex items-center justify-between cursor-pointer border border-blue-500/30"
                      >
                        <span>✓ Set Difficulty to "Mixed"</span>
                        <span>All levels</span>
                      </button>
                    )}

                    {/* Option 3: Switch to another subject with questions in this class */}
                    {otherSubjectsInClassWithQuestions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSubjectId(s.id);
                          setChapterId('');
                        }}
                        className="w-full text-left py-1.5 px-2.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 font-bold text-[11px] transition-all flex items-center justify-between cursor-pointer border border-indigo-500/30"
                      >
                        <span>✓ Switch to {s.name}</span>
                        <span>{stats.subjectCounts[s.id] || 0} Qs</span>
                      </button>
                    ))}

                    {/* Option 4: Switch to another class that has questions */}
                    {otherClassesWithQuestions.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClassId(c.id);
                          setChapterId('');
                        }}
                        className="w-full text-left py-1.5 px-2.5 rounded-lg bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 font-bold text-[11px] transition-all flex items-center justify-between cursor-pointer border border-violet-500/30"
                      >
                        <span>✓ Switch to {c.name}</span>
                        <span>{stats.classCounts[c.id] || 0} Qs</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              disabled={generating || matchingCount === 0}
              onClick={handleStartTest}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-blue-600/40 flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            >
              {generating ? (
                <span>Generating Exam...</span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Start Test Now ({matchingCount} Qs)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
