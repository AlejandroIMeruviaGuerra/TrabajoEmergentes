// src/emergentes/context/PrivateRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          fontFamily: "system-ui",
        }}
      >
        Cargando sesión...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
