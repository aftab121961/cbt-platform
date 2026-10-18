import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  getQuestions, deleteQuestion, clearAllQuestions, getClasses, getSubjects, 
  getChapters, getTopics 
} from '../services/db';
import { 
  Question, ClassLevel, Subject, Chapter, Topic 
} from '../types';
import { 
  PlusCircle, FileUp, Search, Filter, Trash2, Edit3, Eye, 
  Copy, AlertTriangle, X, Image as ImageIcon 
} from 'lucide-react';
import { LoadingState } from '../components/LoadingState';
import { Badge } from '../components/Badge';
import { ConfirmDialog } from '../components/ConfirmDialog';

export const AdminQuestionBankPage: React.FC = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterChapter, setFilterChapter] = useState<string>('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    async function loadMasterData() {
      setLoading(true);
      try {
        const [cls, subjs, chaps, tops] = await Promise.all([
          getClasses(),
          getSubjects(),
          getChapters(),
          getTopics()
        ]);
        setClasses(cls);
        setSubjects(subjs);
        setChapters(chaps);
        setTopics(tops);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMasterData();
  }, []);

  // Fetch Questions when filters change
  useEffect(() => {
    async function fetchFilteredQuestions() {
      const list = await getQuestions({
        class_id: filterClass || undefined,
        subject_id: filterSubject || undefined,
        chapter_id: filterChapter || undefined,
        difficulty: filterDifficulty || undefined,
        source_type: filterSource || undefined,
        search_query: searchQuery || undefined
      });
      setQuestions(list);
    }
    fetchFilteredQuestions();
  }, [filterClass, filterSubject, filterChapter, filterDifficulty, filterSource, searchQuery]);

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    await deleteQuestion(deleteTargetId);
    setQuestions(prev => prev.filter(q => q.id !== deleteTargetId));
    setDeleteTargetId(null);
  };

  const handleClearAll = async () => {
    await clearAllQuestions();
    setQuestions([]);
    setShowClearConfirm(false);
  };

  if (loading) return <LoadingState message="Loading Question Bank repository..." />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Question Bank Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Total {questions.length} questions matching criteria across Classes IX–XII.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            disabled={questions.length === 0}
            className="inline-flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold px-3.5 py-2.5 rounded-xl border border-rose-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Clear All Questions
          </button>
          <Link
            to="/admin/import"
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-300 transition-colors"
          >
            <FileUp className="w-4 h-4" /> Import CSV
          </Link>
          <Link
            to="/admin/questions/new"
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Add Question
          </Link>
        </div>
      </div>

      {/* Comprehensive Filter Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters & Search</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          
          {/* Search Query */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search question text or exam name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Class Filter */}
          <select
            value={filterClass}
            onChange={(e) => {
              setFilterClass(e.target.value);
              setFilterSubject('');
              setFilterChapter('');
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All Classes / Exams</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Subject Filter */}
          <select
            value={filterSubject}
            onChange={(e) => {
              setFilterSubject(e.target.value);
              setFilterChapter('');
            }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All Subjects</option>
            {subjects
              .filter(s => !filterClass || s.class_id === filterClass)
              .map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {!filterClass ? `(${classes.find(c => c.id === s.class_id)?.name || s.class_id})` : ''}
                </option>
              ))}
          </select>

          {/* Difficulty Filter */}
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {/* Source Type */}
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800"
          >
            <option value="">All Sources</option>
            <option value="practice">Practice</option>
            <option value="pyq">PYQ</option>
          </select>

        </div>
      </div>

      {/* Questions Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {questions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No questions match your filter criteria. Try resetting your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Q ID</th>
                  <th className="py-3.5 px-4 min-w-[250px]">Question Text</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Chapter & Topic</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4">Correct</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {questions.map((q) => {
                  const classObj = classes.find(c => c.id === q.class_id);
                  const subjObj = subjects.find(s => s.id === q.subject_id);
                  const chapObj = chapters.find(c => c.id === q.chapter_id);
                  const topicObj = topics.find(t => t.id === q.topic_id);

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                        {q.id.substring(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-[280px]">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{q.question_text}</span>
                          {q.image_url && (
                            <span 
                              title="Question has attached diagram / image"
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex-shrink-0"
                            >
                              <ImageIcon className="w-3 h-3 text-blue-600" /> Image
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-bold">
                        {classObj?.name || 'Class 9'}
                      </td>
                      <td className="py-3.5 px-4 text-indigo-700 font-semibold">
                        {subjObj?.name || 'Science'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-bold text-slate-800 truncate max-w-[170px]" title={chapObj?.name}>{chapObj?.name || '-'}</div>
                        <div className="text-[11px] text-blue-600 font-medium truncate max-w-[170px]" title={topicObj?.name}>{topicObj?.name || '-'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge type="difficulty" value={q.difficulty} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge type="source" value={q.source_type} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        Opt ({q.correct_answer})
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewQuestion(q)}
                            title="Preview Question"
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                            title="Edit Question"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(q.id)}
                            title="Delete Question"
                            className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PREVIEW QUESTION MODAL */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setPreviewQuestion(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-extrabold text-slate-900 text-lg mb-4">Question Preview Panel</h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-2">
                <Badge type="difficulty" value={previewQuestion.difficulty} />
                <Badge type="source" value={previewQuestion.source_type} />
                {previewQuestion.exam_name && (
                  <span className="font-bold text-slate-600">({previewQuestion.exam_name} {previewQuestion.exam_year})</span>
                )}
              </div>

              <div className="text-base font-semibold text-slate-900 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {previewQuestion.question_text}
              </div>

              {previewQuestion.image_url && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-bold text-slate-600 mb-2 flex items-center gap-1 uppercase">
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" /> Attached Diagram
                  </div>
                  <div className="bg-white rounded-lg p-2 border border-slate-200 flex items-center justify-center">
                    <img
                      src={previewQuestion.image_url}
                      alt="Question diagram"
                      className="max-h-52 w-auto object-contain rounded-md"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2.5 rounded-lg border font-medium ${previewQuestion.correct_answer === 'A' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'bg-slate-50'}`}>
                  A. {previewQuestion.option_a}
                </div>
                <div className={`p-2.5 rounded-lg border font-medium ${previewQuestion.correct_answer === 'B' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'bg-slate-50'}`}>
                  B. {previewQuestion.option_b}
                </div>
                <div className={`p-2.5 rounded-lg border font-medium ${previewQuestion.correct_answer === 'C' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'bg-slate-50'}`}>
                  C. {previewQuestion.option_c}
                </div>
                <div className={`p-2.5 rounded-lg border font-medium ${previewQuestion.correct_answer === 'D' ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold' : 'bg-slate-50'}`}>
                  D. {previewQuestion.option_d}
                </div>
              </div>

              <div className="p-3 bg-blue-50 text-blue-900 rounded-xl border border-blue-200">
                <div className="font-bold mb-1">Solution Explanation:</div>
                <p>{previewQuestion.solution}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetId)}
        title="Delete Question?"
        message="Are you sure you want to delete this question from the Question Bank? This action cannot be undone."
        confirmLabel="Delete Question"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* CONFIRM CLEAR ALL QUESTIONS DIALOG */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear All Questions from Question Bank?"
        message="Are you sure you want to permanently delete all questions from the Question Bank? This will wipe the question repository clean so you can upload fresh questions via CSV."
        confirmLabel="Yes, Clear All Questions"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />

    </div>
  );
};
