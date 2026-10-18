import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllAttempts, getRegisteredStudents, getClasses } from '../services/db';
import { Attempt, User, ClassLevel } from '../types';
import { FileCheck2, ArrowRight, Search, Users, Clock, Award, CheckCircle2, RefreshCw } from 'lucide-react';
import { LoadingState } from '../components/LoadingState';

export const AdminResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'results' | 'students'>('results');

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [atts, stds, cls] = await Promise.all([
        getAllAttempts(),
        getRegisteredStudents(),
        getClasses()
      ]);
      setAttempts(atts);
      setStudents(stds);
      setClasses(cls);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <LoadingState message="Loading candidate evaluation metrics & student roster..." />;

  const filteredAttempts = searchQuery
    ? attempts.filter(a => 
        (a.student_name && a.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.student_email && a.student_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.test?.title && a.test.title.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : attempts;

  const filteredStudents = searchQuery
    ? students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.class_id && s.class_id.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : students;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Candidate Test Results & Student Roster
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time student CBT evaluations, score metrics, accuracy breakdown, and candidate directory.
          </p>
        </div>

        {/* View Switcher Tabs & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex bg-slate-200 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'results' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCheck2 className="w-4 h-4 text-blue-600" />
              <span>Test Results ({attempts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'students' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Registered Students ({students.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Sync latest live student records from Supabase Cloud"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={activeTab === 'results' ? "Search by Student Name, Email, or Test Title..." : "Search by Student Name, Email, or Class..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 1. TEST RESULTS TABLE */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student Candidate</th>
                  <th className="py-3.5 px-4">CBT Test Title</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Accuracy</th>
                  <th className="py-3.5 px-4">Time Taken</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAttempts.length > 0 ? (
                  filteredAttempts.map((att) => {
                    const mins = Math.floor(att.time_taken_seconds / 60);
                    const secs = att.time_taken_seconds % 60;
                    const timeFormatted = `${mins}m ${secs}s`;

                    return (
                      <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">
                              {(att.student_name || 'US').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{att.student_name || 'Alex Sharma'}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{att.student_email || 'alex.student@horizoncbt.edu'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {att.test?.title || 'Practice CBT Exam'}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          {att.score} / {att.total_marks}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                            att.accuracy >= 75
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : att.accuracy >= 50
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}>
                            {att.accuracy}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono font-semibold">
                          {timeFormatted}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] capitalize">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {att.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => navigate(`/result/${att.id}`)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            Inspect <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                      No matching student test attempts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. REGISTERED STUDENTS DIRECTORY TABLE */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Candidate Student</th>
                  <th className="py-3.5 px-4">Registered Email</th>
                  <th className="py-3.5 px-4">Assigned Class</th>
                  <th className="py-3.5 px-4">Tests Completed</th>
                  <th className="py-3.5 px-4">Registration Date</th>
                  <th className="py-3.5 px-4 text-right">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((std) => {
                    const studentAttemptsCount = attempts.filter(a => a.student_id === std.id || a.student_email === std.email).length;
                    
                    return (
                      <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center">
                              {std.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{std.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {std.id.substring(0, 12)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">
                          {std.email}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {std.class_id ? (classes.find(c => c.id === std.class_id)?.name || std.class_id) : 'Class 11'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 font-extrabold text-slate-800 rounded-lg border border-slate-200">
                            {studentAttemptsCount} Exams
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 font-mono">
                          {new Date(std.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-[10px] border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active Student
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                      No registered students match your search filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

