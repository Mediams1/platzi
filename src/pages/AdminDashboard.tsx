import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Course, Instructor, Lesson } from '../types';
import { LayoutDashboard, Users, Library, Plus, BarChart3, ChevronRight, Video, Mail, Star, Eye, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-slate-50 dark:bg-zinc-950">
      {/* Sidebar Navigation */}
      <aside className="w-60 bg-slate-900 flex flex-col hidden md:flex shrink-0">
        <div className="flex-1 py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Main Menu</div>
          <AdminNavLink to="/admin" icon={<BarChart3 size={18} />} label="Dashboard" end />
          <AdminNavLink to="/admin/instructors" icon={<Users size={18} />} label="Profesores" />
          <AdminNavLink to="/admin/courses" icon={<Library size={18} />} label="Courses" />
          
          <div className="px-4 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">System</div>
          <div className="px-6 py-2.5 text-slate-400 text-sm cursor-not-allowed">DB Manager</div>
          <div className="px-6 py-2.5 text-slate-400 text-sm cursor-not-allowed">Settings</div>
        </div>
        
        <div className="p-4 bg-slate-950">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-500/20">AD</div>
             <div className="overflow-hidden">
                <p className="text-white font-medium text-xs truncate">Admin Panel</p>
                <p className="text-slate-500 text-[10px] truncate">root@hostinger.com</p>
             </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-8 shrink-0">
           <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-50 tracking-tight">Admin Overview</h2>
           <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-sm text-slate-500">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> System Online
              </span>
           </div>
        </header>

        <div className="p-8">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="instructors" element={<AdminInstructors />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="course/:courseId" element={<AdminManageCourse />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

const AdminNavLink = ({ to, icon, label, end = false }: { to: string, icon: any, label: string, end?: boolean }) => {
  const location = useLocation();
  const isActive = end ? location.pathname === to : location.pathname.startsWith(to);
  
  return (
    <Link
      to={to}
      className={cn(
        "relative flex items-center gap-3 px-6 py-2.5 transition-colors text-sm",
        isActive 
          ? "bg-slate-800 text-white" 
          : "text-slate-400 hover:text-white transition-colors"
      )}
    >
      {isActive && <span className="w-1 h-4 bg-indigo-500 rounded-full absolute left-0" />}
      {icon}
      {label}
    </Link>
  );
};

/* --- Admin Sub-Pages --- */

const AdminOverview = () => {
  const [stats, setStats] = useState({ courses: 0, instructors: 0, views: 0 });
  const [topVideos, setTopVideos] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const courses = await getDocs(collection(db, 'courses'));
      const instructors = await getDocs(collection(db, 'instructors'));
      
      let totalViews = 0;
      let allLessons: any[] = [];

      for (const courseDoc of courses.docs) {
        const cData = courseDoc.data();
        totalViews += (cData.views || 0);
        
        const lessons = await getDocs(collection(db, 'courses', courseDoc.id, 'lessons'));
        lessons.docs.forEach(l => {
          allLessons.push({ 
            id: l.id, 
            ...l.data(), 
            courseTitle: cData.title 
          });
        });
      }

      setStats({
        courses: courses.size,
        instructors: instructors.size,
        views: totalViews
      });

      setTopVideos(allLessons.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5));
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Total Courses" value={stats.courses} prefix="Items" />
        <StatCard label="Instructors" value={stats.instructors} prefix="Faculty" />
        <StatCard label="Total Views" value={stats.views} prefix="Engagement" />
      </div>

      <div className="bg-white dark:bg-zinc-900/50 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-50">Top Performing Lessons</h3>
          <button className="text-xs font-medium text-indigo-600 dark:text-indigo-400">View Full Analytics</button>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-semibold text-slate-500 bg-slate-50 dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 uppercase tracking-wider">
              <th className="px-6 py-3 font-medium">Lesson Title</th>
              <th className="px-6 py-3 font-medium">Course</th>
              <th className="px-6 py-3 font-medium text-right">Views</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-600 dark:text-zinc-400">
            {topVideos.map((video, idx) => (
              <tr key={idx} className="border-b border-slate-50 dark:border-zinc-800 hover:bg-slate-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-3 font-medium text-slate-800 dark:text-zinc-50">{video.title}</td>
                <td className="px-6 py-3">{video.courseTitle}</td>
                <td className="px-6 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                  {video.views?.toLocaleString() || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, prefix }: any) => (
  <div className="bg-white dark:bg-zinc-900/50 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-zinc-800">
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <div className="flex items-baseline gap-2">
      <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50">{value?.toLocaleString()}</h3>
      <span className="text-[10px] text-slate-400 font-medium">{prefix}</span>
    </div>
  </div>
);

const AdminInstructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newIns, setNewIns] = useState({ name: '', email: '', specialty: '' });

  const fetchInstructors = async () => {
    const snapshot = await getDocs(query(collection(db, 'instructors'), orderBy('createdAt', 'desc')));
    setInstructors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Instructor)));
  };

  useEffect(() => { fetchInstructors(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'instructors'), {
      ...newIns,
      createdAt: serverTimestamp()
    });
    setNewIns({ name: '', email: '', specialty: '' });
    setShowAdd(false);
    fetchInstructors();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Gestión de Profesores</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl">
          <Plus size={20} /> Nuevo Profesor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructors.map(ins => (
          <div key={ins.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                {ins.name[0]}
              </div>
              <div>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{ins.name}</h4>
                <p className="text-xs text-zinc-500 font-medium italic serif">{ins.specialty}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <Mail size={14} /> {ins.email}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[40px] p-10 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Añadir Profesor</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input type="text" placeholder="Nombre completo" required value={newIns.name} onChange={e => setNewIns({...newIns, name: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-white" />
              <input type="email" placeholder="Correo electrónico" required value={newIns.email} onChange={e => setNewIns({...newIns, email: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-white" />
              <input type="text" placeholder="Especialidad" required value={newIns.specialty} onChange={e => setNewIns({...newIns, specialty: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-white" />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 font-bold text-zinc-500">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: '', description: '', instructorId: '', price: 0 });

  const fetchData = async () => {
    const cSnapshot = await getDocs(query(collection(db, 'courses'), orderBy('createdAt', 'desc')));
    setCourses(cSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
    const iSnapshot = await getDocs(collection(db, 'instructors'));
    setInstructors(iSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Instructor)));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'courses'), {
      ...newCourse,
      price: Number(newCourse.price),
      views: 0,
      rating: 0,
      ratingCount: 0,
      totalStudents: 0,
      createdAt: serverTimestamp()
    });
    setShowAdd(false);
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Gestión de Cursos</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl">
          <Plus size={20} /> Nuevo Curso
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {courses.map(course => (
          <div key={course.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl flex items-center justify-between group">
            <div className="flex items-center gap-6">
              <div className="w-20 aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden shrink-0">
                <img src={course.thumbnail || `https://picsum.photos/seed/${course.id}/200/150`} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-bold text-lg text-zinc-900 dark:text-zinc-50">{course.title}</h4>
                <div className="flex items-center gap-4 text-sm text-zinc-500 font-medium mt-1">
                  <span className="flex items-center gap-1"><Users size={14} /> {course.totalStudents || 0} alumnos</span>
                  <span className="flex items-center gap-1"><Eye size={14} /> {course.views || 0} vistas</span>
                </div>
              </div>
            </div>
            <Link to={`/admin/course/${course.id}`} className="p-3 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
              <ChevronRight size={24} />
            </Link>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[40px] p-10 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Crear Curso</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <input type="text" placeholder="Título del curso" required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-white" />
              <textarea placeholder="Descripción" required value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-white h-24" />
              <select required value={newCourse.instructorId} onChange={e => setNewCourse({...newCourse, instructorId: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-zinc-500">
                <option value="">Seleccionar Profesor</option>
                {instructors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <input type="number" placeholder="Precio ($)" required value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: Number(e.target.value)})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-white" />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 font-bold text-zinc-500">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold">Crear</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const AdminManageCourse = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newLesson, setNewLesson] = useState({ title: '', videoUrl: '' });

  const fetchData = async () => {
    if (!courseId) return;
    const cDoc = await getDoc(doc(db, 'courses', courseId));
    setCourse({ id: cDoc.id, ...cDoc.data() } as Course);
    const lSnap = await getDocs(query(collection(db, 'courses', courseId, 'lessons'), orderBy('order', 'asc')));
    setLessons(lSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson)));
  };

  useEffect(() => { fetchData(); }, [courseId]);

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    await addDoc(collection(db, 'courses', courseId, 'lessons'), {
      ...newLesson,
      courseId,
      order: lessons.length + 1,
      views: 0
    });
    setNewLesson({ title: '', videoUrl: '' });
    setShowAdd(false);
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/admin/courses" className="p-3 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{course?.title}</h2>
      </div>

      <div className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[40px] space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Video size={20} /> Lecciones en Secuencia
          </h3>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95">
            <Plus size={20} /> Añadir Lección
          </button>
        </div>

        <div className="space-y-3">
          {lessons.map((lesson, idx) => (
            <div key={lesson.id} className="p-5 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl hover:border-zinc-300 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-lg font-black text-zinc-300 uppercase">{idx + 1}</span>
                <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{lesson.title}</h4>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Views</p>
                  <p className="font-black text-zinc-900 dark:text-zinc-50">{lesson.views || 0}</p>
                </div>
              </div>
            </div>
          ))}
          {lessons.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-zinc-500 font-medium">No hay lecciones aún. Empieza añadiendo la primera.</p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[40px] p-10 shadow-2xl">
            <h3 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-50">Añadir Lección</h3>
            <form onSubmit={handleAddLesson} className="space-y-4">
              <input type="text" placeholder="Título de la lección" required value={newLesson.title} onChange={e => setNewLesson({...newLesson, title: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-white" />
              <input type="text" placeholder="URL del Video (ej. YouTube ID)" required value={newLesson.videoUrl} onChange={e => setNewLesson({...newLesson, videoUrl: e.target.value})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 rounded-2xl outline-none dark:text-white" />
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 font-bold text-zinc-500">Cancelar</button>
                <button type="submit" className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold">Guardar</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
