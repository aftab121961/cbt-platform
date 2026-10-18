import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, LayoutDashboard, FileSpreadsheet, History, 
  LineChart, ShieldAlert, User, LogOut, ChevronDown, Check
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, role, setRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isStudent = role === 'student';
  const isAdmin = role === 'admin' || role === 'teacher';

  const isCurrent = (path: string) => location.pathname === path;

  const navItemClass = (path: string) =>
    `inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isCurrent(path)
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left Logo */}
          <div className="flex items-center">
            <Link to={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-slate-900">HORIZON</span>
                  <span className="text-xs font-black uppercase tracking-wider bg-blue-600 text-white px-1.5 py-0.5 rounded">CBT</span>
                </div>
                <p className="text-[10px] font-medium text-slate-500 tracking-tight">Smart Testing Platform</p>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex ml-8 space-x-1">
              {isStudent && (
                <>
                  <Link to="/dashboard" className={navItemClass('/dashboard')}>
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Dashboard
                  </Link>
                  <Link to="/create-test" className={navItemClass('/create-test')}>
                    <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                    Take Test
                  </Link>
                  <Link to="/history" className={navItemClass('/history')}>
                    <History className="w-4 h-4 mr-1.5" />
                    My Tests
                  </Link>
                  <Link to="/performance" className={navItemClass('/performance')}>
                    <LineChart className="w-4 h-4 mr-1.5" />
                    Performance
                  </Link>
                </>
              )}

              {isAdmin && (
                <>
                  <Link to="/admin" className={navItemClass('/admin')}>
                    <LayoutDashboard className="w-4 h-4 mr-1.5" />
                    Admin Overview
                  </Link>
                  <Link to="/admin/questions" className={navItemClass('/admin/questions')}>
                    <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                    Question Bank
                  </Link>
                  <Link to="/admin/import" className={navItemClass('/admin/import')}>
                    Import CSV
                  </Link>
                  <Link to="/admin/results" className={navItemClass('/admin/results')}>
                    Student Results
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Actions & User Profile */}
          <div className="flex items-center gap-3">
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
              <span className={`w-2 h-2 rounded-full ${isStudent ? 'bg-blue-600' : 'bg-indigo-600'}`} />
              <span className="capitalize">{role === 'student' ? 'Student Portal' : 'Admin Portal'}</span>
            </div>

            {/* User Profile Info */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                isStudent ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight">{user?.name || 'User'}</div>
                <div className="text-[10px] text-slate-500 capitalize">{role}</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Logout"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
