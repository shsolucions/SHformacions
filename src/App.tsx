import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ToastContainer } from './components/ui/ToastContainer';
import { AuthModal } from './components/ui/AuthModal';

// Public pages
import { HomePage }        from './pages/HomePage';
import { CoursesPage }     from './pages/CoursesPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { CalendarPage }    from './pages/CalendarPage';
import { BudgetPage }      from './pages/BudgetPage';

// Auth-only pages
import { DashboardPage }     from './pages/DashboardPage';
import { PaymentsPage }      from './pages/PaymentsPage';
import { UsersPage }         from './pages/UsersPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage }      from './pages/SettingsPage';
import { ProfilePage }       from './pages/ProfilePage';

// Standalone auth pages
import { LoginPage }    from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// ── Guards ───────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

// ── Offline banner ────────────────────────────────────────────────────
function OfflineBanner() {
  const [offline, setOffline] = React.useState(!navigator.onLine);
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  if (!offline) return null;
  return (
    <div className="fixed top-14 left-0 right-0 z-50 bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2 text-center pointer-events-none">
      <p className="text-xs text-yellow-400 font-medium">📵 Mode sense connexió — les dades es guarden localment</p>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <OfflineBanner />
      <Routes>
        {/* ── Standalone login/register (guest only) ─── */}
        <Route path="/login"    element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />

        {/* ── PUBLIC routes (no auth needed) ─────────── */}
        <Route path="/"           element={<AppLayout><HomePage /></AppLayout>} />
        <Route path="/cursos"     element={<AppLayout><CoursesPage /></AppLayout>} />
        <Route path="/cursos/:id" element={<AppLayout><CourseDetailPage /></AppLayout>} />
        <Route path="/calendari"  element={<AppLayout><CalendarPage /></AppLayout>} />
        {/* Legacy routes redirect */}
        <Route path="/courses"     element={<Navigate to="/cursos" replace />} />
        <Route path="/courses/:id" element={<Navigate to="/cursos" replace />} />
        <Route path="/calendar"    element={<Navigate to="/calendari" replace />} />

        {/* ── AUTH-ONLY routes ────────────────────────── */}
        <Route path="/pressupost" element={<RequireAuth><AppLayout><BudgetPage /></AppLayout></RequireAuth>} />
        <Route path="/dashboard"  element={<RequireAuth><AppLayout><DashboardPage /></AppLayout></RequireAuth>} />
        <Route path="/notificacions" element={<RequireAuth><AppLayout><NotificationsPage /></AppLayout></RequireAuth>} />
        <Route path="/perfil"     element={<RequireAuth><AppLayout><ProfilePage /></AppLayout></RequireAuth>} />
        <Route path="/configuracio" element={<RequireAuth><AppLayout><SettingsPage /></AppLayout></RequireAuth>} />

        {/* ── ADMIN-ONLY routes ───────────────────────── */}
        <Route path="/admin/pagaments" element={<RequireAdmin><AppLayout><PaymentsPage /></AppLayout></RequireAdmin>} />
        <Route path="/admin/usuaris"   element={<RequireAdmin><AppLayout><UsersPage /></AppLayout></RequireAdmin>} />

        {/* Legacy admin redirects */}
        <Route path="/payments" element={<RequireAdmin><Navigate to="/admin/pagaments" replace /></RequireAdmin>} />
        <Route path="/users"    element={<RequireAdmin><Navigate to="/admin/usuaris" replace /></RequireAdmin>} />
        <Route path="/settings" element={<Navigate to="/configuracio" replace />} />
        <Route path="/profile"  element={<Navigate to="/perfil" replace />} />
        <Route path="/notifications" element={<Navigate to="/notificacions" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
