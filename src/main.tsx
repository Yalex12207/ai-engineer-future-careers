import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';
import './interactive.css';
import './landscape.css';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
