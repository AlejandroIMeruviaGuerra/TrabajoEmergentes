// src/emergentes/components/UploadCsv.jsx
import { useState, useMemo, useRef } from "react";
import { uploadInit, uploadChunk, uploadComplete } from "../services/api";

const DEFAULT_CHUNK_SIZE_MB = 5; // 5–10MB sugerido

export default function UploadCsv() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState(""); // air | noise | underground | ""
  const [uploadId, setUploadId] = useState(null);
  const [progress, setProgress] = useState(0); // 0–100
  const [status, setStatus] = useState("idle"); // idle | running | paused | done | error
  const [message, setMessage] = useState("");
  const [currentChunk, setCurrentChunk] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const abortRef = useRef(false);

  const sizeMB = useMemo(
    () => (file ? (file.size / (1024 * 1024)).toFixed(2) : "0"),
    [file]
  );

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setProgress(0);
    setStatus("idle");
    setMessage("");
    setUploadId(null);
    setCurrentChunk(0);
    setTotalChunks(0);
  };

  const handleCancel = () => {
    abortRef.current = true;
    setStatus("paused");
    setMessage("Subida pausada por el usuario.");
  };

  const handleStartOrResume = async (e) => {
    e.preventDefault();
    if (!file) return;

    abortRef.current = false;
    setStatus("running");
    setMessage("");

    try {
      let _uploadId = uploadId;
      let _chunkSize = DEFAULT_CHUNK_SIZE_MB * 1024 * 1024;
      let _totalChunks = totalChunks;

      // Si es la primera vez, hacemos /init
      if (!_uploadId) {
        const initRes = await uploadInit({
          filename: file.name,
          size: file.size,
          type: type || undefined,
        });
        if (!initRes.ok) {
          throw new Error(initRes.message || "Error en init");
        }
        _uploadId = initRes.uploadId;
        _chunkSize = initRes.chunkSize || _chunkSize;
        _totalChunks =
          initRes.totalChunks || Math.ceil(file.size / _chunkSize);

        setUploadId(_uploadId);
        setTotalChunks(_totalChunks);
        setCurrentChunk(0);
      }

      // Continuar desde currentChunk
      const startIndex = currentChunk || 0;

      for (let index = startIndex; index < _totalChunks; index++) {
        if (abortRef.current) {
          setStatus("paused");
          setMessage("Subida pausada. Puedes reanudar más tarde.");
          return;
        }

        const start = index * _chunkSize;
        const end = Math.min(start + _chunkSize, file.size);
        const blob = file.slice(start, end);

        await uploadChunk({
          uploadId: _uploadId,
          chunkIndex: index,
          totalChunks: _totalChunks,
          blob,
        });

        const pct = Math.round(((index + 1) / _totalChunks) * 100);
        setProgress(pct);
        setCurrentChunk(index + 1);
      }

      const completeRes = await uploadComplete({ uploadId: _uploadId });
      if (!completeRes.ok) {
        throw new Error(completeRes.message || "Error en complete");
      }

      setStatus("done");
      setMessage(completeRes.message || "Subida y ensamblado completados.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(err?.message || "Error en la subida.");
    }
  };

  const handleReset = () => {
    abortRef.current = false;
    setFile(null);
    setUploadId(null);
    setProgress(0);
    setStatus("idle");
    setMessage("");
    setCurrentChunk(0);
    setTotalChunks(0);
  };

  return (
    <div style={{ maxWidth: 920, margin: "32px auto", padding: "0 16px" }}>
      <h2 style={{ marginBottom: 12 }}>Subida de CSV grande (chunks)</h2>

      <form
        onSubmit={handleStartOrResume}
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          display: "grid",
          gap: 12,
        }}
      >
        <div>
          <label style={{ display: "block", marginBottom: 6 }}>
            Archivo (.csv)
          </label>
          <input type="file" accept=".csv,text/csv" onChange={onPickFile} />
          <small style={{ color: "#6b7280" }}>
            Máximo recomendado: 90MB+. Se envía en chunks de 5–10MB.
          </small>
          {file && (
            <div style={{ fontSize: 13, marginTop: 4 }}>
              <strong>{file.name}</strong> — {sizeMB} MB
            </div>
          )}
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6 }}>
            Tipo de sensor (opcional)
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          >
            <option value="">Detectar automáticamente</option>
            <option value="air">air</option>
            <option value="noise">noise</option>
            <option value="underground">underground</option>
          </select>
        </div>

        {/* Barra de progreso */}
        {file && (
          <div>
            <label style={{ display: "block", marginBottom: 6 }}>
              Progreso
            </label>
            <div
              style={{
                width: "100%",
                height: 18,
                borderRadius: 999,
                background: "#e5e7eb",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: "100%",
                  transition: "width 0.2s",
                  background:
                    status === "done"
                      ? "#16a34a"
                      : status === "error"
                      ? "#ef4444"
                      : "#0ea5e9",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{progress}%</span>
              {totalChunks > 0 && (
                <span>
                  Chunk {currentChunk}/{totalChunks}
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            disabled={!file || status === "running"}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "none",
              background:
                status === "running" ? "#6b7280" : "#111827",
              color: "#fff",
              cursor: !file || status === "running" ? "not-allowed" : "pointer",
            }}
          >
            {status === "running"
              ? "Subiendo..."
              : uploadId && status === "paused"
              ? "Reanudar subida"
              : "Iniciar subida"}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={status !== "running"}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              cursor: status === "running" ? "pointer" : "not-allowed",
            }}
          >
            Pausar
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={status === "running"}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              cursor: status === "running" ? "not-allowed" : "pointer",
            }}
          >
            Limpiar
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              color:
                status === "error"
                  ? "#b91c1c"
                  : status === "done"
                  ? "#166534"
                  : "#4b5563",
            }}
          >
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
