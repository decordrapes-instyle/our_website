import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext.tsx'
import { BrowserRouter as Router } from 'react-router-dom'
import MaintenancePage from './pages/MaintenancePage.tsx'
import Spinner from './components/common/Spinner'

const isMaintenanceMode = false; // import.meta.env.VITE_MAINTENANCE_MODE === "true";

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <Router>
          {isMaintenanceMode ? (
            <Suspense fallback={<Spinner fullScreen text="Loading..." />}>
              <MaintenancePage />
            </Suspense>
          ) : (
            <App />
          )}
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)