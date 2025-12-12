import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate
} from "react-router-dom";

import AuthProvider from "./context/AuthProvider.jsx";
import { useAuth } from "./context/useAuth.jsx";

import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import UploadCsv from "./components/UploadCsv";
import AirReports from "./components/AirReports";
import NoiseReports from "./components/NoiseReports.jsx";
import UndergroundReports from "./components/UndergroundReports.jsx";
import AppShell from "./components/AppShell";
import MachineLearning from "./components/MachineLearning.jsx";

// --- Private wrapper ---
function Private({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated)
    return <Navigate to="/login" state={{ from: loc }} replace />;

  return <AppShell>{children}</AppShell>;
}

// --- Login wrapper ---
function LoginPage() {
  const { isAuthenticated, login, loading } = useAuth();
  const [error, setError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const navigate = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from?.pathname || "/";

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleLogin = async (credentials) => {
    try {
      setError(null);
      setLoginLoading(true);
      await login(credentials);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoginLoading(false);
    }
  };

  return <Login onLogin={handleLogin} error={error} loading={loginLoading || loading} />;
}

// --- Routes ---
function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <Private>
            <Dashboard />
          </Private>
        }
      />

      {/* 🔥 AQUI AGREGAMOS LA RUTA CORRECTA */}
      <Route
        path="/reportes/aire"
        element={
          <Private>
            <AirReports />
          </Private>
        }
      />
      <Route
        path="/reportes/ruido"
        element={
          <Private>
            <NoiseReports />
          </Private>
        } />
      <Route
        path="/reportes/soterrado"
        element={
          <Private>
            <UndergroundReports />
          </Private>
        } />
      <Route
        path="/upload"
        element={
          <Private>
            <UploadCsv />
          </Private>
        }
      />
      <Route
        path="/predicciones"
        element={
          <Private>
            <MachineLearning />
          </Private>
        }
      />

      {/* fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
