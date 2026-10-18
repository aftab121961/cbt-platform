import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentAttempts, getSubjects } from '../services/db';
import { Attempt, Subject } from '../types';
import { History, Filter, Search, FileText, ArrowRight } from 'lucide-react';
import { LoadingState } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';

export const StudentHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    async function loadHistory() {
      setLoading(true);
      try {
        const [atts, subjs] = await Promise.all([
          getStudentAttempts(user?.id || '', user?.email || ''),
          getSubjects()
        ]);
        setAttempts(atts);
        setSubjects(subjs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  if (loading) return <LoadingState message="Loading your attempt history..." />;

  // Apply Filters
  let filteredAttempts = attempts;
  if (selectedSubjectId) {
    filteredAttempts = filteredAttempts.filter(a => a.test?.subject_id === selectedSubjectId);
  }
  if (searchQuery) {
    const qLower = searchQuery.toLowerCase();
    filteredAttempts = filteredAttempts.filter(a => 
      a.test?.title.toLowerCase().includes(qLower)
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          <History className="w-4 h-4" />
          <span>My Test Records</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Attempt History
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review all your completed and past CBT test sessions, scores, and accuracy trends.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search tests by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Table */}
      {filteredAttempts.length === 0 ? (
        <EmptyState
          title="No attempt records found"
          description="You haven't attempted any tests matching your search parameters."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Test Title</th>
                  <th className="py-3.5 px-4">Questions</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Accuracy</th>
                  <th className="py-3.5 px-4">Time Taken</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredAttempts.map((att) => {
                  const percentage = att.total_marks > 0 ? Math.round((att.score / att.total_marks) * 100) : 0;
                  const mins = Math.floor(att.time_taken_seconds / 60);
                  const secs = att.time_taken_seconds % 60;

                  return (
                    <tr 
                      key={att.id}
                      onClick={() => navigate(`/result/${att.id}`)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                    >
                      <td className="py-4 px-4 text-slate-500 font-semibold">
                        {new Date(att.started_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-900">
                        {att.test?.title || 'Practice Test'}
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-semibold">
                        {att.test?.number_of_questions || 10} Qs
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-slate-900">{att.score}</span>
                        <span className="text-slate-400"> / {att.total_marks}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md font-bold ${
                          att.accuracy >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {att.accuracy}%
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-600 font-semibold">
                        {mins}m {secs}s
                      </td>
                      <td className="py-4 px-4">
                        <span className="capitalize px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                          {att.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1">
                          Result <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
