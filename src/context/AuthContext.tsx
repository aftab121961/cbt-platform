import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { saveRegisteredStudent, getRegisteredStudents } from '../services/db';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  loginCustom: (email: string, role: UserRole, name?: string, classId?: string, password?: string) => void;
  registerStudent: (name: string, email: string, classId: string, password?: string) => void;
  loginAdmin: (email: string) => void;
  logout: () => void;
  selectedClassId: string;
  setSelectedClassId: (classId: string) => void;
}

const DEFAULT_ADMIN: User = {
  id: 'user_admin_1',
  name: 'Administrator',
  email: 'admin@horizoncbt.edu',
  role: 'admin',
  created_at: new Date().toISOString()
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('horizon_cbt_active_user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [selectedClassId, setSelectedClassId] = useState<string>(() => {
    return user?.class_id || 'c11';
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('horizon_cbt_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('horizon_cbt_active_user');
    }
  }, [user]);

  const setRole = (newRole: UserRole) => {
    if (newRole === 'admin' || newRole === 'teacher') {
      setUser(DEFAULT_ADMIN);
    }
  };

  const loginAdmin = (email: string) => {
    const adminUser: User = {
      id: `admin_${Date.now()}`,
      name: email.split('@')[0].toUpperCase() === 'ADMIN' ? 'System Administrator' : email.split('@')[0],
      email: email,
      role: 'admin',
      created_at: new Date().toISOString()
    };
    setUser(adminUser);
    localStorage.setItem('horizon_cbt_active_user', JSON.stringify(adminUser));
  };

  const loginCustom = (email: string, targetRole: UserRole, name?: string, classId: string = 'c11', password?: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name || (targetRole === 'admin' ? 'Administrator' : email.split('@')[0]),
      email: email,
      role: targetRole,
      password: password,
      class_id: targetRole === 'student' ? classId : undefined,
      created_at: new Date().toISOString()
    };
    setUser(newUser);
    if (targetRole === 'student') {
      setSelectedClassId(classId);
    }
    localStorage.setItem('horizon_cbt_active_user', JSON.stringify(newUser));
  };

  const registerStudent = (name: string, email: string, classId: string, password?: string) => {
    const newStudent: User = {
      id: `student_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      role: 'student',
      password: password?.trim(),
      class_id: classId,
      created_at: new Date().toISOString()
    };
    setUser(newStudent);
    setSelectedClassId(classId);
    saveRegisteredStudent(newStudent);
    localStorage.setItem('horizon_cbt_active_user', JSON.stringify(newStudent));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('horizon_cbt_active_user');
  };

  const role: UserRole = user?.role || 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        loginCustom,
        loginAdmin,
        registerStudent,
        logout,
        selectedClassId,
        setSelectedClassId
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


