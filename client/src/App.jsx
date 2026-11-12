import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './api.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
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
import CourseManager from './pages/admin/CourseManager.jsx';
import Settings from './pages/admin/Settings.jsx';

function Guard({ role, children }) {
  const { user } = useAuth();
  if (user === undefined) return <div className="p-10 text-muted">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard role="student"><Layout portal="student" /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="courses/:slug" element={<CourseDetail />} />
        <Route path="enrolled" element={<Enrolled />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="request" element={<RequestCourse />} />
        <Route path="subscribe" element={<Subscribe />} />
      </Route>
      <Route path="admin" element={<Guard role="admin"><Layout portal="admin" /></Guard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="payments" element={<Payments />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="requests" element={<CourseRequests />} />
        <Route path="courses" element={<CourseManager />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
