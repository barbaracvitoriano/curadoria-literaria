import { useState, useRef, useEffect } from "react";

const P = {
  petrol:"#224259", ocre:"#C8943B", forest:"#3D5431",
  terra:"#9C462D", cream:"#F2E8D5", creamDark:"#E8D8BF",
  white:"#FFFFFF", border:"#D4C4A8",
  textMain:"#1A2E3A", textSub:"#4A5A65", textMuted:"#7A8A8F",
};

function RenderMessage({ text }) {
  const parts = text.split(/(📖[^\n]+(?:\n(?!📖)[^\n]*)*)/g);
  return (
    <div>
      {parts.map((part, i) => {
        if (part.startsWith("📖")) return <BookCard key={i} raw={part} />;
        return <PlainText key={i} text={part} />;
      })}
    </div>
  );
}

function PlainText({ text }) {
  if (!text.trim()) return null;
  const lines = text.split("\n");
  return (
    <div>
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;
        const bold = line.replace(/\*\*(.+?)\*\*/g, (_, m) => `<strong>${m}</strong>`);
        return (
          <p key={i} style={{ margin:"0.25rem 0", lineHeight:1.65,
            color:P.textSub, fontSize:"0.92rem" }}
            dangerouslySetInnerHTML={{ __html: bold }} />
        );
      })}
    </div>
  );
}

function BookCard({ raw }) {
  const lines = raw.split("\n").filter(l => l.trim());
  const title = lines[0]?.replace("📖 ", "").trim();
  const fields = {};
  let linkHref = null;
  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("Ideal para:")) fields.ideal = l.replace("Ideal para:", "").trim();
    else if (l.startsWith("Estilo:")) fields.estilo = l.replace("Estilo:", "").trim();
    else if (l.startsWith("Por que recomendo:")) fields.porque = l.replace("Por que recomendo:", "").trim();
    else if (l.startsWith("👉")) {
      const m = l.match(/https?:\/\/\S+/);
      linkHref = m ? m[0] : null;
    }
  }
  return (
    <div style={{ background:P.white, border:`1px solid ${P.border}`,
      borderLeft:`4px solid ${P.ocre}`, borderRadius:8,
      padding:"1.1rem 1.2rem", margin:"0.75rem 0",
      boxShadow:"0 1px 6px rgba(34,66,89,0.07)" }}>
      <p style={{ color:P.petrol, fontWeight:"bold", fontSize:"1rem",
        margin:"0 0 0.6rem", lineHeight:1.25 }}>📖 {title}</p>
      {fields.ideal && <Row label="Ideal para" val={fields.ideal} />}
      {fields.estilo && <Row label="Estilo" val={fields.estilo} />}
      {fields.porque && <Row label="Por que recomendo" val={fields.porque} highlight />}
      {linkHref && (
        <a href={linkHref} target="_blank" rel="noopener noreferrer"
          style={{ display:"inline-block", marginTop:"0.8rem",
            background:P.petrol, color:P.cream, textDecoration:"none",
            padding:"0.48rem 1.1rem", borderRadius:5,
            fontSize:"0.82rem", fontWeight:"bold", fontFamily:"Georgia, serif" }}>
          👉 Encontrei esse livro com um desconto aqui pra você
        </a>
      )}
    </div>
  );
}

function Row({ label, val, highlight }) {
  const clean = val.replace(/\*\*/g, "");
  return (
    <div style={{ marginBottom:"0.45rem" }}>
      <span style={{ color:P.textMuted, fontSize:"0.73rem",
        textTransform:"uppercase", letterSpacing:"0.06em",
        display:"block", marginBottom:"0.1rem" }}>{label}</span>
      <span style={{ color: highlight ? P.textMain : P.textSub,
        fontSize:"0.88rem", lineHeight:1.55,
        fontWeight: highlight ? 500 : 400 }}>{clean}</span>
    </div>
  );
}

