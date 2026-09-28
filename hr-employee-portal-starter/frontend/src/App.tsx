import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import LeavesPage from './pages/LeavesPage';
import AttendancePage from './pages/AttendancePage';
import PayrollPage from './pages/PayrollPage';
import DocumentsPage from './pages/DocumentsPage';
import LoginPage from './pages/LoginPage';
import './emp.css';

type Route = {
  path: string;
  label: string;
  icon: string;
};

const loginRoute: Route = { path: '/login', label: 'Login', icon: '🔐' };

const routes: Route[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/employees', label: 'Employees', icon: '👤' },
  { path: '/leaves', label: 'Leaves', icon: '🌴' },
  { path: '/attendance', label: 'Attendance', icon: '🕒' },
  { path: '/payroll', label: 'Payroll', icon: '💰' },
  { path: '/documents', label: 'Documents', icon: '📄' }
];

function getRoute(pathname: string) {
  const normalizedPath = pathname === '/hr' ? '/dashboard' : pathname;
  if (normalizedPath === '/' || normalizedPath === '/login') return loginRoute;
  return routes.find((route) => route.path === normalizedPath) ?? loginRoute;
}

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname || '/');

  const handleNavigate = (path: string) => {
    if (path === pathname) return;
    window.history.pushState({}, '', path);
    setPathname(path);
  };

  useEffect(() => {
    const onPopState = () => {
      setPathname(window.location.pathname || '/');
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const activeRoute = useMemo(() => getRoute(pathname), [pathname]);

  let page = <LoginPage onLoginSuccess={() => handleNavigate('/dashboard')} />;

  if (activeRoute.path === '/dashboard') page = <DashboardPage />;
  if (activeRoute.path === '/employees') page = <EmployeesPage />;
  if (activeRoute.path === '/leaves') page = <LeavesPage />;
  if (activeRoute.path === '/attendance') page = <AttendancePage />;
  if (activeRoute.path === '/payroll') page = <PayrollPage />;
  if (activeRoute.path === '/documents') page = <DocumentsPage />;
  if (activeRoute.path === '/login') page = <LoginPage onLoginSuccess={() => handleNavigate('/dashboard')} />;

  if (activeRoute.path === '/login') {
    return (
      <div className="auth-screen">
        <main className="auth-screen-content">{page}</main>
      </div>
    );
  }

  return (
    <div className="portal-shell">
      <Header title="Employee Portal" />

      <div className="portal-layout">
        <Navbar items={routes} activePath={activeRoute.path} onNavigate={handleNavigate} />

        <main className="portal-content">
          <h2 className="active-module-heading">
            Active Module: <strong>{activeRoute.label}</strong>
          </h2>
          {page}
        </main>
      </div>

      <Footer />
    </div>
  );
}

