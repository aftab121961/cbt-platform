import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getTestById, getQuestions, createAttempt, submitAttempt } from '../services/db';
import { Test, Question, Attempt } from '../types';
import { 
  Clock, AlertTriangle, CheckCircle2, Bookmark, ArrowLeft, ArrowRight, 
  RotateCcw, Send, Menu, X, ShieldAlert, GraduationCap, ZoomIn, Image as ImageIcon 
} from 'lucide-react';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { LoadingState } from '../components/LoadingState';

export const CBTTestInterfacePage: React.FC = () => {
  const { id: testId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Test & Attempt State
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Exam Navigation State
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // User Answers State: question_id -> { selectedAnswer, markedForReview, timeSpentSeconds, visited }
  const [answersState, setAnswersState] = useState<Record<string, {
    selectedAnswer: string | null;
    markedForReview: boolean;
    timeSpentSeconds: number;
    visited: boolean;
  }>>({});

  // Timer State (seconds remaining)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [mobilePaletteOpen, setMobilePaletteOpen] = useState<boolean>(false);
  const [timerWarningMessage, setTimerWarningMessage] = useState<string | null>(null);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // Timer reference & Auto-save
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Load Test & Questions & Initialize Attempt
  useEffect(() => {
    async function initTestSession() {
      if (!testId) return;
      setLoading(true);

      try {
        const loadedTest = await getTestById(testId);
        if (!loadedTest) {
          setLoading(false);
          return;
        }
        setTest(loadedTest);

        // Try getting questions from sessionStorage first, or fetch from DB
        let loadedQuestions: Question[] = [];
        const cachedStr = sessionStorage.getItem(`test_questions_${testId}`);
        if (cachedStr) {
          loadedQuestions = JSON.parse(cachedStr);
        } else {
          loadedQuestions = await getQuestions({
            class_id: loadedTest.class_id,
            subject_id: loadedTest.subject_id,
            chapter_id: loadedTest.chapter_id || undefined
          });
          if (loadedQuestions.length > loadedTest.number_of_questions) {
            loadedQuestions = loadedQuestions.slice(0, loadedTest.number_of_questions);
          }
        }

        setQuestions(loadedQuestions);

        // Initial Answer State map
        const initialMap: Record<string, any> = {};
        loadedQuestions.forEach((q, idx) => {
          initialMap[q.id] = {
            selectedAnswer: null,
            markedForReview: false,
            timeSpentSeconds: 0,
            visited: idx === 0 // Mark first visited
          };
        });
        setAnswersState(initialMap);

        // Set Countdown Timer
        const durationSecs = (loadedTest.duration_minutes || 15) * 60;
        setTimeLeftSeconds(durationSecs);

        // Create Attempt Record
        const newAtt = await createAttempt(
          testId, 
          user?.id || 'user_student_1',
          user?.name || 'Alex Sharma',
          user?.email || 'alex.student@horizoncbt.edu'
        );
        setAttempt(newAtt);

      } catch (err) {
        console.error('Test Session Init Error:', err);
      } finally {
        setLoading(false);
      }
    }

    initTestSession();
  }, [testId, user]);

  // Timer Tick Interval
  useEffect(() => {
    if (loading || !test || timeLeftSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }

        // Warnings at 10m, 5m, 1m
        if (prev === 600) setTimerWarningMessage('10 minutes remaining!');
        if (prev === 300) setTimerWarningMessage('5 minutes remaining! Please review your answers.');
        if (prev === 60) setTimerWarningMessage('1 minute remaining! Test will auto-submit shortly.');

        return prev - 1;
      });

      // Update time spent on active question
      if (questions[currentIndex]) {
        const qId = questions[currentIndex].id;
        setAnswersState((prev) => ({
          ...prev,
          [qId]: {
            ...prev[qId],
            timeSpentSeconds: (prev[qId]?.timeSpentSeconds || 0) + 1
          }
        }));
      }

    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, test, currentIndex, questions]);

  // Handle Option Select
  const handleSelectOption = (optionKey: string) => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;

    setAnswersState((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        selectedAnswer: optionKey,
        visited: true
      }
    }));
  };

  // Clear Response
  const handleClearResponse = () => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;

    setAnswersState((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        selectedAnswer: null
      }
    }));
  };

  // Toggle Mark for Review
  const handleToggleMarkForReview = () => {
    if (!questions[currentIndex]) return;
    const qId = questions[currentIndex].id;

    setAnswersState((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        markedForReview: !prev[qId]?.markedForReview
      }
    }));
  };

  // Question Navigation
  const navigateToQuestion = (index: number) => {
    if (index < 0 || index >= questions.length) return;
    setCurrentIndex(index);
    const qId = questions[index].id;
    setAnswersState((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        visited: true
      }
    }));
  };

  // Auto-submit on Timer Expiry
  const handleAutoSubmit = async () => {
    await executeSubmission();
  };

  // User Final Submission
  const executeSubmission = async () => {
    if (!attempt) return;
    try {
      const result = await submitAttempt(attempt.id, answersState, questions);
      navigate(`/result/${result.attempt.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to submit test. Please try again.');
    }
  };

  if (loading || !test) return <LoadingState message="Launching Horizon CBT exam engine..." />;

  const currentQ = questions[currentIndex];
  const currentAns = currentQ ? answersState[currentQ.id] : null;

  // Format Timer String (MM:SS)
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Counts for Palette & Modal
  let answeredCount = 0;
  let markedCount = 0;
  let unattemptedCount = 0;

  questions.forEach(q => {
    const state = answersState[q.id];
    if (state?.selectedAnswer) {
      answeredCount++;
    } else {
      unattemptedCount++;
    }
    if (state?.markedForReview) {
      markedCount++;
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 flex flex-col no-select font-sans">
      
      {/* 1. TOP EXAM HEADER */}
      <header className="bg-slate-900 text-white px-4 sm:px-6 py-3 flex items-center justify-between shadow-md border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-sm">
            H
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight">{test.title}</h1>
            <p className="text-[11px] text-slate-400">Horizon CBT Exam Environment</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Countdown Timer */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
            timeLeftSeconds < 300 
              ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse' 
              : 'bg-slate-800 text-emerald-400 border-slate-700'
          }`}>
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>TIME LEFT {timeFormatted}</span>
          </div>

          {/* Submit Test Button Header */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Test</span>
          </button>

          {/* Mobile Drawer Toggle */}
          <button
            onClick={() => setMobilePaletteOpen(!mobilePaletteOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Timer Warning Banner if triggered */}
      {timerWarningMessage && (
        <div className="bg-amber-500 text-slate-950 text-xs font-bold py-1.5 px-4 text-center flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{timerWarningMessage}</span>
          <button onClick={() => setTimerWarningMessage(null)} className="ml-2 underline text-slate-900">Dismiss</button>
        </div>
      )}

      {/* 2. MAIN EXAM BODY */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT QUESTION CONTAINER */}
        <div className="flex-1 flex flex-col bg-white overflow-y-auto p-4 sm:p-8">
          
          {currentQ ? (
            <div className="max-w-3xl mx-auto w-full space-y-6 flex-1 flex flex-col">
              
              {/* Question Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500">Marks: +{currentQ.marks}</span>
                  {currentQ.negative_marks > 0 && (
                    <span className="text-xs font-bold text-rose-500">-{currentQ.negative_marks}</span>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
                {currentQ.question_text}
              </div>

              {currentQ.image_url && (
                <div className="my-4 bg-slate-50 border border-slate-200/90 rounded-2xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider">
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      Figure / Diagram
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomImage(currentQ.image_url || null)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-white border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" /> Enlarge Diagram
                    </button>
                  </div>
                  <div 
                    onClick={() => setZoomImage(currentQ.image_url || null)}
                    className="cursor-zoom-in group relative overflow-hidden rounded-xl bg-white border border-slate-100 flex items-center justify-center p-2"
                  >
                    <img 
                      src={currentQ.image_url} 
                      alt="Question Diagram" 
                      className="max-h-72 w-auto object-contain rounded-lg group-hover:scale-[1.01] transition-transform duration-200" 
                    />
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="space-y-3 mt-4 flex-1">
                {[
                  { key: 'A', text: currentQ.option_a },
                  { key: 'B', text: currentQ.option_b },
                  { key: 'C', text: currentQ.option_c },
                  { key: 'D', text: currentQ.option_d },
                ].filter(opt => currentQ.question_type === 'mcq' || (currentQ.question_type === 'true_false' && (opt.key === 'A' || opt.key === 'B'))).map((opt) => {
                  const isSelected = currentAns?.selectedAnswer === opt.key;
                  return (
                    <div
                      key={opt.key}
                      onClick={() => handleSelectOption(opt.key)}
                      className={`p-4 rounded-xl border-2 flex items-center gap-4 cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 font-bold text-sm flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-slate-300 text-slate-600'
                      }`}>
                        {opt.key}
                      </div>
                      <div className="font-medium text-sm sm:text-base">{opt.text}</div>
                    </div>
                  );
                })}
              </div>

              {/* Footer Action Buttons */}
              <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 mt-auto">
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={() => navigateToQuestion(currentIndex - 1)}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Previous
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleMarkForReview}
                    className={`px-4 py-2.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
                      currentAns?.markedForReview
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5 fill-current" />
                    {currentAns?.markedForReview ? 'Marked' : 'Mark for Review'}
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearResponse}
                    className="px-3.5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Clear Response
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentIndex < questions.length - 1) {
                        navigateToQuestion(currentIndex + 1);
                      } else {
                        setShowSubmitModal(true);
                      }
                    }}
                    className="px-6 py-2.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors flex items-center gap-1"
                  >
                    Save & Next <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>

            </div>
          ) : (
            <div className="text-center py-12">No question loaded.</div>
          )}

        </div>

        {/* RIGHT QUESTION PALETTE SIDEBAR (DESKTOP) */}
        <div className="hidden md:flex w-80 bg-slate-50 border-l border-slate-200 flex-col p-5 overflow-y-auto">
          <h2 className="font-extrabold text-slate-900 text-sm mb-3 uppercase tracking-wider">
            Question Palette
          </h2>

          {/* Palette Legend */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 mb-5 p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-300" />
              <span>Not Visited</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span>Visited Unanswered</span>
            </div>
          </div>

          {/* Grid of Question Numbers */}
          <div className="grid grid-cols-5 gap-2.5 flex-1 align-content-start">
            {questions.map((q, idx) => {
              const state = answersState[q.id];
              const isCurrent = idx === currentIndex;

              let btnClasses = 'bg-slate-200 text-slate-700 hover:bg-slate-300';

              if (state?.selectedAnswer && state?.markedForReview) {
                btnClasses = 'bg-indigo-600 text-white border-2 border-amber-400';
              } else if (state?.selectedAnswer) {
                btnClasses = 'bg-emerald-600 text-white';
              } else if (state?.markedForReview) {
                btnClasses = 'bg-amber-500 text-white';
              } else if (state?.visited) {
                btnClasses = 'bg-rose-100 text-rose-800 border border-rose-300';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => navigateToQuestion(idx)}
                  className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${btnClasses} ${
                    isCurrent ? 'ring-2 ring-blue-600 ring-offset-2 font-black scale-105' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Summary Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex justify-between">
              <span>Answered:</span>
              <span className="text-emerald-600 font-bold">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Unanswered:</span>
              <span className="text-slate-500 font-bold">{unattemptedCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Marked for Review:</span>
              <span className="text-amber-600 font-bold">{markedCount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* CONFIRMATION SUBMISSION DIALOG */}
      <ConfirmDialog
        isOpen={showSubmitModal}
        title="Submit Horizon CBT Test?"
        message="Are you sure you want to finalize and submit your exam? Your results will be calculated automatically."
        confirmLabel="Submit Exam Now"
        cancelLabel="Continue Exam"
        variant="warning"
        onConfirm={executeSubmission}
        onCancel={() => setShowSubmitModal(false)}
        detailsSummary={[
          { label: 'Answered', value: answeredCount },
          { label: 'Unattempted', value: unattemptedCount },
          { label: 'Marked', value: markedCount },
        ]}
      />

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
