import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { auth } from '../../lib/firebase';
import { LogOut, User, Moon, Sun, LayoutDashboard, Library } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="h-16 bg-white dark:bg-zinc-950 border-b border-slate-200 dark:border-zinc-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
              <h1 className="text-slate-900 dark:text-zinc-50 font-bold text-lg tracking-tight">Platzi Lite</h1>
            </Link>
            
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-zinc-50 uppercase tracking-widest transition-colors">
                Marketplace
              </Link>
              {user && (
                <Link to="/my-courses" className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-zinc-50 uppercase tracking-widest transition-colors">
                  My Library
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               SERVER ONLINE
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>

              {user ? (
                <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-zinc-800">
                  <Link
                    to="/profile"
                    className="flex items-center gap-2 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-indigo-500/10 group-hover:scale-105 transition-transform">
                       {profile?.fullName?.[0] || 'U'}
                    </div>
                    <div className="hidden lg:block text-left leading-tight">
                       <p className="text-xs font-bold text-slate-900 dark:text-zinc-50 truncate max-w-[120px]">{profile?.fullName}</p>
                       <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Student Account</p>
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut size={18} />
                  </button>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="ml-2 px-4 py-2 bg-slate-900 dark:bg-zinc-50 text-white dark:text-black text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity"
                    >
                      DASHBOARD
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-widest"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors uppercase tracking-widest"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
