import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.jsx";

export default function CornerMenu() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { logout } = useAuth();

  return (
    <div style={styles.wrapper}>
      {open && (
        <div style={styles.panel}>
          <button style={styles.item} onClick={() => nav("/")}>📊 Dashboard</button>
          <button style={styles.item} onClick={() => nav("/upload")}>📤 Subir CSV</button>
          <hr style={styles.hr}/>
          <button style={{ ...styles.item, color: "#ef4444" }} onClick={logout}>⏻ Cerrar sesión</button>
        </div>
      )}
      <button style={styles.fab} onClick={() => setOpen(v => !v)} aria-label="menu">
        {open ? "✕" : "☰"}
      </button>
    </div>
  );
}

const styles = {
  wrapper: { position: "fixed", right: 20, bottom: 20, zIndex: 50 },
  fab: { width: 56, height: 56, borderRadius: "50%", border: "none", cursor: "pointer",
         background: "#111827", color: "#fff", fontSize: 22, boxShadow: "0 8px 20px rgba(0,0,0,.25)" },
  panel: { position: "absolute", right: 0, bottom: 70, background: "#fff",
           border: "1px solid #e5e7eb", borderRadius: 12, padding: 8, width: 180,
           boxShadow: "0 8px 28px rgba(0,0,0,.15)" },
  item: { width: "100%", textAlign: "left", background: "transparent", border: "none",
          padding: "8px 10px", cursor: "pointer", borderRadius: 8, fontSize: 14 },
  hr: { border: "none", borderTop: "1px solid #eee", margin: "6px 0" }
};
