import { useState } from "react";

export default function Login({ onLogin, error, loading }) {
  const [usuario, setUsuario] = useState("");
  const [contraseña, setContraseña] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!usuario || !contraseña) {
      return;
    }
    onLogin({ usuario, contraseña });
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Iniciar Sesión</h2>
        {error && <p style={styles.error}>{error}</p>}
        <div style={styles.inputGroup}>
          <label htmlFor="usuario" style={styles.label}>Usuario</label>
          <input
            type="text"
            id="usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <label htmlFor="contraseña" style={styles.label}>Contraseña</label>
          <input
            type="password"
            id="contraseña"
            value={contraseña}
            onChange={(e) => setContraseña(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f3f4f6' },
  form: { background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' },
  title: { textAlign: 'center', marginBottom: '24px', fontSize: '24px', color: '#111827' },
  inputGroup: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '8px', color: '#4b5563' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db' },
  button: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#111827', color: 'white', cursor: 'pointer', fontSize: '16px' },
  error: { color: '#ef4444', textAlign: 'center', marginBottom: '16px' },
};

