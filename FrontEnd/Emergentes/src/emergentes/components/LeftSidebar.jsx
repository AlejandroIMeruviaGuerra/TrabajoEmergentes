import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth.jsx";

export default function LeftSidebar({ open, setOpen }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { logout } = useAuth();

  const items = useMemo(
    () => [
      { to: "/", label: "Dashboard", icon: "📊" },
      { to: "/upload", label: "Subir CSV", icon: "📤" },
    ],
    []
  );

  const width = open ? 220 : 72;

  return (
    <aside
      style={{
        width,
        background: "#111827",
        color: "#E5E7EB",
        borderRight: "1px solid #0b1220",
        display: "flex",
        flexDirection: "column",
        transition: "width .2s ease",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 12px" }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 8, background: "#1f2937",
            display: "grid", placeItems: "center", fontWeight: 700, color: "#fff",
          }}
        >
          G
        </div>
        {open && <div style={{ fontWeight: 700, color: "#fff" }}>GAMC Panel</div>}
        <button
          onClick={() => setOpen(!open)}
          title={open ? "Contraer" : "Expandir"}
          style={{
            marginLeft: "auto", background: "transparent", border: "1px solid #334155",
            color: "#E5E7EB", borderRadius: 8, width: 32, height: 32, cursor: "pointer",
          }}
        >
          {open ? "«" : "»"}
        </button>
      </div>

      {/* nav */}
      <nav style={{ padding: 8, display: "grid", gap: 6 }}>
        {items.map((it) => {
          const active = loc.pathname === it.to;
          return (
            <button
              key={it.to}
              onClick={() => nav(it.to)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                width: "100%",
                background: active ? "#0ea5e9" : "transparent",
                color: active ? "#0b1220" : "#E5E7EB",
                border: "none",
                padding: "10px 12px",
                borderRadius: 10,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 18 }}>{it.icon}</span>
              {open && <span style={{ fontSize: 14 }}>{it.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* spacer */}
      <div style={{ flex: 1 }} />

      {/* logout */}
      <div style={{ padding: 8 }}>
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            background: "transparent",
            color: "#fca5a5",
            border: "1px solid #7f1d1d",
            padding: "10px 12px",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 18 }}>⏻</span>
          {open && <span style={{ fontSize: 14 }}>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
