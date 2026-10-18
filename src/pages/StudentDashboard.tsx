import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentAttempts, getClasses, getSubjects } from '../services/db';
import { Attempt, ClassLevel, Subject } from '../types';
import { 
  Trophy, Target, FileCheck2, Zap, ArrowRight, Play, Clock, 
  Sparkles, AlertCircle, CheckCircle2, ChevronRight, BookOpen 
} from 'lucide-react';
import { LoadingState } from '../components/LoadingState';

export const StudentDashboard: React.FC = () => {
  const { user, selectedClassId, setSelectedClassId } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [atts, cls, subjs] = await Promise.all([
          getStudentAttempts(user?.id || '', user?.email || ''),
          getClasses(),
          getSubjects(selectedClassId)
        ]);
        setAttempts(atts);
        setClasses(cls);
        setSubjects(subjs);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, [user, selectedClassId]);

  // Compute Statistics
  const completedAttempts = attempts.filter(a => a.status === 'completed');
  const testsAttemptedCount = completedAttempts.length;

  const totalScore = completedAttempts.reduce((acc, a) => acc + a.score, 0);
  const totalMaxMarks = completedAttempts.reduce((acc, a) => acc + a.total_marks, 0);
  const avgScore = testsAttemptedCount > 0 ? (totalScore / testsAttemptedCount).toFixed(1) : '0';
  
  const avgAccuracy = testsAttemptedCount > 0 
    ? Math.round(completedAttempts.reduce((acc, a) => acc + a.accuracy, 0) / testsAttemptedCount) 
    : 0;

  const bestScore = testsAttemptedCount > 0 
    ? Math.max(...completedAttempts.map(a => a.score)) 
    : 0;

  if (loading) return <LoadingState message="Loading your student dashboard..." />;

  const currentClassObj = classes.find(c => c.id === selectedClassId) || classes[6] || classes[0];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full border border-blue-400/30">
                Active: {currentClassObj?.name || 'Class 11'}
              </span>
              <span className="text-slate-400 text-xs">• Computer Based Testing</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-blue-400">{user?.name || 'Student'}</span>! 👋
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Ready to test your concept mastery? Create custom chapter tests, practice mock PYQs, and track your progress in real time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Class Selector */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="bg-white/10 text-white border border-white/20 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id} className="text-slate-900">
                  {c.name}
                </option>
              ))}
            </select>

            <Link
              to="/create-test"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4 fill-white" />
              Start a New Test
            </Link>
          </div>
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tests Attempted</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{testsAttemptedCount}</span>
            <span className="text-xs text-slate-500 ml-2">completed</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Score</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{avgScore}</span>
            <span className="text-xs text-slate-500 ml-2">pts / test</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Accuracy</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{avgAccuracy}%</span>
            <span className="text-xs text-emerald-600 font-semibold ml-2">overall</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Best Score</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{bestScore}</span>
            <span className="text-xs text-slate-500 ml-2">high mark</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Quick Start + Recent Tests, Right Weak Topics & AI Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Subject Launch Cards */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Start a New Test</h2>
                <p className="text-xs text-slate-500">Pick a subject in {currentClassObj?.name} to configure a practice session</p>
              </div>
              <Link to="/create-test" className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                Custom Wizard <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {subjects.map((subj) => (
                <div
                  key={subj.id}
                  onClick={() => navigate(`/create-test?subject=${subj.id}`)}
                  className="group p-4 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{subj.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">Chapter & Topic Tests</p>
                  <div className="mt-4 flex items-center text-xs font-bold text-blue-600">
                    Configure Test <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tests Table */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Tests</h2>
              <Link to="/history" className="text-xs font-bold text-blue-600 hover:text-blue-800">
                View All History
              </Link>
            </div>

            {completedAttempts.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No tests attempted yet.</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">Click below to take your first CBT exam!</p>
                <Link
                  to="/create-test"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg"
                >
                  Start First Test
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Test Title</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Accuracy</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {completedAttempts.slice(0, 5).map((att) => (
                      <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {att.test?.title || 'Practice CBT Test'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(att.started_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900">{att.score}</span>
                          <span className="text-slate-400"> / {att.total_marks}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            att.accuracy >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {att.accuracy}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => navigate(`/result/${att.id}`)}
                            className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                          >
                            View Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: AI Insights & Weak Topics */}
        <div className="space-y-6">
          
          {/* Weak Topics Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Weak Topics Focus</h2>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                <div className="flex justify-between text-xs font-bold text-amber-900 mb-1">
                  <span>Laws of Motion - Friction</span>
                  <span>45% Accuracy</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/60">
                <div className="flex justify-between text-xs font-bold text-amber-900 mb-1">
                  <span>Quadratic Equations - Discriminant</span>
                  <span>52% Accuracy</span>
                </div>
                <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-amber-600 h-1.5 rounded-full" style={{ width: '52%' }} />
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate('/create-test')}
              className="w-full mt-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              Take Targeted Weak Topic Test
            </button>
          </div>

          {/* Recommended Practice */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-100 shadow-xs">
            <div className="flex items-center gap-2 text-indigo-900 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-base">Recommended Practice</h3>
            </div>
            <p className="text-xs text-indigo-700 mb-4">
              AI suggests taking a 15-minute 10-Question speed drill on Class XI Physics Kinematics to boost your speed.
            </p>
            <button
              onClick={() => navigate('/create-test')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md transition-colors"
            >
              Start Recommended Session
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
