import { useState, useEffect } from "react";
import LeftSidebar from "./LeftSidebar";

export default function AppShell({ children }) {
  const [open, setOpen] = useState(true);

  // En pantallas chicas, empieza colapsado
  useEffect(() => {
    if (window.innerWidth < 768) setOpen(false);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6" }}>
      <LeftSidebar open={open} setOpen={setOpen} />
      <main style={{ flex: 1, padding: 16 }}>{children}</main>
    </div>
  );
}
