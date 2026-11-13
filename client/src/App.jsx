import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './api.js';
import { useI18n } from './i18n/index.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import TeacherApply from './pages/TeacherApply.jsx';
import Dashboard from './pages/student/Dashboard.jsx';
import Catalog from './pages/student/Catalog.jsx';
import CourseDetail from './pages/student/CourseDetail.jsx';
import Enrolled from './pages/student/Enrolled.jsx';
import Sessions from './pages/student/Sessions.jsx';
import RequestCourse from './pages/student/RequestCourse.jsx';
import Subscribe from './pages/student/Subscribe.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import Payments from './pages/admin/Payments.jsx';
import Bookings from './pages/admin/Bookings.jsx';
import CourseRequests from './pages/admin/CourseRequests.jsx';
import TeacherApplications from './pages/admin/TeacherApplications.jsx';
import CourseManager from './pages/admin/CourseManager.jsx';
import Settings from './pages/admin/Settings.jsx';
import Users from './pages/admin/Users.jsx';

function Loading() {
  const { t } = useI18n();
  return <div className="p-10 text-muted">{t('common.loading')}</div>;
}

/** Pages that need an account (anything to do with payments or personal data). */
function RequireLogin({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}

/** Admin pages: role is checked from the server on every load (see api.js › AuthProvider). */
function RequireAdmin({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <Loading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

function Home() {
  const { user } = useAuth();
  if (user === undefined) return <Loading />;
  if (!user) return <Navigate to="/catalog" replace />;            // guests start at the catalog (free courses)
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Student portal — some pages are public (catalog, free courses, teacher application) */}
      <Route element={<Layout portal="student" />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="courses/:slug" element={<CourseDetail />} />
        <Route path="teach" element={<TeacherApply />} />
        <Route path="subscribe" element={<Subscribe />} />
        <Route path="enrolled" element={<RequireLogin><Enrolled /></RequireLogin>} />
        <Route path="sessions" element={<RequireLogin><Sessions /></RequireLogin>} />
        <Route path="request" element={<RequireLogin><RequestCourse /></RequireLogin>} />
      </Route>

      {/* Admin portal */}
      <Route path="admin" element={<RequireAdmin><Layout portal="admin" /></RequireAdmin>}>
        <Route index element={<AdminDashboard />} />
        <Route path="payments" element={<Payments />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="requests" element={<CourseRequests />} />
        <Route path="teachers" element={<TeacherApplications />} />
        <Route path="courses" element={<CourseManager />} />
        <Route path="settings" element={<Settings />} />
        <Route path="users" element={<Users />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
