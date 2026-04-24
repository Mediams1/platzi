export type UserRole = 'student' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  profileImage?: string;
  createdAt: any;
}

export interface Instructor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  createdAt: any;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName?: string;
  thumbnail: string;
  price: number;
  rating: number;
  ratingCount: number;
  totalStudents: number;
  views: number;
  createdAt: any;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  videoUrl: string;
  order: number;
  views: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  completed: boolean;
  completedLessons: string[];
  lastWatchedLessonId: string | null;
  rating?: number;
  comment?: string;
  joinedAt: any;
}
