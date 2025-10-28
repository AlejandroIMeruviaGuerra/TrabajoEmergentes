import { useState } from "react";
import AuthProvider from "./context/AuthProvider.jsx";
import { useAuth } from "./context/useAuth.jsx";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";

function AppContent() {
  const { isAuthenticated, login, loading } = useAuth();
  const [error, setError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const handleLogin = async (credentials) => {
    try {
      setError(null);
      setLoginLoading(true);
      await login(credentials);
    } catch (err) {
      setError(err.response?.data?.message || "Error al iniciar sesión");
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return isAuthenticated ? <Dashboard /> : <Login onLogin={handleLogin} error={error} loading={loginLoading} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

