import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getClasses, getSubjects, getChapters, getTopics, 
  addQuestion, updateQuestion, getQuestionById 
} from '../services/db';
import { 
  ClassLevel, Subject, Chapter, Topic, Question, QuestionType, 
  QuestionDifficulty, SourceType 
} from '../types';
import { 
  Save, ArrowLeft, Eye, Sparkles, CheckCircle2, AlertTriangle,
  Image as ImageIcon, Upload, Link as LinkIcon, Trash2, X, AlertCircle 
} from 'lucide-react';
import { LoadingState } from '../components/LoadingState';

export const AdminAddEditQuestionPage: React.FC = () => {
  const { id: editQuestionId } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  const isEdit = Boolean(editQuestionId);

  // Curriculum Lists
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Fields
  const [classId, setClassId] = useState<string>('c11');
  const [subjectId, setSubjectId] = useState<string>('');
  const [chapterId, setChapterId] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('');
  const [questionType, setQuestionType] = useState<QuestionType>('mcq');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('medium');
  const [sourceType, setSourceType] = useState<SourceType>('practice');
  const [examName, setExamName] = useState<string>('');
  const [examYear, setExamYear] = useState<string>('');
  const [questionText, setQuestionText] = useState<string>('');
  const [optionA, setOptionA] = useState<string>('');
  const [optionB, setOptionB] = useState<string>('');
  const [optionC, setOptionC] = useState<string>('');
  const [optionD, setOptionD] = useState<string>('');
  const [correctAnswer, setCorrectAnswer] = useState<string>('A');
  const [marks, setMarks] = useState<number>(1);
  const [negativeMarks, setNegativeMarks] = useState<number>(0.25);
  const [solution, setSolution] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageInputMode, setImageInputMode] = useState<'upload' | 'url'>('upload');
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, SVG, WebP, GIF).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }
    setErrorMsg(null);
    setImagePreviewError(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageUrl(event.target?.result as string);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  // Initial load
  useEffect(() => {
    async function initFormData() {
      setLoading(true);
      try {
        const [cls, subjs] = await Promise.all([getClasses(), getSubjects()]);
        setClasses(cls);
        setSubjects(subjs);

        if (editQuestionId) {
          const existing = await getQuestionById(editQuestionId);
          if (existing) {
            setClassId(existing.class_id);
            setSubjectId(existing.subject_id);
            setChapterId(existing.chapter_id);
            setQuestionType(existing.question_type);
            setDifficulty(existing.difficulty);
            setSourceType(existing.source_type);
            setExamName(existing.exam_name || '');
            setExamYear(existing.exam_year ? String(existing.exam_year) : '');
            setQuestionText(existing.question_text);
            setOptionA(existing.option_a);
            setOptionB(existing.option_b);
            setOptionC(existing.option_c);
            setOptionD(existing.option_d);
            setCorrectAnswer(existing.correct_answer);
            setMarks(existing.marks);
            setNegativeMarks(existing.negative_marks);
            setSolution(existing.solution);
            setImageUrl(existing.image_url || '');

            // Refresh subjects in case custom subject was imported
            const allSubjs = await getSubjects();
            setSubjects(allSubjs);

            // Load chapters for existing subject
            const chaps = await getChapters(existing.subject_id);
            setChapters(chaps);

            // Load topics for existing chapter
            const tops = await getTopics(existing.chapter_id);
            if (existing.topic_id && !tops.some(t => t.id === existing.topic_id)) {
              const allTops = await getTopics();
              const found = allTops.find(t => t.id === existing.topic_id);
              if (found) {
                tops.unshift(found);
              }
            }
            setTopics(tops);

            // Preserve exact existing topicId
            if (existing.topic_id) {
              setTopicId(existing.topic_id);
            } else if (tops.length > 0) {
              setTopicId(tops[0].id);
            }
          }
        } else {
          if (subjs.length > 0) {
            const defaultSubj = subjs[0];
            setClassId(defaultSubj.class_id);
            setSubjectId(defaultSubj.id);
            const chaps = await getChapters(defaultSubj.id);
            setChapters(chaps);
            if (chaps.length > 0) {
              setChapterId(chaps[0].id);
              const tops = await getTopics(chaps[0].id);
              setTopics(tops);
              if (tops.length > 0) {
                setTopicId(tops[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initFormData();
  }, [editQuestionId]);

  const handleClassChange = async (newClassId: string) => {
    setClassId(newClassId);
    const subjs = await getSubjects(newClassId);
    setSubjects(subjs);
    if (subjs.length > 0) {
      handleSubjectChange(subjs[0].id);
    } else {
      setSubjectId('');
      setChapters([]);
      setChapterId('');
      setTopics([]);
      setTopicId('');
    }
  };

  const handleSubjectChange = async (newSubjId: string) => {
    setSubjectId(newSubjId);
    const chaps = await getChapters(newSubjId);
    setChapters(chaps);
    if (chaps.length > 0) {
      setChapterId(chaps[0].id);
      const tops = await getTopics(chaps[0].id);
      setTopics(tops);
      setTopicId(tops.length > 0 ? tops[0].id : '');
    } else {
      setChapterId('');
      setTopics([]);
      setTopicId('');
    }
  };

  const handleChapterChange = async (newChapId: string) => {
    setChapterId(newChapId);
    const tops = await getTopics(newChapId);
    setTopics(tops);
    setTopicId(tops.length > 0 ? tops[0].id : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validations
    if (!questionText.trim()) {
      setErrorMsg('Question text is required.');
      return;
    }
    if (questionType === 'mcq') {
      if (!optionA.trim() || !optionB.trim() || !optionC.trim() || !optionD.trim()) {
        setErrorMsg('All four options (A, B, C, D) must be present for MCQ questions.');
        return;
      }
      if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
        setErrorMsg('Correct answer must be one of A, B, C, or D.');
        return;
      }
    }
    if (!solution.trim()) {
      setErrorMsg('Step-by-step solution text is required.');
      return;
    }

    setSaving(true);

    try {
      const qPayload = {
        question_text: questionText,
        question_type: questionType,
        class_id: classId,
        subject_id: subjectId,
        chapter_id: chapterId,
        topic_id: topicId,
        difficulty,
        source_type: sourceType,
        exam_name: examName.trim() || null,
        exam_year: examYear ? Number(examYear) : null,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer,
        solution,
        marks,
        negative_marks: negativeMarks,
        image_url: imageUrl.trim() || null,
      };

      if (isEdit && editQuestionId) {
        await updateQuestion(editQuestionId, qPayload);
      } else {
        await addQuestion(qPayload);
      }

      navigate('/admin/questions');
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to save question.');
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message="Loading question form..." />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/admin/questions')}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Question Bank
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {isEdit ? 'Edit Question' : 'Add New Question'}
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2 Column Layout: Form Left, Preview Right */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT FORM (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Classification Metadata */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Curriculum Mapping</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Class</label>
                <select
                  value={classId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  {subjects.filter(s => s.class_id === classId).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chapter</label>
                <select
                  value={chapterId}
                  onChange={(e) => handleChapterChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  {chapters.map(ch => (
                    <option key={ch.id} value={ch.id}>Ch {ch.chapter_number}: {ch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Topic</label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-900"
                >
                  {topics.map(tp => (
                    <option key={tp.id} value={tp.id}>{tp.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Question Attributes */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Question Attributes</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Type</label>
                <select
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="mcq">MCQ</option>
                  <option value="true_false">True / False</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Source</label>
                <select
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value as SourceType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                >
                  <option value="practice">Practice</option>
                  <option value="pyq">PYQ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Correct Answer</label>
                <select
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl px-3 py-2 font-extrabold"
                >
                  {questionType === 'mcq' ? (
                    <>
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </>
                  ) : (
                    <>
                      <option value="True">True</option>
                      <option value="False">False</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Name</label>
                <input
                  type="text"
                  placeholder="e.g. CBSE Board, JEE"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Exam Year</label>
                <input
                  type="number"
                  placeholder="2024"
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Marks (+)</label>
                <input
                  type="number"
                  step="0.5"
                  value={marks}
                  onChange={(e) => setMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Negative (-)</label>
                <input
                  type="number"
                  step="0.25"
                  value={negativeMarks}
                  onChange={(e) => setNegativeMarks(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                />
              </div>
            </div>

          </div>

          {/* Question & Options Content */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Question & Options Content</h2>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Question Text *</label>
                <textarea
                  rows={3}
                  placeholder="Enter the complete question prompt..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Question Image / Diagram Attachment */}
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                      <ImageIcon className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="font-extrabold text-slate-800 text-xs">Question Image / Diagram</span>
                      <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                        Optional
                      </span>
                    </div>
                  </div>

                  {/* Toggle Mode */}
                  <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setImageInputMode('upload')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        imageInputMode === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Upload File
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageInputMode('url')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        imageInputMode === 'url' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        <LinkIcon className="w-3 h-3" /> Image URL
                      </span>
                    </button>
                  </div>
                </div>

                {/* Upload File Mode */}
                {imageInputMode === 'upload' && (
                  <div>
                    <label
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                        isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 bg-white'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileInputChange}
                        className="hidden"
                      />
                      <Upload className="w-6 h-6 text-slate-400 mb-1" />
                      <div className="font-bold text-slate-800 text-xs">
                        Click to browse or drag & drop diagram/image
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        PNG, JPG, SVG, WebP, GIF (Max 5MB)
                      </div>
                    </label>
                  </div>
                )}

                {/* URL Mode */}
                {imageInputMode === 'url' && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/diagram.png or direct image link..."
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setImagePreviewError(false);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {imageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl('');
                            setImagePreviewError(false);
                          }}
                          className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {/* Quick Diagram Presets */}
                    <div className="flex items-center flex-wrap gap-1.5 text-[11px]">
                      <span className="text-slate-400 text-[10px] font-bold">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80');
                          setImagePreviewError(false);
                        }}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                      >
                        Biology Cell
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=600&q=80');
                          setImagePreviewError(false);
                        }}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                      >
                        Physics Optics
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80');
                          setImagePreviewError(false);
                        }}
                        className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors"
                      >
                        Math Geometry
                      </button>
                    </div>
                  </div>
                )}

                {/* Attached Image Preview */}
                {imageUrl && (
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {!imagePreviewError ? (
                          <img
                            src={imageUrl}
                            alt="Attached preview"
                            className="w-full h-full object-cover"
                            onError={() => setImagePreviewError(true)}
                          />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Image Attached</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[260px] sm:max-w-xs font-mono mt-0.5">
                          {imageUrl.startsWith('data:') ? 'Local uploaded file (embedded)' : imageUrl}
                        </div>
                        {imagePreviewError && (
                          <div className="text-[10px] text-amber-600 font-bold mt-0.5">
                            Warning: Image failed to load. Check URL.
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('');
                        setImagePreviewError(false);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors self-end sm:self-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                )}
              </div>

              {questionType === 'mcq' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Option A *</label>
                    <input
                      type="text"
                      value={optionA}
                      onChange={(e) => setOptionA(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Option B *</label>
                    <input
                      type="text"
                      value={optionB}
                      onChange={(e) => setOptionB(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Option C *</label>
                    <input
                      type="text"
                      value={optionC}
                      onChange={(e) => setOptionC(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Option D *</label>
                    <input
                      type="text"
                      value={optionD}
                      onChange={(e) => setOptionD(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Step-by-Step Solution *</label>
                <textarea
                  rows={3}
                  placeholder="Explain why the correct answer is right..."
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Question...' : isEdit ? 'Update Question' : 'Save Question to Bank'}</span>
            </button>
          </div>

        </div>

        {/* RIGHT LIVE PREVIEW PANEL */}
        <div>
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl sticky top-24 space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3 text-xs font-extrabold uppercase text-blue-400 tracking-wider">
              <Eye className="w-4 h-4" /> Live Student Preview
            </div>

            <div className="text-sm font-semibold text-slate-100">
              {questionText || 'Your question text will appear here...'}
            </div>

            {imageUrl && !imagePreviewError && (
              <div className="my-3 rounded-xl overflow-hidden border border-white/15 bg-slate-950/80 p-2.5">
                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3 text-blue-400" /> Attached Figure / Diagram
                </div>
                <img
                  src={imageUrl}
                  alt="Question Diagram"
                  className="max-h-48 w-full object-contain rounded-lg bg-black/40"
                  onError={() => setImagePreviewError(true)}
                />
              </div>
            )}

            <div className="space-y-2 text-xs">
              {[
                { key: 'A', text: optionA },
                { key: 'B', text: optionB },
                { key: 'C', text: optionC },
                { key: 'D', text: optionD },
              ].map((opt) => (
                <div
                  key={opt.key}
                  className={`p-3 rounded-xl border flex items-center gap-3 ${
                    correctAnswer === opt.key
                      ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-bold'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white/10 font-bold flex items-center justify-center">
                    {opt.key}
                  </span>
                  <span>{opt.text || `Option ${opt.key}`}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-400/20 rounded-xl text-xs text-slate-300">
              <div className="font-bold text-blue-300 mb-1">Solution Preview:</div>
              <p className="italic">{solution || 'Step-by-step solution text...'}</p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
