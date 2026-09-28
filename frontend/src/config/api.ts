const envBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim();

export const API_BASE_URL = envBaseUrl.replace(/\/+$/, '');

const withBase = (path: string) => `${API_BASE_URL}${path}`;

export const apiRoutes = {
  health: withBase('/api/health'),
  dashboard: withBase('/api/dashboard'),
  employees: withBase('/api/employees'),
  leaves: withBase('/api/leaves'),
  attendance: withBase('/api/attendance'),
  payroll: withBase('/api/payroll'),
  documents: withBase('/api/documents')
};

