import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getQuestions, getAllAttempts, getRegisteredStudents } from '../services/db';
import { Question, Attempt, User } from '../types';
import { 
  Users, FileSpreadsheet, FileCheck2, PlusCircle, FileUp, 
  Layers, ChevronRight, BarChart2, ShieldAlert, ArrowRight, RefreshCw
} from 'lucide-react';
import { LoadingState } from '../components/LoadingState';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const [questionsCount, setQuestionsCount] = useState<number>(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAdminData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [qs, atts, stds] = await Promise.all([
        getQuestions(),
        getAllAttempts(),
        getRegisteredStudents()
      ]);
      setQuestionsCount(qs.length);
      setAttempts(atts);
      setStudents(stds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (loading) return <LoadingState message="Loading Horizon CBT Admin Control Panel..." />;

  const recentAttempts = attempts.slice(0, 5);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-400/30 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" /> Admin / Teacher Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Horizon CBT Administration
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Manage question bank, bulk CSV imports, curriculum hierarchy, registered candidates, and student test evaluation records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadAdminData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2.5 rounded-xl border border-white/20 transition-colors cursor-pointer disabled:opacity-50"
            title="Sync latest live student & exam metrics from Supabase Cloud"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>
          <Link
            to="/admin/questions/new"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Add Question
          </Link>
          <Link
            to="/admin/import"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/20 transition-colors"
          >
            <FileUp className="w-4 h-4" /> Import CSV
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Registered Students</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{students.length}</div>
          <div className="text-xs text-slate-500 mt-1">Active candidate accounts</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Questions</span>
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{questionsCount}</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Classes IX–XII Question Bank</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Active Tests</span>
            <Layers className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">48</div>
          <div className="text-xs text-slate-500 mt-1">Predefined test templates</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase tracking-wider">
            <span>Tests Attempted</span>
            <FileCheck2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">{attempts.length}</div>
          <div className="text-xs text-slate-500 mt-1">Evaluated student sessions</div>
        </div>
      </div>

      {/* Recent Student Test Submissions Feed */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Candidate Test Submissions</h2>
            <p className="text-xs text-slate-500">Live evaluation feed of student CBT test results</p>
          </div>
          <button
            onClick={() => navigate('/admin/results')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View All Results <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
          {recentAttempts.length > 0 ? (
            recentAttempts.map((att) => (
              <div key={att.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                    {(att.student_name || 'US').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{att.student_name || 'Alex Sharma'}</div>
                    <div className="text-[11px] text-slate-500">{att.test?.title || 'Practice Exam'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold">
                  <div>
                    <span className="text-slate-400 font-normal">Score: </span>
                    <span className="text-slate-900">{att.score} / {att.total_marks}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] ${
                    att.accuracy >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {att.accuracy}% Accuracy
                  </span>
                  <button
                    onClick={() => navigate(`/result/${att.id}`)}
                    className="text-blue-600 hover:underline"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">No student test attempts logged yet.</div>
          )}
        </div>
      </div>

      {/* Admin Quick Modules */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Admin Action Modules</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div
            onClick={() => navigate('/admin/questions')}
            className="p-5 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-blue-700">Question Bank Manager</h3>
            <p className="text-xs text-slate-500 mt-1">Filter, search, edit, delete and preview questions in real time.</p>
            <div className="mt-4 text-xs font-bold text-blue-600 flex items-center gap-1">
              Open Question Bank <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/import')}
            className="p-5 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3">
              <FileUp className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-indigo-700">Bulk CSV Importer</h3>
            <p className="text-xs text-slate-500 mt-1">Upload CSV spreadsheets with validation feedback & error reporting.</p>
            <div className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1">
              Import Questions <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div
            onClick={() => navigate('/admin/results')}
            className="p-5 bg-slate-50 hover:bg-blue-50/60 rounded-xl border border-slate-200 hover:border-blue-300 cursor-pointer transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 group-hover:text-emerald-700">Student Results & Roster</h3>
            <p className="text-xs text-slate-500 mt-1">Inspect individual candidate scores, student names, emails, and response logs.</p>
            <div className="mt-4 text-xs font-bold text-emerald-600 flex items-center gap-1">
              View Results <ChevronRight className="w-4 h-4" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

