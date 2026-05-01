export type UserRole = 'admin' | 'user';
export type Language =
  | 'ca' | 'es' | 'en'
  | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'ro' | 'ar';
export type Theme = 'dark' | 'light';

export type CourseCategory =
  | 'excel' | 'word' | 'access' | 'outlook'
  | 'cloud' | 'it_repair' | 'consulting' | 'actic' | 'ai' | 'ia' | 'powerpoint';

export type CourseStatus = 'active' | 'inactive' | 'full' | 'draft';
export type CourseLevel = 'basic' | 'intermediate' | 'advanced';
export type CourseFormat = 'online' | 'presential' | 'hybrid';
export type PaymentStatus = 'pending' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'bizum' | 'paypal';
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

// =====================================================================
// CLOUD TYPES (Entrega 3.2)
// =====================================================================

/**
 * ID d'usuari polimòrfic (Dexie o Supabase).
 * A la pràctica session.userId sempre és number (mirror Dexie).
 */
export type UserId = number | string;

export interface CloudBudgetItem {
  courseId?: number | string;
  name: string;
  price: number;
  qty: number;
  discount?: number;
  notes?: string;
}

export type CloudBudgetStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface CloudBudget {
  id: string;
  user_id: string;
  title: string;
  items: CloudBudgetItem[];
  total: number;
  currency: string;
  status: CloudBudgetStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type CloudUserCourseStatus =
  | 'interested' | 'enrolled' | 'completed' | 'cancelled';

export interface CloudUserCourse {
  id: string;
  user_id: string;
  course_key: string;
  course_name: string;
  status: CloudUserCourseStatus;
  progress: number;
  enrolled_at?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CloudDiploma {
  id: string;
  user_id: string;
  course_key: string;
  course_name: string;
  student_name?: string;
  hours?: number;
  issued_at: string;
  pdf_url?: string;
  verification_code?: string;
  issued_by?: string;
  created_at?: string;
}

export interface CloudProfile {
  id: string;
  nickname: string;
  name: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminCloudStats {
  total_users: number;
  total_budgets: number;
  total_diplomas: number;
  total_enrollments: number;
  recent_budgets: CloudBudget[];
  recent_users: CloudProfile[];
  recent_diplomas: CloudDiploma[];
}
