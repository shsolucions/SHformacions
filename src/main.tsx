import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { AuthModalProvider } from './context/AuthModalContext';
import { NotificationProvider } from './context/NotificationContext';
import { seedDatabase, seedIACourses, seedPowerPointCourses } from './db/database';
import './index.css';

async function bootstrap() {
  try {
    await seedDatabase();
    await seedIACourses();
    await seedPowerPointCourses();
  } catch (err) {
    console.warn('Seed skipped:', err);
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <AuthProvider>
                <AuthModalProvider>
                  <NotificationProvider>
                    <App />
                  </NotificationProvider>
                </AuthModalProvider>
              </AuthProvider>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}

bootstrap();
