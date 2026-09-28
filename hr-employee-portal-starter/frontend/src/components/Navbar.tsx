type NavItem = {
  path: string;
  label: string;
  icon: string;
};

type NavbarProps = {
  items: NavItem[];
  activePath: string;
  onNavigate: (path: string) => void;
};

export default function Navbar({ items, activePath, onNavigate }: NavbarProps) {
  return (
    <nav aria-label="Portal modules" className="portal-sidebar">
      <div>
        <h3 className="sidebar-heading">Portal Modules</h3>
        <ul>
          {items.map((item) => (
            <li key={item.path}>
              <button
                type="button"
                className={`module-button ${activePath === item.path ? 'module-button-active' : ''}`}
                onClick={() => onNavigate(item.path)}
                aria-current={activePath === item.path ? 'page' : undefined}
              >
                <span className="module-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="module-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <p className="sidebar-version" aria-label="Portal version">
        V.8.2026
      </p>
    </nav>
  );
}

