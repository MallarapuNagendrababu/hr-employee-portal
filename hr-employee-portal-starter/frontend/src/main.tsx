import { createRoot } from 'react-dom/client';
import App from './App';
import 'antd/dist/reset.css';

const container = document.getElementById('root');

if (container) {
  createRoot(container).render(<App />);
}
