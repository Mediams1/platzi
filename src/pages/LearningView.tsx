import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc, increment, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Course, Lesson, Enrollment } from '../types';
import { motion } from 'motion/react';
import { Play, CheckCircle2, Lock, ChevronLeft, Menu, ChevronRight, Star } from 'lucide-react';
import { cn } from '../lib/utils';

export const LearningView: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string, lessonId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');

  useEffect(() => {
    if (!courseId || !user) return;

    // Real-time enrollment and progress
    const enrollmentRef = doc(db, 'enrollments', `${user.uid}_${courseId}`);
    const unsubEnroll = onSnapshot(enrollmentRef, (docSnap) => {
      if (!docSnap.exists()) {
        navigate(`/course/${courseId}`);
        return;
      }
      setEnrollment({ id: docSnap.id, ...docSnap.data() } as Enrollment);
    });

    const fetchCourseData = async () => {
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);

        const lessonsSnapshot = await getDocs(query(collection(db, 'courses', courseId, 'lessons'), orderBy('order', 'asc')));
        const lessonsData = lessonsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Lesson));
        setLessons(lessonsData);
        
        const current = lessonsData.find(l => l.id === lessonId);
        if (current) {
          // Check if locked
          const lessonIndex = lessonsData.findIndex(l => l.id === current.id);
          if (lessonIndex > 0) {
            const prevLesson = lessonsData[lessonIndex - 1];
            // Since we don't have enrollment yet in this async block (it's set via onSnapshot),
            // We should use a separate useEffect to handle redirection once both lessons and enrollment are ready.
          }
          setCurrentLesson(current);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
    return () => unsubEnroll();
  }, [courseId, lessonId, user, navigate]);

  // Redirect if current lesson is locked
  useEffect(() => {
    if (lessons.length > 0 && enrollment && currentLesson) {
      if (isLessonLocked(currentLesson)) {
        // Find the furthest accessible lesson or just the previous one
        const lastCompletedId = enrollment.completedLessons?.[enrollment.completedLessons.length - 1];
        if (lastCompletedId) {
          const lastIdx = lessons.findIndex(l => l.id === lastCompletedId);
          if (lastIdx !== -1 && lastIdx + 1 < lessons.length) {
            navigate(`/learn/${courseId}/${lessons[lastIdx + 1].id}`, { replace: true });
          } else {
             navigate(`/learn/${courseId}/${lessons[0].id}`, { replace: true });
          }
        } else {
          navigate(`/learn/${courseId}/${lessons[0].id}`, { replace: true });
        }
      }
    }
  }, [lessons, enrollment, currentLesson, navigate, courseId]);

  // Update views and progress when lesson changes
  useEffect(() => {
    if (currentLesson && courseId && user) {
      const updateViews = async () => {
        const lessonRef = doc(db, 'courses', courseId, 'lessons', currentLesson.id);
        const courseRef = doc(db, 'courses', courseId);
        const enrollmentRef = doc(db, 'enrollments', `${user.uid}_${courseId}`);
        
        await updateDoc(lessonRef, { views: increment(1) });
        await updateDoc(courseRef, { views: increment(1) });
        await updateDoc(enrollmentRef, { lastWatchedLessonId: currentLesson.id });
      };
      updateViews();
    }
  }, [currentLesson, courseId, user]);

  const handleLessonComplete = async () => {
    if (!currentLesson || !courseId || !user || !enrollment) return;

    const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
    const isLast = currentIndex === lessons.length - 1;

    // Update completed lessons tracking
    const updatedCompletedLessons = Array.from(new Set([...(enrollment.completedLessons || []), currentLesson.id]));
    const enrollmentRef = doc(db, 'enrollments', `${user.uid}_${courseId}`);

    if (isLast) {
      await updateDoc(enrollmentRef, { 
        completed: true,
        completedLessons: updatedCompletedLessons
      });
      setRatingOpen(true);
    } else {
      await updateDoc(enrollmentRef, { 
        completedLessons: updatedCompletedLessons
      });
      const nextLesson = lessons[currentIndex + 1];
      navigate(`/learn/${courseId}/${nextLesson.id}`);
    }
  };

  const submitRating = async () => {
    if (!user || !courseId) return;
    const enrollmentRef = doc(db, 'enrollments', `${user.uid}_${courseId}`);
    await updateDoc(enrollmentRef, { 
      rating: userRating, 
      comment: userComment 
    });
    
    // Update course global rating
    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, {
      ratingCount: increment(1),
      rating: userRating // Simplified rating avg logic
    });
    
    setRatingOpen(false);
    navigate('/my-courses');
  };

  const isLessonLocked = (lesson: Lesson) => {
    if (!enrollment || lessons.length === 0) return false;
    
    const lessonIndex = lessons.findIndex(l => l.id === lesson.id);
    if (lessonIndex === 0) return false; // First lesson is never locked
    
    // A lesson is locked if the previous lesson is NOT completed
    const prevLesson = lessons[lessonIndex - 1];
    return !(enrollment.completedLessons || []).includes(prevLesson.id);
  };

  if (loading) return null;

  return (
    <div className="flex bg-slate-50 dark:bg-zinc-950 min-h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar - Lessons List */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0 }}
        className={cn(
          "relative border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col transition-all duration-300 z-40 overflow-hidden shrink-0",
          !sidebarOpen && "border-none"
        )}
      >
        <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between min-w-[320px]">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Curriculum</h2>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-slate-400"><ChevronLeft size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto min-w-[320px] divide-y divide-slate-50 dark:divide-zinc-800/50">
          {lessons.map((lesson, idx) => {
            const isActive = lesson.id === lessonId;
            const locked = isLessonLocked(lesson);
            return (
              <button
                key={lesson.id}
                disabled={locked}
                onClick={() => !locked && navigate(`/learn/${courseId}/${lesson.id}`)}
                className={cn(
                  "w-full flex items-center gap-4 p-5 transition-all text-left group border-l-4",
                  isActive 
                    ? "bg-slate-50 dark:bg-zinc-800/50 border-indigo-600 text-indigo-600" 
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500",
                  locked && "opacity-50 cursor-not-allowed"
                )}
              >
                <span className={cn(
                  "text-[10px] font-black shrink-0",
                  isActive ? "text-indigo-600" : "text-slate-300"
                )}>
                  P-{(idx + 1).toString().padStart(2, '0')}
                </span>
                <span className={cn(
                  "text-xs font-bold flex-1 line-clamp-2 leading-tight",
                  isActive ? "text-slate-900 dark:text-white" : ""
                )}>{lesson.title}</span>
                <div className={cn(
                  "shrink-0",
                  isActive ? "text-indigo-600" : "text-slate-200"
                )}>
                  {locked ? <Lock size={12} /> : <Play size={12} fill="currentColor" />}
                </div>
              </button>
            );
          })}
        </div>
      </motion.aside>

      {/* Main Content - Video Player */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <div className="absolute top-4 left-4 z-50">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 bg-slate-900 text-white rounded-lg shadow-lg hover:scale-105 transition-transform"
            >
              <Menu size={18} />
            </button>
          )}
        </div>

        <div className="p-8 max-w-6xl mx-auto w-full">
          <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-2xl relative mb-8 border border-slate-200 dark:border-zinc-800">
             {/* Dynamic Video Embed Simulation */}
             <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center bg-slate-950">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-6 ring-1 ring-white/20">
                   <Play size={24} fill="white" />
                </div>
                <p className="text-[10px] font-black tracking-[0.3em] text-indigo-400 uppercase mb-4">Lesson Module Online</p>
                <h3 className="text-xl font-bold mb-8 max-w-md">{currentLesson?.title}</h3>
                <div className="w-full max-w-sm h-1 bg-white/10 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "45%" }}
                    className="h-full bg-indigo-500"
                   />
                </div>
             </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 py-6 border-b border-slate-200 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase">ACTIVE SESSION</span>
                 <span className="text-[10px] font-bold text-slate-400">ID: {currentLesson?.id.slice(0, 8)}</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-50 tracking-tight uppercase">
                {currentLesson?.title}
              </h1>
            </div>

            <button
              onClick={handleLessonComplete}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
            >
              Complete Lesson <ChevronRight size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
             <div className="lg:col-span-2 prose dark:prose-invert max-w-none">
                <h3 className="text-sm font-black text-slate-900 dark:text-zinc-50 mb-4 uppercase tracking-[0.1em]">Lesson Documentation</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-zinc-400 leading-relaxed">
                  Welcome to the technical documentation for "{currentLesson?.title}". This module covers the critical path for successfully implementing the concepts discussed in the video. 
                  Users are expected to follow the sequential order to ensure state integrity.
                </p>
             </div>
             
             <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Course Info</h3>
                <div className="space-y-4">
                   <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400 uppercase">Parent</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">{course?.title}</span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400 uppercase">Progress</span>
                      <span className="font-bold text-indigo-600">{(lessons.findIndex(l => l.id === lessonId) + 1)} / {lessons.length}</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Completion Modal */}
      {ratingOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
           <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[40px] p-10 text-center shadow-2xl"
           >
              <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-2 tracking-tight">¡Felicitaciones!</h2>
              <p className="text-zinc-500 dark:text-zinc-400 font-medium mb-8">Has terminado el curso "{course?.title}". Por favor califica tu experiencia para generar tu certificado.</p>
              
              <div className="flex justify-center gap-3 mb-8">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    className={cn(
                      "p-1 transition-colors",
                      userRating >= star ? "text-yellow-500" : "text-zinc-200 dark:text-zinc-800"
                    )}
                  >
                    <Star size={32} fill={userRating >= star ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>

              <textarea
                placeholder="Cuéntanos qué te pareció el curso..."
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                className="w-full h-32 p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl focus:ring-2 focus:ring-black dark:focus:ring-white outline-none transition-all dark:text-white mb-8 resize-none"
              />

              <button
                onClick={submitRating}
                disabled={userRating === 0}
                className="w-full py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold text-lg hover:opacity-90 disabled:opacity-50 transition-all"
              >
                Obtener Certificado
              </button>
           </motion.div>
        </div>
      )}
    </div>
  );
};
