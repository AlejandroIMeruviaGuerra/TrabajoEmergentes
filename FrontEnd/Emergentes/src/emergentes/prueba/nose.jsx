// Componente React de ejemplo (subida por chunks con progreso real)
import React, { useState, useRef } from "react";
import io from "socket.io-client";

const API = "http://localhost:4000";

export default function CsvUploader() {
  const [file, setFile] = useState(null);
  const [type, setType] = useState("air");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const uploadIdRef = useRef(null);
  const socketRef = useRef(null);

  const onFile = (e) => setFile(e.target.files?.[0] || null);

  const start = async () => {
    if (!file) return;

    setStatus("Inicializando…");
    const initRes = await fetch(`${API}/api/uploads/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file.name, size: file.size, type }),
    }).then(r => r.json());

    if (!initRes.ok) { setStatus(initRes.msg || "Error init"); return; }

    uploadIdRef.current = initRes.id;
    const chunkSize = initRes.chunkSize;
    const parts = initRes.parts;

    // Socket opcional (para ver ingest progress)
    socketRef.current = io(API, { transports: ["websocket"] });
    socketRef.current.on("ingest:progress", (evt) => {
      if (evt.id === uploadIdRef.current) {
        setStatus(`Ingestando: enviados=${evt.sent}`);
      }
    });

    setStatus("Subiendo por chunks…");
    let sent = 0;

    for (let i = 0; i < parts; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const blob = file.slice(start, end);
      const buf = await blob.arrayBuffer();

      const putRes = await fetch(`${API}/api/uploads/chunk/${uploadIdRef.current}/${i}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: buf,
      }).then(r => r.json());

      if (!putRes.ok) { setStatus(putRes.msg || "Error chunk"); return; }

      sent += (end - start);
      setProgress(Math.round((sent / file.size) * 100));
    }

    setStatus("Ensamblando y empezando ingesta…");
    const comp = await fetch(`${API}/api/uploads/complete/${uploadIdRef.current}`, {
      method: "POST"
    }).then(r => r.json());

    if (!comp.ok) { setStatus(comp.msg || "Error complete"); return; }

    setStatus(`Listo. Publicados a Kafka: ${comp.stats?.totalSent || 0}`);
  };

  return (
    <div style={{maxWidth: 480}}>
      <h3>Subir CSV por chunks</h3>
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="air">air</option>
        <option value="noise">noise</option>
        <option value="underground">underground</option>
      </select>
      <input type="file" accept=".csv" onChange={onFile} />
      <button onClick={start} disabled={!file}>Subir</button>
      <div>Progreso: {progress}%</div>
      <div>Estado: {status}</div>
    </div>
  );
}