export default function App() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:"smooth" });
  }, [msgs, loading]);

  const callAPI = async (history) => {
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "Desculpe, algo deu errado. Pode tentar novamente?";
  };

  const start = async () => {
    setStarted(true);
    setLoading(true);
    const reply = await callAPI([{ role:"user", content:"Olá" }]);
    setMsgs([
      { role:"user", content:"Olá" },
      { role:"assistant", content:reply }
    ]);
    setLoading(false);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const newMsgs = [...msgs, { role:"user", content:text }];
    setMsgs(newMsgs);
    setLoading(true);
    const reply = await callAPI(newMsgs);
    setMsgs([...newMsgs, { role:"assistant", content:reply }]);
    setLoading(false);
    inputRef.current?.focus();
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!started) return (
    <div style={{ fontFamily:"Georgia, 'Times New Roman', serif",
      minHeight:"100vh", background:P.cream,
      display:"flex", alignItems:"center", justifyContent:"center", padding:"1.5rem" }}>
      <div style={{ maxWidth:460, width:"100%", textAlign:"center" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:"0.4rem",
          background:P.forest, color:P.cream, fontSize:"0.68rem",
          letterSpacing:"0.1em", padding:"0.28rem 0.85rem",
          borderRadius:20, marginBottom:"1.5rem", textTransform:"uppercase" }}>
          ✦ Curadoria Brasileira
        </div>
        <h1 style={{ color:P.petrol, fontSize:"clamp(1.8rem,5vw,2.5rem)",
          fontWeight:"bold", lineHeight:1.2, margin:"0 0 1rem" }}>
          Descubra sua<br/>próxima leitura
        </h1>
        <p style={{ color:P.textSub, fontSize:"0.97rem", lineHeight:1.7, margin:"0 0 0.5rem" }}>
          Converse com um <strong>curador especializado em literatura brasileira</strong> e descubra qual livro foi feito para o seu momento.
        </p>
        <p style={{ color:P.textMuted, fontSize:"0.82rem", marginBottom:"2.5rem" }}>
          Recomendações personalizadas com base no seu perfil · somente autores brasileiros
        </p>
        <button onClick={start}
          style={{ background:P.petrol, color:P.cream, border:"none",
            padding:"0.9rem 2.2rem", borderRadius:8, fontSize:"1rem",
            cursor:"pointer", fontFamily:"Georgia, serif", fontWeight:"bold" }}>
          Começar conversa →
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"Georgia, 'Times New Roman', serif",
      minHeight:"100vh", background:P.cream, display:"flex",
      flexDirection:"column", maxWidth:680, margin:"0 auto", boxSizing:"border-box" }}>

      <div style={{ background:P.petrol, padding:"0.85rem 1.25rem",
        display:"flex", alignItems:"center", gap:"0.6rem",
        position:"sticky", top:0, zIndex:10 }}>
        <div style={{ width:34, height:34, borderRadius:"50%",
          background:P.ocre, display:"flex", alignItems:"center",
          justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>
          📚
        </div>
        <div>
          <div style={{ color:P.cream, fontWeight:"bold", fontSize:"0.95rem" }}>
            Curador Literário
          </div>
          <div style={{ color:"#a8c4d8", fontSize:"0.72rem", marginTop:"0.1rem" }}>
            Literatura Brasileira
          </div>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", padding:"1.25rem 1rem 0.5rem" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom:"1rem",
            display:"flex", justifyContent: m.role==="user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" ? (
              <div style={{ maxWidth:"88%", background:P.white,
                border:`1px solid ${P.border}`, borderRadius:"2px 12px 12px 12px",
                padding:"0.9rem 1.1rem", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
                <RenderMessage text={m.content} />
              </div>
            ) : (
              <div style={{ maxWidth:"72%", background:P.petrol,
                color:P.cream, borderRadius:"12px 2px 12px 12px",
                padding:"0.65rem 1rem", fontSize:"0.92rem", lineHeight:1.55 }}>
                {m.content}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex", justifyContent:"flex-start", marginBottom:"1rem" }}>
            <div style={{ background:P.white, border:`1px solid ${P.border}`,
              borderRadius:"2px 12px 12px 12px", padding:"0.75rem 1.1rem",
              boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              <Dots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding:"0.75rem 1rem 1rem",
        borderTop:`1px solid ${P.border}`, background:P.cream }}>
        <div style={{ display:"flex", gap:"0.5rem", alignItems:"flex-end" }}>
          <textarea ref={inputRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey} rows={1}
            placeholder="Digite sua resposta ou escolha um número..."
            style={{ flex:1, resize:"none", border:`1.5px solid ${P.border}`,
              borderRadius:8, padding:"0.65rem 0.9rem",
              fontFamily:"Georgia, serif", fontSize:"0.92rem",
              color:P.textMain, background:P.white, outline:"none",
              lineHeight:1.5, maxHeight:100, overflowY:"auto",
              boxSizing:"border-box" }}
          />
          <button onClick={send} disabled={loading || !input.trim()}
            style={{ background: loading || !input.trim() ? P.creamDark : P.petrol,
              color: loading || !input.trim() ? P.textMuted : P.cream,
              border:"none", borderRadius:8, padding:"0.65rem 1.1rem",
              fontSize:"1.1rem", cursor: loading || !input.trim() ? "default" : "pointer",
              transition:"background 0.2s", flexShrink:0 }}>
            ↑
          </button>
        </div>
        <p style={{ color:P.textMuted, fontSize:"0.7rem",
          textAlign:"center", margin:"0.5rem 0 0" }}>
          Enter para enviar · Shift+Enter para nova linha
        </p>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <div style={{ display:"flex", gap:"5px", alignItems:"center", padding:"0.1rem 0" }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ width:7, height:7, borderRadius:"50%",
          background:"#C8943B",
          animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite` }} />
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
