import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import AssetsList from './pages/assets/AssetsList';
import AssetDetail from './pages/assets/AssetDetail';
import EmployeesList from './pages/employees/EmployeesList';
import EmployeeDetail from './pages/employees/EmployeeDetail';
import AssignmentsList from './pages/assignments/AssignmentsList';
import BookingsList from './pages/bookings/BookingsList';
import MaintenanceList from './pages/maintenance/MaintenanceList';
import AuditLogsList from './pages/audit/AuditLogsList';
import Settings from './pages/settings/Settings';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Enterprise Dashboard Shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="assets" element={<AssetsList />} />
        <Route path="assets/:id" element={<AssetDetail />} />
        <Route path="employees" element={<EmployeesList />} />
        <Route path="employees/:id" element={<EmployeeDetail />} />
        <Route path="assignments" element={<AssignmentsList />} />
        <Route path="bookings" element={<BookingsList />} />
        <Route path="maintenance" element={<MaintenanceList />} />
        <Route
          path="audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AuditLogsList />
            </ProtectedRoute>
          }
        />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
