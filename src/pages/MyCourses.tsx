import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Enrollment, Course } from '../types';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, CheckCircle2, Award, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export const MyCourses: React.FC = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<(Enrollment & { course?: Course })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnrollments = async () => {
      if (!user) return;
      try {
        const q = query(collection(db, 'enrollments'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        const data = await Promise.all(snapshot.docs.map(async (d) => {
          const enrollment = { id: d.id, ...d.data() } as Enrollment;
          const courseDoc = await getDoc(doc(db, 'courses', enrollment.courseId));
          return { ...enrollment, course: { id: courseDoc.id, ...courseDoc.data() } as Course };
        }));
        setEnrollments(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEnrollments();
  }, [user]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 dark:text-zinc-50 tracking-tighter uppercase italic serif">My Library</h1>
        <p className="text-slate-500 dark:text-zinc-400 font-medium tracking-tight">Resume your educational progress</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="text-center py-32 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-lg flex items-center justify-center mx-auto mb-6 ring-1 ring-slate-100">
            <Play className="text-slate-300 dark:text-zinc-700" size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-50 mb-4 tracking-tight uppercase">Empty Library</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 font-medium mb-8 max-w-xs mx-auto">Discover high-performance courses and start building your career identity today.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all">
             Browse Catalog <ArrowRight size={14} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrollments.map((en, idx) => (
            <motion.div
              key={en.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 group flex flex-col h-full"
            >
              <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img src={en.course?.thumbnail || `https://picsum.photos/seed/${en.id}/800/450`} alt="" className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-xl">
                     <Play size={18} fill="currentColor" />
                  </div>
                </div>
                {en.completed && (
                  <div className="absolute top-3 left-3 px-2 py-1 bg-green-500 text-white rounded text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lg">
                    <CheckCircle2 size={10} /> COMPLETED
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-base font-bold text-slate-900 dark:text-zinc-50 mb-4 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{en.course?.title}</h3>
                
                <div className="mb-8 p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-lg border border-slate-100 dark:border-zinc-800/50">
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <span>Integration Status</span>
                    <span className="text-indigo-600">{en.completed ? '100% Sync' : 'Active State'}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: en.completed ? '100%' : '35%' }}
                      className="h-full bg-indigo-600" 
                    />
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <Link
                    to={`/learn/${en.courseId}/${en.lastWatchedLessonId || 'start'}`}
                    className="flex-1 px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg font-bold text-[10px] uppercase tracking-widest text-center shadow-sm hover:bg-indigo-600 transition-colors"
                  >
                    {en.completed ? 'Review Content' : 'Resume Module'}
                  </Link>
                  {en.completed && (
                    <button className="p-3 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
                       <Award size={16} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
