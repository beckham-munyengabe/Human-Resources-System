
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

import Layout from './components/layout/Layout.jsx';
import Login from './pages/auth/Login.jsx';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import Employees from './pages/employees/Employees.jsx';
import Departments from './pages/departments/Departments.jsx';
import Attendance from './pages/attendance/Attendance.jsx';
import Leave from './pages/leave/Leave.jsx';
import Payroll from './pages/payroll/Payroll.jsx';
import Performance from './pages/performance/Performance.jsx';
import Reports from './pages/reports/Reports.jsx';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const HRRoute = ({ children }) => {
  const { isHR } = useAuth();
  return isHR ? children : <Navigate to="/dashboard" replace />;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="employees" element={<HRRoute><Employees /></HRRoute>} />
        <Route path="departments" element={<HRRoute><Departments /></HRRoute>} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leave" element={<Leave />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="performance" element={<Performance />} />
        <Route path="reports" element={<HRRoute><Reports /></HRRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster position="top-right" toastOptions={{
          duration: 3500,
          style: { borderRadius: '10px', fontSize: '14px', fontWeight: '500' },
          success: { style: { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' } },
          error: { style: { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' } },
        }} />
      </Router>
    </AuthProvider>
  );
}
