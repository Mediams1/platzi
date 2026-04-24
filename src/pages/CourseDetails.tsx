import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy, setDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Course, Lesson, Enrollment } from '../types';
import { motion } from 'motion/react';
import { Play, Star, Users, CheckCircle2, Lock, ChevronRight, Share2, Heart, Award } from 'lucide-react';
import { cn } from '../lib/utils';

export const CourseDetails: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!courseId) return;
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (!courseDoc.exists()) {
          navigate('/');
          return;
        }
        setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);

        const lessonsSnapshot = await getDocs(query(collection(db, 'courses', courseId, 'lessons'), orderBy('order', 'asc')));
        setLessons(lessonsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lesson)));

        if (user) {
          const enrollmentQuery = query(
            collection(db, 'enrollments'), 
            where('userId', '==', user.uid), 
            where('courseId', '==', courseId)
          );
          const enrollmentSnapshot = await getDocs(enrollmentQuery);
          if (!enrollmentSnapshot.empty) {
            setEnrollment({ id: enrollmentSnapshot.docs[0].id, ...enrollmentSnapshot.docs[0].data() } as Enrollment);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [courseId, user, navigate]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!courseId) return;

    setEnrolling(true);
    try {
      const enrollmentId = `${user.uid}_${courseId}`;
      const newEnrollment = {
        userId: user.uid,
        courseId: courseId,
        completed: false,
        completedLessons: [],
        lastWatchedLessonId: null,
        joinedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'enrollments', enrollmentId), newEnrollment);
      setEnrollment(newEnrollment as any);
      
      // Navigate to first lesson
      if (lessons.length > 0) {
        navigate(`/learn/${courseId}/${lessons[0].id}`);
      }
    } catch (error) {
      console.error('Error enrolling:', error);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
    </div>
  );

  if (!course) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-zinc-950">
      {/* Course Hero */}
      <div className="bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/4 h-full bg-slate-50 dark:bg-zinc-800/50 -skew-x-12 translate-x-10 hidden lg:block" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                <Link to="/" className="hover:text-indigo-600 transition-colors">Courses</Link>
                <ChevronRight size={12} />
                <span className="text-slate-900 dark:text-zinc-50">{course.title}</span>
              </nav>
              
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-zinc-50 tracking-tighter leading-[0.9] mb-6 uppercase italic serif">
                {course.title}
              </h1>
              
              <p className="text-lg text-slate-500 dark:text-zinc-400 mb-10 leading-relaxed font-medium max-w-xl">
                {course.description}
              </p>

              <div className="flex flex-wrap items-center gap-8 mb-10">
                <div className="flex items-center gap-2">
                  <Star className="text-indigo-600" size={18} fill="currentColor" />
                  <span className="text-xl font-black text-slate-900 dark:text-zinc-50">{course.rating || '4.8'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="text-slate-400" size={18} />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{course.totalStudents || 0} Learners</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {enrollment ? (
                  <Link
                    to={`/learn/${courseId}/${enrollment.lastWatchedLessonId || lessons[0]?.id}`}
                    className="flex-1 sm:flex-none px-10 py-4 bg-indigo-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20"
                  >
                    Continue <Play size={16} fill="currentColor" />
                  </Link>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={enrolling}
                    className="flex-1 sm:flex-none px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                  >
                    {enrolling ? 'Processing...' : `Enroll Now ($${course.price || 0})`}
                  </button>
                )}
                <button className="p-4 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors text-slate-400">
                  <Heart size={20} />
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-white border-4 border-white dark:border-zinc-800"
            >
              <img 
                src={course.thumbnail || `https://picsum.photos/seed/${course.id}/1280/720`} 
                alt={course.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/40 cursor-pointer hover:scale-110 transition-transform">
                  <Play size={32} fill="white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-black text-slate-900 dark:text-zinc-50 tracking-tight mb-8 uppercase">Course Content</h2>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className={cn(
                    "group flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer",
                    enrollment ? "" : "pointer-events-none opacity-80"
                  )}
                  onClick={() => enrollment && navigate(`/learn/${courseId}/${lesson.id}`)}
                >
                  <div className="flex items-center gap-6">
                    <span className="text-xs font-black text-slate-300 dark:text-zinc-700 uppercase tracking-[0.2em]">
                      SEC-{(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-50 mb-1">{lesson.title}</h4>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Play size={10} /> HD VIDEO</span>
                        <span>15:30 MIN</span>
                      </div>
                    </div>
                  </div>
                  {enrollment ? (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <Play size={14} fill="currentColor" />
                    </div>
                  ) : (
                    <Lock size={14} className="text-slate-300 dark:text-zinc-700" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="sticky top-32 p-8 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Learning Goals</h3>
              <ul className="space-y-4 mb-10">
                {[
                  'Advanced industry-level fundamentals',
                  'High-density practical projects',
                  'Pro-level workflow & best practices',
                  'Priority support & access'
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="text-indigo-600 mt-1 shrink-0" size={14} />
                    <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-100 dark:border-zinc-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">LEAD INSTRUCTOR</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-zinc-700 overflow-hidden ring-2 ring-white">
                    <img src="https://i.pravatar.cc/100?u=instructor" alt="Instructor" />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-900 dark:text-zinc-50">Alex Johnson</h5>
                    <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-tighter">System Expert</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
