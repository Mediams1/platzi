import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'motion/react';
import { User, Mail, Shield, Moon, Sun, Camera, Save, Loader2, Key } from 'lucide-react';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const Profile: React.FC = () => {
  const { profile, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { fullName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 dark:text-zinc-50 tracking-tighter uppercase italic serif">System Identity</h1>
        <p className="text-slate-500 font-medium tracking-tight">Configure your user profile and environment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <div className="p-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-center shadow-sm">
             <div className="relative w-32 h-32 mx-auto mb-6 group">
                <div className="w-full h-full rounded-lg bg-slate-50 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-zinc-900 shadow-xl ring-1 ring-slate-100">
                   {profile?.profileImage ? (
                     <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <User size={48} className="text-slate-200" />
                   )}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2.5 bg-indigo-600 text-white rounded-lg shadow-xl hover:scale-110 transition-transform">
                   <Camera size={18} />
                </button>
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50">{profile?.fullName}</h3>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{profile?.role} ACCESS</p>
          </div>

          <div className="p-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl shadow-xl flex items-center justify-between border-b-4 border-indigo-500">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Visual Engine</p>
              <h4 className="font-bold text-sm">{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</h4>
            </div>
            <button
              onClick={toggleTheme}
              className="w-10 h-10 bg-white/10 dark:bg-slate-900/10 rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-8 md:p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-zinc-800/50 -skew-x-12 translate-x-12 -translate-y-12" />
            <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="md:col-span-2">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Account Metadata</h3>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Legal Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input
                    type="email"
                    disabled
                    value={profile?.email}
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-zinc-800 opacity-60 border border-slate-100 dark:border-zinc-700 rounded-lg outline-none dark:text-white text-sm font-medium"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {saved ? 'ID UPDATED' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-zinc-800">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                        <Key size={18} />
                     </div>
                     <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-zinc-50">Security Override</h4>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Request encrypted password reset</p>
                     </div>
                  </div>
                  <button className="px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                     RESET LINK
                  </button>
               </div>
            </div>

            <div className="mt-8 flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700">
               <div className="flex items-center gap-4">
                  <Shield size={20} className="text-indigo-600" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-zinc-50">Identity Vault</h5>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Advanced encryption protocol active</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
