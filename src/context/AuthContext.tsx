import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { saveRegisteredStudent, findStudentByEmail } from '../services/db';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  loginCustom: (email: string, role: UserRole, name?: string, classId?: string, password?: string) => Promise<User>;
  registerStudent: (name: string, email: string, classId: string, password?: string) => Promise<User>;
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
    return user?.class_id || 'jee';
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
      email: email.trim().toLowerCase(),
      role: 'admin',
      created_at: new Date().toISOString()
    };
    setUser(adminUser);
    localStorage.setItem('horizon_cbt_active_user', JSON.stringify(adminUser));
  };

  const loginCustom = async (email: string, targetRole: UserRole, name?: string, classId: string = 'jee', password?: string): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if user already exists in cloud/local
    let resolvedUser: User | null = null;
    if (targetRole === 'student') {
      resolvedUser = await findStudentByEmail(cleanEmail);
    }

    const newUser: User = {
      id: resolvedUser?.id || `user_${Date.now()}`,
      name: name || resolvedUser?.name || (targetRole === 'admin' ? 'Administrator' : cleanEmail.split('@')[0]),
      email: cleanEmail,
      role: targetRole,
      password: password || resolvedUser?.password,
      class_id: targetRole === 'student' ? (classId || resolvedUser?.class_id || 'jee') : undefined,
      created_at: resolvedUser?.created_at || new Date().toISOString()
    };

    setUser(newUser);
    if (targetRole === 'student' && newUser.class_id) {
      setSelectedClassId(newUser.class_id);
    }
    localStorage.setItem('horizon_cbt_active_user', JSON.stringify(newUser));
    return newUser;
  };

  const registerStudent = async (name: string, email: string, classId: string, password?: string): Promise<User> => {
    const cleanEmail = email.trim().toLowerCase();
    const newStudent: User = {
      id: `student_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: cleanEmail,
      role: 'student',
      password: password?.trim(),
      class_id: classId,
      created_at: new Date().toISOString()
    };

    // Save directly to Supabase cloud and local storage
    const savedStudent = await saveRegisteredStudent(newStudent);
    setUser(savedStudent);
    setSelectedClassId(classId);
    localStorage.setItem('horizon_cbt_active_user', JSON.stringify(savedStudent));
    return savedStudent;
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
