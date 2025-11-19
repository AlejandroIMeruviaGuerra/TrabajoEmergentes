import { useState } from "react";
import logoGAMC from "../Imgs/logo-gamc.png";

export default function Login({ onLogin, error, loading }) {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const [buttonHover, setButtonHover] = useState(false);
  const [linkHover, setLinkHover] = useState(false);
  const [badgeHover, setBadgeHover] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // 👈 nuevo

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usuario || !contraseña) return;
    onLogin({ usuario, contraseña });
  };

  const isDisabled = loading || !usuario || !contraseña;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* PANEL IZQUIERDO - BRANDING GAMC */}
        <div style={styles.leftPanel}>
          <div style={styles.leftOverlay} />

          <div style={styles.leftContent}>
            <img
              src={logoGAMC}
              alt="Alcaldía de Cochabamba"
              style={styles.logo}
            />

            <div style={styles.badgeRow}>
              <span
                style={{
                  ...styles.badge,
                  ...(badgeHover === "gamc" ? styles.badgeHover : {}),
                }}
                onMouseEnter={() => setBadgeHover("gamc")}
                onMouseLeave={() => setBadgeHover(null)}
              >
                GAMC
              </span>
              <span
                style={{
                  ...styles.badgeSecondary,
                  ...(badgeHover === "cbb" ? styles.badgeHoverSecondary : {}),
                }}
                onMouseEnter={() => setBadgeHover("cbb")}
                onMouseLeave={() => setBadgeHover(null)}
              >
                COCHABAMBA
              </span>
            </div>

            <h1 style={styles.leftTitle}>Sistema de Monitoreo</h1>
            <p style={styles.leftSubtitle}>
              Calidad de aire, ruido y soterrados
              <br />
              en tiempo real para el municipio.
            </p>

            <div style={styles.separatorLine} />

            <p style={styles.leftFootnote}>
              Gobierno Autónomo Municipal de Cochabamba
            </p>
          </div>
        </div>

        {/* PANEL DERECHO - FORMULARIO */}
        <div style={styles.rightPanel}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <h2 style={styles.formTitle}>Iniciar Sesión</h2>
            <p style={styles.formSubtitle}>
              Ingresa con tu usuario institucional para acceder al panel.
            </p>

            <div style={styles.inputGroup}>
              <label htmlFor="usuario" style={styles.label}>
                Usuario
              </label>
              <input
                id="usuario"
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                autoComplete="username"
                placeholder="Ej: admin.gamc"
                style={{
                  ...styles.input,
                  ...(focusedField === "usuario" ? styles.inputFocused : {}),
                }}
                onFocus={() => setFocusedField("usuario")}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            <div style={styles.inputGroup}>
              <label htmlFor="contraseña" style={styles.label}>
                Contraseña
              </label>

              {/* wrapper para el input + ojito */}
              <div style={styles.passwordWrapper}>
                <input
                  id="contraseña"
                  type={showPassword ? "text" : "password"}
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  style={{
                    ...styles.input,
                    ...(focusedField === "contraseña"
                      ? styles.inputFocused
                      : {}),
                    paddingRight: "40px", // espacio para el ojito
                  }}
                  onFocus={() => setFocusedField("contraseña")}
                  onBlur={() => setFocusedField(null)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.togglePassword}
                >
                  {showPassword ? "🚫" : "👁"}
                </button>
              </div>
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button
              type="submit"
              disabled={isDisabled}
              style={{
                ...styles.button,
                ...(buttonHover && !isDisabled ? styles.buttonHover : {}),
                ...(isDisabled ? styles.buttonDisabled : {}),
              }}
              onMouseEnter={() => setButtonHover(true)}
              onMouseLeave={() => setButtonHover(false)}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>

            <p style={styles.formFooter}>
              Acceso exclusivo a personal autorizado del GAMC.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top left, #1e293b 0, #020617 42%, #020617 100%)",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  },
  card: {
    width: "100%",
    maxWidth: "960px",
    borderRadius: "24px",
    overflow: "hidden",
    display: "flex",
    backgroundColor: "#ffffff",
    boxShadow: "0 24px 60px rgba(15,23,42,0.7)",
    border: "1px solid rgba(148,163,184,0.5)",
  },

  /* LEFT PANEL */
  leftPanel: {
    position: "relative",
    flex: "1 1 45%",
    background:
      "linear-gradient(145deg, #0f172a 0%, #1d4ed8 40%, #4f46e5 85%)",
    padding: "28px 28px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#e5e7eb",
  },
  leftOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "radial-gradient(circle at top left, rgba(248,250,252,0.12) 0, transparent 55%)",
    opacity: 0.9,
  },
  leftContent: {
    position: "relative",
    zIndex: 1,
    maxWidth: "320px",
    textAlign: "left",
  },
  logo: {
    height: "190px",
    width: "auto",
    objectFit: "contain",
    marginBottom: "16px",
    filter: "drop-shadow(0 8px 14px rgba(15,23,42,0.6))",
    backgroundColor: "rgba(15,23,42,0.3)",
    borderRadius: "18px",
    padding: "10px 14px",
  },

  badgeRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "10px",
  },
  badge: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    padding: "4px 10px",
    borderRadius: "999px",
    backgroundColor: "rgba(15,23,42,0.9)",
    border: "1px solid rgba(148,163,184,0.6)",
    cursor: "default",
    transition: "background-color 0.12s ease, transform 0.1s ease",
  },
  badgeSecondary: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.16em",
    padding: "4px 10px",
    borderRadius: "999px",
    backgroundColor: "rgba(15,23,42,0.25)",
    border: "1px solid rgba(191,219,254,0.5)",
    cursor: "default",
    transition: "background-color 0.12s ease, transform 0.1s ease",
  },
  badgeHover: {
    backgroundColor: "rgba(15,23,42,1)",
    transform: "translateY(-1px)",
  },
  badgeHoverSecondary: {
    backgroundColor: "rgba(59,130,246,0.5)",
    transform: "translateY(-1px)",
  },

  leftTitle: {
    marginTop: "10px",
    marginBottom: "4px",
    fontSize: "22px",
    fontWeight: 600,
  },
  leftSubtitle: {
    margin: 0,
    fontSize: "13px",
    color: "#e5e7eb",
  },
  separatorLine: {
    marginTop: "18px",
    marginBottom: "10px",
    width: "52px",
    height: "2px",
    borderRadius: "999px",
    backgroundColor: "#bfdbfe",
  },
  leftFootnote: {
    fontSize: "11px",
    color: "#c7d2fe",
  },

  /* RIGHT PANEL */
  rightPanel: {
    flex: "1 1 55%",
    backgroundColor: "#f9fafb",
    padding: "28px 32px",
    display: "flex",
    alignItems: "center",
  },
  form: {
    width: "100%",
    maxWidth: "360px",
    margin: "0 auto",
  },
  formTitle: {
    fontSize: "22px",
    fontWeight: 600,
    color: "#111827",
    marginBottom: "4px",
  },
  formSubtitle: {
    fontSize: "13px",
    color: "#6b7280",
    marginBottom: "20px",
  },
  inputGroup: {
    marginBottom: "14px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    color: "#374151",
    marginBottom: "6px",
    fontWeight: 500,
  },
  input: {
    width: "100%",
    padding: "9px 11px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    backgroundColor: "#ffffff",
    transition: "border-color 0.12s ease, box-shadow 0.12s ease",
  },
  inputFocused: {
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 1px rgba(59,130,246,0.45)",
  },

  // 👇 estilos para el wrapper y el ojito
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },
  togglePassword: {
    position: "absolute",
    right: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    padding: 0,
  },

  error: {
    fontSize: "12px",
    color: "#b91c1c",
    marginTop: "2px",
    marginBottom: "8px",
  },
  bottomRow: {
    marginTop: "4px",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    flexWrap: "wrap",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#4b5563",
    cursor: "pointer",
  },
  checkbox: {
    width: "14px",
    height: "14px",
    accentColor: "#1d4ed8",
    cursor: "pointer",
  },
  linkButton: {
    border: "none",
    background: "none",
    padding: 0,
    fontSize: "12px",
    color: "#1d4ed8",
    cursor: "pointer",
    textDecoration: "none",
    whiteSpace: "nowrap",
    transition: "color 0.12s ease, text-decoration-color 0.12s ease",
  },
  linkButtonHover: {
    textDecoration: "underline",
    textDecorationColor: "#1d4ed8",
  },
  button: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "999px",
    border: "none",
    fontSize: "15px",
    fontWeight: 600,
    color: "#ffffff",
    background:
      "linear-gradient(135deg, #1d4ed8 0%, #4f46e5 50%, #0ea5e9 100%)",
    cursor: "pointer",
    boxShadow: "0 16px 32px rgba(37,99,235,0.45)",
    transition: "transform 0.08s ease, box-shadow 0.08s ease, opacity 0.12s",
  },
  buttonHover: {
    transform: "translateY(-1px)",
    boxShadow: "0 22px 40px rgba(37,99,235,0.55)",
  },
  buttonDisabled: {
    opacity: 0.55,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  formFooter: {
    marginTop: "14px",
    fontSize: "11px",
    color: "#9ca3af",
    textAlign: "center",
  },
};
