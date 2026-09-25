const isDev = import.meta.env.DEV;
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (isDev ? 'http://localhost:5000/api/v1' : '/api/v1');
export const ADMIN_API_BASE_URL =
  import.meta.env.VITE_ADMIN_API_BASE_URL || (isDev ? 'http://localhost:5000/api/v1/admin' : '/api/v1/admin');

export const LANGUAGES = [
  'English',
  'Hindi',
  'Marathi',
  'Gujarati',
  'Punjabi',
  'Tamil',
  'Telugu',
  'Bengali',
];

export const ASPECT_RATIOS = ['1:1', '4:5', '9:16', '16:9'];

export const SUPPORT_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'warning' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'info' },
  { value: 'RESOLVED', label: 'Resolved', color: 'success' },
  { value: 'CLOSED', label: 'Closed', color: 'default' },
];

export const ROLES = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];
