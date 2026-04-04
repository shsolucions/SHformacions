export type UserRole = 'admin' | 'user';
export type Language = 'ca' | 'es' | 'en';
export type Theme = 'dark' | 'light';

export type CourseCategory =
  | 'excel' | 'word' | 'access' | 'outlook'
  | 'cloud' | 'it_repair' | 'consulting' | 'actic' | 'ai' | 'ia' | 'powerpoint';

export type CourseStatus = 'active' | 'inactive' | 'full' | 'draft';
export type CourseLevel = 'basic' | 'intermediate' | 'advanced';
export type CourseFormat = 'online' | 'presential' | 'hybrid';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'transfer' | 'bizum';
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface User {
  id?: number;
  nickname: string;
  name: string;
  email?: string;
  pinHash: string;
  role: UserRole;
  active: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Course {
  id?: number;
  name: string;
  description: string;
  category: CourseCategory;
  level: CourseLevel;
  format: CourseFormat;
  duration: number;
  price: number;
  maxStudents: number;
  currentStudents: number;
  instructor?: string;
  location?: string;
  startDate?: number;
  endDate?: number;
  status: CourseStatus;
  tags?: string;
  objectives?: string;
  targetAudience?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ServiceRequest {
  id?: number;
  userId: number;
  courseId: number;
  status: RequestStatus;
  message?: string;
  adminNotes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Payment {
  id?: number;
  userId: number;
  courseId?: number;
  requestId?: number;
  amount: number;
  status: PaymentStatus;
  method: PaymentMethod;
  concept?: string;
  notes?: string;
  dueDate?: number;
  paidAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Notification {
  id?: number;
  userId?: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: number;
}

export interface AppSetting {
  id?: number;
  key: string;
  value: string;
}

export interface Session {
  userId: number;
  nickname: string;
  name: string;
  role: UserRole;
  loginAt: string;
}

export interface CourseWithStats extends Course {
  requestCount?: number;
  paidAmount?: number;
}

export interface PaymentWithDetails extends Payment {
  userName?: string;
  courseName?: string;
}

export interface RequestWithDetails extends ServiceRequest {
  userName?: string;
  courseName?: string;
  courseCategory?: CourseCategory;
}

export interface LoginFormData { nickname: string; pin: string; }

export interface RegisterFormData {
  nickname: string; name: string; email?: string;
  pin: string; confirmPin: string;
}

export interface CourseFormData {
  name: string; description: string; category: CourseCategory;
  level: CourseLevel; format: CourseFormat; duration: number;
  price: number; maxStudents: number; instructor?: string;
  location?: string; startDate?: string; endDate?: string;
  status: CourseStatus; objectives?: string; tags?: string;
  targetAudience?: string;
}

export interface PaymentFormData {
  userId: number | ''; courseId?: number | ''; amount: number;
  status: PaymentStatus; method: PaymentMethod;
  concept?: string; notes?: string; dueDate?: string;
}

export interface Toast { id: string; type: ToastType; message: string; duration?: number; }

export interface BackupData {
  version: string; exportedAt: string;
  users: User[]; courses: Course[]; requests: ServiceRequest[];
  payments: Payment[]; notifications: Notification[]; settings: AppSetting[];
}

export interface DashboardStats {
  totalUsers: number; totalCourses: number; activeCourses: number;
  pendingRequests: number; totalPayments: number; paidPayments: number;
  pendingPayments: number; totalRevenue: number;
}

export interface CalendarEvent { date: Date; course: Course; type: 'start' | 'end' | 'ongoing'; }

export interface SavedCourse { courseId: number; savedAt: number; }

// Saved courses (localStorage, no auth needed to accumulate, auth to persist)
export interface SavedCourse {
  courseId: number;
  addedAt: number;
}
