import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole, ClassLevel } from '../types';
import { getRegisteredStudents, getClasses } from '../services/db';
import { GraduationCap, ShieldCheck, UserCheck, Lock, Mail, User as UserIcon, BookOpen, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginCustom, registerStudent, loginAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [studentMode, setStudentMode] = useState<'signin' | 'signup'>('signin');
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classId, setClassId] = useState('jee');
  const [classesList, setClassesList] = useState<ClassLevel[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function fetchClasses() {
      try {
        const cls = await getClasses();
        if (cls && cls.length > 0) {
          setClassesList(cls);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchClasses();
  }, []);

  const clearMessages = () => {
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (activeTab === 'admin') {
      if (!email.trim()) {
        setErrorMsg('Please enter your admin email address.');
        return;
      }
      loginAdmin(email.trim() || 'admin@horizoncbt.edu');
      navigate('/admin');
    } else {
      if (studentMode === 'signup') {
        if (!name.trim() || !email.trim() || !password.trim()) {
          setErrorMsg('Please fill in your full name, email address, and password to register.');
          return;
        }
        registerStudent(name, email, classId, password);
        setSuccessMsg(`Account created successfully! Welcome, ${name}.`);
        setTimeout(() => {
          navigate('/dashboard');
        }, 500);
      } else {
        if (!email.trim()) {
          setErrorMsg('Please enter your registered student email address.');
          return;
        }

        const registeredStudents = await getRegisteredStudents();
        const student = registeredStudents.find(
          s => s.email.trim().toLowerCase() === email.trim().toLowerCase()
        );

        if (!student) {
          setErrorMsg('Student not found, go to new student registration.');
          return;
        }

        if (student.password && student.password !== password.trim()) {
          setErrorMsg('Wrong credential');
          return;
        }

        loginCustom(student.email, 'student', student.name, student.class_id || classId, student.password);
        navigate('/dashboard');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute left-1/4 top-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-1/4 bottom-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl relative z-10 space-y-6 animate-fadeIn">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">HORIZON CBT</h1>
          <p className="text-xs text-slate-500 font-medium">Smart Computer Based Testing Platform</p>
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center animate-fadeIn">
            {successMsg}
          </div>
        )}

        {/* Portal Selection Tabs (Student vs Admin) */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => { setActiveTab('student'); clearMessages(); }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'student'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Student Portal</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('admin'); clearMessages(); }}
            className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Portal</span>
          </button>
        </div>

        {/* Student Sub-Toggle (Sign In vs Register) */}
        {activeTab === 'student' && (
          <div className="flex justify-center gap-4 text-xs font-bold border-b border-slate-100 pb-2">
            <button
              type="button"
              onClick={() => { setStudentMode('signin'); clearMessages(); }}
              className={`pb-1 transition-all ${
                studentMode === 'signin'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              onClick={() => { setStudentMode('signup'); clearMessages(); }}
              className={`pb-1 transition-all ${
                studentMode === 'signup'
                  ? 'text-emerald-600 border-b-2 border-emerald-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              New Student Registration
            </button>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {activeTab === 'student' && studentMode === 'signup' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Student Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {activeTab === 'admin' ? 'Admin Email Address' : 'Student Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                placeholder={
                  activeTab === 'admin' 
                    ? 'admin@horizoncbt.edu' 
                    : studentMode === 'signup' 
                      ? 'student@gmail.com' 
                      : 'student@horizoncbt.edu'
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
            {activeTab === 'admin' && (
              <p className="text-[10px] text-slate-400 mt-1">Default admin email: admin@horizoncbt.edu</p>
            )}
          </div>

          {activeTab === 'student' && studentMode === 'signup' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Class / Target Exam</label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 cursor-pointer"
                >
                  {classesList.length > 0 ? (
                    classesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="c9">Class 9</option>
                      <option value="c10">Class 10</option>
                      <option value="c11">Class 11</option>
                      <option value="c12">Class 12</option>
                      <option value="jee">JEE Mains</option>
                      <option value="neet">NEET</option>
                      <option value="cuet">CUET</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:scale-[1.01] cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-gradient-to-r from-slate-900 to-indigo-950'
                : studentMode === 'signup'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}
          >
            {activeTab === 'admin'
              ? 'Sign In to Admin Portal'
              : studentMode === 'signup'
                ? 'Register Student Account & Start CBT'
                : 'Sign In to Student Account'}
          </button>
        </form>

        <p className="text-[11px] text-slate-400 text-center">
          Horizon CBT © 2026 — Real-time Computer Based Testing Platform
        </p>
      </div>
    </div>
  );
};



