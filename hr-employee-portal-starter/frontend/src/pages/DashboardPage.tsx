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

const primaryStats: StatCard[] = [
  { title: 'Total Employees', value: 0, action: 'View List', icon: '👥', tone: 'orange' },
  { title: 'On Leave Today', value: 0, action: 'View List', icon: '📝', tone: 'indigo' },
  { title: 'Total Departments', value: 0, action: 'View List', icon: '🏢', tone: 'teal' },
  { title: 'Pending Approvals', value: 0, action: 'View List', icon: '☑️', tone: 'blue' }
];

const quickStats: QuickCard[] = [
  { title: 'Present Today', value: 0, action: 'View All', icon: '✅' },
  { title: 'Total Announcements', value: 0, action: 'View All', icon: '📣' },
  { title: 'Approved Leave', value: 0, action: 'View All', icon: '📋' },
  { title: 'Pending Payrolls', value: 0, action: 'View All', icon: '💲' }
];

export default function DashboardPage() {
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

