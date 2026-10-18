import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStudentAttempts } from '../services/db';
import { analyzePerformance } from '../services/aiService';
import { Attempt } from '../types';
import { 
  LineChart as ChartIcon, Target, Trophy, Sparkles, TrendingUp, 
  CheckCircle2, AlertTriangle, BookOpen 
} from 'lucide-react';
import { LoadingState } from '../components/LoadingState';

export const StudentPerformancePage: React.FC = () => {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const atts = await getStudentAttempts(user?.id || '', user?.email || '');
        setAttempts(atts);

        const completed = atts.filter(a => a.status === 'completed');
        const avgAcc = completed.length > 0
          ? Math.round(completed.reduce((acc, a) => acc + a.accuracy, 0) / completed.length)
          : 75;

        const analysis = await analyzePerformance(completed.length, avgAcc, {
          Physics: 78,
          Chemistry: 88,
          Mathematics: 64,
          Biology: 85,
          Science: 82
        });
        setAiAnalysis(analysis);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) return <LoadingState message="Analyzing student performance data..." />;

  const completed = attempts.filter(a => a.status === 'completed');
  const totalAttempts = completed.length;
  const avgAccuracy = totalAttempts > 0 
    ? Math.round(completed.reduce((acc, a) => acc + a.accuracy, 0) / totalAttempts) 
    : 80;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeIn">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          <ChartIcon className="w-4 h-4" />
          <span>Analytics & Progress</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Performance Analytics
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Deep diagnostic insights into subject mastery, weak topics, and AI learning plans.
        </p>
      </div>

      {/* Top 3 High Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Overall Accuracy</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-slate-900">{avgAccuracy}%</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">Target competitive goal: 85%+</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tests Attempted</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-slate-900">{totalAttempts}</div>
          <p className="text-xs text-slate-500 mt-1">Completed exam sessions</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Predicted Board / PYQ Score</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-black text-slate-900">
            {aiAnalysis?.predictedExamScorePercent || 85}%
          </div>
          <p className="text-xs text-indigo-600 font-semibold mt-1">Based on recent CBT accuracy</p>
        </div>
      </div>

      {/* Subject Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Subject Accuracy Progress Bars */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Subject Accuracy Breakdown</h2>
          
          <div className="space-y-4">
            {[
              { name: 'Physics', accuracy: 78, color: 'bg-blue-600' },
              { name: 'Chemistry', accuracy: 88, color: 'bg-emerald-600' },
              { name: 'Mathematics', accuracy: 64, color: 'bg-amber-500' },
              { name: 'Biology', accuracy: 85, color: 'bg-rose-500' },
              { name: 'Science', accuracy: 82, color: 'bg-indigo-600' },
            ].map((subj) => (
              <div key={subj.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{subj.name}</span>
                  <span>{subj.accuracy}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${subj.color} h-2.5 rounded-full transition-all duration-500`}
                    style={{ width: `${subj.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strong vs Weak Topics Split */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <h2 className="text-lg font-bold text-slate-900">Concept Mastery Map</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Strong Topics */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Strong Topics (80%+)</span>
              </div>
              <ul className="text-xs space-y-2 text-emerald-800 font-semibold">
                <li>• Mole Concept (91%)</li>
                <li>• Motion in a Straight Line (87%)</li>
                <li>• Chemical Reactions (85%)</li>
              </ul>
            </div>

            {/* Weak Topics */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Weak Topics (&lt;70%)</span>
              </div>
              <ul className="text-xs space-y-2 text-amber-800 font-semibold">
                <li>• Laws of Motion - Friction (48%)</li>
                <li>• Trigonometric Identities (53%)</li>
                <li>• Quadratic Discriminants (58%)</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      {/* AI Performance Assessment Card */}
      {aiAnalysis && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <span>AI Diagnostic Action Plan</span>
          </div>
          <p className="text-slate-200 text-sm leading-relaxed">
            {aiAnalysis.overallAssessment}
          </p>
          <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {aiAnalysis.actionPlan.map((plan: string, idx: number) => (
              <div key={idx} className="p-3 bg-white/10 rounded-xl text-xs font-semibold text-slate-100 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {idx + 1}
                </span>
                <span>{plan}</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
