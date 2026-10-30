import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VisitPage from './pages/VisitPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminMapView from './pages/AdminMapView';
import AssignLocation from './pages/AssignLocation';
import SalespersonTracking from './pages/SalespersonTracking';
import VisitReportsPage from './pages/VisitReportsPage';
import CreateExpense from './pages/CreateExpense';
import ViewExpenses from './pages/ViewExpenses';
import ExpenseReports from './pages/ExpenseReports';
import SalespersonManagement from './pages/SalespersonManagement';
import Notifications from './pages/Notifications';
import { NotificationProvider } from './contexts/NotificationContext';
import ToastNotification from './components/ToastNotification';
import NotificationErrorBoundary from './components/NotificationErrorBoundary';
import './styles.css';

function App() {
  return (
    <NotificationErrorBoundary>
      <NotificationProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/visit/:assignmentId/:placeId" element={<VisitPage />} />
            <Route path="/expenses/create" element={<CreateExpense />} />
            <Route path="/expenses/view" element={<ViewExpenses />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/map" element={<AdminMapView />} />
            <Route path="/admin/assign" element={<AssignLocation />} />
            <Route path="/admin/tracking/:id" element={<SalespersonTracking />} />
            <Route path="/admin/visit-reports" element={<VisitReportsPage />} />
            <Route path="/admin/expense-reports" element={<ExpenseReports />} />
            <Route path="/admin/salesperson-management" element={<SalespersonManagement />} />
          </Routes>
          <ToastNotification />
        </Router>
      </NotificationProvider>
    </NotificationErrorBoundary>
  );
}

export default App;
