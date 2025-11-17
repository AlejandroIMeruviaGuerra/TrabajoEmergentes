// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./emergentes/context/AuthProvider";
import AppShell from "./emergentes/components/AppShell";

import Login from "./emergentes/components/Login";
import Dashboard from "./emergentes/components/Dashboard";
import UploadCsv from "./emergentes/components/UploadCsv";
import Historico from "./emergentes/components/Historico";
import PrivateRoute from "./emergentes/context/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Login público */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard tiempo real */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppShell>
                  <Dashboard />
                </AppShell>
              </PrivateRoute>
            }
          />

          {/* Histórico */}
          <Route
            path="/historico"
            element={
              <PrivateRoute>
                <AppShell>
                  <Historico />
                </AppShell>
              </PrivateRoute>
            }
          />

          {/* Upload por chunks */}
          <Route
            path="/upload"
            element={
              <PrivateRoute>
                <AppShell>
                  <UploadCsv />
                </AppShell>
              </PrivateRoute>
            }
          />

          {/* Cualquier otra ruta → Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
