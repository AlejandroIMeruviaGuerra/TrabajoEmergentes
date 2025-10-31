import { useMemo, useState } from "react";
import { uploadCsvBulk } from "../services/api";

export default function UploadCsv() {
  const [type, setType] = useState("");     // "", "air", "noise", "underground" (opcional)
  const [files, setFiles] = useState([]);   // File[]
  const [running, setRunning] = useState(false);
  const [resp, setResp] = useState(null);   // { ok, results: [...] }

  const count = useMemo(() => files.length, [files]);

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setResp(null);
  };

  const clearAll = () => {
    setFiles([]);
    setResp(null);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files.length) return;
    setRunning(true);
    try {
      const data = await uploadCsvBulk(files, type || undefined);
      setResp(data); // { ok, results: [{ filename, type, inserted }] }
    } catch (err) {
      setResp({ ok: false, message: err?.response?.data?.message || err.message });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div style={{ maxWidth: 920, margin: "32px auto", padding: "0 16px" }}>
      <h2 style={{ marginBottom: 12 }}>Subir CSV (múltiples archivos)</h2>

      <form onSubmit={handleUpload} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 }}>
        <div style={{ display:"grid", gap:12 }}>
          <div>
            <label style={{ display:"block", marginBottom:6 }}>Archivos (.csv)</label>
            <input type="file" accept=".csv,text/csv" multiple onChange={onPickFiles} />
            <small style={{ color:"#6b7280" }}>
              Puedes seleccionar varios a la vez. Si no eliges “Tipo”, el backend lo detecta por columnas.
            </small>
          </div>

          <div>
            <label style={{ display:"block", marginBottom:6 }}>Tipo (opcional)</label>
            <select
              value={type}
              onChange={(e)=>setType(e.target.value)}
              style={{ width:"100%", padding:"10px", borderRadius:8, border:"1px solid #d1d5db" }}
            >
              <option value="">Detectar automáticamente</option>
              <option value="air">air</option>
              <option value="noise">noise</option>
              <option value="underground">underground</option>
            </select>
          </div>

          <div style={{ display:"flex", gap:8 }}>
            <button
              type="submit"
              disabled={!count || running}
              style={{ padding:"10px 14px", borderRadius:10, border:"none",
                       background: running ? "#6b7280" : "#111827",
                       color:"#fff", cursor: running ? "not-allowed" : "pointer" }}
            >
              {running ? "Subiendo..." : `Subir ${count || ""} archivo(s)`}
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={running || (!count && !resp)}
              style={{ padding:"10px 14px", borderRadius:10, border:"1px solid #d1d5db",
                       background:"#fff", color:"#111827", cursor:"pointer" }}
            >
              Limpiar
            </button>
          </div>
        </div>
      </form>

      {/* Resultado */}
      {resp && (
        <section style={{ marginTop:16, background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16 }}>
          {resp.ok ? (
            <>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <strong>Resultado</strong>
                <span style={{ color:"#6b7280" }}>
                  {resp.results?.length || 0} archivo(s) procesado(s)
                </span>
              </div>

              <div style={{ display:"grid", gap:10 }}>
                {resp.results?.map((r, i) => (
                  <div key={`${r.filename}-${i}`} style={{ border:"1px solid #e5e7eb", borderRadius:10, padding:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span style={{ fontSize:18 }}>📄</span>
                        <div>
                          <div style={{ fontWeight:600 }}>{r.filename}</div>
                          <div style={{ fontSize:12, color:"#6b7280" }}>type: {r.type}</div>
                        </div>
                      </div>
                      <div style={{ fontSize:14, color:"#16a34a" }}>
                        ✔ Insertado(s): {r.inserted ?? 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ color:"#ef4444" }}>Error: {resp.message || "falló la carga"}</div>
          )}
        </section>
      )}
    </div>
  );
}
