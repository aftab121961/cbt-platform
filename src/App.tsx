import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/MainLayout';
import { UserRole } from './types';

// Pages
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { CreateTestPage } from './pages/CreateTestPage';
import { CBTTestInterfacePage } from './pages/CBTTestInterfacePage';
import { ResultDashboardPage } from './pages/ResultDashboardPage';
import { StudentHistoryPage } from './pages/StudentHistoryPage';
import { StudentPerformancePage } from './pages/StudentPerformancePage';

// Admin Pages
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminQuestionBankPage } from './pages/AdminQuestionBankPage';
import { AdminAddEditQuestionPage } from './pages/AdminAddEditQuestionPage';
import { AdminCSVImportPage } from './pages/AdminCSVImportPage';
import { AdminResultsPage } from './pages/AdminResultsPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // If a student attempts to access admin-restricted routes
    if (role === 'student') {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin' || role === 'teacher';

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<LoginPage />} />

      {/* Student App Flow */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
            <MainLayout><StudentDashboard /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-test"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
            <MainLayout><CreateTestPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
            <MainLayout><StudentHistoryPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/performance"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
            <MainLayout><StudentPerformancePage /></MainLayout>
          </ProtectedRoute>
        }
      />

      {/* CBT Distraction-free Fullscreen Exam Mode */}
      <Route
        path="/test/:id"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
            <CBTTestInterfacePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/result/:attemptId"
        element={
          <ProtectedRoute allowedRoles={['student', 'admin', 'teacher']}>
            <MainLayout><ResultDashboardPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin / Teacher Flow - Strictly Restricted to Admin/Teacher */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <MainLayout><AdminDashboardPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions"
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <MainLayout><AdminQuestionBankPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions/new"
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <MainLayout><AdminAddEditQuestionPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/questions/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <MainLayout><AdminAddEditQuestionPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/import"
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <MainLayout><AdminCSVImportPage /></MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/results"
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher']}>
            <MainLayout><AdminResultsPage /></MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route
        path="*"
        element={
          <Navigate to={!user ? "/login" : (isAdmin ? "/admin" : "/dashboard")} replace />
        }
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}

