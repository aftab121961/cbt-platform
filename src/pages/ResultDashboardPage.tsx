import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getAttemptDetails } from '../services/db';
import { Attempt, AttemptAnswer } from '../types';
import { 
  Trophy, Target, CheckCircle, XCircle, HelpCircle, Clock, 
  Sparkles, RotateCcw, LayoutDashboard, Filter, Check, ChevronDown, 
  Image as ImageIcon, ZoomIn, X 
} from 'lucide-react';
import { LoadingState } from '../components/LoadingState';
import { Badge } from '../components/Badge';

export const ResultDashboardPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [answers, setAnswers] = useState<AttemptAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOnlyIncorrect, setFilterOnlyIncorrect] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!attemptId) return;
      setLoading(true);
      try {
        const details = await getAttemptDetails(attemptId);
        if (details) {
          setAttempt(details.attempt);
          setAnswers(details.answers);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [attemptId]);

  if (loading || !attempt) return <LoadingState message="Calculating detailed CBT test results..." />;

  const percentage = attempt.total_marks > 0 
    ? Math.round((attempt.score / attempt.total_marks) * 1000) / 10 
    : 0;

  const filteredAnswers = filterOnlyIncorrect 
    ? answers.filter(a => !a.is_correct && a.selected_answer !== null)
    : answers;

  // Format time taken
  const minutes = Math.floor(attempt.time_taken_seconds / 60);
  const seconds = attempt.time_taken_seconds % 60;
  const timeStr = `${minutes}m ${seconds}s`;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-fadeIn">
      
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full border border-emerald-400/30">
                Test Completed
              </span>
              <span className="text-slate-400 text-xs">• Instant Automated Evaluation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {attempt.test?.title || 'CBT Assessment Result'}
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Detailed performance breakdown and solution review for your attempt.
            </p>
          </div>

          {/* Big Score Visual Badge */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[200px]">
            <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider mb-1">Your Total Score</div>
            <div className="text-4xl font-black text-white">
              {attempt.score} <span className="text-xl text-slate-300 font-normal">/ {attempt.total_marks}</span>
            </div>
            <div className="mt-2 inline-block bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              {percentage}% Marks
            </div>
          </div>
        </div>
      </div>

      {/* 5 Key Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{attempt.correct_count}</div>
          <div className="text-xs text-slate-500 font-semibold">Correct</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
            <XCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{attempt.wrong_count}</div>
          <div className="text-xs text-slate-500 font-semibold">Wrong</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-2">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{attempt.unattempted_count}</div>
          <div className="text-xs text-slate-500 font-semibold">Unattempted</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2">
            <Target className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{attempt.accuracy}%</div>
          <div className="text-xs text-slate-500 font-semibold">Accuracy</div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center col-span-2 sm:col-span-1">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-slate-900">{timeStr}</div>
          <div className="text-xs text-slate-500 font-semibold">Time Taken</div>
        </div>

      </div>

      {/* Action Buttons Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOnlyIncorrect(!filterOnlyIncorrect)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
              filterOnlyIncorrect 
                ? 'bg-rose-600 text-white border-rose-600' 
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {filterOnlyIncorrect ? 'Showing Incorrect Only' : 'Review Incorrect Only'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/create-test"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Take Similar Test
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Detailed Question Review List */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">
          Question Review & Solutions ({filteredAnswers.length})
        </h2>

        {filteredAnswers.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
            No incorrect questions in this test! Great job! 🎉
          </div>
        ) : (
          filteredAnswers.map((ans, idx) => {
            const q = ans.question;
            if (!q) return null;

            return (
              <div
                key={ans.id}
                className={`bg-white rounded-2xl p-6 border transition-all ${
                  ans.is_correct
                    ? 'border-emerald-200/80 shadow-2xs'
                    : ans.selected_answer
                    ? 'border-rose-200 shadow-2xs'
                    : 'border-slate-200 shadow-2xs'
                }`}
              >
                {/* Header info */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-500 uppercase">Q{idx + 1}</span>
                    <Badge type="difficulty" value={q.difficulty} size="sm" />
                    <Badge type="source" value={q.source_type} size="sm" />
                    {q.exam_name && (
                      <span className="text-[11px] font-semibold text-slate-500">({q.exam_name} {q.exam_year})</span>
                    )}
                  </div>

                  <div>
                    {ans.is_correct ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" /> Correct (+{q.marks})
                      </span>
                    ) : ans.selected_answer ? (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect (-{q.negative_marks})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                        Unattempted (0)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-base font-semibold text-slate-900 mb-4">
                  {q.question_text}
                </div>

                {/* Question Diagram if present */}
                {q.image_url && (
                  <div className="mb-4 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        Figure / Diagram
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomImage(q.image_url || null)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5" /> Enlarge
                      </button>
                    </div>
                    <div
                      onClick={() => setZoomImage(q.image_url || null)}
                      className="cursor-zoom-in bg-white rounded-lg p-2 border border-slate-100 flex items-center justify-center"
                    >
                      <img
                        src={q.image_url}
                        alt="Question Diagram"
                        className="max-h-60 w-auto object-contain rounded-md hover:scale-[1.01] transition-transform"
                      />
                    </div>
                  </div>
                )}

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {[
                    { key: 'A', text: q.option_a },
                    { key: 'B', text: q.option_b },
                    { key: 'C', text: q.option_c },
                    { key: 'D', text: q.option_d },
                  ].map((opt) => {
                    const isStudentPick = ans.selected_answer === opt.key;
                    const isCorrectKey = q.correct_answer === opt.key;

                    let optionStyle = 'bg-slate-50 border-slate-200 text-slate-700';

                    if (isCorrectKey) {
                      optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                    } else if (isStudentPick && !isCorrectKey) {
                      optionStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-white border font-bold flex items-center justify-center text-slate-700">
                            {opt.key}
                          </span>
                          <span>{opt.text}</span>
                        </div>
                        {isCorrectKey && <Check className="w-4 h-4 text-emerald-600 font-extrabold" />}
                        {isStudentPick && !isCorrectKey && <XCircle className="w-4 h-4 text-rose-600" />}
                      </div>
                    );
                  })}
                </div>

                {/* Solution Explanation Panel */}
                <div className="p-4 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs space-y-1 text-slate-800">
                  <div className="font-bold text-blue-900 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Step-by-Step Solution:
                  </div>
                  <p className="leading-relaxed text-slate-700 font-medium">
                    {q.solution}
                  </p>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* DIAGRAM FULLSCREEN LIGHTBOX MODAL */}
      {zoomImage && (
        <div 
          onClick={() => setZoomImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-4 shadow-2xl border border-white/20 flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase">
                <ImageIcon className="w-4 h-4 text-blue-600" /> Question Diagram (High Resolution)
              </span>
              <button
                onClick={() => setZoomImage(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto flex-1 p-2 flex items-center justify-center">
              <img 
                src={zoomImage} 
                alt="Diagram Zoomed" 
                className="max-h-[75vh] w-auto object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
