import { useEffect, useState } from 'react';
import { apiRoutes } from '../config/api';

type StatCard = {
  title: string;
  value: number;
  action: string;
  icon: string;
  tone: 'orange' | 'indigo' | 'teal' | 'blue';
};

type QuickCard = {
  title: string;
  value: number;
  action: string;
  icon: string;
};

type DashboardStats = {
  totalEmployees: number;
  onLeaveToday: number;
  totalDepartments: number;
  pendingApprovals: number;
  presentToday: number;
  totalAnnouncements: number;
  approvedLeave: number;
  pendingPayrolls: number;
};

const emptyStats: DashboardStats = {
  totalEmployees: 0,
  onLeaveToday: 0,
  totalDepartments: 0,
  pendingApprovals: 0,
  presentToday: 0,
  totalAnnouncements: 0,
  approvedLeave: 0,
  pendingPayrolls: 0
};

export default function DashboardPage() {
  const [stats, setStats] = useState(emptyStats);

  useEffect(() => {
    fetch(apiRoutes.dashboard)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Dashboard unavailable'))))
      .then((result: { data: DashboardStats }) => setStats(result.data))
      .catch(() => setStats(emptyStats));
  }, []);

  const primaryStats: StatCard[] = [
    { title: 'Total Employees', value: stats.totalEmployees, action: 'View List', icon: '👥', tone: 'orange' },
    { title: 'On Leave Today', value: stats.onLeaveToday, action: 'View List', icon: '📝', tone: 'indigo' },
    { title: 'Total Departments', value: stats.totalDepartments, action: 'View List', icon: '🏢', tone: 'teal' },
    { title: 'Pending Approvals', value: stats.pendingApprovals, action: 'View List', icon: '☑️', tone: 'blue' }
  ];

  const quickStats: QuickCard[] = [
    { title: 'Present Today', value: stats.presentToday, action: 'View All', icon: '✅' },
    { title: 'Total Announcements', value: stats.totalAnnouncements, action: 'View All', icon: '📣' },
    { title: 'Approved Leave', value: stats.approvedLeave, action: 'View All', icon: '📋' },
    { title: 'Pending Payrolls', value: stats.pendingPayrolls, action: 'View All', icon: '💲' }
  ];

  return (
    <section className="dashboard-page">
      <header>
        <div>
          <h3 className="dashboard-title">Welcome, Admin</h3>
          <p className="dashboard-subtitle">Here's what's happening with your team today.</p>
        </div>
      </header>

      <div className="dashboard-primary-grid">
        {primaryStats.map((item) => (
          <article key={item.title} className={`stat-card stat-card-${item.tone}`}>
            <div className="stat-card-top">
              <span className="stat-icon" aria-hidden="true">
                {item.icon}
              </span>
              <div>
                <p className="stat-label">{item.title}</p>
                <p className="stat-value">{item.value}</p>
              </div>
            </div>
            <button type="button" className="stat-action">
              {item.action}
            </button>
          </article>
        ))}
      </div>

      <div className="dashboard-secondary-grid">
        {quickStats.map((item) => (
          <article key={item.title} className="quick-card">
            <div className="quick-card-header">
              <p className="quick-label">{item.title}</p>
              <span className="quick-icon" aria-hidden="true">
                {item.icon}
              </span>
            </div>
            <p className="quick-value">{item.value}</p>
            <button type="button" className="quick-link">
              {item.action}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

