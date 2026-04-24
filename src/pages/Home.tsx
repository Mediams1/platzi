import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course } from '../types';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Play, Star, Users, ArrowRight, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export const Home: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        setCourses(data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 py-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-50 dark:bg-zinc-800/50 -skew-x-12 translate-x-20 hidden lg:block" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="flex items-center gap-2 mb-6">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Next-Gen Learning Platform</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-zinc-50 tracking-tighter leading-[0.85] mb-8 uppercase italic serif">
              Platzi Lite<br />
              <span className="text-indigo-600">Education</span>
            </h1>
            <p className="text-lg text-slate-500 dark:text-zinc-400 mb-10 font-medium leading-relaxed max-w-lg">
              High-performance education for the modern era. Industry-standard courses delivered in a high-density, focus-first environment.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#courses"
                className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm tracking-widest uppercase shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center gap-2"
              >
                Browse Library <ArrowRight size={18} />
              </a>
              <div className="flex -space-x-3 items-center ml-4">
                 {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-4 border-white dark:border-zinc-900 bg-slate-200 overflow-hidden shadow-sm">
                       <img src={`https://i.pravatar.cc/100?u=${i}`} alt="" />
                    </div>
                 ))}
                 <span className="ml-6 text-xs font-bold text-slate-400">+1.2k Students</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Courses Section */}
      <section id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight uppercase">Featured Courses</h2>
            <div className="h-1 w-12 bg-indigo-500 mt-1" />
          </div>

          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filter by title, instructor, or skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all dark:text-white text-sm font-medium"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-80 rounded-2xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course, idx) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col h-full"
              >
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                  <img 
                    src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/450`} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-slate-900">
                     PRO CONTENT
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                      <Star size={10} fill="currentColor" />
                      {course.rating || '4.8'}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {course.totalStudents || 0} Learners
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-50 mb-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs line-clamp-2 mb-6 font-medium leading-relaxed">
                    {course.description}
                  </p>

                  <div className="mt-auto pt-6 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing</span>
                       <span className="text-xl font-black text-slate-900 dark:text-zinc-50">
                        ${course.price || 'Free'}
                       </span>
                    </div>
                    <Link
                      to={`/course/${course.id}`}
                      className="px-5 py-2 bg-slate-900 dark:bg-white text-white dark:text-black rounded-lg font-bold text-xs uppercase tracking-widest transition-all hover:bg-indigo-600"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
