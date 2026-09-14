/**
 * src/App.jsx
 * Router + layout: authenticated pages share the Sidebar + main content area.
 */
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import LogsPage from './pages/LogsPage';
import ProtectedRoute from './routes/ProtectedRoute';

/** Shared layout for authenticated pages */
function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected admin layout */}
        <Route
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/students"  element={<StudentsPage />} />
          <Route path="/logs"      element={<LogsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
